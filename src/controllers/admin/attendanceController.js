const { Attendance, HourlyAttendance, Student, AuditLog, TeacherNotification } = require('../../models');
const { Parser } = require('json2csv');
exports.viewClassAttendance = async (req, res) => {
  const { classId, date } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (date) filter.date = new Date(date);
  const hourly = await HourlyAttendance.find(filter);
  res.json(hourly);
};
exports.overrideAttendance = async (req, res) => {
  const { recordId, status } = req.body;
  const updated = await HourlyAttendance.findByIdAndUpdate(recordId, { status }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'override', entityType:'HourlyAttendance', entityId:recordId, details:{status} });
  if (process.env.ADMIN_NOTIFY_ON_OVERRIDE === 'true') {
    // simple teacher notification stub
    await TeacherNotification.create({ teacherId: updated.markedByTeacherId, title:'Attendance override', body:`Admin changed status to ${status}` });
  }
  res.json(updated);
};
exports.downloadReport = async (req, res) => {
  const { classId, from, to } = req.query;
  const filter = { classId };
  if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };
  const list = await HourlyAttendance.find(filter).lean();
  const parser = new Parser();
  const csv = parser.parse(list);
  res.header('Content-Type', 'text/csv');
  res.attachment('attendance.csv');
  res.send(csv);
};
exports.approveError = async (req, res) => {
  const { recordId } = req.body;
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'approve-error', entityType:'HourlyAttendance', entityId:recordId });
  res.json({ msg:'Approved' });
};
