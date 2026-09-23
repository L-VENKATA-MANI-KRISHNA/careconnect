const express = require('express');
const { getSupportDashboard } = require('../controllers/support.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('SUPPORT_AGENT', 'PLATFORM_ADMIN', 'OPERATIONS_MANAGER'));

router.get('/dashboard-summary', getSupportDashboard);

module.exports = router;
