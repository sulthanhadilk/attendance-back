const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // e.g., "Semester 1 Fee", "Annual Fee"
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  batch: { type: String, trim: true },
  semester: { type: Number },
  type: { type: String, enum: ['school','islamic'], required: true },
  amount: { type: Number, required: true, min: 0 }, // Total amount
  items: [{ label: String, amount: Number }], // Itemized breakdown
  total: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-calculate total from items if not provided
feeStructureSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.total = this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  } else if (this.amount) {
    this.total = this.amount;
  }
  next();
});

feeStructureSchema.index({ departmentId: 1, semester: 1, type: 1 });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
