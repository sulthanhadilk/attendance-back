const jwt = require('jsonwebtoken');
const { User } = require('../models');
// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Access denied' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Insufficient permissions' });
    }
    next();
  };
};
// Admin only middleware
const adminOnly = authorize('admin');
// Teacher only middleware
const teacherOnly = authorize('teacher');
// Student only middleware
const studentOnly = authorize('student');
// Teacher and Admin middleware
const teacherOrAdmin = authorize('teacher', 'admin');
// All authenticated users
const authenticated = auth;
module.exports = {
  auth,
  authorize,
  adminOnly,
  teacherOnly,
  studentOnly,
  teacherOrAdmin,
  authenticated
};
