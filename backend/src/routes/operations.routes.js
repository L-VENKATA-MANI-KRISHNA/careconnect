const express = require('express');
const {
  getOperationsDashboard,
  getUnassignedRequests,
  assignProvider,
} = require('../controllers/operations.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('OPERATIONS_MANAGER', 'PLATFORM_ADMIN'));

router.get('/dashboard-summary', getOperationsDashboard);
router.get('/unassigned-requests', getUnassignedRequests);
router.post('/assign-provider', assignProvider);

module.exports = router;
