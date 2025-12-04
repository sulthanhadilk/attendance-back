const { ExamResult, AuditLog } = require('../../models');
exports.list = async (req, res) => {
  const { classId, examType } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (examType) filter.examType = examType;
  const list = await ExamResult.find(filter);
  res.json(list);
};
exports.approve = async (req, res) => {
  const { id } = req.params;
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'approve-result', entityType:'ExamResult', entityId:id });
  res.json({ msg:'Approved' });
};
exports.edit = async (req, res) => {
  const { id } = req.params; const { marksObtained, maxMarks } = req.body;
  const updated = await ExamResult.findByIdAndUpdate(id, { marksObtained, maxMarks }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'edit-result', entityType:'ExamResult', entityId:id });
  res.json(updated);
};
exports.publish = async (req, res) => {
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'publish-results', entityType:'ExamResult' });
  res.json({ msg:'Published' });
};
