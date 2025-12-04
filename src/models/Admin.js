const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema({
  // Legacy reference to User model (keep for backward compatibility)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  // Direct admin fields (primary)
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Store hashed password
  role: { type: String, default: 'admin', enum: ['admin', 'superadmin'] },
  designation: { type: String, trim: true },
  department: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
  isSuperAdmin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
// Index for efficient queries
adminSchema.index({ email: 1 });
module.exports = mongoose.model('Admin', adminSchema);
