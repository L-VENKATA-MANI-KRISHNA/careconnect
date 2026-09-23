const express = require('express');
const {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest,
} = require('../controllers/request.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', createServiceRequest);
router.get('/', getServiceRequests);
router.get('/:id', getServiceRequestById);
router.patch('/:id', updateServiceRequest);
router.post('/:id/cancel', cancelServiceRequest);

module.exports = router;
