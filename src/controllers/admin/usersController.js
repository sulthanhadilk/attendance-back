const { User, Student, Teacher, AuditLog } = require('../../models');

exports.listStudents = async (req, res) => {
  const list = await Student.find().populate('user_id');
  res.json(list);
};
exports.createStudent = async (req, res) => {
  const { name, email, password, class_id, guardian_name, guardian_phone } = req.body;
  if (!name || !email || !password || !class_id) return res.status(400).json({ msg: 'Missing fields' });
  const user = await User.create({ name, email: email.toLowerCase(), password, role: 'student' });
  const student = await Student.create({ user_id: user._id, class_id, guardian_name, guardian_phone });
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'create', entityType: 'Student', entityId: student._id, details: { email } });
  res.status(201).json({ user, student });
};
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const student = await Student.findByIdAndUpdate(id, update, { new: true });
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'update', entityType: 'Student', entityId: id, details: update });
  res.json(student);
};
exports.disableStudent = async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id).populate('user_id');
  if (!student) return res.status(404).json({ msg: 'Not found' });
  student.user_id.password = 'DISABLED';
  await student.user_id.save();
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'disable', entityType: 'Student', entityId: id });
  res.json({ msg: 'Student disabled' });
};
exports.listTeachers = async (req, res) => {
  const list = await Teacher.find().populate('user_id');
  res.json(list);
};
exports.createTeacher = async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });
  const user = await User.create({ name, email: email.toLowerCase(), password, role: 'teacher' });
  const teacher = await Teacher.create({ user_id: user._id, department });
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'create', entityType: 'Teacher', entityId: teacher._id, details: { email } });
  res.status(201).json({ user, teacher });
};
exports.updateTeacher = async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const teacher = await Teacher.findByIdAndUpdate(id, update, { new: true });
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'update', entityType: 'Teacher', entityId: id, details: update });
  res.json(teacher);
};
exports.disableTeacher = async (req, res) => {
  const { id } = req.params;
  const teacher = await Teacher.findById(id).populate('user_id');
  if (!teacher) return res.status(404).json({ msg: 'Not found' });
  teacher.user_id.password = 'DISABLED';
  await teacher.user_id.save();
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'disable', entityType: 'Teacher', entityId: id });
  res.json({ msg: 'Teacher disabled' });
};
exports.resetPassword = async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) return res.status(400).json({ msg: 'userId and newPassword required' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: 'User not found' });
  user.password = newPassword;
  await user.save();
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'reset-password', entityType: 'User', entityId: userId });
  res.json({ msg: 'Password reset' });
};
exports.approvePhoto = async (req, res) => {
  const { userId, photoUrl } = req.body;
  if (!userId || !photoUrl) return res.status(400).json({ msg: 'userId and photoUrl required' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: 'User not found' });
  user.profile_picture = photoUrl;
  await user.save();
  await AuditLog.create({ actorUserId: req.user._id, actorRole: 'admin', action: 'approve-photo', entityType: 'User', entityId: userId, details: { photoUrl } });
  res.json({ msg: 'Photo approved' });
};
