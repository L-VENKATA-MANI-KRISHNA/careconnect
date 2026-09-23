const express = require('express');
const { getInvoices, getInvoiceById, payInvoice } = require('../controllers/invoice.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/:id/pay', payInvoice);

module.exports = router;
