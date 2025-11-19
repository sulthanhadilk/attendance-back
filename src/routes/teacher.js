const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getMyClasses,
  getClassStudents,
  markAttendance,
  getAttendanceHistory,
  createExam,
  getMyExams,
  addExamResults,
  getClassAttendanceSummary,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto
} = require('../controllers/teacherController');
const { auth, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply auth and teacherOnly middleware to all routes
router.use(auth);
router.use(teacherOnly);

// Dashboard
router.get('/dashboard', getDashboardData);

// Profile
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);

// Classes
router.get('/classes', getMyClasses);
router.get('/classes/:classId/students', getClassStudents);
router.get('/classes/:classId/attendance-summary', getClassAttendanceSummary);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance/:classId/:subjectId', getAttendanceHistory);
router.get('/attendance/:classId', getAttendanceHistory);

// Exams
router.get('/exams', getMyExams);
router.post('/exams', createExam);
router.post('/exams/results', addExamResults);

module.exports = router;