const { ProviderProfile } = require('../models/ProviderProfile');
const { User } = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');

// GET /api/providers (Search, filter, paginate verified providers)
const getProviders = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 12);
    const { search, category, skill, city, minRating, sort = '-rating' } = req.query;

    const filter = {
      verificationStatus: 'APPROVED',
    };

    if (category) {
      filter.serviceCategories = category;
    }

    if (skill) {
      filter.skills = { $regex: new RegExp(skill, 'i') };
    }

    if (city) {
      filter['serviceAreas.city'] = { $regex: new RegExp(city, 'i') };
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Keyword search over business name or bio
    if (search) {
      filter.$or = [
        { businessName: { $regex: new RegExp(search, 'i') } },
        { bio: { $regex: new RegExp(search, 'i') } },
        { skills: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const total = await ProviderProfile.countDocuments(filter);
    const providers = await ProviderProfile.find(filter)
      .populate('user', 'name avatar phone email')
      .populate('serviceCategories', 'name icon basePrice')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Providers retrieved', formatPaginatedResponse(providers, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/providers/:id
const getProviderById = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id)
      .populate('user', 'name avatar phone email address createdAt')
      .populate('serviceCategories', 'name icon basePrice');

    if (!profile) {
      return next(ApiError.notFound('Provider profile not found'));
    }

    // Fetch provider reviews
    const reviews = await Review.find({ provider: profile.user._id, isVisible: true })
      .populate('customer', 'name avatar')
      .sort('-createdAt')
      .limit(10);

    return sendSuccess(res, 'Provider profile details', {
      profile,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/providers/me/profile
const getMyProviderProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user._id })
      .populate('user', 'name avatar phone email address')
      .populate('serviceCategories', 'name icon basePrice');

    if (!profile) {
      return next(ApiError.notFound('Provider profile not found for this account'));
    }

    return sendSuccess(res, 'My provider profile', profile);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/providers/me/profile
const updateMyProviderProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      bio,
      skills,
      serviceCategories,
      serviceAreas,
      hourlyRate,
      availabilityNotes,
      experienceYears,
    } = req.body;

    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(ApiError.notFound('Provider profile not found'));
    }

    if (businessName !== undefined) profile.businessName = businessName;
    if (bio !== undefined) profile.bio = bio;
    if (skills !== undefined) profile.skills = Array.isArray(skills) ? skills : [skills];
    if (serviceCategories !== undefined) profile.serviceCategories = serviceCategories;
    if (serviceAreas !== undefined) profile.serviceAreas = serviceAreas;
    if (hourlyRate !== undefined) profile.hourlyRate = Number(hourlyRate);
    if (availabilityNotes !== undefined) profile.availabilityNotes = availabilityNotes;
    if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears);

    await profile.save();

    return sendSuccess(res, 'Provider profile updated', profile);
  } catch (err) {
    next(err);
  }
};

// POST /api/providers/me/documents
const uploadProviderDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(ApiError.badRequest('No document file was uploaded'));
    }

    const { title = 'Verification Document', documentType = 'LICENSE' } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(ApiError.notFound('Provider profile not found'));
    }

    profile.documents.push({
      title,
      fileUrl,
      documentType,
      uploadedAt: new Date(),
    });

    // If previously rejected, move back to PENDING for admin review
    if (profile.verificationStatus === 'REJECTED') {
      profile.verificationStatus = 'PENDING';
    }

    await profile.save();

    await logAction({
      actor: req.user,
      action: 'PROVIDER_DOCUMENT_UPLOADED',
      entityType: 'ProviderProfile',
      entityId: profile._id,
      metadata: { documentType, title, fileUrl },
      req,
    });

    return sendSuccess(res, 'Document uploaded successfully', {
      documents: profile.documents,
      verificationStatus: profile.verificationStatus,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/providers/admin/pending (Admin/Ops only)
const getPendingProviders = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 10);
    const filter = { verificationStatus: 'PENDING' };

    const total = await ProviderProfile.countDocuments(filter);
    const providers = await ProviderProfile.find(filter)
      .populate('user', 'name email phone avatar address createdAt')
      .populate('serviceCategories', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Pending provider verifications', formatPaginatedResponse(providers, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/providers/admin/verify/:id (Admin only)
const setProviderVerification = async (req, res, next) => {
  try {
    const { status, notes = '' } = req.body;
    const allowed = ['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'];

    if (!allowed.includes(status)) {
      return next(ApiError.badRequest(`Invalid verification status. Must be one of: ${allowed.join(', ')}`));
    }

    const profile = await ProviderProfile.findById(req.params.id).populate('user', 'name email');
    if (!profile) {
      return next(ApiError.notFound('Provider profile not found'));
    }

    profile.verificationStatus = status;
    profile.verificationNotes = notes;
    await profile.save();

    // Create in-app notification for the provider
    await createNotification({
      userId: profile.user._id,
      type: 'VERIFICATION_UPDATE',
      title: `Provider Verification: ${status}`,
      message: `Your provider account verification status has been updated to ${status}. ${notes ? `Notes: ${notes}` : ''}`,
      relatedEntity: { entityType: 'ProviderProfile', entityId: profile._id },
    });

    // Audit log
    await logAction({
      actor: req.user,
      action: `PROVIDER_VERIFICATION_${status}`,
      entityType: 'ProviderProfile',
      entityId: profile._id,
      metadata: { status, notes, providerUserId: profile.user._id },
      req,
    });

    return sendSuccess(res, `Provider verification updated to ${status}`, profile);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  uploadProviderDocument,
  getPendingProviders,
  setProviderVerification,
};
