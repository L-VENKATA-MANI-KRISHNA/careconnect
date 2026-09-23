const { classifyServiceRequest } = require('../ai/classifier');
const { matchProviders } = require('../ai/matchingEngine');
const { ServiceRequest } = require('../models/ServiceRequest');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

/**
 * Classify a service request title & description using AI or fallback
 * POST /api/ai/classify-request
 */
const classifyRequest = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return next(ApiError.badRequest('Both title and description are required for classification'));
    }

    const classification = await classifyServiceRequest(title, description);

    return sendSuccess(res, 'Request classified successfully', classification);
  } catch (err) {
    next(err);
  }
};

/**
 * Find and rank matching providers for a service request
 * GET /api/ai/match-providers/:requestId
 */
const getMatchingProviders = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const serviceRequest = await ServiceRequest.findById(requestId);

    if (!serviceRequest) {
      return next(ApiError.notFound('Service request not found'));
    }

    const matchedProviders = await matchProviders(serviceRequest);

    return sendSuccess(res, 'Matched providers retrieved', {
      requestId: serviceRequest._id,
      count: matchedProviders.length,
      providers: matchedProviders,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  classifyRequest,
  getMatchingProviders,
};
