const { TeacherNotification, AuditLog } = require('../../models');

exports.list = async (req, res) => {
  const list = await TeacherNotification.find({ target: 'all' }).sort({ createdAt: -1 });
  res.json(list);
};
exports.create = async (req, res) => {
  const { title, body } = req.body;
  const n = await TeacherNotification.create({ teacherId: null, target: 'all', title, body });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'create-notice', entityType:'Notice', entityId:n._id });
  res.status(201).json(n);
};
exports.update = async (req, res) => {
  const { id } = req.params; const { title, body } = req.body;
  const n = await TeacherNotification.findByIdAndUpdate(id, { title, body }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'update-notice', entityType:'Notice', entityId:id });
  res.json(n);
};
exports.remove = async (req, res) => {
  const { id } = req.params;
  await TeacherNotification.findByIdAndDelete(id);
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'delete-notice', entityType:'Notice', entityId:id });
  res.json({ msg:'Deleted' });
};
