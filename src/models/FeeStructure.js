const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  batch: { type: String, trim: true },
  semester: { type: Number },
  type: { type: String, enum: ['school','islamic'], required: true },
  items: [{ label: String, amount: Number }],
  total: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
