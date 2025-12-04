const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, enum: ['admin'], required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: Object },
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', auditLogSchema);
