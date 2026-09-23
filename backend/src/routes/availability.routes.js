const express = require('express');
const {
  getProviderAvailability,
  getMyAvailability,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
} = require('../controllers/availability.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/provider/:providerId', getProviderAvailability);
router.get('/me', requireAuth, requireRole('SERVICE_PROVIDER'), getMyAvailability);
router.post('/me', requireAuth, requireRole('SERVICE_PROVIDER'), addAvailabilitySlot);
router.delete('/me/:id', requireAuth, requireRole('SERVICE_PROVIDER'), deleteAvailabilitySlot);

module.exports = router;
