const mongoose = require('mongoose');
const studentConductSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, default: Date.now },
  remark: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
}, { timestamps: true });
studentConductSchema.index({ studentId: 1, classId: 1, date: -1 });
module.exports = mongoose.model('StudentConduct', studentConductSchema);
