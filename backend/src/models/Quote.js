const mongoose = require('mongoose');

const QUOTE_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'];

const quoteSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Quote amount is required'],
      min: [1, 'Quote amount must be at least $1'],
    },
    estimatedDuration: {
      type: String,
      default: '2 hours',
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    availableDate: {
      type: String,
      required: [true, 'Available date is required (YYYY-MM-DD)'],
    },
    availableTime: {
      type: String,
      required: [true, 'Available start time is required (HH:mm)'],
    },
    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A provider can submit only 1 active quote per service request
quoteSchema.index({ serviceRequest: 1, provider: 1 }, { unique: true });

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = {
  Quote,
  QUOTE_STATUSES,
};
