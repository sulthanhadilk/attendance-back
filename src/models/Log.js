const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  meta: { type: Object },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

logSchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
