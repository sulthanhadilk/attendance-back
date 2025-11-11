const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getMyAttendance,
  getMyFines,
  getMyResults,
  getUpcomingExams,
  getClassSchedule,
  requestFinePayment,
  getProfile,
  generateReportCard
} = require('../controllers/studentController');
const { auth, studentOnly } = require('../middleware/auth');

// Apply auth and studentOnly middleware to all routes
router.use(auth);
router.use(studentOnly);

// Dashboard
router.get('/dashboard', getDashboardData);

// Profile
router.get('/profile', getProfile);

// Attendance
router.get('/attendance', getMyAttendance);

// Fines
router.get('/fines', getMyFines);
router.post('/fines/:fine_id/pay', requestFinePayment);

// Exam Results
router.get('/results', getMyResults);

// Exams
router.get('/exams/upcoming', getUpcomingExams);

// Class Schedule
router.get('/schedule', getClassSchedule);

// Generate Report Card PDF
router.get('/report-card', generateReportCard);

module.exports = router;