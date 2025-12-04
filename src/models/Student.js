const mongoose = require('mongoose');
// Student Profile Schema
const studentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false
  },
  roll_number: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  admission_number: {
    type: String,
    unique: true,
    trim: true
  },
  // Alias for admission_number
  admissionNo: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  admission_date: {
    type: Date,
    default: Date.now
  },
  // Batch info (e.g., "2021-2024")
  batch: {
    type: String,
    trim: true
  },
  // Current semester
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  // Department reference
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  // Course IDs the student is enrolled in
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Photo URL
  photoUrl: {
    type: String,
    trim: true
  },
  guardian_info: {
    father_name: {
      type: String,
      required: false,
      trim: true
    },
    mother_name: {
      type: String,
      trim: true
    },
    guardian_name: {
      type: String,
      trim: true
    },
    guardian_relation: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      default: 'father'
    },
    guardian_phone: {
      type: String,
      required: false,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    guardian_email: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    guardian_occupation: String,
    emergency_contact: String
  },
  academic_info: {
    current_year: {
      type: Number,
      required: false,
      default: 1
    },
    academic_session: {
      type: String,
      required: false,
      default: '2024-25'
    },
    previous_school: String,
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }]
  },
  transport_info: {
    transport_required: {
      type: Boolean,
      default: false
    },
    pickup_point: String,
    route_number: String
  },
  medical_info: {
    blood_group: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medical_conditions: [String],
    emergency_medication: String
  },
  fees_info: {
    fee_structure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure'
    },
    scholarship_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    concession_amount: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated', 'expelled'],
    default: 'active'
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
studentSchema.index({ user_id: 1 });
studentSchema.index({ class_id: 1 });
studentSchema.index({ roll_number: 1 });
studentSchema.index({ admission_number: 1 });
studentSchema.index({ status: 1 });
// Pre-save middleware
studentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});
// Virtual for guardian primary contact
studentSchema.virtual('primaryGuardianContact').get(function() {
  return {
    name: this.guardian_info.guardian_name || this.guardian_info.father_name,
    phone: this.guardian_info.guardian_phone,
    email: this.guardian_info.guardian_email
  };
});
module.exports = mongoose.model('Student', studentSchema);
