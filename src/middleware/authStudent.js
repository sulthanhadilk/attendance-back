const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');
/**
 * Authentication middleware for Student module
 * Verifies JWT token and ensures user has 'student' role
 */
const authStudent = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: 'No token provided, authorization denied' 
      });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'User not found, token invalid' 
      });
    }
    // Check if user is a student
    if (user.role !== 'student') {
      return res.status(403).json({ 
        success: false,
        msg: 'Access denied. Student access only.' 
      });
    }
    // Find student profile
    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        msg: 'Student profile not found' 
      });
    }
    // Attach to request
    req.user = user;
    req.student = student;
    req.studentId = student._id;
    next();
  } catch (error) {
    console.error('Auth Student Error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Token expired' 
      });
    }
    res.status(500).json({ 
      success: false,
      msg: 'Server error during authentication' 
    });
  }
};
module.exports = authStudent;
