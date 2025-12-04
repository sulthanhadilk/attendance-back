const jwt = require('jsonwebtoken');
const { User, Admin } = require('../models');
/**
 * Authentication middleware for Admin module
 * Verifies JWT token and ensures user has 'admin' role
 */
const authAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: 'No token provided, authorization denied' 
      });
    }
    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId); // Changed from payload.id
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'User not found, token invalid' 
      });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        msg: 'Access denied. Admin access only.' 
      });
    }
    // Find admin profile
    const admin = await Admin.findOne({ user_id: user._id });
    // Attach to request
    req.user = user;
    req.admin = admin;
    req.adminId = admin?._id;
    next();
  } catch (err) {
    console.error('authAdmin error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid token' 
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false,
      msg: 'Server error during authentication' 
    });
  }
};
module.exports = authAdmin;
