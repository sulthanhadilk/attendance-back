const jwt = require('jsonwebtoken');
const { User, Teacher } = require('../models');

/**
 * Authentication middleware for Teacher module
 * Verifies JWT token and ensures user has 'teacher' role
 * Supports dev mode with x-teacher-id header for testing
 */
const authTeacher = async (req, res, next) => {
  try {
    // Production mode: JWT authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          msg: 'User not found, token invalid' 
        });
      }
      
      if (user.role !== 'teacher') {
        return res.status(403).json({ 
          success: false,
          msg: 'Access denied. Teacher access only.' 
        });
      }
      
      // Find teacher profile
      const teacher = await Teacher.findOne({ user_id: user._id });
      
      if (!teacher) {
        return res.status(404).json({ 
          success: false,
          msg: 'Teacher profile not found' 
        });
      }
      
      // Attach to request
      req.user = user;
      req.teacher = teacher;
      req.teacherId = teacher._id;
      
      return next();
    }

    // Development stub: allow x-teacher-id header or ?teacherId=
    if (process.env.NODE_ENV !== 'production') {
      const teacherId = req.header('x-teacher-id') || req.query.teacherId;
      
      if (teacherId) {
        const teacher = await Teacher.findById(teacherId);
        
        if (!teacher) {
          return res.status(404).json({ 
            success: false,
            msg: 'Teacher not found' 
          });
        }
        
        // Try to get linked user
        if (teacher.user_id) {
          const user = await User.findById(teacher.user_id);
          if (user) {
            req.user = user;
          } else {
            req.user = { _id: teacher.user_id, role: 'teacher' };
          }
        } else {
          req.user = { _id: teacher._id, role: 'teacher' };
        }
        
        req.teacher = teacher;
        req.teacherId = teacher._id;
        req.isDevStub = true;
        
        return next();
      }
    }

    return res.status(401).json({ 
      success: false,
      msg: 'No token provided, authorization denied' 
    });
  } catch (err) {
    console.error('authTeacher error:', err);
    
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

module.exports = authTeacher;
