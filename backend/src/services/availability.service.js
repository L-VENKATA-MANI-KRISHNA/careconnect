const { Booking } = require('../models/Booking');
const { timeToMinutes } = require('../models/AvailabilitySlot');

/**
 * Check if a provider has an overlapping active booking
 * Overlap condition: (newStart < existingEnd) && (newEnd > existingStart)
 */
const checkBookingConflict = async ({
  providerId,
  scheduledDate,
  startTime,
  endTime,
  excludeBookingId = null,
}) => {
  const newStartMinutes = timeToMinutes(startTime);
  const newEndMinutes = timeToMinutes(endTime);

  if (newEndMinutes <= newStartMinutes) {
    return {
      hasConflict: true,
      reason: 'End time must be after start time',
    };
  }

  // Active bookings that block the provider's calendar
  const activeStatuses = [
    'CONFIRMED',
    'PROVIDER_ON_THE_WAY',
    'IN_PROGRESS',
    'COMPLETED_PENDING_CONFIRMATION',
  ];

  const query = {
    provider: providerId,
    scheduledDate: scheduledDate,
    status: { $in: activeStatuses },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query);

  for (const booking of existingBookings) {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);

    // Overlap condition
    if (newStartMinutes < existingEnd && newEndMinutes > existingStart) {
      return {
        hasConflict: true,
        conflictingBooking: booking,
        reason: `Provider has a confirmed booking conflict between ${booking.startTime} and ${booking.endTime}`,
      };
    }
  }

  return {
    hasConflict: false,
    conflictingBooking: null,
  };
};

module.exports = {
  checkBookingConflict,
};
