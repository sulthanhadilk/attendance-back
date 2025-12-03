const { PrayerAttendance, Student, AuditLog } = require('../../models');

exports.summary = async (req, res) => {
  const { classId, from, to } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };
  const agg = await PrayerAttendance.aggregate([
    { $match: filter },
    { $group: { _id: { studentId: '$studentId', prayerType: '$prayerType' }, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status','present'] },1,0] } } } }
  ]);
  res.json(agg);
};

exports.override = async (req, res) => {
  const { id, status } = req.body;
  const updated = await PrayerAttendance.findByIdAndUpdate(id, { status }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'override', entityType:'PrayerAttendance', entityId:id, details:{status} });
  res.json(updated);
};

exports.setReward = async (req, res) => {
  const { id, rewarded } = req.body;
  const updated = await PrayerAttendance.findByIdAndUpdate(id, { rewarded: !!rewarded }, { new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'reward', entityType:'PrayerAttendance', entityId:id, details:{rewarded} });
  res.json(updated);
};
