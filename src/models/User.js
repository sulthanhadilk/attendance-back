const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Enhanced User Schema for comprehensive system
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  roll_no: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't return password by default in queries
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true,
    default: 'student'
  },
  profile_picture: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  date_of_birth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ roll_no: 1 });
userSchema.index({ role: 1 });
// Pre-save middleware to hash password and update timestamps
userSchema.pre('save', async function(next) {
  try {
    // Only hash password if it's new or modified
    if (!this.isModified('password')) {
      this.updated_at = Date.now();
      return next();
    }
    // Hash password with salt rounds of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updated_at = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});
// Method to compare password with hashed password
userSchema.methods.comparePassword = async function(passwordAttempt) {
  try {
    return await bcrypt.compare(passwordAttempt, this.password);
  } catch (error) {
    throw new Error('Password comparison failed: ' + error.message);
  }
};
// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});
// Method to check if user is student
userSchema.methods.isStudent = function() {
  return this.role === 'student';
};
// Method to check if user is teacher
userSchema.methods.isTeacher = function() {
  return this.role === 'teacher';
};
// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};
module.exports = mongoose.model('User', userSchema);
