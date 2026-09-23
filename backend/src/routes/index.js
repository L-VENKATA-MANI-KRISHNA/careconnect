const express = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const skillRoutes = require('./skill.routes');
const providerRoutes = require('./provider.routes');
const availabilityRoutes = require('./availability.routes');
const requestRoutes = require('./request.routes');
const quoteRoutes = require('./quote.routes');
const bookingRoutes = require('./booking.routes');
const invoiceRoutes = require('./invoice.routes');
const reviewRoutes = require('./review.routes');
const disputeRoutes = require('./dispute.routes');
const notificationRoutes = require('./notification.routes');
const aiRoutes = require('./ai.routes');
const operationsRoutes = require('./operations.routes');
const supportRoutes = require('./support.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Mount all API domains
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/skills', skillRoutes);
router.use('/providers', providerRoutes);
router.use('/availability', availabilityRoutes);
router.use('/service-requests', requestRoutes);
router.use('/quotes', quoteRoutes);
router.use('/bookings', bookingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/reviews', reviewRoutes);
router.use('/disputes', disputeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/operations', operationsRoutes);
router.use('/support', supportRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
