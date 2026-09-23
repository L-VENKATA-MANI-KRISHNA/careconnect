class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'ERROR', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', code = 'BAD_REQUEST', errors = null) {
    return new ApiError(400, msg, code, errors);
  }

  static unauthorized(msg = 'Unauthorized access', code = 'UNAUTHORIZED') {
    return new ApiError(401, msg, code);
  }

  static forbidden(msg = 'Forbidden: insufficient permissions', code = 'FORBIDDEN') {
    return new ApiError(403, msg, code);
  }

  static notFound(msg = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, msg, code);
  }

  static conflict(msg = 'Resource conflict or overlapping schedule', code = 'CONFLICT') {
    return new ApiError(409, msg, code);
  }

  static unprocessable(msg = 'Unprocessable entity', code = 'UNPROCESSABLE_ENTITY', errors = null) {
    return new ApiError(422, msg, code, errors);
  }

  static internal(msg = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, msg, code);
  }
}

module.exports = ApiError;
