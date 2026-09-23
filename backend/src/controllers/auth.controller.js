const crypto = require('crypto');
const { User, ROLES } = require('../models/User');
const { ProviderProfile } = require('../models/ProviderProfile');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require('../utils/token');
const ApiError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { logAction } = require('../services/audit.service');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'CUSTOMER', phone, businessName, address } = req.body;

    // Prevent direct registration as platform admin, ops, or support via public endpoint
    const allowedPublicRoles = ['CUSTOMER', 'SERVICE_PROVIDER'];
    const assignedRole = allowedPublicRoles.includes(role) ? role : 'CUSTOMER';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email already exists.', 'EMAIL_EXISTS'));
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole,
      phone: phone || '',
      address: address || {},
    });

    let providerProfile = null;
    // If registering as a provider, create initial ProviderProfile
    if (assignedRole === 'SERVICE_PROVIDER') {
      providerProfile = await ProviderProfile.create({
        user: user._id,
        businessName: businessName || `${user.name}'s Services`,
        verificationStatus: 'PENDING',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);

    await logAction({
      actor: user,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      metadata: { role: assignedRole },
      req,
    });

    return sendSuccess(
      res,
      'Registration successful',
      {
        user,
        providerProfile,
        accessToken,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account is deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS'));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);

    let providerProfile = null;
    if (user.role === 'SERVICE_PROVIDER') {
      providerProfile = await ProviderProfile.findOne({ user: user._id }).populate('serviceCategories');
    }

    await logAction({
      actor: user,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    // Remove passwordHash before returning
    const userJson = user.toJSON();

    return sendSuccess(res, 'Login successful', {
      user: userJson,
      providerProfile,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAction({
        actor: req.user,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user._id,
        req,
      });
    }

    clearAuthCookies(res);
    return sendSuccess(res, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let providerProfile = null;

    if (user.role === 'SERVICE_PROVIDER') {
      providerProfile = await ProviderProfile.findOne({ user: user._id }).populate('serviceCategories');
    }

    return sendSuccess(res, 'Current user profile retrieved', {
      user,
      providerProfile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return next(ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED'));
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return next(ApiError.unauthorized('Invalid session. Please log in again.', 'SESSION_INVALID'));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return sendSuccess(res, 'Session refreshed', {
      accessToken: newAccessToken,
    });
  } catch (err) {
    clearAuthCookies(res);
    return next(ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID'));
  }
};

/**
 * Update authenticated user profile
 * PATCH /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (address) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();

    return sendSuccess(res, 'Profile updated successfully', { user });
  } catch (err) {
    next(err);
  }
};

/**
 * Google Sign-In & Sign-Up via Firebase
 * POST /api/auth/google
 */
const googleAuth = async (req, res, next) => {
  try {
    const { email, name, avatar, googleId, role = 'CUSTOMER', businessName } = req.body;

    if (!email) {
      return next(ApiError.badRequest('Email is required for Google Sign-In'));
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const allowedRoles = ['CUSTOMER', 'SERVICE_PROVIDER'];
      const assignedRole = allowedRoles.includes(role) ? role : 'CUSTOMER';
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await User.hashPassword(randomPassword);

      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        passwordHash,
        role: assignedRole,
        avatar: avatar || '',
        googleId: googleId || '',
        authProvider: 'google',
      });

      if (assignedRole === 'SERVICE_PROVIDER') {
        await ProviderProfile.create({
          user: user._id,
          businessName: businessName || `${user.name}'s Services`,
          verificationStatus: 'PENDING',
          serviceCategories: [],
        });
      }
    } else {
      if (!user.isActive) {
        return next(ApiError.forbidden('Your account is deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED'));
      }
      let needsSave = false;
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        needsSave = true;
      }
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);

    let providerProfile = null;
    if (user.role === 'SERVICE_PROVIDER') {
      providerProfile = await ProviderProfile.findOne({ user: user._id }).populate('serviceCategories');
    }

    await logAction({
      actor: user,
      action: isNewUser ? 'USER_REGISTERED_GOOGLE' : 'USER_LOGIN_GOOGLE',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    return sendSuccess(res, 'Google authentication successful', {
      user: user.toJSON(),
      providerProfile,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refresh,
  updateProfile,
  googleAuth,
};
