const mongoose = require('mongoose');
const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['school','islamic'], required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  code: { type: String, trim: true, uppercase: true },
  credits: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Course', courseSchema);
