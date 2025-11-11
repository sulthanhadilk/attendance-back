const { Student, Attendance, Fine, Exam, ExamResult, Class, Subject } = require('../models');

// Student Dashboard
const getDashboardData = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('class_id', 'name section year')
      .populate('user_id', 'name roll_no');

    if (!student) {
      return res.status(404).json({ msg: 'Student profile not found' });
    }

    const [
      totalClasses,
      presentClasses,
      pendingFines,
      upcomingExams,
      recentResults
    ] = await Promise.all([
      Attendance.countDocuments({ student_id: student._id }),
      Attendance.countDocuments({ student_id: student._id, status: 'present' }),
      Fine.find({ student_id: student._id, is_paid: false }),
      Exam.find({ 
        class_id: student.class_id,
        exam_date: { $gte: new Date() }
      }).populate('subject_id', 'name').limit(5),
      ExamResult.find({ student_id: student._id })
        .populate({
          path: 'exam_id',
          populate: { path: 'subject_id', select: 'name' }
        })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const attendancePercentage = totalClasses > 0 
      ? Math.round((presentClasses / totalClasses) * 100) 
      : 0;

    const totalFineAmount = pendingFines.reduce((sum, fine) => sum + fine.amount, 0);

    res.json({
      student,
      stats: {
        totalClasses,
        presentClasses,
        attendancePercentage,
        pendingFines: pendingFines.length,
        totalFineAmount
      },
      upcomingExams,
      recentResults
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Attendance History
const getMyAttendance = async (req, res) => {
  try {
    const { date_from, date_to, subject_id } = req.query;
    
    const student = await Student.findOne({ user_id: req.user._id });
    
    const matchConditions = { student_id: student._id };
    
    if (subject_id) matchConditions.subject_id = subject_id;
    
    if (date_from && date_to) {
      matchConditions.date = {
        $gte: new Date(date_from).toDateString(),
        $lte: new Date(date_to).toDateString()
      };
    }

    const attendance = await Attendance.find(matchConditions)
      .populate('subject_id', 'name code')
      .populate('class_id', 'name section')
      .sort({ date: -1, time: -1 });

    // Calculate subject-wise attendance
    const subjectStats = {};
    attendance.forEach(record => {
      const subjectName = record.subject_id.name;
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { total: 0, present: 0 };
      }
      subjectStats[subjectName].total++;
      if (record.status === 'present') {
        subjectStats[subjectName].present++;
      }
    });

    // Calculate percentages
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.percentage = Math.round((stats.present / stats.total) * 100);
    });

    res.json({
      attendance,
      subjectStats,
      overall: {
        total: attendance.length,
        present: attendance.filter(r => r.status === 'present').length,
        percentage: attendance.length > 0 
          ? Math.round((attendance.filter(r => r.status === 'present').length / attendance.length) * 100)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get My Fines
const getMyFines = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    const fines = await Fine.find({ student_id: student._id })
      .sort({ fine_date: -1 });

    const summary = {
      total: fines.length,
      paid: fines.filter(f => f.is_paid).length,
      pending: fines.filter(f => !f.is_paid).length,
      totalAmount: fines.reduce((sum, f) => sum + f.amount, 0),
      paidAmount: fines.filter(f => f.is_paid).reduce((sum, f) => sum + f.amount, 0),
      pendingAmount: fines.filter(f => !f.is_paid).reduce((sum, f) => sum + f.amount, 0)
    };

    res.json({ fines, summary });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get My Exam Results
const getMyResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    const results = await ExamResult.find({ student_id: student._id })
      .populate({
        path: 'exam_id',
        populate: { path: 'subject_id', select: 'name code' }
      })
      .sort({ createdAt: -1 });

    // Calculate overall performance
    const totalMarks = results.reduce((sum, r) => sum + r.total_marks, 0);
    const obtainedMarks = results.reduce((sum, r) => sum + r.obtained_marks, 0);
    const overallPercentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

    // Subject-wise performance
    const subjectPerformance = {};
    results.forEach(result => {
      const subject = result.exam_id.subject_id.name;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          totalMarks: 0,
          obtainedMarks: 0,
          exams: 0,
          grades: []
        };
      }
      
      subjectPerformance[subject].totalMarks += result.total_marks;
      subjectPerformance[subject].obtainedMarks += result.obtained_marks;
      subjectPerformance[subject].exams++;
      subjectPerformance[subject].grades.push(result.grade);
    });

    // Calculate subject percentages
    Object.keys(subjectPerformance).forEach(subject => {
      const perf = subjectPerformance[subject];
      perf.percentage = Math.round((perf.obtainedMarks / perf.totalMarks) * 100);
    });

    res.json({
      results,
      summary: {
        totalExams: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        overallPercentage
      },
      subjectPerformance
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Upcoming Exams
const getUpcomingExams = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    const exams = await Exam.find({
      class_id: student.class_id,
      exam_date: { $gte: new Date() }
    })
    .populate('subject_id', 'name code')
    .sort({ exam_date: 1, exam_time: 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Class Schedule
const getClassSchedule = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    const classInfo = await Class.findById(student.class_id)
      .populate('subjects', 'name code type')
      .populate('class_teacher', 'name');

    res.json(classInfo);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Request Fine Payment (for future implementation)
const requestFinePayment = async (req, res) => {
  try {
    const { fine_id } = req.params;
    
    const fine = await Fine.findById(fine_id);
    if (!fine) {
      return res.status(404).json({ msg: 'Fine not found' });
    }

    const student = await Student.findOne({ user_id: req.user._id });
    if (fine.student_id.toString() !== student._id.toString()) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    if (fine.is_paid) {
      return res.status(400).json({ msg: 'Fine already paid' });
    }

    // In a real implementation, integrate with payment gateway
    // For now, just mark as payment requested
    fine.payment_requested = true;
    fine.payment_request_date = new Date();
    await fine.save();

    res.json({ msg: 'Payment request submitted successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('user_id', 'name email roll_no phone')
      .populate('class_id', 'name section year');

    if (!student) {
      return res.status(404).json({ msg: 'Student profile not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Generate PDF Report Card
const generateReportCard = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ msg: 'Student profile not found' });
    }

    const ExportService = require('../services/exportService');
    const { examId } = req.query;
    
    const result = await ExportService.generateStudentReportCardPDF(student._id, examId);
    
    res.json({
      message: 'Report card generated successfully',
      fileName: result.fileName,
      downloadUrl: `/api/admin/download/${result.fileName}`
    });
  } catch (error) {
    console.error('Report card generation error:', error);
    res.status(500).json({ msg: 'Failed to generate report card' });
  }
};

module.exports = {
  getDashboardData,
  getMyAttendance,
  getMyFines,
  getMyResults,
  getUpcomingExams,
  getClassSchedule,
  requestFinePayment,
  getProfile,
  generateReportCard
};