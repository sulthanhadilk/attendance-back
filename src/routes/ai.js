const express = require('express');
const router = express.Router();
const {
  predictStudentAbsences,
  analyzeStudentGrades,
  chatbotMessage,
  generateAIReport,
  getAdminInsights,
  getTeacherAIInsights,
  getStudentAIInsights
} = require('../controllers/aiController');
const { auth, adminOnly, teacherOrAdmin, studentOnly } = require('../middleware/auth');

// Apply authentication to all AI routes
router.use(auth);

// Admin AI Routes
router.get('/admin/insights', adminOnly, getAdminInsights);
router.get('/admin/predict/:classId', adminOnly, predictStudentAbsences);

// Teacher AI Routes  
router.get('/teacher/insights', teacherOrAdmin, getTeacherAIInsights);
router.get('/teacher/predict/:classId', teacherOrAdmin, predictStudentAbsences);
router.get('/teacher/analyze/:studentId', teacherOrAdmin, analyzeStudentGrades);

// Student AI Routes
router.get('/student/insights', studentOnly, getStudentAIInsights);
router.get('/student/analyze', studentOnly, (req, res, next) => {
  // Auto-set studentId from authenticated user
  req.params.studentId = req.user.student_id || req.user._id;
  next();
}, analyzeStudentGrades);

// Universal AI Routes (role-based access within controller)
router.post('/chatbot', chatbotMessage);
router.get('/report/:studentId', generateAIReport);

// Health check for AI services
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI services are operational',
    features: [
      'Attendance Prediction',
      'Grade Analysis', 
      'AI Chatbot',
      'Report Generation',
      'Smart Insights'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;