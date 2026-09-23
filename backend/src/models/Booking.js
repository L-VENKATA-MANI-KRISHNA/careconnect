const mongoose = require('mongoose');

const BOOKING_STATUSES = [
  'CONFIRMED',
  'PROVIDER_ON_THE_WAY',
  'IN_PROGRESS',
  'COMPLETED_PENDING_CONFIRMATION',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
];

const bookingSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: true,
    },
    scheduledDate: {
      type: String, // 'YYYY-MM-DD'
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    startTime: {
      type: String, // 'HH:mm'
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // 'HH:mm'
      required: [true, 'End time is required'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      zipCode: { type: String, required: true },
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'CONFIRMED',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    customerConfirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for scheduling queries and user dashboards
bookingSchema.index({ provider: 1, scheduledDate: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = {
  Booking,
  BOOKING_STATUSES,
};
