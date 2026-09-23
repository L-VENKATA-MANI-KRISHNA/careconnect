const { User } = require('../models/User');
const { ProviderProfile } = require('../models/ProviderProfile');
const { Booking } = require('../models/Booking');
const { ServiceRequest } = require('../models/ServiceRequest');
const { Invoice } = require('../models/Invoice');
const { Dispute } = require('../models/Dispute');
const AuditLog = require('../models/AuditLog');
const { PricingRule } = require('../models/PricingRule');
const ServiceCategory = require('../models/ServiceCategory');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

// GET /api/admin/analytics (Real database calculations)
const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. User & Provider Counts
    const totalUsers = await User.countDocuments();
    const totalProviders = await ProviderProfile.countDocuments();
    const pendingVerifications = await ProviderProfile.countDocuments({ verificationStatus: 'PENDING' });
    const approvedProviders = await ProviderProfile.countDocuments({ verificationStatus: 'APPROVED' });

    // 2. Booking Counts by Status
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION'] },
    });
    const completedBookings = await Booking.countDocuments({ status: 'COMPLETED' });
    const cancelledBookings = await Booking.countDocuments({ status: 'CANCELLED' });
    const disputedBookings = await Booking.countDocuments({ status: 'DISPUTED' });

    // 3. Revenue Aggregations from Invoices
    const revenueAgg = await Invoice.aggregate([
      { $match: { status: 'PAID' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalPlatformFees: { $sum: '$platformFee' },
          totalTax: { $sum: '$tax' },
          avgInvoiceAmount: { $avg: '$total' },
        },
      },
    ]);

    const revenueData = revenueAgg[0] || {
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalTax: 0,
      avgInvoiceAmount: 0,
    };

    // 4. Bookings by Category Aggregation
    const categoryStats = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'servicecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryName: { $ifNull: ['$cat.name', 'Uncategorized'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 5. Monthly Booking Trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookingTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $substr: ['$scheduledDate', 0, 7] }, // 'YYYY-MM'
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 6. Provider Performance Overview
    const providerPerfAgg = await ProviderProfile.aggregate([
      { $match: { verificationStatus: 'APPROVED' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalCompletedJobs: { $sum: '$completedJobs' },
          avgCancellationRate: { $avg: '$cancellationRate' },
        },
      },
    ]);

    const providerPerf = providerPerfAgg[0] || {
      avgRating: 5.0,
      totalCompletedJobs: 0,
      avgCancellationRate: 0,
    };

    return sendSuccess(res, 'Admin analytics retrieved', {
      users: {
        totalUsers,
        totalProviders,
        pendingVerifications,
        approvedProviders,
      },
      bookings: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        disputedBookings,
        cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
      },
      revenue: {
        totalRevenue: Math.round(revenueData.totalRevenue * 100) / 100,
        platformFees: Math.round(revenueData.totalPlatformFees * 100) / 100,
        avgBookingValue: Math.round(revenueData.avgInvoiceAmount * 100) / 100,
      },
      providerPerformance: {
        avgRating: Math.round(providerPerf.avgRating * 10) / 10,
        totalCompletedJobs: providerPerf.totalCompletedJobs,
        avgCancellationRate: Math.round(providerPerf.avgCancellationRate * 10) / 10,
      },
      categoryStats,
      bookingTrends,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 10);
    const { role, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Users retrieved', formatPaginatedResponse(users, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/status (Activate / Deactivate)
const setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    user.isActive = Boolean(isActive);
    await user.save();

    await logAction({
      actor: req.user,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user._id,
      metadata: { isActive: user.isActive },
      req,
    });

    return sendSuccess(res, `User ${user.isActive ? 'activated' : 'deactivated'}`, user);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/role
const setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { ROLES } = require('../models/User');

    if (!ROLES.includes(role)) {
      return next(ApiError.badRequest(`Invalid role. Must be one of: ${ROLES.join(', ')}`));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // If upgraded to provider and no profile exists, create one
    if (role === 'SERVICE_PROVIDER') {
      const existingProfile = await ProviderProfile.findOne({ user: user._id });
      if (!existingProfile) {
        await ProviderProfile.create({
          user: user._id,
          businessName: `${user.name}'s Services`,
          verificationStatus: 'PENDING',
        });
      }
    }

    await logAction({
      actor: req.user,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: user._id,
      metadata: { oldRole, newRole: role },
      req,
    });

    return sendSuccess(res, `User role updated to ${role}`, user);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 20);
    const { action, entityType } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Audit logs retrieved', formatPaginatedResponse(logs, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// Pricing Rules Management
// GET /api/admin/pricing
const getPricingRules = async (req, res, next) => {
  try {
    const rules = await PricingRule.find().populate('category', 'name basePrice');
    return sendSuccess(res, 'Pricing rules', rules);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/pricing
const createPricingRule = async (req, res, next) => {
  try {
    const { category, ruleType, value, minimumPrice, maximumPrice } = req.body;
    const rule = await PricingRule.create({
      category,
      ruleType,
      value: Number(value),
      minimumPrice: Number(minimumPrice) || 0,
      maximumPrice: Number(maximumPrice) || 10000,
      isActive: true,
    });

    await logAction({
      actor: req.user,
      action: 'PRICING_RULE_CREATED',
      entityType: 'PricingRule',
      entityId: rule._id,
      metadata: { ruleType, value },
      req,
    });

    return sendSuccess(res, 'Pricing rule created', rule, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminAnalytics,
  getUsers,
  setUserStatus,
  setUserRole,
  getAuditLogs,
  getPricingRules,
  createPricingRule,
};
