const mongoose = require('mongoose');

const termAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  termStart: Date,
  termEnd: Date,
  months: [
    {
      year: Number,
      month: Number,
      attended: Number,
      total: Number,
      percentage: Number
    }
  ],
  totalAttended: {
    type: Number,
    default: 0
  },
  totalClasses: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

termAttendanceSchema.index({ studentId: 1, semester: 1 });

module.exports = mongoose.model('TermAttendance', termAttendanceSchema);
