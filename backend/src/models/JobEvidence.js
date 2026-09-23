const mongoose = require('mongoose');

const EVIDENCE_TYPES = ['BEFORE', 'DURING', 'AFTER', 'DOCUMENT'];

const jobEvidenceSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: EVIDENCE_TYPES,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

jobEvidenceSchema.index({ booking: 1, type: 1 });

const JobEvidence = mongoose.model('JobEvidence', jobEvidenceSchema);

module.exports = {
  JobEvidence,
  EVIDENCE_TYPES,
};
