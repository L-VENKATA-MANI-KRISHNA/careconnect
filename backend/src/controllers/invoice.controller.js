const { Invoice } = require('../models/Invoice');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 10);
    const { status } = req.query;

    const filter = {};
    if (req.user.role === 'CUSTOMER') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'SERVICE_PROVIDER') {
      filter.provider = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('booking', 'scheduledDate status')
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .sort('-issuedAt')
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Invoices retrieved', formatPaginatedResponse(invoices, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('booking')
      .populate('customer', 'name email phone address')
      .populate('provider', 'name email phone');

    if (!invoice) {
      return next(ApiError.notFound('Invoice not found'));
    }

    const isCustomer = invoice.customer._id.toString() === req.user._id.toString();
    const isProvider = invoice.provider._id.toString() === req.user._id.toString();
    const isStaff = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return next(ApiError.forbidden('Unauthorized to view this invoice'));
    }

    return sendSuccess(res, 'Invoice details', invoice);
  } catch (err) {
    next(err);
  }
};

// POST /api/invoices/:id/pay (Customer pays invoice)
const payInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return next(ApiError.notFound('Invoice not found'));
    }

    if (invoice.customer.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return next(ApiError.forbidden('Only the billed customer can pay this invoice'));
    }

    if (invoice.status === 'PAID') {
      return next(ApiError.badRequest('Invoice has already been paid'));
    }

    invoice.status = 'PAID';
    invoice.paidAt = new Date();
    await invoice.save();

    await logAction({
      actor: req.user,
      action: 'INVOICE_PAID',
      entityType: 'Invoice',
      entityId: invoice._id,
      metadata: { amount: invoice.total },
      req,
    });

    return sendSuccess(res, 'Invoice paid successfully', invoice);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  payInvoice,
};
