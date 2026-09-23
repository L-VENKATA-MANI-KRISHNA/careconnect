const { ServiceRequest } = require('../models/ServiceRequest');
const ServiceCategory = require('../models/ServiceCategory');
const { ProviderProfile } = require('../models/ProviderProfile');
const { Quote } = require('../models/Quote');
const { classifyServiceRequest } = require('../ai/classifier');
const { matchProviders } = require('../ai/matchingEngine');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notification.service');
const { logAction } = require('../services/audit.service');

// POST /api/service-requests (Customer creates request)
const createServiceRequest = async (req, res, next) => {
  try {
    const {
      title,
      description,
      categoryId,
      location,
      preferredDate,
      preferredTime = 'Morning (09:00 - 12:00)',
      urgency = 'MEDIUM',
      budget = 0,
      requiredSkills = [],
    } = req.body;

    if (!title || !description || !location?.city || !location?.zipCode || !preferredDate) {
      return next(ApiError.badRequest('Title, description, city, zipCode, and preferredDate are required'));
    }

    // AI Classification run
    const aiResult = await classifyServiceRequest(title, description);

    let finalCategoryId = categoryId || aiResult.categoryId;

    // If no category ID provided, find the category by name from AI result or default
    if (!finalCategoryId) {
      const foundCategory = await ServiceCategory.findOne({
        name: aiResult.categoryName || 'General Maintenance',
      });
      finalCategoryId = foundCategory?._id;
    }

    // Combine manual skills with AI extracted skills
    const finalSkills = Array.from(
      new Set([...(requiredSkills || []), ...(aiResult.requiredSkills || [])])
    );

    const serviceRequest = await ServiceRequest.create({
      customer: req.user._id,
      category: finalCategoryId,
      title,
      description,
      location,
      preferredDate,
      preferredTime,
      urgency: urgency || aiResult.urgency,
      budget: Number(budget) || 0,
      aiClassification: {
        predictedCategory: aiResult.categoryName,
        confidence: aiResult.confidence,
        extractedSkills: aiResult.requiredSkills,
        urgency: aiResult.urgency,
        isAiClassified: true,
        classifiedAt: new Date(),
      },
      requiredSkills: finalSkills,
      status: 'OPEN',
    });

    // Notify customer
    await createNotification({
      userId: req.user._id,
      type: 'REQUEST_CREATED',
      title: 'Service Request Created',
      message: `Your request "${title}" is now open for quotes from verified providers.`,
      relatedEntity: { entityType: 'ServiceRequest', entityId: serviceRequest._id },
    });

    await logAction({
      actor: req.user,
      action: 'SERVICE_REQUEST_CREATED',
      entityType: 'ServiceRequest',
      entityId: serviceRequest._id,
      metadata: { title, urgency, category: finalCategoryId },
      req,
    });

    const populated = await ServiceRequest.findById(serviceRequest._id)
      .populate('category', 'name icon basePrice')
      .populate('customer', 'name email phone');

    return sendSuccess(res, 'Service request created successfully', populated, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/service-requests
const getServiceRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 10);
    const { status, category, search } = req.query;

    const filter = {};

    // Customer: see their own requests
    if (req.user.role === 'CUSTOMER') {
      filter.customer = req.user._id;
    }
    // Provider: see open/matching requests in the market
    else if (req.user.role === 'SERVICE_PROVIDER') {
      const providerProfile = await ProviderProfile.findOne({ user: req.user._id });

      filter.status = { $in: ['OPEN', 'MATCHING', 'QUOTING'] };

      // Filter by provider's registered trades if explicitly requested
      if (req.query.myTrades === 'true' && providerProfile?.serviceCategories?.length > 0) {
        filter.category = { $in: providerProfile.serviceCategories };
      }
    }
    // Admin & Ops: can view all

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { 'location.city': { $regex: new RegExp(search, 'i') } },
      ];
    }

    const total = await ServiceRequest.countDocuments(filter);
    const requests = await ServiceRequest.find(filter)
      .populate('category', 'name icon basePrice')
      .populate('customer', 'name email phone avatar')
      .populate('assignedProvider', 'name email phone avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Service requests retrieved', formatPaginatedResponse(requests, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/service-requests/:id
const getServiceRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('category', 'name icon basePrice requiredSkills')
      .populate('customer', 'name email phone avatar address')
      .populate('assignedProvider', 'name email phone avatar');

    if (!request) {
      return next(ApiError.notFound('Service request not found'));
    }

    // Check permissions
    const isOwner = req.user._id.toString() === request.customer._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role);
    const isProvider = req.user.role === 'SERVICE_PROVIDER';

    if (!isOwner && !isStaff && !isProvider) {
      return next(ApiError.forbidden('You do not have permission to view this request'));
    }

    // Fetch submitted quotes for this request
    let quotes = [];
    if (isOwner || isStaff) {
      quotes = await Quote.find({ serviceRequest: request._id })
        .populate('provider', 'name email phone avatar')
        .sort('amount');
    } else if (isProvider) {
      // Provider only sees their own quote
      quotes = await Quote.find({ serviceRequest: request._id, provider: req.user._id });
    }

    return sendSuccess(res, 'Service request details', {
      request,
      quotes,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/service-requests/:id
const updateServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return next(ApiError.notFound('Service request not found'));
    }

    if (request.customer.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('You can only update your own service requests'));
    }

    if (!['DRAFT', 'OPEN'].includes(request.status)) {
      return next(ApiError.badRequest(`Cannot modify request with status '${request.status}'`));
    }

    const { title, description, preferredDate, preferredTime, urgency, budget, location } = req.body;

    if (title) request.title = title;
    if (description) request.description = description;
    if (preferredDate) request.preferredDate = preferredDate;
    if (preferredTime) request.preferredTime = preferredTime;
    if (urgency) request.urgency = urgency;
    if (budget !== undefined) request.budget = budget;
    if (location) request.location = { ...request.location, ...location };

    await request.save();

    return sendSuccess(res, 'Service request updated', request);
  } catch (err) {
    next(err);
  }
};

// POST /api/service-requests/:id/cancel
const cancelServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return next(ApiError.notFound('Service request not found'));
    }

    const isOwner = request.customer.toString() === req.user._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return next(ApiError.forbidden('Unauthorized to cancel this request'));
    }

    if (['COMPLETED', 'CANCELLED'].includes(request.status)) {
      return next(ApiError.badRequest(`Request is already ${request.status.toLowerCase()}`));
    }

    request.status = 'CANCELLED';
    await request.save();

    // Expire any pending quotes
    await Quote.updateMany(
      { serviceRequest: request._id, status: 'PENDING' },
      { status: 'EXPIRED' }
    );

    await logAction({
      actor: req.user,
      action: 'SERVICE_REQUEST_CANCELLED',
      entityType: 'ServiceRequest',
      entityId: request._id,
      req,
    });

    return sendSuccess(res, 'Service request cancelled successfully', request);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest,
};
