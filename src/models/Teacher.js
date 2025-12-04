const mongoose = require('mongoose');

// Teacher Profile Schema
const teacherSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employee_id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  // Staff code for Islamic college mapping
  staffCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    enum: [
      'Principal',
      'Vice Principal',
      'Head of Department',
      'Senior Teacher',
      'Teacher',
      'Assistant Teacher',
      'Subject Coordinator',
      'Lab Assistant',
      'Librarian',
      'Counselor',
      'Sports Teacher',
      'Art Teacher',
      'Music Teacher'
    ]
  },
  department: {
    type: String,
    required: true,
    enum: [
      'Mathematics',
      'Science',
      'English',
      'Hindi',
      'Social Studies',
      'Computer Science',
      'Physics',
      'Chemistry',
      'Biology',
      'Commerce',
      'Arts',
      'Physical Education',
      'Islamic Studies',
      'Arabic',
      'Administration'
    ]
  },
  // Optional reference to a Department collection if present
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  subjects: [{
    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }]
  }],
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    subject: String,
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    percentage: Number,
    grade: String
  }],
  experience: {
    total_years: {
      type: Number,
      default: 0
    },
    previous_schools: [{
      school_name: String,
      designation: String,
      from_date: Date,
      to_date: Date,
      subjects_taught: [String]
    }],
    current_school_joining_date: {
      type: Date,
      required: true
    }
  },
  class_teacher: {
    is_class_teacher: {
      type: Boolean,
      default: false
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    academic_year: String
  },
  contact_info: {
    personal_phone: String,
    emergency_contact_name: String,
    emergency_contact_phone: String,
    emergency_contact_relation: String
  },
  salary_info: {
    basic_salary: {
      type: Number,
      required: true
    },
    allowances: {
      house_rent: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  permissions: {
    can_mark_attendance: {
      type: Boolean,
      default: true
    },
    can_add_fines: {
      type: Boolean,
      default: true
    },
    can_enter_marks: {
      type: Boolean,
      default: true
    },
    can_view_all_students: {
      type: Boolean,
      default: false
    },
    can_generate_reports: {
      type: Boolean,
      default: false
    }
  },
  // Classes explicitly assigned by admin
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  // Alias for easier querying (same as classes)
  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],

  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    periods: [{
      period_number: Number,
      subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      start_time: String,
      end_time: String
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'transferred', 'resigned'],
    default: 'active'
  },
  // Simple flag for teacher active state used by new module
  isActive: {
    type: Boolean,
    default: true
  },
  // Optional profile photo URL used by teacher dashboard
  photoUrl: {
    type: String,
    trim: true
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

// Indexes
teacherSchema.index({ user_id: 1 });
teacherSchema.index({ employee_id: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ status: 1 });

// Pre-save middleware
teacherSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual for total salary
teacherSchema.virtual('totalSalary').get(function() {
  const basic = this.salary_info.basic_salary || 0;
  const allowances = Object.values(this.salary_info.allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
  const deductions = Object.values(this.salary_info.deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
  return basic + allowances - deductions;
});

// Method to check if teacher can perform action
teacherSchema.methods.canPerformAction = function(action) {
  return this.permissions[action] || false;
};

module.exports = mongoose.model('Teacher', teacherSchema);