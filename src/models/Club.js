const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  teacherInChargeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
}, { timestamps: true });

clubSchema.index({ teacherInChargeId: 1 });
clubSchema.index({ classId: 1 });

module.exports = mongoose.model('Club', clubSchema);
