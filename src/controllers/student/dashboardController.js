const { Student, User, HourlyAttendance, PrayerAttendance, Class, Course, Department } = require('../../models');
/**
 * GET /api/student/dashboard
 * Student dashboard with profile summary, today's schedule, stats
 */
exports.getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('user_id', 'name email roll_no')
      .populate('class_id', 'name section semester batch')
      .populate('departmentId', 'name code')
      .populate('courseIds', 'name code type');
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student profile not found' });
    }
    // Get today's attendance count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayHourly, todayPrayer, totalHourly, presentHourly] = await Promise.all([
      HourlyAttendance.find({
        studentId: student._id,
        date: { $gte: today }
      }),
      PrayerAttendance.find({
        studentId: student._id,
        date: { $gte: today }
      }),
      HourlyAttendance.countDocuments({ studentId: student._id }),
      HourlyAttendance.countDocuments({ studentId: student._id, status: 'present' })
    ]);
    const attendancePercentage = totalHourly > 0 
      ? Math.round((presentHourly / totalHourly) * 100) 
      : 0;
    res.json({
      success: true,
      student: {
        name: student.user_id.name,
        rollNo: student.roll_number || student.user_id.roll_no,
        admissionNo: student.admission_number || student.admissionNo,
        class: student.class_id?.name,
        department: student.departmentId?.name,
        semester: student.semester,
        batch: student.batch,
        photoUrl: student.photoUrl,
        email: student.user_id.email
      },
      stats: {
        attendancePercentage,
        totalClasses: totalHourly,
        presentClasses: presentHourly,
        todayHourly: todayHourly.length,
        todayPrayer: todayPrayer.length
      },
      courses: student.courseIds || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
};
/**
 * GET /api/student/profile
 * Get complete student profile
 */
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('user_id', 'name email roll_no phone')
      .populate('class_id', 'name section year semester batch')
      .populate('departmentId', 'name code')
      .populate('courseIds', 'name code type');
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student profile not found' });
    }
    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * PUT /api/student/profile
 * Update student profile (limited fields)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { photoUrl, phone } = req.body;
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    // Update allowed fields
    if (photoUrl) student.photoUrl = photoUrl;
    if (phone) {
      const user = await User.findById(req.user._id);
      user.phone = phone;
      await user.save();
    }
    await student.save();
    res.json({
      success: true,
      msg: 'Profile updated successfully',
      student
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/idcard
 * Get virtual ID card data
 */
exports.getIDCard = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('user_id', 'name email')
      .populate('class_id', 'name section')
      .populate('departmentId', 'name');
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const idCardData = {
      name: student.user_id.name,
      rollNo: student.roll_number || student.user_id.roll_no,
      admissionNo: student.admission_number || student.admissionNo,
      class: student.class_id?.name,
      department: student.departmentId?.name,
      photoUrl: student.photoUrl,
      batch: student.batch,
      barcode: student.admission_number || student.admissionNo,
      qrCode: JSON.stringify({
        id: student._id,
        name: student.user_id.name,
        rollNo: student.roll_number,
        admissionNo: student.admission_number
      })
    };
    res.json({
      success: true,
      idCard: idCardData
    });
  } catch (error) {
    console.error('ID Card error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/departments
 * Get all departments
 */
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/courses
 * Get student's enrolled courses
 */
exports.getCourses = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('courseIds', 'name code type credits');
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    res.json({
      success: true,
      courses: student.courseIds || []
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
module.exports = exports;
