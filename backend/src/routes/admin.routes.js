const express = require('express');
const {
  getAdminAnalytics,
  getUsers,
  setUserStatus,
  setUserRole,
  getAuditLogs,
  getPricingRules,
  createPricingRule,
} = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('PLATFORM_ADMIN'));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getUsers);
router.patch('/users/:id/status', setUserStatus);
router.patch('/users/:id/role', setUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/pricing', getPricingRules);
router.post('/pricing', createPricingRule);

module.exports = router;
