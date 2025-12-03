const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  designation: { type: String, trim: true },
  department: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
  isSuperAdmin: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
