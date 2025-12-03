const { Fine, AuditLog } = require('../../models');

exports.list = async (req, res) => {
  const { classId, studentId, teacherId, status } = req.query;
  const match = {};
  if (status) match.status = status;
  let fines = await Fine.find(match).populate('student_id').populate('teacher_id');
  if (classId) fines = fines.filter(f => String(f.student_id.class_id) === String(classId));
  if (studentId) fines = fines.filter(f => String(f.student_id._id) === String(studentId));
  if (teacherId) fines = fines.filter(f => String(f.teacher_id._id) === String(teacherId));
  res.json(fines);
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params; const { status } = req.body;
  const updated = await Fine.findByIdAndUpdate(id, { status, is_paid: status==='paid' }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'fine-status', entityType:'Fine', entityId:id, details:{status} });
  res.json(updated);
};

exports.editFine = async (req, res) => {
  const { id } = req.params; const { amount, reason } = req.body;
  const updated = await Fine.findByIdAndUpdate(id, { amount, reason }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'fine-edit', entityType:'Fine', entityId:id, details:{amount, reason} });
  res.json(updated);
};

exports.approveFine = async (req, res) => {
  const { id } = req.params;
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'fine-approve', entityType:'Fine', entityId:id });
  res.json({ msg:'Approved' });
};
