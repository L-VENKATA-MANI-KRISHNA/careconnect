const Review = require('../models/Review');
const { Booking } = require('../models/Booking');
const { ProviderProfile } = require('../models/ProviderProfile');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { createNotification } = require('../services/notification.service');
const { logAction } = require('../services/audit.service');

// Recalculate and update provider rating average
const recalculateProviderRating = async (providerUserId) => {
  const reviews = await Review.find({ provider: providerUserId, isVisible: true });
  const totalReviews = reviews.length;
  if (totalReviews === 0) return;

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / totalReviews) * 10) / 10;

  await ProviderProfile.findOneAndUpdate(
    { user: providerUserId },
    { rating: avg, totalReviews }
  );
};

// POST /api/reviews (Customer submits review for completed booking)
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return next(ApiError.badRequest('bookingId, rating, and comment are required'));
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return next(ApiError.forbidden('Only the customer who made this booking can submit a review'));
    }

    // Business rule: Only completed bookings can receive reviews
    if (booking.status !== 'COMPLETED') {
      return next(
        ApiError.badRequest(
          `Cannot review a booking with status '${booking.status}'. Service must be COMPLETED.`
        )
      );
    }

    // Business rule: Prevent duplicate reviews for the same booking
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return next(
        ApiError.conflict('A review has already been submitted for this booking', 'DUPLICATE_REVIEW')
      );
    }

    const review = await Review.create({
      booking: booking._id,
      customer: req.user._id,
      provider: booking.provider,
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Update Provider Average Rating & Count
    await recalculateProviderRating(booking.provider);

    // Notify provider
    await createNotification({
      userId: booking.provider,
      type: 'NEW_REVIEW',
      title: 'New Customer Review Received',
      message: `You received a ${rating}★ review: "${comment.substring(0, 60)}..."`,
      relatedEntity: { entityType: 'Review', entityId: review._id },
    });

    await logAction({
      actor: req.user,
      action: 'REVIEW_SUBMITTED',
      entityType: 'Review',
      entityId: review._id,
      metadata: { rating, provider: booking.provider },
      req,
    });

    return sendSuccess(res, 'Review submitted successfully', review, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/provider/:providerId (Public)
const getProviderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId, isVisible: true })
      .populate('customer', 'name avatar')
      .sort('-createdAt');

    return sendSuccess(res, 'Provider reviews', reviews);
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews/:id/response (Provider replies to a review)
const replyToReview = async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!response) {
      return next(ApiError.badRequest('Response text is required'));
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(ApiError.notFound('Review not found'));
    }

    if (review.provider.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('Only the reviewed provider can reply to this review'));
    }

    review.response = response.trim();
    await review.save();

    return sendSuccess(res, 'Reply posted successfully', review);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getProviderReviews,
  replyToReview,
};
