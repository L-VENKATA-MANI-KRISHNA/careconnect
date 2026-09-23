const { Booking } = require('../models/Booking');
const { ServiceRequest } = require('../models/ServiceRequest');
const { ProviderProfile } = require('../models/ProviderProfile');
const { Dispute } = require('../models/Dispute');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { createNotification } = require('../services/notification.service');
const { logAction } = require('../services/audit.service');

// GET /api/operations/dashboard-summary
const getOperationsDashboard = async (req, res, next) => {
  try {
    const activeBookingsCount = await Booking.countDocuments({
      status: { $in: ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'] },
    });

    const unassignedRequestsCount = await ServiceRequest.countDocuments({
      status: { $in: ['OPEN', 'MATCHING'] },
    });

    const openDisputesCount = await Dispute.countDocuments({
      status: { $in: ['OPEN', 'UNDER_REVIEW'] },
    });

    const pendingVerificationsCount = await ProviderProfile.countDocuments({
      verificationStatus: 'PENDING',
    });

    // Recent active jobs
    const activeJobs = await Booking.find({
      status: { $in: ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION'] },
    })
      .populate('serviceRequest', 'title category urgency')
      .populate('customer', 'name phone')
      .populate('provider', 'name phone')
      .sort('-scheduledDate')
      .limit(10);

    return sendSuccess(res, 'Operations dashboard summary', {
      metrics: {
        activeBookingsCount,
        unassignedRequestsCount,
        openDisputesCount,
        pendingVerificationsCount,
      },
      activeJobs,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/operations/unassigned-requests
const getUnassignedRequests = async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({
      status: { $in: ['OPEN', 'MATCHING', 'QUOTING'] },
    })
      .populate('category', 'name icon basePrice')
      .populate('customer', 'name email phone')
      .sort('-createdAt');

    return sendSuccess(res, 'Unassigned requests', requests);
  } catch (err) {
    next(err);
  }
};

// POST /api/operations/assign-provider (Ops manually assigns provider)
const assignProvider = async (req, res, next) => {
  try {
    const { requestId, providerId } = req.body;

    if (!requestId || !providerId) {
      return next(ApiError.badRequest('requestId and providerId are required'));
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return next(ApiError.notFound('Service request not found'));
    }

    const providerProfile = await ProviderProfile.findOne({ user: providerId, verificationStatus: 'APPROVED' });
    if (!providerProfile) {
      return next(ApiError.badRequest('Provider is not approved or profile not found'));
    }

    request.assignedProvider = providerId;
    request.status = 'PROVIDER_SELECTED';
    await request.save();

    await createNotification({
      userId: providerId,
      type: 'DISPATCH_ASSIGNMENT',
      title: 'Job Assigned by Operations Dispatcher',
      message: `Operations assigned you to request: "${request.title}". Please review and confirm.`,
      relatedEntity: { entityType: 'ServiceRequest', entityId: request._id },
    });

    await logAction({
      actor: req.user,
      action: 'OPERATIONS_PROVIDER_ASSIGNED',
      entityType: 'ServiceRequest',
      entityId: request._id,
      metadata: { providerId },
      req,
    });

    return sendSuccess(res, 'Provider assigned successfully', request);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOperationsDashboard,
  getUnassignedRequests,
  assignProvider,
};
