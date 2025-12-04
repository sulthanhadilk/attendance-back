const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    caption: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  type: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'religious', 'holiday', 'meeting', 'other'],
    default: 'other'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'specific'],
    default: 'all'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  registrationRequired: {
    type: Boolean,
    default: false
  },
  maxParticipants: {
    type: Number
  },
  registeredParticipants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'registeredParticipants.userType'
    },
    userType: {
      type: String,
      enum: ['Student', 'Teacher']
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });
// Indexes
eventSchema.index({ date: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ type: 1, date: 1 });
eventSchema.index({ isPublic: 1 });
module.exports = mongoose.model('Event', eventSchema);
