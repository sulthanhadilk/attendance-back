const mongoose = require('mongoose');
// Exam Schema
const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Annual', 'Unit Test', 'Surprise Test', 'Final'],
    required: true
  },
  academic_year: {
    type: String,
    required: true
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  subjects: [{
    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    max_marks: {
      type: Number,
      required: true,
      default: 100
    },
    pass_marks: {
      type: Number,
      required: true,
      default: 35
    },
    exam_date: Date,
    duration_minutes: {
      type: Number,
      default: 180
    }
  }],
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  result_date: Date,
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  instructions: [String],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subjects: [{
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
      required: true
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
    },
    remarks: String,
    is_absent: {
      type: Boolean,
      default: false
    }
  }],
  total_marks_obtained: {
    type: Number,
    required: true,
    default: 0
  },
  total_max_marks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  overall_grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  rank_in_class: {
    type: Number,
    min: 1
  },
  status: {
    type: String,
    enum: ['pass', 'fail', 'promoted', 'detained'],
    required: true
  },
  teacher_remarks: String,
  principal_remarks: String,
  parent_remarks: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
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
// Compound index for unique result per student per exam
examResultSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });
// Fee Structure Schema
const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  academic_year: {
    type: String,
    required: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  fee_components: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time'],
      required: true
    },
    due_date: Date,
    is_mandatory: {
      type: Boolean,
      default: true
    }
  }],
  total_annual_fee: {
    type: Number,
    required: true,
    min: 0
  },
  installments: [{
    name: String,
    amount: Number,
    due_date: Date
  }],
  late_fee_per_day: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
// Fee Payment Schema
const feePaymentSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fee_structure_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true
  },
  academic_year: {
    type: String,
    required: true
  },
  payment_components: [{
    component_name: String,
    amount_due: Number,
    amount_paid: Number,
    due_date: Date
  }],
  total_amount_due: {
    type: Number,
    required: true
  },
  total_amount_paid: {
    type: Number,
    required: true,
    default: 0
  },
  balance_amount: {
    type: Number,
    required: true
  },
  payment_date: {
    type: Date,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'card', 'bank_transfer'],
    required: true
  },
  transaction_id: String,
  receipt_number: {
    type: String,
    required: true,
    unique: true
  },
  late_fee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  remarks: String,
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
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
// Indexes
examSchema.index({ start_date: 1, end_date: 1 });
examResultSchema.index({ exam_id: 1, percentage: -1 });
feeStructureSchema.index({ class_id: 1, academic_year: 1 });
feePaymentSchema.index({ student_id: 1, academic_year: 1 });
// Pre-save middleware for calculating totals
examResultSchema.pre('save', function(next) {
  // Calculate total marks and percentage
  this.total_marks_obtained = this.subjects.reduce((sum, subject) => sum + (subject.marks_obtained || 0), 0);
  this.total_max_marks = this.subjects.reduce((sum, subject) => sum + (subject.max_marks || 0), 0);
  this.percentage = this.total_max_marks > 0 ? Math.round((this.total_marks_obtained / this.total_max_marks) * 100) : 0;
  // Determine overall grade
  if (this.percentage >= 90) this.overall_grade = 'A+';
  else if (this.percentage >= 80) this.overall_grade = 'A';
  else if (this.percentage >= 70) this.overall_grade = 'B+';
  else if (this.percentage >= 60) this.overall_grade = 'B';
  else if (this.percentage >= 50) this.overall_grade = 'C+';
  else if (this.percentage >= 40) this.overall_grade = 'C';
  else if (this.percentage >= 35) this.overall_grade = 'D';
  else this.overall_grade = 'F';
  // Determine status
  this.status = this.percentage >= 35 ? 'pass' : 'fail';
  this.updated_at = Date.now();
  next();
});
module.exports = {
  Exam: mongoose.model('Exam', examSchema),
  ExamResult: mongoose.model('ExamResult', examResultSchema),
  FeeStructure: mongoose.model('FeeStructure', feeStructureSchema),
  FeePayment: mongoose.model('FeePayment', feePaymentSchema)
};
