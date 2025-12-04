const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Teacher, Admin, Log } = require('../models');
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      role: user.role,
      email: user.email
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};
// Log user activity
const logActivity = async (userId, action) => {
  try {
    await Log.create({ user_id: userId, action });
  } catch (error) {
    console.error('Log error:', error);
  }
};
/**
 * Universal Login Controller
 * Accepts identifier (email, staffCode, admissionNo, roll_no) + password
 * Auto-detects role and returns appropriate user data
 */
const login = async (req, res) => {
  try {
    const { identifier, email, roll_no, password } = req.body;
    const searchValue = identifier || email || roll_no;
    if (!searchValue || !password) {
      return res.status(400).json({ 
        success: false,
        msg: 'Email/Roll No/Staff Code and password are required' 
      });
    }
    let user = null;
    let profileData = null;
    // Step 1: Try to find User by email or roll_no
    const searchLower = searchValue.toLowerCase();
    const searchUpper = searchValue.toUpperCase();
    // Check if it's an email format
    if (searchValue.includes('@')) {
      user = await User.findOne({ email: searchLower }).select('+password');
    } else {
      // Try roll_no (students)
      user = await User.findOne({ roll_no: searchUpper }).select('+password');
      if (!user) {
        const teacher = await Teacher.findOne({
          $or: [
            { staffCode: searchUpper },
            { employee_id: searchUpper }
          ]
        }).populate({
          path: 'user_id',
          select: '+password'
        });
        if (teacher && teacher.user_id) {
          user = teacher.user_id;
          profileData = { teacherId: teacher._id, staffCode: teacher.staffCode };
        }
      }
      if (!user) {
        const student = await Student.findOne({
          $or: [
            { admissionNo: searchUpper },
            { admission_number: searchUpper },
            { roll_number: searchUpper }
          ]
        }).populate({
          path: 'user_id',
          select: '+password'
        });
        if (student && student.user_id) {
          user = student.user_id;
          profileData = { studentId: student._id, admissionNo: student.admissionNo };
        }
      }
    }
    // Step 2: Validate user exists
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid credentials. Please check your email/roll number and password.' 
      });
    }
    // Step 3: Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid credentials. Please check your email/roll number and password.' 
      });
    }
    // Step 4: Get role-specific profile data
    if (!profileData) {
      if (user.role === 'student') {
        const student = await Student.findOne({ user_id: user._id });
        profileData = { studentId: student?._id, admissionNo: student?.admissionNo };
      } else if (user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user_id: user._id });
        profileData = { teacherId: teacher?._id, staffCode: teacher?.staffCode };
      } else if (user.role === 'admin') {
        const admin = await Admin.findOne({ user_id: user._id });
        profileData = { adminId: admin?._id };
      }
    }
    const token = generateToken(user);
    // Step 6: Log activity
    await logActivity(user._id, `User logged in (${user.role}) via ${searchValue}`);
    // Step 7: Return response
    res.json({
      success: true,
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roll_no: user.roll_no,
        role: user.role,
        ...profileData
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      msg: 'Server error during login. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = { 
      success: true,
      user 
    };
    if (user.role === 'student') {
      const student = await Student.findOne({ user_id: user._id })
        .populate('class_id', 'name section year')
        .populate('departmentId', 'name code');
      profile.student = student;
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user_id: user._id })
        .populate('subjects.subject_id', 'name type')
        .populate('departmentId', 'name code');
      profile.teacher = teacher;
    } else if (user.role === 'admin') {
      const admin = await Admin.findOne({ user_id: user._id });
      profile.admin = admin;
    }
    res.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error fetching profile' 
    });
  }
};
// Logout (token invalidation handled client-side)
const logout = (req, res) => {
  // Log activity before clearing session
  if (req.user) {
    logActivity(req.user._id, `User logged out (${req.user.role})`);
  }
  res.json({ 
    success: true,
    msg: 'Logged out successfully' 
  });
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
  logout,
  getStatus,
  generateToken,
  logActivity
};
