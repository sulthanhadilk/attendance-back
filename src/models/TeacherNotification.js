const mongoose = require('mongoose');
const teacherNotificationSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  target: { type: String, enum: ['student', 'class'], required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  title: { type: String, required: true },
  body: { type: String, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
teacherNotificationSchema.index({ teacherId: 1, createdAt: -1 });
module.exports = mongoose.model('TeacherNotification', teacherNotificationSchema);
