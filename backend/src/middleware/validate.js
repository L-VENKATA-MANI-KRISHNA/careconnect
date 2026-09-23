const { validationResult } = require('express-validator');
const ApiError = require('../utils/errors');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    return next(new ApiError(400, 'Input validation failed', 'VALIDATION_ERROR', errorDetails));
  }
  next();
};

module.exports = validate;
