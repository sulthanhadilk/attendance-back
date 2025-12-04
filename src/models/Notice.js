const mongoose = require('mongoose');
const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'specific'],
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String
  }],
  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  departmentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }]
}, { timestamps: true });
// Indexes
noticeSchema.index({ createdBy: 1 });
noticeSchema.index({ isActive: 1, createdAt: -1 });
noticeSchema.index({ targetAudience: 1 });
module.exports = mongoose.model('Notice', noticeSchema);
