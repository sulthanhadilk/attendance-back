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
  deleteTeacher,
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
  downloadFile,
  importStudentsCSV,
  exportStudentsCSV,
  getAttendanceRequests,
  approveAttendance,
  adjustAttendance,
  createFine,
  listFines,
  updateFine,
  bulkCreateFines,
  getStudentFines,
  getFeesSummary,
  recordFee,
  createExamAdmin,
  addExamResultsAdmin,
  publishExamResultsAdmin,
  getExamResultsAdmin,
  createNotice,
  listNotices,
  createEvent,
  getGradesReport,
  getAuditLogs,
  getSettings,
  updateSettings,
  aiAttendanceAnomalies,
  aiSuggestFine,
  aiScheduleOptimizer,
  aiDropoutRisk,
  aiGenerateReport
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const uploadMem = multer({ storage: multer.memoryStorage() });
const {
  getTimetable,
  createTimetableBulk,
  updateTimetableEntry
} = require('../controllers/adminController');
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
router.delete('/teachers/:id', deleteTeacher);
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
router.get('/reports/grades', getGradesReport);
router.get('/reports/fines', getFinesReport);
// Export functionality
router.get('/export/attendance', exportAttendanceCSV);
router.get('/export/fines', exportFinesCSV);
router.get('/export/exam-results/:examId', exportExamResultsCSV);
router.get('/export/students', exportStudentsCSV);
router.get('/download/:fileName', downloadFile);
// Import functionality
router.post('/import/students', uploadMem.single('file'), importStudentsCSV);
// Attendance admin actions
router.get('/attendance/requests', getAttendanceRequests);
router.put('/attendance/approve/:attendanceId', approveAttendance);
router.put('/attendance/adjust/:attendanceId', adjustAttendance);
// Timetable
router.get('/timetable', getTimetable);
router.post('/timetable', createTimetableBulk);
router.put('/timetable/:id', updateTimetableEntry);
// Fines management
router.post('/fines', createFine);
router.get('/fines', listFines);
router.put('/fines/:id', updateFine);
router.post('/fines/bulk', bulkCreateFines);
router.get('/fines/student/:studentId', getStudentFines);
// Fees (stubs)
router.get('/fees/summary', getFeesSummary);
router.post('/fees/record', recordFee);
// Exams & Results (stubs)
router.post('/exams', createExamAdmin);
router.post('/exams/:examId/results', addExamResultsAdmin);
router.put('/exams/:examId/publish', publishExamResultsAdmin);
router.get('/exams/:examId/results', getExamResultsAdmin);
// Notices & Events (stubs)
router.post('/notices', createNotice);
router.get('/notices', listNotices);
router.post('/events', createEvent);
// Audit Logs
router.get('/auditlogs', getAuditLogs);
// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
// AI Stubs
router.get('/ai/attendance-anomalies', aiAttendanceAnomalies);
router.post('/ai/suggest-fine', aiSuggestFine);
router.post('/ai/schedule-optimizer', aiScheduleOptimizer);
router.get('/ai/dropout-risk', aiDropoutRisk);
router.post('/ai/generate-report', aiGenerateReport);
module.exports = router;
