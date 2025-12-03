const mongoose = require('mongoose');

const classActivitySchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  attachments: [{ type: String }],
}, { timestamps: true });

classActivitySchema.index({ classId: 1, date: -1 });

module.exports = mongoose.model('ClassActivity', classActivitySchema);
