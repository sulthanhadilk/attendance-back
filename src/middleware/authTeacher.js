const jwt = require('jsonwebtoken');
const { User, Teacher } = require('../models');

/**
 * authTeacher middleware
 * - In production: verifies JWT and ensures role === 'teacher'
 * - In development: accepts header `x-teacher-id` or query `?teacherId=` and sets req.user and req.teacherId
 */
const authTeacher = async (req, res, next) => {
  try {
    // If Authorization header present, reuse JWT logic
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(401).json({ msg: 'Token is not valid' });
      if (user.role !== 'teacher') return res.status(403).json({ msg: 'Insufficient permissions' });
      req.user = user;
      // try to attach teacherId for convenience
      const teacher = await Teacher.findOne({ user_id: user._id });
      if (teacher) req.teacherId = teacher._id;
      return next();
    }

    // Development stub: allow x-teacher-id header or ?teacherId=
    if (process.env.NODE_ENV !== 'production') {
      const teacherId = req.header('x-teacher-id') || req.query.teacherId;
      if (!teacherId) return res.status(401).json({ msg: 'No teacher id provided (dev stub)' });
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });
      // Attach a minimal req.user with _id pointing to the linked user if available, else set a synthetic id
      if (teacher.user_id) {
        const user = await User.findById(teacher.user_id);
        if (user) req.user = user;
        else req.user = { _id: teacher.user_id };
      } else {
        req.user = { _id: teacher._id };
      }
      req.teacherId = teacher._id;
      req.isDevStub = true;
      return next();
    }

    return res.status(401).json({ msg: 'Authorization required' });
  } catch (err) {
    console.error('authTeacher error:', err);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authTeacher;
