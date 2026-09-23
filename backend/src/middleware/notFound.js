const { sendError } = require('../utils/response');

const notFound = (req, res, next) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};

module.exports = notFound;
