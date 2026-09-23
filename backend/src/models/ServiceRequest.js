const mongoose = require('mongoose');

const REQUEST_STATUSES = [
  'DRAFT',
  'OPEN',
  'MATCHING',
  'QUOTING',
  'PROVIDER_SELECTED',
  'BOOKED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
];

const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },
    location: {
      street: { type: String, default: '' },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, default: '' },
      zipCode: { type: String, required: [true, 'Zip code is required'], trim: true },
    },
    preferredDate: {
      type: String, // 'YYYY-MM-DD'
      required: [true, 'Preferred service date is required'],
    },
    preferredTime: {
      type: String, // '09:00 - 12:00' or 'Morning' or 'HH:mm'
      default: 'Morning (09:00 - 12:00)',
    },
    urgency: {
      type: String,
      enum: URGENCY_LEVELS,
      default: 'MEDIUM',
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        title: { type: String, default: 'Attachment' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    aiClassification: {
      predictedCategory: { type: String },
      confidence: { type: Number, default: 0 },
      extractedSkills: [{ type: String }],
      urgency: { type: String },
      isAiClassified: { type: Boolean, default: false },
      classifiedAt: { type: Date },
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'OPEN',
      index: true,
    },
    selectedQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null,
    },
    assignedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

serviceRequestSchema.index({ customer: 1, status: 1 });
serviceRequestSchema.index({ category: 1, status: 1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = {
  ServiceRequest,
  REQUEST_STATUSES,
  URGENCY_LEVELS,
};
