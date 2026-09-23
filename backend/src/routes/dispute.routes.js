const express = require('express');
const {
  createDispute,
  getDisputes,
  getDisputeById,
  assignDispute,
  resolveDispute,
} = require('../controllers/dispute.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', createDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeById);
router.patch('/:id/assign', requireRole('SUPPORT_AGENT', 'PLATFORM_ADMIN', 'OPERATIONS_MANAGER'), assignDispute);
router.post('/:id/resolve', requireRole('SUPPORT_AGENT', 'PLATFORM_ADMIN'), resolveDispute);

module.exports = router;
