const express = require('express');
const {
  acceptQuote,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmBookingCompletion,
  cancelBooking,
  uploadEvidence,
} = require('../controllers/booking.controller');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth);

router.post('/accept-quote/:quoteId', acceptQuote);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus);
router.post('/:id/confirm-completion', confirmBookingCompletion);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/evidence', upload.single('file'), uploadEvidence);

module.exports = router;
