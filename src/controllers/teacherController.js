const { Student, Teacher, Class, Subject, Attendance, Fine, Exam, ExamResult } = require('../models');
const { logActivity } = require('./authController');

// Teacher Dashboard
const getDashboardData = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user_id: req.user._id })
      .populate('subjects', 'name code type');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher profile not found' });
    }

    const [
      totalStudents,
      todayAttendance,
      upcomingExams,
      myClasses
    ] = await Promise.all([
      Student.countDocuments(),
      Attendance.countDocuments({ 
        teacher_id: teacher._id,
        date: new Date().toDateString()
      }),
      Exam.find({ 
        subject_id: { $in: teacher.subjects },
        exam_date: { $gte: new Date() }
      }).limit(5),
      Class.find({ 
        $or: [
          { class_teacher: req.user._id },
          { subjects: { $in: teacher.subjects } }
        ]
      })
    ]);

    res.json({
      teacher,
      stats: {
        totalStudents,
        todayAttendance,
        mySubjects: teacher.subjects.length,
        myClasses: myClasses.length
      },
      upcomingExams,
      myClasses
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Classes for Teacher
const getMyClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user_id: req.user._id });
    
    const classes = await Class.find({
      $or: [
        { class_teacher: req.user._id },
        { subjects: { $in: teacher.subjects } }
      ]
    }).populate('subjects', 'name code');

    res.json(classes);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Students in a Class
const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const students = await Student.find({ class_id: classId })
      .populate('user_id', 'name roll_no phone')
      .sort({ 'user_id.roll_no': 1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Mark Attendance
const markAttendance = async (req, res) => {
  try {
    const { class_id, subject_id, attendance_data } = req.body;
    // attendance_data: [{ student_id, status }]

    const teacher = await Teacher.findOne({ user_id: req.user._id });
    const today = new Date().toDateString();

    // Check if attendance already marked for today
    const existingAttendance = await Attendance.findOne({
      class_id,
      subject_id,
      teacher_id: teacher._id,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({ msg: 'Attendance already marked for today' });
    }

    // Create attendance records
    const attendanceRecords = attendance_data.map(record => ({
      student_id: record.student_id,
      class_id,
      subject_id,
      teacher_id: teacher._id,
      status: record.status,
      date: today,
      time: new Date().toTimeString().split(' ')[0]
    }));

    await Attendance.insertMany(attendanceRecords);

    // Create fines for absent students
    const absentStudents = attendance_data.filter(record => record.status === 'absent');
    if (absentStudents.length > 0) {
      const fineRecords = absentStudents.map(record => ({
        student_id: record.student_id,
        fine_type: 'attendance',
        amount: 10, // Default fine amount
        description: `Absent on ${today}`,
        fine_date: new Date()
      }));

      await Fine.insertMany(fineRecords);
    }

    await logActivity(req.user._id, `Marked attendance for class ${class_id} - ${attendance_data.length} students`);

    res.json({ 
      msg: 'Attendance marked successfully',
      totalStudents: attendance_data.length,
      present: attendance_data.filter(r => r.status === 'present').length,
      absent: absentStudents.length
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// View Attendance History
const getAttendanceHistory = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;
    const { date_from, date_to } = req.query;

    const teacher = await Teacher.findOne({ user_id: req.user._id });
    
    const matchConditions = {
      class_id: classId,
      teacher_id: teacher._id
    };

    if (subjectId) matchConditions.subject_id = subjectId;
    
    if (date_from && date_to) {
      matchConditions.date = {
        $gte: new Date(date_from).toDateString(),
        $lte: new Date(date_to).toDateString()
      };
    }

    const attendance = await Attendance.find(matchConditions)
      .populate('student_id')
      .populate({
        path: 'student_id',
        populate: { path: 'user_id', select: 'name roll_no' }
      })
      .populate('subject_id', 'name code')
      .sort({ date: -1, time: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Create Exam
const createExam = async (req, res) => {
  try {
    const { title, subject_id, class_id, exam_date, exam_time, total_marks, duration } = req.body;

    const teacher = await Teacher.findOne({ user_id: req.user._id });

    const exam = new Exam({
      title,
      subject_id,
      class_id,
      teacher_id: teacher._id,
      exam_date,
      exam_time,
      total_marks,
      duration
    });

    await exam.save();

    await logActivity(req.user._id, `Created exam: ${title} for class ${class_id}`);

    res.status(201).json({ msg: 'Exam created successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get My Exams
const getMyExams = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user_id: req.user._id });
    
    const exams = await Exam.find({ teacher_id: teacher._id })
      .populate('subject_id', 'name code')
      .populate('class_id', 'name section')
      .sort({ exam_date: -1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Add Exam Results
const addExamResults = async (req, res) => {
  try {
    const { exam_id, results } = req.body;
    // results: [{ student_id, obtained_marks }]

    const exam = await Exam.findById(exam_id);
    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    // Check if results already exist
    const existingResults = await ExamResult.findOne({ exam_id });
    if (existingResults) {
      return res.status(400).json({ msg: 'Results already added for this exam' });
    }

    // Create result records with auto-grading (Islamic College Standard)
    const resultRecords = results.map(result => {
      const percentage = (result.obtained_marks / exam.total_marks) * 100;
      let grade;
      
      // Islamic College Grading System: 90-100=A, 75-89=B, 60-74=C, 45-59=D, <45=F
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 75) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 45) grade = 'D';
      else grade = 'F';

      return {
        exam_id,
        student_id: result.student_id,
        obtained_marks: result.obtained_marks,
        total_marks: exam.total_marks,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        status: percentage >= 40 ? 'pass' : 'fail'
      };
    });

    await ExamResult.insertMany(resultRecords);

    await logActivity(req.user._id, `Added results for exam: ${exam.title} - ${results.length} students`);

    res.json({ msg: 'Exam results added successfully' });
  } catch (error) {
    console.error('Add exam results error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Class Attendance Summary
const getClassAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher = await Teacher.findOne({ user_id: req.user._id });

    const summary = await Attendance.aggregate([
      { 
        $match: { 
          class_id: classId,
          teacher_id: teacher._id 
        } 
      },
      {
        $group: {
          _id: '$student_id',
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student.user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          studentName: { $arrayElemAt: ['$user.name', 0] },
          rollNo: { $arrayElemAt: ['$user.roll_no', 0] },
          totalClasses: 1,
          presentClasses: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentClasses', '$totalClasses'] },
              100
            ]
          }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getDashboardData,
  getMyClasses,
  getClassStudents,
  markAttendance,
  getAttendanceHistory,
  createExam,
  getMyExams,
  addExamResults,
  getClassAttendanceSummary
};