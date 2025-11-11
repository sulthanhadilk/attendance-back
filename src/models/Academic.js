const mongoose = require('mongoose');

// Class Schema
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  academic_session: {
    type: String,
    required: true
  },
  class_teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  strength: {
    total_capacity: {
      type: Number,
      required: true,
      default: 40
    },
    current_strength: {
      type: Number,
      default: 0
    }
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  room_number: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique class-section combination per year
classSchema.index({ name: 1, section: 1, year: 1 }, { unique: true });

// Subject Schema
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Islamic', 'School', 'Core', 'Elective', 'Practical'],
    required: true
  },
  category: {
    type: String,
    enum: ['Mathematics', 'Science', 'Language', 'Social Science', 'Arts', 'Physical Education', 'Religious Studies'],
    required: true
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  max_marks: {
    type: Number,
    default: 100
  },
  pass_marks: {
    type: Number,
    default: 35
  },
  is_practical: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Session Schema (Prayer times, Class periods, etc.)
const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['prayer', 'class', 'break', 'assembly', 'sports', 'other'],
    required: true
  },
  start_time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  end_time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  duration_minutes: {
    type: Number,
    required: true
  },
  days: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  is_mandatory: {
    type: Boolean,
    default: true
  },
  description: String,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'half_day'],
    required: true
  },
  marked_at: {
    type: Date,
    default: Date.now
  },
  remarks: String,
  late_minutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for unique attendance per student per session per date
attendanceSchema.index({ student_id: 1, session_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, class_id: 1 });

// Fine Schema
const fineSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Late Submission',
      'Uniform Violation',
      'Misconduct',
      'Absent Without Leave',
      'Damage to Property',
      'Library Fine',
      'Late Fee',
      'Exam Malpractice',
      'Other'
    ]
  },
  custom_reason: String,
  date: {
    type: Date,
    required: true
  },
  is_paid: {
    type: Boolean,
    default: false
  },
  paid_date: Date,
  paid_amount: {
    type: Number,
    default: 0
  },
  payment_method: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'card']
  },
  receipt_number: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for fines
fineSchema.index({ student_id: 1, date: -1 });
fineSchema.index({ is_paid: 1 });

module.exports = {
  Class: mongoose.model('Class', classSchema),
  Subject: mongoose.model('Subject', subjectSchema),
  Session: mongoose.model('Session', sessionSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Fine: mongoose.model('Fine', fineSchema)
};