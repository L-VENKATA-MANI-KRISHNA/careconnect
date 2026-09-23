const express = require('express');
const {
  submitQuote,
  getMyQuotes,
  getQuotesForRequest,
  withdrawQuote,
} = require('../controllers/quote.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('SERVICE_PROVIDER'), submitQuote);
router.get('/me', requireRole('SERVICE_PROVIDER'), getMyQuotes);
router.get('/request/:requestId', getQuotesForRequest);
router.post('/:id/withdraw', withdrawQuote);

module.exports = router;
