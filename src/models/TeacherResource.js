const mongoose = require('mongoose');
const teacherResourceSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['LMS', 'REFERENCE', 'LECTURE_NOTE', 'VIDEO', 'DOCUMENT'],
    default: 'REFERENCE'
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
teacherResourceSchema.index({ teacherId: 1, courseId: 1 });
module.exports = mongoose.model('TeacherResource', teacherResourceSchema);
