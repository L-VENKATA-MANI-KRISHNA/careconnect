const express = require('express');
const {
  createReview,
  getProviderReviews,
  replyToReview,
} = require('../controllers/review.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/provider/:providerId', getProviderReviews);
router.post('/', requireAuth, requireRole('CUSTOMER'), createReview);
router.post('/:id/reply', requireAuth, requireRole('SERVICE_PROVIDER'), replyToReview);

module.exports = router;
