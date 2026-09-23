const { Dispute } = require('../models/Dispute');
const { Booking } = require('../models/Booking');
const { Invoice } = require('../models/Invoice');
const { sendSuccess } = require('../utils/response');

// GET /api/support/dashboard-summary
const getSupportDashboard = async (req, res, next) => {
  try {
    const openDisputes = await Dispute.countDocuments({ status: 'OPEN' });
    const underReviewDisputes = await Dispute.countDocuments({ status: 'UNDER_REVIEW' });
    const resolvedDisputes = await Dispute.countDocuments({ status: 'RESOLVED' });
    const cancelledBookings = await Booking.countDocuments({ status: 'CANCELLED' });

    // Recent dispute tickets
    const recentTickets = await Dispute.find()
      .populate('booking')
      .populate('raisedBy', 'name email phone avatar')
      .populate('assignedAgent', 'name email')
      .sort('-createdAt')
      .limit(10);

    return sendSuccess(res, 'Support dashboard summary', {
      metrics: {
        openDisputes,
        underReviewDisputes,
        resolvedDisputes,
        cancelledBookings,
      },
      recentTickets,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSupportDashboard,
};
