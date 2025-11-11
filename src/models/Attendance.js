const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
}, { timestamps: true });

attendanceSchema.index({ student_id: 1, session_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
