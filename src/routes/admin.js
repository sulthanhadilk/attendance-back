const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

// Apply auth and adminOnly middleware to all routes
router.use(auth);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Generic User Creation
router.post('/create-user', createUser);

// Student Management
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Teacher Management
router.get('/teachers', getTeachers);
router.post('/teachers', createTeacher);

// Class Management
router.get('/classes', getClasses);
router.post('/classes', createClass);

// Subject Management
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);

// Session Management
router.get('/sessions', getSessions);
router.post('/sessions', createSession);

// Reports
router.get('/reports/attendance', getAttendanceReport);
router.get('/reports/fines', getFinesReport);

// Export functionality
router.get('/export/attendance', exportAttendanceCSV);
router.get('/export/fines', exportFinesCSV);
router.get('/export/exam-results/:examId', exportExamResultsCSV);
router.get('/download/:fileName', downloadFile);

module.exports = router;