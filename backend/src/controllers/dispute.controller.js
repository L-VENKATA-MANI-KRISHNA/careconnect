const { Dispute } = require('../models/Dispute');
const { Booking } = require('../models/Booking');
const { Invoice } = require('../models/Invoice');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notification.service');
const { logAction } = require('../services/audit.service');

// POST /api/disputes (Raise dispute)
const createDispute = async (req, res, next) => {
  try {
    const { bookingId, reason, description } = req.body;

    if (!bookingId || !reason || !description) {
      return next(ApiError.badRequest('bookingId, reason, and description are required'));
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('Only parties involved in this booking can raise a dispute'));
    }

    const dispute = await Dispute.create({
      booking: booking._id,
      raisedBy: req.user._id,
      reason,
      description,
      status: 'OPEN',
    });

    // Update booking status to DISPUTED
    booking.status = 'DISPUTED';
    await booking.save();

    await logAction({
      actor: req.user,
      action: 'DISPUTE_RAISED',
      entityType: 'Dispute',
      entityId: dispute._id,
      metadata: { bookingId, reason },
      req,
    });

    return sendSuccess(res, 'Dispute submitted. A support agent will review it shortly.', dispute, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/disputes
const getDisputes = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 10);
    const { status } = req.query;

    const filter = {};
    if (['CUSTOMER', 'SERVICE_PROVIDER'].includes(req.user.role)) {
      filter.raisedBy = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const total = await Dispute.countDocuments(filter);
    const disputes = await Dispute.find(filter)
      .populate('booking')
      .populate('raisedBy', 'name email phone avatar')
      .populate('assignedAgent', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Disputes retrieved', formatPaginatedResponse(disputes, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/disputes/:id
const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('booking')
      .populate('raisedBy', 'name email phone avatar')
      .populate('assignedAgent', 'name email');

    if (!dispute) {
      return next(ApiError.notFound('Dispute not found'));
    }

    return sendSuccess(res, 'Dispute details', dispute);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/disputes/:id/assign (Support agent assigns dispute to self)
const assignDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return next(ApiError.notFound('Dispute not found'));
    }

    dispute.assignedAgent = req.user._id;
    dispute.status = 'UNDER_REVIEW';
    await dispute.save();

    await logAction({
      actor: req.user,
      action: 'DISPUTE_ASSIGNED',
      entityType: 'Dispute',
      entityId: dispute._id,
      metadata: { assignedTo: req.user._id },
      req,
    });

    return sendSuccess(res, 'Dispute assigned to you', dispute);
  } catch (err) {
    next(err);
  }
};

// POST /api/disputes/:id/resolve (Support Agent or Admin resolves dispute)
const resolveDispute = async (req, res, next) => {
  try {
    const { status = 'RESOLVED', resolution, refundAmount = 0 } = req.body;

    if (!resolution) {
      return next(ApiError.badRequest('Resolution summary is required'));
    }

    const dispute = await Dispute.findById(req.params.id).populate('booking');
    if (!dispute) {
      return next(ApiError.notFound('Dispute not found'));
    }

    dispute.status = status;
    dispute.resolution = resolution;
    dispute.refundAmount = Number(refundAmount);
    dispute.resolvedAt = new Date();
    await dispute.save();

    // If refund was granted, update invoice status
    if (refundAmount > 0 && dispute.booking) {
      await Invoice.findOneAndUpdate(
        { booking: dispute.booking._id },
        { status: 'REFUNDED' }
      );
    }

    // Notify user who raised dispute
    await createNotification({
      userId: dispute.raisedBy,
      type: 'DISPUTE_RESOLVED',
      title: `Dispute ${status}`,
      message: `Your dispute for booking #${dispute.booking?._id?.toString().slice(-6)} has been resolved. Note: ${resolution}`,
      relatedEntity: { entityType: 'Dispute', entityId: dispute._id },
    });

    await logAction({
      actor: req.user,
      action: `DISPUTE_${status}`,
      entityType: 'Dispute',
      entityId: dispute._id,
      metadata: { status, resolution, refundAmount },
      req,
    });

    return sendSuccess(res, `Dispute marked as ${status}`, dispute);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDispute,
  getDisputes,
  getDisputeById,
  assignDispute,
  resolveDispute,
};
