const mongoose = require('mongoose');

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
    lowercase: true,
    trim: true
  },
  roll_no: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
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

// Student Schema
const studentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  guardian_name: {
    type: String,
    required: true,
    trim: true
  },
  guardian_phone: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  department: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

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
    trim: true,
    uppercase: true
  },
  year: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Session Schema (Subh, Maqrib, Class Periods)
const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['prayer', 'class', 'break'],
    required: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Subject Schema (Islamic & School subjects)
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Islamic', 'School'],
    required: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher_id: {
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

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
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
    enum: ['present', 'absent', 'late'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

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
    enum: ['Late', 'Absent', 'Misbehavior', 'Custom'],
    required: true
  },
  custom_reason: {
    type: String,
    trim: true
  },
  is_paid: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Exam Schema
const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Exam Result Schema
const examResultSchema = new mongoose.Schema({
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  marks_obtained: {
    type: Number,
    required: true,
    min: 0
  },
  max_marks: {
    type: Number,
    required: true,
    min: 1
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Activity Log Schema
const logSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-calculate grade before saving exam result
examResultSchema.pre('save', function(next) {
  const percentage = (this.marks_obtained / this.max_marks) * 100;
  
  if (percentage >= 90) this.grade = 'A';
  else if (percentage >= 75) this.grade = 'B';
  else if (percentage >= 60) this.grade = 'C';
  else if (percentage >= 45) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ roll_no: 1 });
attendanceSchema.index({ student_id: 1, date: -1 });
fineSchema.index({ student_id: 1, is_paid: 1 });
examResultSchema.index({ exam_id: 1, student_id: 1 });

module.exports = {
  User: mongoose.model('User', userSchema),
  Student: mongoose.model('Student', studentSchema),
  Teacher: mongoose.model('Teacher', teacherSchema),
  Class: mongoose.model('Class', classSchema),
  Session: mongoose.model('Session', sessionSchema),
  Subject: mongoose.model('Subject', subjectSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Fine: mongoose.model('Fine', fineSchema),
  Exam: mongoose.model('Exam', examSchema),
  ExamResult: mongoose.model('ExamResult', examResultSchema),
  Log: mongoose.model('Log', logSchema)
};