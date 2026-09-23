const { Quote } = require('../models/Quote');
const { ServiceRequest } = require('../models/ServiceRequest');
const { ProviderProfile } = require('../models/ProviderProfile');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { createNotification } = require('../services/notification.service');
const { logAction } = require('../services/audit.service');

// POST /api/quotes (Provider submits quote)
const submitQuote = async (req, res, next) => {
  try {
    const { serviceRequestId, amount, estimatedDuration, message, availableDate, availableTime } = req.body;

    if (!serviceRequestId || !amount || !availableDate || !availableTime) {
      return next(ApiError.badRequest('serviceRequestId, amount, availableDate, and availableTime are required'));
    }

    // 1. Verify Provider Profile is Approved
    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });
    if (!providerProfile || providerProfile.verificationStatus !== 'APPROVED') {
      return next(ApiError.forbidden('Only approved service providers can submit quotes', 'PROVIDER_NOT_APPROVED'));
    }

    // 2. Fetch service request
    const request = await ServiceRequest.findById(serviceRequestId);
    if (!request) {
      return next(ApiError.notFound('Service request not found'));
    }

    if (!['OPEN', 'MATCHING', 'QUOTING'].includes(request.status)) {
      return next(ApiError.badRequest(`Cannot submit quote. Request status is '${request.status}'`));
    }

    // 3. Check if provider supports this category
    if (providerProfile.serviceCategories && providerProfile.serviceCategories.length > 0) {
      const supportsCategory = providerProfile.serviceCategories.some(
        (catId) => catId.toString() === request.category?.toString()
      );
      if (!supportsCategory) {
        return next(
          ApiError.forbidden('Your profile does not currently list this category. Please add it to your profile services to quote on this request.', 'CATEGORY_MISMATCH')
        );
      }
    } else if (request.category) {
      providerProfile.serviceCategories = [request.category];
      await providerProfile.save();
    }

    // 4. Create quote (duplicate quote prevented by compound unique index)
    const quote = await Quote.create({
      serviceRequest: request._id,
      provider: req.user._id,
      amount: Number(amount),
      estimatedDuration: estimatedDuration || '2 hours',
      message: message || '',
      availableDate,
      availableTime,
      status: 'PENDING',
    });

    // Update request status to QUOTING
    if (request.status !== 'QUOTING') {
      request.status = 'QUOTING';
      await request.save();
    }

    // Notify customer
    await createNotification({
      userId: request.customer,
      type: 'NEW_QUOTE',
      title: 'New Quote Received',
      message: `You received a quote of $${amount} for "${request.title}".`,
      relatedEntity: { entityType: 'Quote', entityId: quote._id },
    });

    await logAction({
      actor: req.user,
      action: 'QUOTE_SUBMITTED',
      entityType: 'Quote',
      entityId: quote._id,
      metadata: { serviceRequestId, amount },
      req,
    });

    return sendSuccess(res, 'Quote submitted successfully', quote, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/me (Provider's quotes)
const getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ provider: req.user._id })
      .populate({
        path: 'serviceRequest',
        populate: [
          { path: 'customer', select: 'name email phone avatar address' },
          { path: 'category', select: 'name icon' },
        ],
      })
      .sort('-createdAt');

    return sendSuccess(res, 'Provider quotes', quotes);
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/request/:requestId (Customer or Provider viewing quotes for a request)
const getQuotesForRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return next(ApiError.notFound('Service request not found'));
    }

    let quotes;
    // Customer who owns request or admin/ops: see all quotes with provider profiles
    if (
      request.customer.toString() === req.user._id.toString() ||
      ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role)
    ) {
      quotes = await Quote.find({ serviceRequest: requestId })
        .populate('provider', 'name email phone avatar')
        .sort('amount');

      // Populate provider profile details (rating, completedJobs, etc.)
      const quotesWithProfiles = await Promise.all(
        quotes.map(async (q) => {
          const profile = await ProviderProfile.findOne({ user: q.provider._id }).select(
            'businessName rating totalReviews completedJobs hourlyRate experienceYears'
          );
          return {
            ...q.toObject(),
            providerProfile: profile,
          };
        })
      );

      return sendSuccess(res, 'Quotes for request', quotesWithProfiles);
    }
    // Provider viewing: only see own quote
    else if (req.user.role === 'SERVICE_PROVIDER') {
      quotes = await Quote.find({ serviceRequest: requestId, provider: req.user._id });
      return sendSuccess(res, 'Your quote for this request', quotes);
    }

    return next(ApiError.forbidden('Unauthorized to view quotes for this request'));
  } catch (err) {
    next(err);
  }
};

// POST /api/quotes/:id/withdraw (Provider withdraws quote)
const withdrawQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return next(ApiError.notFound('Quote not found'));
    }

    if (quote.provider.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('You can only withdraw your own quotes'));
    }

    if (quote.status !== 'PENDING') {
      return next(ApiError.badRequest(`Cannot withdraw quote with status '${quote.status}'`));
    }

    quote.status = 'WITHDRAWN';
    await quote.save();

    return sendSuccess(res, 'Quote withdrawn successfully', quote);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitQuote,
  getMyQuotes,
  getQuotesForRequest,
  withdrawQuote,
};
