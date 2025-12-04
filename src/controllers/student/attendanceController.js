const { Student, HourlyAttendance, PrayerAttendance, Course, Class } = require('../../models');

/**
 * GET /api/student/attendance/course
 * Get course-wise attendance summary
 */
exports.getCourseAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Get all attendance records grouped by course
    const attendanceRecords = await HourlyAttendance.find({
      studentId: student._id
    }).populate('courseId', 'name code type');

    // Group by course
    const courseStats = {};
    
    attendanceRecords.forEach(record => {
      const courseId = record.courseId?._id?.toString();
      if (!courseId) return;
      
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          course: record.courseId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          letoff: 0
        };
      }
      
      courseStats[courseId].total++;
      if (record.status === 'present') courseStats[courseId].present++;
      if (record.status === 'absent') courseStats[courseId].absent++;
      if (record.status === 'late') courseStats[courseId].late++;
      if (record.status === 'letoff') courseStats[courseId].letoff++;
    });

    // Calculate percentages
    const result = Object.values(courseStats).map(stat => ({
      course: stat.course,
      total: stat.total,
      present: stat.present,
      absent: stat.absent,
      late: stat.late,
      letoff: stat.letoff,
      percentage: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0
    }));

    res.json({
      success: true,
      attendance: result
    });
  } catch (error) {
    console.error('Course attendance error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/attendance/hourly/:year/:month
 * Get hourly attendance for a specific month
 */
exports.getHourlyAttendance = async (req, res) => {
  try {
    const { year, month } = req.params;
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendance = await HourlyAttendance.find({
      studentId: student._id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('courseId', 'name code')
      .populate('markedByTeacherId', 'user_id')
      .populate({
        path: 'markedByTeacherId',
        populate: { path: 'user_id', select: 'name' }
      })
      .sort({ date: 1, hourIndex: 1 });

    // Group by date
    const attendanceByDate = {};
    
    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = {
          date: record.date,
          hours: {}
        };
      }
      attendanceByDate[dateKey].hours[`H${record.hourIndex}`] = {
        status: record.status,
        course: record.courseId?.name,
        teacher: record.markedByTeacherId?.user_id?.name
      };
    });

    res.json({
      success: true,
      month: parseInt(month),
      year: parseInt(year),
      attendance: Object.values(attendanceByDate)
    });
  } catch (error) {
    console.error('Hourly attendance error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/attendance/term
 * Get term/semester wise attendance summary
 */
exports.getTermAttendance = async (req, res) => {
  try {
    const { semester } = req.query;
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const query = { studentId: student._id };
    
    // Filter by semester if provided
    if (semester) {
      // Assuming academic year: June-May, Odd sem: June-Nov, Even sem: Dec-May
      const year = new Date().getFullYear();
      if (semester === '1' || semester === 'odd') {
        query.date = {
          $gte: new Date(year, 5, 1), // June 1
          $lte: new Date(year, 10, 30) // Nov 30
        };
      } else if (semester === '2' || semester === 'even') {
        query.date = {
          $gte: new Date(year, 11, 1), // Dec 1
          $lte: new Date(year + 1, 4, 31) // May 31
        };
      }
    }

    const [totalHourly, presentHourly, absentHourly, lateHourly] = await Promise.all([
      HourlyAttendance.countDocuments(query),
      HourlyAttendance.countDocuments({ ...query, status: 'present' }),
      HourlyAttendance.countDocuments({ ...query, status: 'absent' }),
      HourlyAttendance.countDocuments({ ...query, status: 'late' })
    ]);

    const percentage = totalHourly > 0 
      ? Math.round((presentHourly / totalHourly) * 100) 
      : 0;

    res.json({
      success: true,
      semester: semester || 'all',
      stats: {
        total: totalHourly,
        present: presentHourly,
        absent: absentHourly,
        late: lateHourly,
        percentage
      }
    });
  } catch (error) {
    console.error('Term attendance error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/attendance/prayer
 * Get prayer attendance (Subh + Maghrib)
 */
exports.getPrayerAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const query = { studentId: student._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const prayerRecords = await PrayerAttendance.find(query)
      .populate('teacherId', 'user_id')
      .populate({
        path: 'teacherId',
        populate: { path: 'user_id', select: 'name' }
      })
      .sort({ date: -1 });

    // Calculate stats
    const stats = {
      subh: { total: 0, present: 0 },
      maghrib: { total: 0, present: 0 }
    };

    prayerRecords.forEach(record => {
      const prayerType = record.prayerType.toLowerCase();
      if (stats[prayerType]) {
        stats[prayerType].total++;
        if (record.status === 'present') {
          stats[prayerType].present++;
        }
      }
    });

    stats.subh.percentage = stats.subh.total > 0 
      ? Math.round((stats.subh.present / stats.subh.total) * 100) 
      : 0;
    stats.maghrib.percentage = stats.maghrib.total > 0 
      ? Math.round((stats.maghrib.present / stats.maghrib.total) * 100) 
      : 0;

    res.json({
      success: true,
      stats,
      records: prayerRecords
    });
  } catch (error) {
    console.error('Prayer attendance error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/attendance/monthly
 * Get monthly attendance overview
 */
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { year, month } = req.query;
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const [hourlyRecords, prayerRecords] = await Promise.all([
      HourlyAttendance.find({
        studentId: student._id,
        date: { $gte: startDate, $lte: endDate }
      }),
      PrayerAttendance.find({
        studentId: student._id,
        date: { $gte: startDate, $lte: endDate }
      })
    ]);

    const hourlyStats = {
      total: hourlyRecords.length,
      present: hourlyRecords.filter(r => r.status === 'present').length,
      absent: hourlyRecords.filter(r => r.status === 'absent').length,
      late: hourlyRecords.filter(r => r.status === 'late').length
    };

    const prayerStats = {
      total: prayerRecords.length,
      present: prayerRecords.filter(r => r.status === 'present').length,
      absent: prayerRecords.filter(r => r.status === 'absent').length
    };

    hourlyStats.percentage = hourlyStats.total > 0 
      ? Math.round((hourlyStats.present / hourlyStats.total) * 100) 
      : 0;
    prayerStats.percentage = prayerStats.total > 0 
      ? Math.round((prayerStats.present / prayerStats.total) * 100) 
      : 0;

    res.json({
      success: true,
      year: targetYear,
      month: targetMonth,
      hourly: hourlyStats,
      prayer: prayerStats
    });
  } catch (error) {
    console.error('Monthly attendance error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

module.exports = exports;
