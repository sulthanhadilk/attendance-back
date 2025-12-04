const express = require('express');
const router = express.Router();
const { login, getProfile, logout, getStatus } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
// @route   POST /api/auth/login
// @access  Public
router.post('/login', login);
// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, getProfile);
// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, logout);
// @route   GET /api/auth/status
// @desc    Server status check
// @access  Public
router.get('/status', getStatus);
module.exports = router;
