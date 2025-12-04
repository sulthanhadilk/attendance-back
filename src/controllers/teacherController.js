const {
  Student,
  Teacher,
  Class,
  Subject,
  Attendance,
  Fine,
  Exam,
  ExamResult,
  PrayerAttendance,
  HourlyAttendance,
  StudentConduct,
  TeacherNotification,
  QuestionBank,
  ClassActivity,
  Club,
  LMSLink,
  User
} = require('../models');
const { logActivity, generateToken } = require('./authController');
// Helper: get teacher by user
async function getTeacherByUser(userId) {
  return Teacher.findOne({ user_id: userId });
}
// AUTH: teacher login using existing User+JWT
async function teacherLogin(req, res) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ msg: 'Identifier and password are required' });
    }
    let user = null;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      const teacher = await Teacher.findOne({ $or: [{ staffCode: identifier.toUpperCase() }, { employee_id: identifier.toUpperCase() }] });
      if (teacher) {
        user = await User.findById(teacher.user_id);
      }
    }
    if (!user || user.role !== 'teacher') {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    // delegate password check to existing authController via method
    if (typeof user.comparePassword === 'function') {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });
    } else {
      // fallback: reject if comparePassword is not defined
      return res.status(500).json({ msg: 'Password validation not configured for teacher login' });
    }
    const token = generateToken(user); // existing helper uses JWT_SECRET
    const teacher = await Teacher.findOne({ user_id: user._id });
    return res.json({
      token,
      teacher: {
        id: teacher?._id,
        name: user.name,
        staffCode: teacher?.staffCode || teacher?.employee_id || null
      }
    });
  } catch (err) {
    console.error('teacherLogin error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// DASHBOARD
async function getDashboardData(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id).populate('classes');
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    // classes assigned
    const classIds = (teacher.classes || []).map(c => c._id ? c._id : c);
    // compute attendance aggregates for today across teacher's classes
    const attendanceMatch = { classId: { $in: classIds } , date: { $gte: startOfDay, $lt: endOfDay } };
    const [classCount, attendanceAgg, pendingFines, upcomingExams, recentNotifications, recentConduct] = await Promise.all([
      Class.countDocuments({ _id: { $in: classIds } }),
      HourlyAttendance.aggregate([
        { $match: attendanceMatch },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
      ]),
      Fine.countDocuments({ teacher_id: teacher._id, status: 'unpaid' }),
      Exam.find({ class_id: { $in: classIds }, date: { $gte: today } }).sort({ date: 1 }).limit(5),
      TeacherNotification.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).limit(5),
      StudentConduct.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).limit(5)
    ]);
    const total = attendanceAgg[0]?.total || 0;
    const present = attendanceAgg[0]?.present || 0;
    const todayAttendancePercent = total ? Math.round((present / total) * 100) : 0;
    // build today's timetable items with required fields (hourIndex, className, courseName, room)
    const targetDate = today;
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = weekdays[targetDate.getDay()];
    let timetable = [];
    if (teacher.schedule && Array.isArray(teacher.schedule)) {
      const daySchedule = teacher.schedule.find(d => d.day === dayName);
      if (daySchedule && Array.isArray(daySchedule.periods)) {
        timetable = await Promise.all(daySchedule.periods.map(async p => {
          // populate courseName and room from subject and class if available
          const subject = p.subject_id ? await Subject.findById(p.subject_id).select('name') : null;
          const cls = p.class_id ? await Class.findById(p.class_id).select('name room') : null;
          return {
            hourIndex: p.period_number,
            className: cls?.name || (p.class_id?.name || 'Class'),
            courseName: subject?.name || (p.subject_id?.name || 'Course'),
            room: cls?.room || null
          };
        }));
      }
    }
    res.json({
      teacher: {
        id: teacher._id,
        name: req.user.name,
        staffCode: teacher.staffCode || teacher.employee_id,
        designation: teacher.designation,
        department: teacher.department,
        photoUrl: teacher.photoUrl || req.user.profile_picture || null
      },
      classes: teacher.classes,
      todaysTimetable: timetable,
      stats: {
        classesAssigned: classCount,
        todayAttendancePercent,
        pendingFinesCount: pendingFines,
        upcomingExams: upcomingExams.length
      },
      upcomingExams,
      notifications: recentNotifications,
      recentConduct
    });
  } catch (err) {
    console.error('getDashboardData error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// CLASSES
async function getMyClasses(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    const classes = await Class.find({
      $or: [
        { _id: { $in: teacher.classes || [] } },
      ]
    });
    res.json(classes);
  } catch (err) {
    console.error('getMyClasses error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getClassStudents(req, res) {
  try {
    const { classId } = req.params;
    // Basic student list
    const students = await Student.find({ class_id: classId })
      .populate('user_id', 'name roll_no phone')
      .sort({ 'user_id.roll_no': 1 });
    // For each student compute attendance %, fines count, last mark
    const studentIds = students.map(s => s._id);
    const attAgg = await HourlyAttendance.aggregate([
      { $match: { studentId: { $in: studentIds }, classId: require('mongoose').Types.ObjectId(classId) } },
      { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
    ]);
    const attMap = new Map(attAgg.map(a => [String(a._id), { total: a.total, present: a.present, pct: a.total ? Math.round((a.present / a.total) * 100) : 0 }]));
    const finesAgg = await Fine.aggregate([
      { $match: { student_id: { $in: studentIds } } },
      { $group: { _id: '$student_id', count: { $sum: 1 } } }
    ]);
    const finesMap = new Map(finesAgg.map(f => [String(f._id), f.count]));
    const lastMarks = await ExamResult.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$studentId', last: { $first: '$$ROOT' } } }
    ]);
    const lastMarksMap = new Map(lastMarks.map(m => [String(m._id), m.last]));
    const result = students.map(s => ({
      student: s,
      attendance: attMap.get(String(s._id)) || { total: 0, present: 0, pct: 0 },
      finesCount: finesMap.get(String(s._id)) || 0,
      lastMark: lastMarksMap.get(String(s._id)) || null
    }));
    res.json(result);
  } catch (err) {
    console.error('getClassStudents error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// TIMETABLE (using Teacher.schedule as stub)
async function getTimetable(req, res) {
  try {
    const { classId, date } = req.query;
    const teacher = await getTeacherByUser(req.user._id).populate('schedule.periods.subject_id').populate('schedule.periods.class_id');
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    const targetDate = date ? new Date(date) : new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = weekdays[targetDate.getDay()];
    const daySchedule = (teacher.schedule || []).find(d => d.day === dayName);
    if (!daySchedule) return res.json([]);
    const periods = await Promise.all((daySchedule.periods || [])
      .filter(p => !classId || String(p.class_id) === String(classId))
      .map(async p => {
        const subject = p.subject_id ? await Subject.findById(p.subject_id).select('name') : null;
        const cls = p.class_id ? await Class.findById(p.class_id).select('name room') : null;
        return {
          hourIndex: p.period_number,
          className: cls?.name || (p.class_id?.name || 'Class'),
          courseName: subject?.name || (p.subject_id?.name || 'Course'),
          room: cls?.room || null
        };
      }));
    res.json(periods);
  } catch (err) {
    console.error('getTimetable error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// HOUR-WISE ATTENDANCE
async function markHourlyAttendance(req, res) {
  try {
    const { classId, courseId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ msg: 'classId, date and records are required' });
    }
    const teacher = await getTeacherByUser(req.user._id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    const targetDate = new Date(date);
    const ops = records.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, classId, date: targetDate, hourIndex: r.hourIndex },
        update: {
          $set: {
            studentId: r.studentId,
            classId,
            courseId: courseId || null,
            date: targetDate,
            hourIndex: r.hourIndex,
            status: r.status,
            markedByTeacherId: teacher._id
          }
        },
        upsert: true
      }
    }));
    if (ops.length) await HourlyAttendance.bulkWrite(ops);
    await logActivity(req.user._id, `Marked hourly attendance for class ${classId} (${records.length} records)`);
    res.json({ msg: 'Hourly attendance saved', count: records.length });
  } catch (err) {
    console.error('markHourlyAttendance error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getAttendanceReport(req, res) {
  try {
    const { classId, from, to, courseId } = req.query;
    if (!classId || !from || !to) return res.status(400).json({ msg: 'classId, from, to are required' });
    const mongoose = require('mongoose');
    const teacher = await getTeacherByUser(req.user._id);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const matchStage = {
      classId: new mongoose.Types.ObjectId(classId),
      markedByTeacherId: teacher._id,
      date: { $gte: fromDate, $lte: toDate }
    };
    // Per-course breakdown if courseId provided
    const groupKey = courseId ? { studentId: '$studentId', courseId: '$courseId' } : '$studentId';
    const summary = await HourlyAttendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupKey,
          totalHours: { $sum: 1 },
          presentHours: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      }
    ]);
    res.json(summary.map(s => ({
      studentId: courseId ? s._id.studentId : s._id,
      courseId: courseId ? s._id.courseId : undefined,
      totalHours: s.totalHours,
      presentHours: s.presentHours,
      attendancePct: s.totalHours ? (s.presentHours / s.totalHours) * 100 : 0
    })));
  } catch (err) {
    console.error('getAttendanceReport error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getMonthlyAttendance(req, res) {
  try {
    const { classId, month, year, courseId } = req.query;
    if (!classId || !month || !year) return res.status(400).json({ msg: 'classId, month, year are required' });
    const mongoose = require('mongoose');
    const teacher = await getTeacherByUser(req.user._id);
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);
    const fromDate = new Date(y, m, 1);
    const toDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
    const matchStage = {
      classId: new mongoose.Types.ObjectId(classId),
      markedByTeacherId: teacher._id,
      date: { $gte: fromDate, $lte: toDate }
    };
    // Per-course breakdown if courseId provided
    const groupKey = courseId ? { studentId: '$studentId', courseId: '$courseId' } : '$studentId';
    const summary = await HourlyAttendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupKey,
          totalHours: { $sum: 1 },
          presentHours: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      }
    ]);
    res.json(summary.map(s => ({
      studentId: courseId ? s._id.studentId : s._id,
      courseId: courseId ? s._id.courseId : undefined,
      totalHours: s.totalHours,
      presentHours: s.presentHours,
      attendancePct: s.totalHours ? (s.presentHours / s.totalHours) * 100 : 0
    })));
  } catch (err) {
    console.error('getMonthlyAttendance error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// PRAYER ATTENDANCE
async function markPrayerAttendance(req, res) {
  try {
    const { classId, prayerType, date, records } = req.body;
    if (!prayerType || !date || !Array.isArray(records) || !classId) {
      return res.status(400).json({ msg: 'classId, prayerType, date and records are required' });
    }
    const teacher = await getTeacherByUser(req.user._id);
    const targetDate = new Date(date);
    const ops = records.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, classId, date: targetDate, prayerType },
        update: {
          $set: { studentId: r.studentId, teacherId: teacher._id, classId, date: targetDate, prayerType, status: r.status }
        },
        upsert: true
      }
    }));
    if (ops.length) await PrayerAttendance.bulkWrite(ops);
    res.json({ msg: 'Prayer attendance saved', count: records.length });
  } catch (err) {
    console.error('markPrayerAttendance error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getPrayerReport(req, res) {
  try {
    const { classId, from, to, prayerType } = req.query;
    if (!classId || !from || !to) return res.status(400).json({ msg: 'classId, from, to are required' });
    const students = await Student.find({ class_id: classId }).select('_id');
    const studentIds = students.map(s => s._id);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const match = { studentId: { $in: studentIds }, date: { $gte: fromDate, $lte: toDate } };
    if (prayerType) match.prayerType = prayerType;
    const agg = await PrayerAttendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$studentId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      }
    ]);
    res.json(agg.map(a => ({
      studentId: a._id,
      total: a.total,
      present: a.present,
      attendancePct: a.total ? (a.present / a.total) * 100 : 0
    })));
  } catch (err) {
    console.error('getPrayerReport error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// FINES
async function createFine(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { classId, studentId, amount, reason, dueDate, context } = req.body;
    if (!studentId || typeof amount === 'undefined' || !reason) return res.status(400).json({ msg: 'studentId, amount, reason are required' });
    const fine = await Fine.create({
      student_id: studentId,
      teacher_id: teacher._id,
      amount,
      reason,
      context: context || 'other',
      issuedAt: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'unpaid',
      is_paid: false
    });
    res.status(201).json({ msg: 'Fine created', fine });
  } catch (err) {
    console.error('createFine error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function updateFineStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, paidAt } = req.body;
    if (!['paid', 'unpaid', 'waived'].includes(status)) return res.status(400).json({ msg: 'Invalid status' });
    const updateObj = {
      status,
      is_paid: status === 'paid',
      paidAt: status === 'paid' ? (paidAt ? new Date(paidAt) : new Date()) : null
    };
    if (req.body.paymentNote) updateObj.paymentNote = req.body.paymentNote;
    const updated = await Fine.findByIdAndUpdate(id, updateObj, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Fine not found' });
    res.json({ msg: 'Fine updated', fine: updated });
  } catch (err) {
    console.error('updateFineStatus error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function listFines(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { classId, status } = req.query;
    const match = { teacher_id: teacher._id };
    if (status) match.status = status;
    let fines = await Fine.find(match).populate({
      path: 'student_id',
      populate: { path: 'user_id', select: 'name roll_no' }
    });
    if (classId) {
      fines = fines.filter(f => String(f.student_id.class_id) === String(classId));
    }
    res.json(fines);
  } catch (err) {
    console.error('listFines error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// EXAMS & RESULTS (teacher-side bulk)
async function saveExamResultsBulk(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const body = req.body;
    if (!Array.isArray(body) || !body.length) return res.status(400).json({ msg: 'Array of results required' });
    const docs = body.map(r => ({
      studentId: r.studentId,
      classId: r.classId,
      courseId: r.courseId,
      examType: r.examType,
      internalOrExternal: r.internalOrExternal,
      examName: r.examName,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      enteredByTeacherId: teacher._id
    }));
    // Upsert each result (simple approach: insertMany for now)
    const results = await ExamResult.insertMany(docs);
    res.json({ msg: 'Exam results saved', count: results.length });
  } catch (err) {
    console.error('saveExamResultsBulk error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getExamResults(req, res) {
  try {
    const { classId, examType, internalOrExternal } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (examType) filter.examType = examType;
    if (internalOrExternal) filter.internalOrExternal = internalOrExternal;
    const results = await ExamResult.find(filter);
    res.json(results);
  } catch (err) {
    console.error('getExamResults error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function updateExamResult(req, res) {
  try {
    const { id } = req.params;
    const { marksObtained, maxMarks } = req.body;
    const updated = await ExamResult.findByIdAndUpdate(id, { marksObtained, maxMarks }, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Result not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateExamResult error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// CONDUCT
async function addConductRemark(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { classId } = req.params;
    const { studentId, severity, remark } = req.body;
    if (!studentId || !severity || !remark) return res.status(400).json({ msg: 'studentId, severity, remark required' });
    const conduct = await StudentConduct.create({
      studentId,
      teacherId: teacher._id,
      classId,
      severity,
      remark
    });
    res.status(201).json(conduct);
  } catch (err) {
    console.error('addConductRemark error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getConductRemarks(req, res) {
  try {
    const { classId } = req.params;
    const records = await StudentConduct.find({ classId }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error('getConductRemarks error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// NOTIFICATIONS
async function createNotification(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { targetType, studentId, classId, title, body } = req.body;
    if (!targetType || !title || !body) return res.status(400).json({ msg: 'targetType, title, body required' });
    const notif = await TeacherNotification.create({
      teacherId: teacher._id,
      target: targetType,
      studentId: targetType === 'student' ? studentId : null,
      classId: targetType === 'class' ? classId : null,
      title,
      body
    });
    res.status(201).json(notif);
  } catch (err) {
    console.error('createNotification error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function listNotifications(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const list = await TeacherNotification.find({ teacherId: teacher._id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error('listNotifications error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// ACTIVITIES
async function createActivity(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { classId } = req.params;
    const { title, description, date, attachments } = req.body;
    if (!title) return res.status(400).json({ msg: 'title required' });
    const activity = await ClassActivity.create({
      classId,
      teacherId: teacher._id,
      title,
      description,
      date: date ? new Date(date) : new Date(),
      attachments: attachments || []
    });
    res.status(201).json(activity);
  } catch (err) {
    console.error('createActivity error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function listActivities(req, res) {
  try {
    const { classId } = req.params;
    const list = await ClassActivity.find({ classId }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    console.error('listActivities error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// CLUBS
async function createClub(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { name, members, classId } = req.body;
    if (!name) return res.status(400).json({ msg: 'name required' });
    const club = await Club.create({
      name,
      teacherInChargeId: teacher._id,
      classId: classId || null,
      members: members || []
    });
    res.status(201).json(club);
  } catch (err) {
    console.error('createClub error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function listClubs(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { classId } = req.query;
    const filter = { teacherInChargeId: teacher._id };
    if (classId) filter.classId = classId;
    const list = await Club.find(filter);
    res.json(list);
  } catch (err) {
    console.error('listClubs error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// QUESTION BANK
async function createQuestionBank(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { courseId, title, difficulty, questions } = req.body;
    if (!courseId || !title) return res.status(400).json({ msg: 'courseId and title required' });
    const qb = await QuestionBank.create({
      teacherId: teacher._id,
      courseId,
      title,
      difficulty: difficulty || 'medium',
      questions: questions || []
    });
    res.status(201).json(qb);
  } catch (err) {
    console.error('createQuestionBank error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function listQuestionBanks(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { courseId } = req.query;
    const filter = { teacherId: teacher._id };
    if (courseId) filter.courseId = courseId;
    const list = await QuestionBank.find(filter);
    res.json(list);
  } catch (err) {
    console.error('listQuestionBanks error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// RESOURCES / LMS LINKS
async function createResourceLink(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { title, url, type, courseId } = req.body;
    if (!title || !url) return res.status(400).json({ msg: 'title and url required' });
    const link = await LMSLink.create({
      title,
      url,
      type: type || 'REFERENCE',
      courseId: courseId || null,
      teacherId: teacher._id
    });
    res.status(201).json(link);
  } catch (err) {
    console.error('createResourceLink error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function listResourceLinks(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { courseId, type } = req.query;
    const filter = { teacherId: teacher._id };
    if (courseId) filter.courseId = courseId;
    if (type) filter.type = type;
    const list = await LMSLink.find(filter);
    res.json(list);
  } catch (err) {
    console.error('listResourceLinks error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// AI STUBS
async function aiWeakStudents(req, res) {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ msg: 'classId required' });
    const students = await Student.find({ class_id: classId }).populate('user_id', 'name');
    const studentIds = students.map(s => s._id);
    const attendanceAgg = await HourlyAttendance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', totalHours: { $sum: 1 }, presentHours: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
    ]);
    const attendanceMap = new Map();
    attendanceAgg.forEach(a => attendanceMap.set(String(a._id), { attendancePercent: a.totalHours ? (a.presentHours / a.totalHours) * 100 : 0 }));
    // average marks per student
    // Compute percentage from available fields: percentage OR marksObtained/maxMarks OR marks_obtained/max_marks
    const marksAgg = await ExamResult.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $project: {
          studentId: 1,
          computedPercent: {
            $cond: [
              { $ifNull: ['$percentage', false] },
              '$percentage',
              {
                $cond: [
                  { $and: [{ $ifNull: ['$marksObtained', false] }, { $ifNull: ['$maxMarks', false] }] },
                  { $multiply: [{ $divide: ['$marksObtained', '$maxMarks'] }, 100] },
                  {
                    $cond: [
                      { $and: [{ $ifNull: ['$marks_obtained', false] }, { $ifNull: ['$max_marks', false] }] },
                      { $multiply: [{ $divide: ['$marks_obtained', '$max_marks'] }, 100] },
                      0
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      { $group: { _id: '$studentId', avgPercent: { $avg: '$computedPercent' } } }
    ]);
    const marksMap = new Map(marksAgg.map(m => [String(m._id), m.avgPercent || 0]));
    const results = students.map(s => {
      const attendancePercent = Math.round((attendanceMap.get(String(s._id))?.attendancePercent) || 0);
      const averageMarks = Math.round(marksMap.get(String(s._id)) || 0);
      const weak = (attendancePercent < 75) || (averageMarks < 40);
      return { studentId: s._id, name: s.user_id?.name || '', attendancePercent, averageMarks, weak };
    }).filter(r => r.weak);
    res.json(results);
  } catch (err) {
    console.error('aiWeakStudents error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function aiAttendanceRisk(req, res) {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ msg: 'classId required' });
    const students = await Student.find({ class_id: classId }).populate('user_id', 'name');
    const studentIds = students.map(s => s._id);
    const attendanceAgg = await HourlyAttendance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', totalHours: { $sum: 1 }, presentHours: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
    ]);
    const attendanceMap = new Map();
    attendanceAgg.forEach(a => attendanceMap.set(String(a._id), { attendancePercent: a.totalHours ? (a.presentHours / a.totalHours) * 100 : 100 }));
    const results = students.map(s => {
      const attendancePercent = Math.round((attendanceMap.get(String(s._id))?.attendancePercent) || 0);
      const riskScore = Number((1 - attendancePercent / 100).toFixed(2));
      return { studentId: s._id, name: s.user_id?.name || '', riskScore };
    });
    res.json(results);
  } catch (err) {
    console.error('aiAttendanceRisk error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function aiScheduleSuggestion(req, res) {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ msg: 'classId required' });
    // Return array of suggestion objects per spec
    const suggestions = [
      { day: 'Wednesday', period: 'H2', reason: 'Mid-week & mid-day have better attendance (stub).' },
      { day: 'Tuesday', period: 'H3', reason: 'Avoid Monday mornings and late periods before weekend (stub).' }
    ];
    res.json(suggestions);
  } catch (err) {
    console.error('aiScheduleSuggestion error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// New: Day-grid attendance for a class & date
async function getAttendanceDayGrid(req, res) {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) return res.status(400).json({ msg: 'classId and date required' });
    const targetDate = new Date(date);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    const students = await Student.find({ class_id: classId }).populate('user_id', 'name roll_no');
    const studentIds = students.map(s => s._id);
    const records = await HourlyAttendance.find({ classId, date: { $gte: start, $lt: end } });
    // Build grid: for each student, hours 1..5
    const grid = students.map(s => {
      const recs = records.filter(r => String(r.studentId) === String(s._id));
      const hours = {};
      for (let h = 1; h <= 5; h++) {
        const rr = recs.find(r => r.hourIndex === h);
        hours[`H${h}`] = rr ? rr.status : 'unmarked';
      }
      return { student: s, hours };
    });
    res.json({ date: start, classId, grid });
  } catch (err) {
    console.error('getAttendanceDayGrid error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
// LEGACY METHODS (backward compatibility)
async function markAttendance(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { session_id, date, entries } = req.body;
    if (!session_id || !date || !Array.isArray(entries)) {
      return res.status(400).json({ msg: 'session_id, date, and entries are required' });
    }
    const targetDate = new Date(date);
    const saved = [];
    for (const entry of entries) {
      const att = await Attendance.create({
        student_id: entry.student_id,
        session_id,
        teacher_id: teacher._id,
        date: targetDate,
        status: entry.status || 'present'
      });
      saved.push(att);
    }
    await logActivity(req.user._id, `Marked attendance for session ${session_id} (${saved.length} students)`);
    res.json({ msg: 'Attendance marked successfully', saved });
  } catch (err) {
    console.error('markAttendance error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getAttendanceHistory(req, res) {
  try {
    const { classId, subjectId } = req.params;
    const teacher = await getTeacherByUser(req.user._id);
    const filter = { teacher_id: teacher._id };
    if (classId) {
      // Find students in this class
      const students = await Student.find({ class_id: classId });
      filter.student_id = { $in: students.map(s => s._id) };
    }
    if (subjectId) {
      // Find sessions for this subject
      const sessions = await Session.find({ subject_id: subjectId });
      filter.session_id = { $in: sessions.map(s => s._id) };
    }
    const history = await Attendance.find(filter)
      .populate('student_id')
      .populate('session_id')
      .sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error('getAttendanceHistory error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function createExam(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const { name, date, class_id, subject_id } = req.body;
    if (!name || !date || !class_id) {
      return res.status(400).json({ msg: 'name, date, and class_id are required' });
    }
    const exam = await Exam.create({
      name,
      date: new Date(date),
      class_id,
      subject_id: subject_id || null,
      teacher_id: teacher._id,
      created_by: req.user._id
    });
    await logActivity(req.user._id, `Created exam: ${name}`);
    res.status(201).json({ msg: 'Exam created', exam });
  } catch (err) {
    console.error('createExam error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getMyExams(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    const exams = await Exam.find({ teacher_id: teacher._id })
      .populate('class_id')
      .populate('subject_id')
      .sort({ date: -1 });
    res.json(exams);
  } catch (err) {
    console.error('getMyExams error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function addExamResults(req, res) {
  try {
    const { results } = req.body;
    if (!Array.isArray(results)) return res.status(400).json({ msg: 'results array required' });
    const saved = await ExamResult.insertMany(results);
    res.json({ msg: 'Results saved', count: saved.length });
  } catch (err) {
    console.error('addExamResults error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getClassAttendanceSummary(req, res) {
  try {
    const { classId } = req.params;
    const students = await Student.find({ class_id: classId }).populate('user_id', 'name roll_no');
    const summary = [];
    for (const student of students) {
      const totalAtt = await Attendance.countDocuments({ student_id: student._id });
      const presentAtt = await Attendance.countDocuments({ student_id: student._id, status: 'present' });
      summary.push({
        student: student.user_id,
        total: totalAtt,
        present: presentAtt,
        percentage: totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(2) : 0
      });
    }
    res.json(summary);
  } catch (err) {
    console.error('getClassAttendanceSummary error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function getMyProfile(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id)
      .populate('classes')
      .populate('subjects');
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    res.json({
      user: req.user,
      teacher
    });
  } catch (err) {
    console.error('getMyProfile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function updateMyProfile(req, res) {
  try {
    const teacher = await getTeacherByUser(req.user._id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    const { designation, department, photoUrl } = req.body;
    if (designation) teacher.designation = designation;
    if (department) teacher.department = department;
    if (photoUrl) teacher.photoUrl = photoUrl;
    await teacher.save();
    res.json({ msg: 'Profile updated', teacher });
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
async function uploadProfilePhoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const teacher = await getTeacherByUser(req.user._id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
    const photoUrl = `/uploads/${req.file.filename}`;
    teacher.photoUrl = photoUrl;
    await teacher.save();
    res.json({ msg: 'Photo uploaded', photoUrl });
  } catch (err) {
    console.error('uploadProfilePhoto error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
module.exports = {
  teacherLogin,
  getDashboardData,
  getMyClasses,
  getClassStudents,
  getTimetable,
  markHourlyAttendance,
  getAttendanceReport,
  getMonthlyAttendance,
  getAttendanceDayGrid,
  markPrayerAttendance,
  getPrayerReport,
  createFine,
  updateFineStatus,
  listFines,
  saveExamResultsBulk,
  getExamResults,
  updateExamResult,
  addConductRemark,
  getConductRemarks,
  createNotification,
  listNotifications,
  createActivity,
  listActivities,
  createClub,
  listClubs,
  createQuestionBank,
  listQuestionBanks,
  createResourceLink,
  listResourceLinks,
  aiWeakStudents,
  aiAttendanceRisk,
  aiScheduleSuggestion,
  // Legacy methods
  markAttendance,
  getAttendanceHistory,
  createExam,
  getMyExams,
  addExamResults,
  getClassAttendanceSummary,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto
};
