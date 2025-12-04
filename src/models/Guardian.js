const mongoose = require('mongoose');
const guardianSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  fatherPhone: {
    type: String,
    trim: true
  },
  fatherEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  fatherHouse: String,
  fatherPlace: String,
  fatherCity: String,
  fatherPostOffice: String,
  fatherPin: String,
  fatherOccupation: String,
  fatherIncome: Number,
  motherName: {
    type: String,
    trim: true
  },
  motherPhone: {
    type: String,
    trim: true
  },
  motherEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  motherOccupation: String,
  guardianName: {
    type: String,
    trim: true
  },
  guardianRelation: String,
  guardianPhone: {
    type: String,
    trim: true
  },
  guardianAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
guardianSchema.index({ studentId: 1 });
module.exports = mongoose.model('Guardian', guardianSchema);
