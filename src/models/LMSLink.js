const mongoose = require('mongoose');

const lmsLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  type: { type: String, enum: ['LMS', 'REFERENCE'], default: 'REFERENCE' },
}, { timestamps: true });

lmsLinkSchema.index({ teacherId: 1, type: 1 });

module.exports = mongoose.model('LMSLink', lmsLinkSchema);
