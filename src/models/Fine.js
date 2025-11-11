const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  is_paid: { type: Boolean, default: false },
}, { timestamps: true });

fineSchema.index({ student_id: 1, is_paid: 1 });

module.exports = mongoose.model('Fine', fineSchema);
