const express = require('express');
const {
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  uploadProviderDocument,
  getPendingProviders,
  setProviderVerification,
} = require('../controllers/provider.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getProviders);
router.get('/:id', getProviderById);

// Provider authenticated routes
router.get('/me/profile', requireAuth, requireRole('SERVICE_PROVIDER'), getMyProviderProfile);
router.patch('/me/profile', requireAuth, requireRole('SERVICE_PROVIDER'), updateMyProviderProfile);
router.post(
  '/me/documents',
  requireAuth,
  requireRole('SERVICE_PROVIDER'),
  upload.single('document'),
  uploadProviderDocument
);

// Admin / Ops routes
router.get(
  '/admin/pending',
  requireAuth,
  requireRole('PLATFORM_ADMIN', 'OPERATIONS_MANAGER'),
  getPendingProviders
);
router.patch(
  '/admin/verify/:id',
  requireAuth,
  requireRole('PLATFORM_ADMIN'),
  setProviderVerification
);

module.exports = router;
