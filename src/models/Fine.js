const mongoose = require('mongoose');
const fineSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  // Legacy date field retained for compatibility
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  // New fields for teacher-module spec
  context: { type: String, enum: ['attendance', 'discipline', 'other'], default: 'other' },
  paymentNote: { type: String },
  // New fields for teacher-module spec
  issuedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
  paidAt: { type: Date },
  is_paid: { type: Boolean, default: false }
}, { timestamps: true });
fineSchema.index({ student_id: 1, is_paid: 1 });
module.exports = mongoose.model('Fine', fineSchema);
