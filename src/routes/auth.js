const express = require('express');
const router = express.Router();
const { login, getProfile, getStatus } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   GET /api/auth/status
// @desc    Server status check
// @access  Public
router.get('/status', getStatus);

module.exports = router;