const { Booking } = require('../models/Booking');
const { ServiceRequest } = require('../models/ServiceRequest');
const { Quote } = require('../models/Quote');
const { ProviderProfile } = require('../models/ProviderProfile');
const { JobEvidence } = require('../models/JobEvidence');
const { Invoice } = require('../models/Invoice');
const Review = require('../models/Review');
const { checkBookingConflict } = require('../services/availability.service');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notification.service');
const { logAction } = require('../services/audit.service');

// Calculate End Time (e.g. 2 hours after startTime)
const calculateEndTime = (startTime, durationHours = 2) => {
  const [hours, mins] = startTime.split(':').map(Number);
  const endHour = (hours + durationHours) % 24;
  return `${String(endHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// POST /api/bookings/accept-quote/:quoteId (Customer accepts quote -> Creates Booking & Invoice)
const acceptQuote = async (req, res, next) => {
  try {
    const { quoteId } = req.params;
    const { notes } = req.body;

    const quote = await Quote.findById(quoteId).populate('serviceRequest');
    if (!quote) {
      return next(ApiError.notFound('Quote not found'));
    }

    const request = quote.serviceRequest;
    if (!request) {
      return next(ApiError.notFound('Associated service request not found'));
    }

    // Authorization: only the customer who owns the request can accept a quote
    if (request.customer.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('Only the customer who created this request can accept quotes', 'FORBIDDEN'));
    }

    if (quote.status !== 'PENDING') {
      return next(ApiError.badRequest(`This quote is no longer pending (Current: ${quote.status})`));
    }

    if (request.status === 'BOOKED' || request.status === 'COMPLETED') {
      return next(ApiError.badRequest(`Service request has already been booked`));
    }

    // 1. Verify Provider is Approved
    const providerProfile = await ProviderProfile.findOne({ user: quote.provider });
    if (!providerProfile || providerProfile.verificationStatus !== 'APPROVED') {
      return next(ApiError.badRequest('Provider is not approved to accept bookings'));
    }

    // 2. Server-side conflict detection for provider's schedule
    const scheduledDate = quote.availableDate || request.preferredDate;
    const startTime = quote.availableTime || '09:00';
    const endTime = calculateEndTime(startTime, 2);

    const conflict = await checkBookingConflict({
      providerId: quote.provider,
      scheduledDate,
      startTime,
      endTime,
    });

    if (conflict.hasConflict) {
      return next(
        ApiError.conflict(
          `Scheduling Conflict: ${conflict.reason || 'Provider has an overlapping booking for this time window'}`,
          'BOOKING_CONFLICT'
        )
      );
    }

    // 3. Atomically update quote and competing quotes
    quote.status = 'ACCEPTED';
    await quote.save();

    // Reject competing pending quotes for the same service request
    await Quote.updateMany(
      { serviceRequest: request._id, _id: { $ne: quote._id }, status: 'PENDING' },
      { status: 'REJECTED' }
    );

    // 4. Update Service Request
    request.status = 'BOOKED';
    request.selectedQuote = quote._id;
    request.assignedProvider = quote.provider;
    await request.save();

    // 5. Create Booking
    const booking = await Booking.create({
      serviceRequest: request._id,
      customer: request.customer,
      provider: quote.provider,
      quote: quote._id,
      scheduledDate,
      startTime,
      endTime,
      address: request.location,
      status: 'CONFIRMED',
      notes: notes || request.description,
    });

    // 6. Generate Invoice
    const subtotal = quote.amount;
    const platformFee = Math.round(subtotal * 0.1 * 100) / 100; // 10% platform fee
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% sales tax
    const total = Math.round((subtotal + platformFee + tax) * 100) / 100;

    const invoice = await Invoice.create({
      booking: booking._id,
      customer: request.customer,
      provider: quote.provider,
      items: [
        {
          description: `${request.title} (${quote.estimatedDuration})`,
          amount: subtotal,
        },
      ],
      subtotal,
      platformFee,
      tax,
      total,
      status: 'PENDING',
    });

    // 7. Notifications
    await createNotification({
      userId: quote.provider,
      type: 'QUOTE_ACCEPTED',
      title: 'Quote Accepted — New Booking Confirmed!',
      message: `Your quote of $${quote.amount} for "${request.title}" was accepted. Scheduled for ${scheduledDate} at ${startTime}.`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id },
    });

    await createNotification({
      userId: request.customer,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed!',
      message: `Your booking for "${request.title}" is confirmed with your provider.`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id },
    });

    await logAction({
      actor: req.user,
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { quoteId, totalAmount: total, scheduledDate },
      req,
    });

    return sendSuccess(res, 'Booking created successfully', {
      booking,
      invoice,
    }, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings (List bookings for current user based on role)
const getBookings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 10);
    const { status, scheduledDate } = req.query;

    const filter = {};

    if (req.user.role === 'CUSTOMER') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'SERVICE_PROVIDER') {
      filter.provider = req.user._id;
    }
    // Admin, Ops, Support can see all

    if (status) {
      filter.status = status;
    }
    if (scheduledDate) {
      filter.scheduledDate = scheduledDate;
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('serviceRequest', 'title description category urgency')
      .populate('customer', 'name email phone avatar address')
      .populate('provider', 'name email phone avatar')
      .populate('quote', 'amount estimatedDuration')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Bookings retrieved', formatPaginatedResponse(bookings, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id (Booking details with evidence, invoice, review)
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceRequest')
      .populate('customer', 'name email phone avatar address')
      .populate('provider', 'name email phone avatar')
      .populate('quote');

    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    // Role check
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isProvider = booking.provider._id.toString() === req.user._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return next(ApiError.forbidden('Unauthorized to view this booking'));
    }

    // Associated evidence, invoice, review
    const evidence = await JobEvidence.find({ booking: booking._id }).sort('uploadedAt');
    const invoice = await Invoice.findOne({ booking: booking._id });
    const review = await Review.findOne({ booking: booking._id });

    return sendSuccess(res, 'Booking details', {
      booking,
      evidence,
      invoice,
      review,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/status (Provider updates status)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('serviceRequest');

    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    // Only assigned provider or admin/ops can update status
    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role);

    if (!isProvider && !isStaff) {
      return next(ApiError.forbidden('Only the assigned provider can update job progress'));
    }

    // Permitted state transitions
    const allowedTransitions = {
      'CONFIRMED': ['PROVIDER_ON_THE_WAY', 'CANCELLED'],
      'PROVIDER_ON_THE_WAY': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED_PENDING_CONFIRMATION', 'DISPUTED'],
      'COMPLETED_PENDING_CONFIRMATION': ['COMPLETED', 'DISPUTED'],
    };

    const validNextStates = allowedTransitions[booking.status] || [];
    if (!validNextStates.includes(status) && !isStaff) {
      return next(
        ApiError.badRequest(
          `Cannot transition booking status from '${booking.status}' to '${status}'. Allowed: ${validNextStates.join(', ')}`
        )
      );
    }

    booking.status = status;
    if (status === 'COMPLETED_PENDING_CONFIRMATION') {
      booking.completedAt = new Date();
    }
    await booking.save();

    // Sync Service Request status
    if (booking.serviceRequest) {
      if (status === 'IN_PROGRESS') {
        booking.serviceRequest.status = 'IN_PROGRESS';
        await booking.serviceRequest.save();
      }
    }

    // Notify customer
    await createNotification({
      userId: booking.customer,
      type: 'BOOKING_STATUS_UPDATE',
      title: `Job Status Update: ${status}`,
      message: `Your booking status is now: ${status.replace(/_/g, ' ')}.`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id },
    });

    await logAction({
      actor: req.user,
      action: `BOOKING_STATUS_${status}`,
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { previousStatus: booking.status, newStatus: status },
      req,
    });

    return sendSuccess(res, `Booking status updated to ${status}`, booking);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/confirm-completion (Customer confirms completion)
const confirmBookingCompletion = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('Only the customer who booked this service can confirm completion'));
    }

    if (booking.status !== 'COMPLETED_PENDING_CONFIRMATION' && booking.status !== 'IN_PROGRESS') {
      return next(ApiError.badRequest(`Booking is in '${booking.status}'. Cannot confirm completion yet.`));
    }

    booking.status = 'COMPLETED';
    booking.customerConfirmedAt = new Date();
    if (!booking.completedAt) {
      booking.completedAt = new Date();
    }
    await booking.save();

    // Update ServiceRequest status
    await ServiceRequest.findByIdAndUpdate(booking.serviceRequest, { status: 'COMPLETED' });

    // Update Provider Completed Jobs count
    await ProviderProfile.findOneAndUpdate(
      { user: booking.provider },
      { $inc: { completedJobs: 1 } }
    );

    // Finalize invoice to PAID
    await Invoice.findOneAndUpdate(
      { booking: booking._id },
      { status: 'PAID', paidAt: new Date() }
    );

    // Notify provider
    await createNotification({
      userId: booking.provider,
      type: 'JOB_CONFIRMED',
      title: 'Job Completion Confirmed!',
      message: 'The customer has confirmed job completion. Payment invoice has been finalized.',
      relatedEntity: { entityType: 'Booking', entityId: booking._id },
    });

    await logAction({
      actor: req.user,
      action: 'BOOKING_COMPLETED_CONFIRMED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
    });

    return sendSuccess(res, 'Job completion confirmed successfully', booking);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by user' } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return next(ApiError.forbidden('Unauthorized to cancel this booking'));
    }

    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return next(ApiError.badRequest(`Cannot cancel a booking that is already ${booking.status.toLowerCase()}`));
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason;
    await booking.save();

    // If cancelled by provider, adjust provider cancellation rate
    if (isProvider) {
      await ProviderProfile.findOneAndUpdate(
        { user: booking.provider },
        { $inc: { cancellationRate: 2 } } // increase cancellation rate
      );
    }

    // Cancel associated invoice
    await Invoice.findOneAndUpdate(
      { booking: booking._id },
      { status: 'CANCELLED' }
    );

    // Update ServiceRequest status back to OPEN or CANCELLED
    await ServiceRequest.findByIdAndUpdate(booking.serviceRequest, { status: 'CANCELLED' });

    // Notify other party
    const targetUserId = isCustomer ? booking.provider : booking.customer;
    await createNotification({
      userId: targetUserId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Booking scheduled for ${booking.scheduledDate} was cancelled. Reason: ${reason}`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id },
    });

    await logAction({
      actor: req.user,
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { reason, cancelledByRole: req.user.role },
      req,
    });

    return sendSuccess(res, 'Booking cancelled successfully', booking);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/evidence (Provider uploads before/during/after evidence)
const uploadEvidence = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(ApiError.badRequest('No evidence file uploaded'));
    }

    const { type = 'BEFORE', description = '' } = req.body;
    const allowedTypes = ['BEFORE', 'DURING', 'AFTER', 'DOCUMENT'];

    if (!allowedTypes.includes(type)) {
      return next(ApiError.badRequest(`Invalid evidence type. Allowed: ${allowedTypes.join(', ')}`));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role);

    if (!isProvider && !isStaff) {
      return next(ApiError.forbidden('Only the assigned provider can upload job evidence'));
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const evidence = await JobEvidence.create({
      booking: booking._id,
      provider: booking.provider,
      type,
      fileUrl,
      description,
      uploadedAt: new Date(),
    });

    return sendSuccess(res, 'Job evidence uploaded successfully', evidence, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  acceptQuote,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmBookingCompletion,
  cancelBooking,
  uploadEvidence,
};
