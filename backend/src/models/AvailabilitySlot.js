const mongoose = require('mongoose');

const SLOT_STATUSES = ['AVAILABLE', 'BOOKED', 'BLOCKED'];

const availabilitySlotSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: [true, 'Date string is required in YYYY-MM-DD format'],
      index: true,
    },
    startTime: {
      type: String, // 'HH:mm' 24h
      required: [true, 'Start time is required (HH:mm)'],
    },
    endTime: {
      type: String, // 'HH:mm' 24h
      required: [true, 'End time is required (HH:mm)'],
    },
    status: {
      type: String,
      enum: SLOT_STATUSES,
      default: 'AVAILABLE',
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find provider availability for a given date
availabilitySlotSchema.index({ provider: 1, date: 1, status: 1 });

/**
 * Utility to convert "HH:mm" to minutes since midnight for boundary checks
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Static method to check if a new slot or booking overlaps with existing provider slots/bookings
 */
availabilitySlotSchema.statics.hasOverlap = async function (providerId, date, startTime, endTime, excludeSlotId = null) {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  const query = {
    provider: providerId,
    date: date,
  };

  if (excludeSlotId) {
    query._id = { $ne: excludeSlotId };
  }

  const existingSlots = await this.find(query);

  for (const slot of existingSlots) {
    const existingStart = timeToMinutes(slot.startTime);
    const existingEnd = timeToMinutes(slot.endTime);

    // Overlap condition: start < existingEnd && end > existingStart
    if (newStart < existingEnd && newEnd > existingStart) {
      return true; // Overlap detected
    }
  }

  return false;
};

const AvailabilitySlot = mongoose.model('AvailabilitySlot', availabilitySlotSchema);

module.exports = {
  AvailabilitySlot,
  SLOT_STATUSES,
  timeToMinutes,
};
