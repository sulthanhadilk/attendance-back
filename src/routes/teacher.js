const express = require('express');
const router = express.Router();
const {
  // existing handlers
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
  uploadProfilePhoto,
  // new teacher module handlers (to be implemented in controller)
  teacherLogin,
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
  aiScheduleSuggestion
} = require('../controllers/teacherController');
const authTeacher = require('../middleware/authTeacher');
const upload = require('../middleware/upload');
// Public-ish auth route for teachers (still uses central auth logic)
router.post('/auth/login', teacherLogin);
// Apply teacher auth middleware (accepts JWT in prod or x-teacher-id dev stub)
router.use(authTeacher);
// Dashboard
router.get('/dashboard', getDashboardData);
// Profile
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);
// Classes & timetable
router.get('/classes', getMyClasses);
router.get('/classes/:classId/students', getClassStudents);
router.get('/classes/:classId/attendance-summary', getClassAttendanceSummary);
router.get('/timetable', getTimetable);
// Legacy simple attendance (kept for backward compatibility)
router.post('/attendance', markAttendance);
router.get('/attendance/:classId/:subjectId', getAttendanceHistory);
router.get('/attendance/:classId', getAttendanceHistory);
// Hour-wise attendance
router.post('/attendance/mark', markHourlyAttendance);
router.get('/attendance/report', getAttendanceReport);
router.get('/attendance/monthly', getMonthlyAttendance);
router.get('/attendance/day', getAttendanceDayGrid);
// Prayer attendance
router.post('/prayer/mark', markPrayerAttendance);
router.get('/prayer/report', getPrayerReport);
// Fines
router.post('/fines/create', createFine);
router.put('/fines/:id/status', updateFineStatus);
router.get('/fines', listFines);
// Exams & marks (bulk)
router.post('/exams/results', saveExamResultsBulk);
router.get('/exams/results', getExamResults);
router.put('/exams/results/:id', updateExamResult);
// Conduct
router.post('/class/:classId/conduct', addConductRemark);
router.get('/class/:classId/conduct', getConductRemarks);
// Activities
router.post('/class/:classId/activity', createActivity);
router.get('/class/:classId/activities', listActivities);
// Clubs
router.post('/clubs', createClub);
router.get('/clubs', listClubs);
// Question bank
router.post('/question-bank', createQuestionBank);
router.get('/question-bank', listQuestionBanks);
// Resources / LMS links
router.post('/resources', createResourceLink);
router.get('/resources', listResourceLinks);
// AI stubs
router.get('/ai/weak-students', aiWeakStudents);
router.get('/ai/attendance-risk', aiAttendanceRisk);
router.get('/ai/schedule-suggestion', aiScheduleSuggestion);
// Alias for spec: /api/teacher/ai/test-schedule -> schedule suggestion
router.get('/ai/test-schedule', aiScheduleSuggestion);
// Exams listing/creation kept for backward compatibility
router.get('/exams', getMyExams);
router.post('/exams', createExam);
module.exports = router;
