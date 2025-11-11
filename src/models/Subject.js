const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Islamic', 'School'], required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

subjectSchema.index({ name: 1, class_id: 1, teacher_id: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
