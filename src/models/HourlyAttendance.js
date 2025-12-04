const mongoose = require('mongoose');
const hourlyAttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // reuse Subject as course placeholder
  date: { type: Date, required: true },
  hourIndex: { type: Number, min: 1, max: 5, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'letoff', 'unmarked'], default: 'unmarked' },
  markedByTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });
hourlyAttendanceSchema.index({ studentId: 1, classId: 1, date: 1, hourIndex: 1 }, { unique: true });
module.exports = mongoose.model('HourlyAttendance', hourlyAttendanceSchema);
