const mongoose = require('mongoose');
const feePaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  structureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  mode: {
    type: String,
    enum: ['cash', 'upi', 'bank', 'card', 'cheque', 'online'],
    default: 'cash'
  },
  date: {
    type: Date,
    default: Date.now
  },
  receiptNo: {
    type: String,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'success'
  },
  transactionId: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  paidBy: {
    type: String,
    trim: true
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });
// Indexes for efficient queries
feePaymentSchema.index({ studentId: 1, date: -1 });
feePaymentSchema.index({ receiptNo: 1 });
feePaymentSchema.index({ status: 1 });
module.exports = mongoose.model('FeePayment', feePaymentSchema);
