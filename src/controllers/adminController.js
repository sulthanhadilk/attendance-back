const bcrypt = require('bcryptjs');
const { User, Student, Teacher, Class, Subject, Session, Attendance, Fine, Exam, ExamResult, Log } = require('../models');
const { logActivity } = require('./authController');

// Admin Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      activeSession,
      todayAttendance,
      pendingFines,
      recentExams
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Subject.countDocuments(),
      Session.findOne({ is_active: true }),
      Attendance.countDocuments({ date: new Date().toDateString() }),
      Fine.countDocuments({ is_paid: false }),
      Exam.find().sort({ exam_date: -1 }).limit(5)
    ]);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        todayAttendance,
        pendingFines
      },
      activeSession,
      recentExams
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Manage Students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user_id', 'name email roll_no phone')
      .populate('class_id', 'name section year');
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, roll_no, phone, class_id, admission_date, father_name, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { roll_no: roll_no.toUpperCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ msg: 'Student with this email or roll number already exists' });
    }

    // Create user account
    const hashedPassword = await bcrypt.hash('123456', 10); // Default password
    const user = new User({
      name,
      email: email.toLowerCase(),
      roll_no: roll_no.toUpperCase(),
      phone,
      password: hashedPassword,
      role: 'student'
    });

    await user.save();

    // Create student profile
    const student = new Student({
      user_id: user._id,
      class_id,
      admission_date: admission_date || new Date(),
      father_name,
      address
    });

    await student.save();

    await logActivity(req.user._id, `Created new student: ${name} (${roll_no})`);

    res.status(201).json({ msg: 'Student created successfully' });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Update user information
    if (updates.name || updates.email || updates.phone) {
      const userUpdates = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.email) userUpdates.email = updates.email.toLowerCase();
      if (updates.phone) userUpdates.phone = updates.phone;

      const student = await Student.findById(id);
      await User.findByIdAndUpdate(student.user_id, userUpdates);
    }

    // Update student profile
    const studentUpdates = {};
    if (updates.class_id) studentUpdates.class_id = updates.class_id;
    if (updates.father_name) studentUpdates.father_name = updates.father_name;
    if (updates.address) studentUpdates.address = updates.address;

    await Student.findByIdAndUpdate(id, studentUpdates);

    await logActivity(req.user._id, `Updated student profile: ${id}`);

    res.json({ msg: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Delete user account and student profile
    await User.findByIdAndDelete(student.user_id);
    await Student.findByIdAndDelete(id);

    await logActivity(req.user._id, `Deleted student: ${id}`);

    res.json({ msg: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Manage Teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('user_id', 'name email phone')
      .populate('subjects', 'name type');
    
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const createTeacher = async (req, res) => {
  try {
    const { name, email, phone, subjects, qualification, department, joining_date } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: 'Teacher with this email already exists' });
    }

    // Generate employee ID
    const teacherCount = await Teacher.countDocuments();
    const emp_id = `TCH${String(teacherCount + 1).padStart(3, '0')}`;

    // Create user account
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      roll_no: emp_id,
      phone,
      password: hashedPassword,
      role: 'teacher'
    });

    await user.save();

    // Create teacher profile
    const teacher = new Teacher({
      user_id: user._id,
      emp_id,
      subjects: subjects || [],
      qualification,
      department,
      joining_date: joining_date || new Date()
    });

    await teacher.save();

    await logActivity(req.user._id, `Created new teacher: ${name} (${emp_id})`);

    res.status(201).json({ msg: 'Teacher created successfully' });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Manage Classes
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('class_teacher', 'name')
      .populate('subjects', 'name type');
    
    res.json(classes);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, section, year, class_teacher, subjects } = req.body;

    const newClass = new Class({
      name,
      section,
      year,
      class_teacher,
      subjects: subjects || []
    });

    await newClass.save();

    await logActivity(req.user._id, `Created new class: ${name} ${section}`);

    res.status(201).json({ msg: 'Class created successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Manage Subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code, type, description } = req.body;

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      type,
      description
    });

    await subject.save();

    await logActivity(req.user._id, `Created new subject: ${name} (${code})`);

    res.status(201).json({ msg: 'Subject created successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Session Management
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ start_date: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const createSession = async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;

    // Deactivate current active session
    await Session.updateMany({}, { is_active: false });

    const session = new Session({
      name,
      start_date,
      end_date,
      is_active: true
    });

    await session.save();

    await logActivity(req.user._id, `Created new session: ${name}`);

    res.status(201).json({ msg: 'Session created successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Reports
const getAttendanceReport = async (req, res) => {
  try {
    const { class_id, subject_id, date_from, date_to } = req.query;

    const matchConditions = {};
    if (class_id) matchConditions.class_id = class_id;
    if (subject_id) matchConditions.subject_id = subject_id;
    if (date_from && date_to) {
      matchConditions.date = {
        $gte: new Date(date_from),
        $lte: new Date(date_to)
      };
    }

    const attendanceReport = await Attendance.aggregate([
      { $match: matchConditions },
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

    res.json(attendanceReport);
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getFinesReport = async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate({
        path: 'student_id',
        populate: { path: 'user_id', select: 'name roll_no' }
      })
      .sort({ fine_date: -1 });

    res.json(fines);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Export attendance data as CSV
const exportAttendanceCSV = async (req, res) => {
  try {
    const ExportService = require('../services/exportService');
    const { startDate, endDate, classId } = req.query;
    
    const result = await ExportService.exportAttendanceCSV(
      classId,
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default last 30 days
      endDate ? new Date(endDate) : new Date()
    );
    
    res.json({
      message: 'Attendance data exported successfully',
      fileName: result.fileName,
      recordCount: result.recordCount
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ msg: 'Failed to export attendance data' });
  }
};

// Export fines data as CSV  
const exportFinesCSV = async (req, res) => {
  try {
    const ExportService = require('../services/exportService');
    const { startDate, endDate } = req.query;
    
    const result = await ExportService.exportFinesCSV(
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );
    
    res.json({
      message: 'Fines data exported successfully',
      fileName: result.fileName,
      recordCount: result.recordCount
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ msg: 'Failed to export fines data' });
  }
};

// Export exam results as CSV
const exportExamResultsCSV = async (req, res) => {
  try {
    const ExportService = require('../services/exportService');
    const { examId } = req.params;
    
    const result = await ExportService.exportExamResultsCSV(examId);
    
    res.json({
      message: 'Exam results exported successfully',
      fileName: result.fileName,
      recordCount: result.recordCount
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ msg: 'Failed to export exam results' });
  }
};

// Download exported file
const downloadFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    const path = require('path');
    const filePath = path.join(__dirname, '../../exports', fileName);
    
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ msg: 'File not found' });
    }
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ msg: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ msg: 'Failed to download file' });
  }
};

// Create User (Generic - can create student, teacher, or admin)
const createUser = async (req, res) => {
  try {
    const { name, email, roll_no, password, role } = req.body;

    // Validate required fields
    if (!name || !password || !role) {
      return res.status(400).json({ msg: 'Please provide name, password, and role' });
    }

    // Email is required for teachers and admins, optional for students
    if ((role === 'teacher' || role === 'admin') && !email) {
      return res.status(400).json({ msg: 'Email is required for teachers and administrators' });
    }

    // Roll number is required for students
    if (role === 'student' && !roll_no) {
      return res.status(400).json({ msg: 'Roll number is required for students' });
    }

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role. Must be student, teacher, or admin' });
    }

    // Check if user already exists by email (if provided)
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase() 
      });

      if (existingUser) {
        return res.status(400).json({ msg: 'User with this email already exists' });
      }
    }

    // Check roll number if provided
    if (roll_no) {
      const existingRoll = await User.findOne({ 
        roll_no: roll_no.toUpperCase() 
      });
      if (existingRoll) {
        return res.status(400).json({ msg: 'User with this roll number already exists' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email: email ? email.toLowerCase() : undefined,
      roll_no: roll_no ? roll_no.toUpperCase() : undefined,
      password: hashedPassword,
      role
    });

    await user.save();

    // Create profile based on role
    if (role === 'student') {
      const student = new Student({
        user_id: user._id,
        roll_number: user.roll_no || undefined,
        admission_date: new Date(),
        academic_info: {
          current_year: 1,
          academic_session: '2024-25'
        }
      });
      await student.save();
    } else if (role === 'teacher') {
      const teacherCount = await Teacher.countDocuments();
      const emp_id = `TCH${String(teacherCount + 1).padStart(3, '0')}`;
      
      // Update user with employee ID
      user.roll_no = emp_id;
      await user.save();

      const teacher = new Teacher({
        user_id: user._id,
        emp_id,
        joining_date: new Date()
      });
      await teacher.save();
    }

    await logActivity(req.user._id, `Created new ${role}: ${name} (${user.email})`);

    res.status(201).json({ 
      msg: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roll_no: user.roll_no,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  createUser,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getTeachers,
  createTeacher,
  getClasses,
  createClass,
  getSubjects,
  createSubject,
  getSessions,
  createSession,
  getAttendanceReport,
  getFinesReport,
  exportAttendanceCSV,
  exportFinesCSV,
  exportExamResultsCSV,
  downloadFile
};