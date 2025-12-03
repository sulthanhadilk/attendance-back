const mongoose = require('mongoose');

const prayerAttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  // include classId so reports can be directly filtered by class
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  date: { type: Date, required: true },
  prayerType: { type: String, enum: ['SUBH', 'MAGHRIB'], required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
}, { timestamps: true });

prayerAttendanceSchema.index({ studentId: 1, date: 1, prayerType: 1 }, { unique: true });

module.exports = mongoose.model('PrayerAttendance', prayerAttendanceSchema);
