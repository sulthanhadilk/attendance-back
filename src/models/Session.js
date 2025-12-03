const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['prayer', 'class'], required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
}, { timestamps: true });

sessionSchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);
