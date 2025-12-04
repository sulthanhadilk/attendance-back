const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password with hashed password
userSchema.methods.comparePassword = async function(passwordAttempt) {
  try {
    return await bcrypt.compare(passwordAttempt, this.password);
  } catch (error) {
    throw new Error('Password comparison failed: ' + error.message);
  }
};
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
// Teacher Schema (expanded for profile support)
const teacherSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Identification
  emp_id: { type: String, trim: true, uppercase: true, sparse: true },
  employee_id: { type: String, trim: true, uppercase: true, sparse: true },
  // Professional
  designation: { type: String, trim: true },
  department: {
    type: String,
    required: true,
    trim: true
  },
  joining_date: { type: Date },
  // Teaching
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  // Qualifications & Experience (simplified)
  qualification: { type: String, trim: true },
  experience_years: { type: Number, default: 0 },
  blood_group: { type: String, trim: true },
  religion: { type: String, trim: true },
  caste: { type: String, trim: true },
  category: { type: String, trim: true },
  aadhaar_number: { type: String, trim: true },
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
  // Extended fields for teacher-module spec
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  semester: { type: Number },
  batch: { type: String, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  mainTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  type: { type: String, enum: ['school', 'islamic'] },
  room: { type: String, trim: true },
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
const Admin = require('./Admin');
const Department = require('./Department');
const Course = require('./Course');
const FeeStructure = require('./FeeStructure');
const FeePayment = require('./FeePayment');
const AuditLog = require('./AuditLog');
const PrayerAttendance = require('./PrayerAttendance');
const HourlyAttendance = require('./HourlyAttendance');
const StudentConduct = require('./StudentConduct');
const TeacherNotification = require('./TeacherNotification');
const QuestionBank = require('./QuestionBank');
const ClassActivity = require('./ClassActivity');
const Club = require('./Club');
const LMSLink = require('./LMSLink');
const LibraryBook = require('./LibraryBook');
const LibraryIssue = require('./LibraryIssue');
const Notice = require('./Notice');
const Event = require('./Event');
const AICache = require('./AICache');
// Also import models that might be defined separately
let TeacherModel, StudentModel, ClassModel;
try {
  TeacherModel = require('./Teacher');
} catch (e) {
  TeacherModel = mongoose.model('Teacher', teacherSchema);
}
try {
  StudentModel = require('./Student');
} catch (e) {
  StudentModel = mongoose.model('Student', studentSchema);
}
try {
  ClassModel = require('./Class');
} catch (e) {
  ClassModel = mongoose.model('Class', classSchema);
}
module.exports = {
  User: mongoose.model('User', userSchema),
  Student: StudentModel,
  Teacher: TeacherModel,
  Class: ClassModel,
  Session: mongoose.model('Session', sessionSchema),
  Subject: mongoose.model('Subject', subjectSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Fine: mongoose.model('Fine', fineSchema),
  Exam: mongoose.model('Exam', examSchema),
  ExamResult: mongoose.model('ExamResult', examResultSchema),
  Log: mongoose.model('Log', logSchema),
  // Core models
  Admin,
  Department,
  Course,
  // Fee models
  FeeStructure,
  FeePayment,
  // Audit
  AuditLog,
  // Teacher module models
  PrayerAttendance,
  HourlyAttendance,
  StudentConduct,
  TeacherNotification,
  QuestionBank,
  ClassActivity,
  Club,
  LMSLink,
  // Library models
  LibraryBook,
  LibraryIssue,
  // Communication models
  Notice,
  Event,
  // AI models
  AICache
};
