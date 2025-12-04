const { AttendancePredictionModel, GradeAnalyzer } = require('../services/aiServices');
const ChatbotService = require('../services/chatbotService');
const ReportGenerator = require('../services/reportGenerator');
const { Student, Teacher } = require('../models');
const { logActivity } = require('./authController');
// Initialize services
const predictionModel = new AttendancePredictionModel();
const chatbot = new ChatbotService();
// AI Attendance Prediction
const predictStudentAbsences = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query; // Optional: predict for specific date
    // Get all students in the class
    const students = await Student.find({ class_id: classId });
    const studentIds = students.map(s => s._id);
    // Get predictions
    const predictions = await predictionModel.predictBatchAbsences(studentIds);
    // Combine with student info
    const enrichedPredictions = predictions.map(pred => {
      const student = students.find(s => s._id.toString() === pred.student_id.toString());
      return {
        ...pred,
        student_name: student?.user_id?.name || 'Unknown',
        roll_no: student?.user_id?.roll_no || 'Unknown'
      };
    });
    // Sort by risk level (high risk first)
    const sortedPredictions = enrichedPredictions.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.risk_level] - riskOrder[a.risk_level];
    });
    await logActivity(req.user._id, `Generated AI predictions for class ${classId}`);
    res.json({
      success: true,
      class_id: classId,
      prediction_date: date || new Date().toISOString().split('T')[0],
      total_students: studentIds.length,
      high_risk_count: sortedPredictions.filter(p => p.risk_level === 'high').length,
      medium_risk_count: sortedPredictions.filter(p => p.risk_level === 'medium').length,
      low_risk_count: sortedPredictions.filter(p => p.risk_level === 'low').length,
      predictions: sortedPredictions
    });
  } catch (error) {
    console.error('AI prediction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate attendance predictions' 
    });
  }
};
// AI Grade Analysis
const analyzeStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const analysis = await GradeAnalyzer.analyzeStudent(studentId);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or insufficient data for analysis'
      });
    }
    await logActivity(req.user._id, `Generated AI grade analysis for student ${studentId}`);
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Grade analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze student grades'
    });
  }
};
// AI Chatbot
const chatbotMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    const response = await chatbot.processMessage(message, userId);
    res.json({
      success: true,
      user_message: message,
      bot_response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot service is temporarily unavailable'
    });
  }
};
// AI Report Generation
const generateAIReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type = 'student' } = req.query;
    let report;
    if (type === 'student') {
      report = await ReportGenerator.generateStudentReport(studentId);
    } else if (type === 'class') {
      const student = await Student.findById(studentId);
      if (student) {
        report = await ReportGenerator.generateClassReport(student.class_id);
      }
    }
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Unable to generate report'
      });
    }
    await logActivity(req.user._id, `Generated AI report for ${type}: ${studentId}`);
    res.json({
      success: true,
      report_type: type,
      report
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI report'
    });
  }
};
// Admin AI Insights
const getAdminInsights = async (req, res) => {
  try {
    const insights = await ReportGenerator.generateAdminInsights();
    if (!insights) {
      return res.status(500).json({
        success: false,
        message: 'Unable to generate admin insights'
      });
    }
    await logActivity(req.user._id, 'Generated admin AI insights');
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Admin insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate admin insights'
    });
  }
};
// Teacher AI Dashboard Data
const getTeacherAIInsights = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user_id: req.user._id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }
    // Get teacher's classes
    const classes = await Student.distinct('class_id', {});
    let allPredictions = [];
    for (const classId of classes) {
      const students = await Student.find({ class_id: classId });
      const studentIds = students.map(s => s._id);
      const predictions = await predictionModel.predictBatchAbsences(studentIds);
      const enrichedPredictions = predictions.map(pred => {
        const student = students.find(s => s._id.toString() === pred.student_id.toString());
        return {
          ...pred,
          student_name: student?.user_id?.name || 'Unknown',
          roll_no: student?.user_id?.roll_no || 'Unknown',
          class_id: classId
        };
      });
      allPredictions = allPredictions.concat(enrichedPredictions);
    }
    // Get high-risk students
    const highRiskStudents = allPredictions
      .filter(p => p.risk_level === 'high')
      .sort((a, b) => b.absence_probability - a.absence_probability)
      .slice(0, 10);
    res.json({
      success: true,
      teacher_insights: {
        total_students_monitored: allPredictions.length,
        high_risk_students: highRiskStudents.length,
        medium_risk_students: allPredictions.filter(p => p.risk_level === 'medium').length,
        low_risk_students: allPredictions.filter(p => p.risk_level === 'low').length,
        alert_list: highRiskStudents,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Teacher AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate teacher AI insights'
    });
  }
};
// Student AI Dashboard
const getStudentAIInsights = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    // Get AI analysis
    const gradeAnalysis = await GradeAnalyzer.analyzeStudent(student._id);
    const report = await ReportGenerator.generateStudentReport(student._id);
    const absentRisk = await predictionModel.predictAbsence(student._id);
    res.json({
      success: true,
      student_ai_insights: {
        grade_analysis: gradeAnalysis,
        ai_report_summary: report?.summary || 'No report available',
        absence_risk: {
          probability: Math.round(absentRisk * 100),
          level: absentRisk >= 0.7 ? 'high' : absentRisk >= 0.4 ? 'medium' : 'low',
          message: absentRisk >= 0.7 
            ? '⚠️ High risk of absence - please ensure you attend classes'
            : absentRisk >= 0.4
            ? '⚡ Medium risk - maintain consistent attendance'
            : '✅ Low risk - keep up the good work!'
        },
        recommendations: report?.recommendations?.slice(0, 3) || [],
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Student AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate student AI insights'
    });
  }
};
module.exports = {
  predictStudentAbsences,
  analyzeStudentGrades,
  chatbotMessage,
  generateAIReport,
  getAdminInsights,
  getTeacherAIInsights,
  getStudentAIInsights
};
