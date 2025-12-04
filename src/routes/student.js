const express = require('express');
const router = express.Router();

// Import controllers
const dashboardController = require('../controllers/student/dashboardController');
const attendanceController = require('../controllers/student/attendanceController');
const feesController = require('../controllers/student/feesController');
const assessmentController = require('../controllers/student/assessmentController');
const libraryController = require('../controllers/student/libraryController');
const aiController = require('../controllers/student/aiController');

// Legacy controller for backward compatibility
const legacyController = require('../controllers/studentController');

// Middleware
const authStudent = require('../middleware/authStudent');

// Apply auth middleware to all routes
router.use(authStudent);

// ============ DASHBOARD & PROFILE ============
router.get('/dashboard', dashboardController.getDashboard);
router.get('/profile', dashboardController.getProfile);
router.put('/profile', dashboardController.updateProfile);
router.get('/idcard', dashboardController.getIDCard);
router.get('/departments', dashboardController.getDepartments);
router.get('/courses', dashboardController.getCourses);

// ============ ATTENDANCE ============
router.get('/attendance/course', attendanceController.getCourseAttendance);
router.get('/attendance/hourly/:year/:month', attendanceController.getHourlyAttendance);
router.get('/attendance/term', attendanceController.getTermAttendance);
router.get('/attendance/prayer', attendanceController.getPrayerAttendance);
router.get('/attendance/monthly', attendanceController.getMonthlyAttendance);

// Legacy attendance route
router.get('/attendance', legacyController.getMyAttendance);

// ============ FEES & FINES ============
router.get('/fees/structure', feesController.getFeeStructure);
router.get('/fees/payments', feesController.getFeePayments);
router.get('/fees/due', feesController.getDueFees);
router.get('/fees/history', feesController.getFeesHistory);
router.get('/fines', feesController.getFines);

// Legacy fines routes
router.post('/fines/:fine_id/pay', legacyController.requestFinePayment);

// ============ ASSESSMENT & RESULTS ============
router.get('/assessment/results', assessmentController.getResults);
router.get('/assessment/internal', assessmentController.getInternalResults);
router.get('/assessment/external', assessmentController.getExternalResults);
router.get('/assessment/by-course/:courseId', assessmentController.getResultsByCourse);
router.get('/assessment/summary', assessmentController.getAssessmentSummary);

// Legacy results routes
router.get('/results', legacyController.getMyResults);
router.get('/exams/upcoming', legacyController.getUpcomingExams);

// ============ LIBRARY ============
router.get('/library/books', libraryController.getBooks);
router.get('/library/my-issues', libraryController.getMyIssues);
router.get('/library/history', libraryController.getHistory);

// ============ AI FEATURES (STUBS) ============
router.get('/ai/risk', aiController.getRiskAssessment);
router.get('/ai/study-advice', aiController.getStudyAdvice);

// ============ LEGACY ROUTES ============
router.get('/schedule', legacyController.getClassSchedule);
router.get('/report-card', legacyController.generateReportCard);

module.exports = router;