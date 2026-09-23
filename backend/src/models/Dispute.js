const mongoose = require('mongoose');

const DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

const disputeSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Dispute description is required'],
      trim: true,
    },
    evidence: [
      {
        fileUrl: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: DISPUTE_STATUSES,
      default: 'OPEN',
      index: true,
    },
    resolution: {
      type: String,
      default: '',
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = {
  Dispute,
  DISPUTE_STATUSES,
};
