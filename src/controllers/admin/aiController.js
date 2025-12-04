const { Student, HourlyAttendance, ExamResult, AuditLog } = require('../../models');
let AI_ENABLED = process.env.TEACHER_AI_ENABLED === 'true';
exports.toggle = async (req, res) => {
  const { enabled } = req.body; AI_ENABLED = !!enabled;
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'ai-toggle', entityType:'AI', details:{enabled:AI_ENABLED} });
  res.json({ enabled: AI_ENABLED });
};
exports.lowAttendance = async (req, res) => {
  const { classId } = req.query; const students = await Student.find({ class_id: classId }); const ids = students.map(s=>s._id);
  const agg = await HourlyAttendance.aggregate([{ $match:{ studentId:{ $in: ids } } }, { $group:{ _id:'$studentId', total:{ $sum:1 }, present:{ $sum:{ $cond:[{ $eq:['$status','present'] },1,0] } } } }]);
  const result = agg.map(a => ({ studentId:a._id, attendancePct: a.total? (a.present/a.total)*100 : 0 })).filter(r => r.attendancePct < 75);
  res.json(result);
};
exports.atRisk = async (req, res) => {
  const { classId } = req.query; const students = await Student.find({ class_id: classId }); const ids = students.map(s=>s._id);
  const att = await HourlyAttendance.aggregate([{ $match:{ studentId:{ $in: ids } } }, { $group:{ _id:'$studentId', total:{ $sum:1 }, present:{ $sum:{ $cond:[{ $eq:['$status','present'] },1,0] } } } }]);
  const attMap = new Map(att.map(a => [String(a._id), a.total? (a.present/a.total)*100 : 0]));
  const marks = await ExamResult.aggregate([{ $match:{ studentId:{ $in: ids } } }, { $group:{ _id:'$studentId', avg:{ $avg:'$percentage' } } }]);
  const marksMap = new Map(marks.map(m => [String(m._id), m.avg||0]));
  const result = students.map(s => ({ studentId: s._id, attendancePct: attMap.get(String(s._id))||0, avgMarks: marksMap.get(String(s._id))||0 })).filter(r => r.attendancePct<75 || r.avgMarks<40);
  res.json(result);
};
exports.summary = async (req, res) => {
  res.json({ enabled: AI_ENABLED, rules: { attendanceRiskThreshold: 75, marksLowThreshold: 40 } });
};
