const { verifyAccessToken } = require('../utils/token');
const { User } = require('../models/User');
const ApiError = require('../utils/errors');

/**
 * Authentication Middleware: Extracts JWT from cookie or Authorization Bearer header
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Check Authorization header fallback
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication required. Please log in.', 'AUTH_REQUIRED'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.', 'USER_NOT_FOUND'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Session expired. Please log in again.', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid security token.', 'INVALID_TOKEN'));
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} roles Permitted roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
          'ROLE_FORBIDDEN'
        )
      );
    }

    next();
  };
};

/**
 * Resource Ownership Verification Middleware
 * Checks if the current authenticated user owns the resource or has an overriding admin/ops role.
 */
const requireOwnership = (Model, paramKey = 'id', ownerField = 'customer') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED'));
      }

      // Platform admins and Operations managers bypass direct resource ownership
      if (['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role)) {
        return next();
      }

      const resourceId = req.params[paramKey];
      if (!resourceId) {
        return next(ApiError.badRequest('Missing resource identifier parameter.'));
      }

      const resource = await Model.findById(resourceId);
      if (!resource) {
        return next(ApiError.notFound('Resource not found.'));
      }

      const ownerId = resource[ownerField]?.toString() || resource[ownerField]?._id?.toString();

      if (ownerId !== req.user._id.toString()) {
        return next(
          ApiError.forbidden('Access denied. You do not own this resource.', 'OWNERSHIP_VIOLATION')
        );
      }

      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requireOwnership,
};
