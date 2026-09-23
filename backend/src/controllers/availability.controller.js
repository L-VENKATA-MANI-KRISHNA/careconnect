const { AvailabilitySlot, timeToMinutes } = require('../models/AvailabilitySlot');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

// GET /api/availability/provider/:providerId
const getProviderAvailability = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;

    const filter = { provider: providerId };
    if (date) {
      filter.date = date;
    }

    const slots = await AvailabilitySlot.find(filter).sort({ date: 1, startTime: 1 });
    return sendSuccess(res, 'Provider availability slots', slots);
  } catch (err) {
    next(err);
  }
};

// GET /api/availability/me (Provider viewing own slots)
const getMyAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = { provider: req.user._id };
    if (date) {
      filter.date = date;
    }

    const slots = await AvailabilitySlot.find(filter).sort({ date: 1, startTime: 1 });
    return sendSuccess(res, 'My availability slots', slots);
  } catch (err) {
    next(err);
  }
};

// POST /api/availability/me (Provider creating slot)
const addAvailabilitySlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return next(ApiError.badRequest('date, startTime, and endTime are required'));
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      return next(ApiError.badRequest('endTime must be after startTime'));
    }

    // Check for overlap with existing slots
    const hasOverlap = await AvailabilitySlot.hasOverlap(req.user._id, date, startTime, endTime);
    if (hasOverlap) {
      return next(ApiError.conflict('An availability slot already overlaps with this time window'));
    }

    const slot = await AvailabilitySlot.create({
      provider: req.user._id,
      date,
      startTime,
      endTime,
      status: 'AVAILABLE',
    });

    return sendSuccess(res, 'Availability slot created', slot, 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/availability/me/:id
const deleteAvailabilitySlot = async (req, res, next) => {
  try {
    const slot = await AvailabilitySlot.findOneAndDelete({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!slot) {
      return next(ApiError.notFound('Availability slot not found'));
    }

    return sendSuccess(res, 'Availability slot removed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProviderAvailability,
  getMyAvailability,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
};
