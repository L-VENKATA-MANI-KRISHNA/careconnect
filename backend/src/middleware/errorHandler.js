const ApiError = require('../utils/errors');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource ID format: ${err.value}`, 'INVALID_ID');
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', messages);
  }

  // Handle Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`Duplicate value entered for '${field}'. Must be unique.`, 'DUPLICATE_KEY');
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid security token', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Security token has expired', 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errorCode = error.errorCode || 'INTERNAL_ERROR';
  const errors = error.errors || null;

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[Unhandled Error]', err);
  }

  return sendError(res, message, statusCode, errorCode, errors);
};

module.exports = errorHandler;
