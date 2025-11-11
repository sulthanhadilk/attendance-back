const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  section: { type: String, trim: true },
  year: { type: Number, required: true },
}, { timestamps: true });

classSchema.index({ name: 1, section: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
