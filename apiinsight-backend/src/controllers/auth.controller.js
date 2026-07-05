const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  sendSuccess(res, 201, { user, token }, 'User registered successfully');
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  sendSuccess(res, 200, { user, token }, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the authGuard middleware
  sendSuccess(res, 200, { user: req.user }, 'Current user fetched');
});

module.exports = { register, login, getMe };
