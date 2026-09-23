const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  refresh,
  updateProfile,
  googleAuth,
} = require('../controllers/auth.controller');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/refresh', refresh);
router.patch('/profile', requireAuth, updateProfileValidator, validate, updateProfile);

module.exports = router;
