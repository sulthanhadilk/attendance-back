const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Teacher, Log } = require('../models');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Log user activity
const logActivity = async (userId, action) => {
  try {
    await Log.create({ user_id: userId, action });
  } catch (error) {
    console.error('Log error:', error);
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, roll_no, password } = req.body;

    // Find user by email or roll_no
    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (roll_no) {
      user = await User.findOne({ roll_no: roll_no.toUpperCase() });
    } else {
      return res.status(400).json({ msg: 'Email or roll number is required' });
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Log activity
    await logActivity(user._id, `User logged in (${user.role})`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roll_no: user.roll_no,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    let profile = { user };

    // Get additional profile data based on role
    if (user.role === 'student') {
      const student = await Student.findOne({ user_id: user._id })
        .populate('class_id', 'name section year');
      profile.student = student;
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user_id: user._id })
        .populate('subjects', 'name type');
      profile.teacher = teacher;
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Status endpoint for deployment testing
const getStatus = (req, res) => {
  res.json({ 
    status: 'Server running...', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  login,
  getProfile,
  getStatus,
  logActivity
};