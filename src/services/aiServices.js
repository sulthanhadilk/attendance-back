const { Attendance, Fine, Student, Exam, ExamResult } = require('../models');
// Simple ML-based prediction for student absences
class AttendancePredictionModel {
  constructor() {
    this.weights = {
      recentAbsences: 0.4,
      consecutiveAbsences: 0.3,
      dayOfWeek: 0.2,
      fineHistory: 0.1
    };
  }
  // Predict likelihood of absence (0-1 scale)
  async predictAbsence(studentId) {
    try {
      const student = await Student.findById(studentId).populate('user_id');
      if (!student) return 0;
      // Get recent attendance (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttendance = await Attendance.find({
        student_id: studentId,
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: -1 });
      // Calculate features
      const features = this.extractFeatures(recentAttendance, student);
      // Simple weighted scoring
      const score = (
        features.recentAbsenceRate * this.weights.recentAbsences +
        features.consecutiveAbsences * this.weights.consecutiveAbsences +
        features.dayOfWeekFactor * this.weights.dayOfWeek +
        features.fineImpact * this.weights.fineHistory
      );
      return Math.min(Math.max(score, 0), 1); // Clamp between 0-1
    } catch (error) {
      console.error('Prediction error:', error);
      return 0;
    }
  }
  extractFeatures(attendanceRecords, student) {
    const totalRecords = attendanceRecords.length;
    if (totalRecords === 0) return this.getDefaultFeatures();
    // Recent absence rate (last 10 classes)
    const recent10 = attendanceRecords.slice(0, 10);
    const recentAbsences = recent10.filter(r => r.status === 'absent').length;
    const recentAbsenceRate = recent10.length > 0 ? recentAbsences / recent10.length : 0;
    // Consecutive absences pattern
    let consecutiveAbsences = 0;
    let maxConsecutive = 0;
    for (const record of attendanceRecords) {
      if (record.status === 'absent') {
        consecutiveAbsences++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveAbsences);
      } else {
        consecutiveAbsences = 0;
      }
    }
    // Day of week factor (some students miss more on certain days)
    const today = new Date().getDay();
    const dayOfWeekFactor = this.getDayOfWeekFactor(today);
    // Fine impact (students with more fines tend to be absent more)
    const fineImpact = this.calculateFineImpact(student);
    return {
      recentAbsenceRate,
      consecutiveAbsences: Math.min(maxConsecutive / 5, 1), // Normalize
      dayOfWeekFactor,
      fineImpact
    };
  }
  getDefaultFeatures() {
    return {
      recentAbsenceRate: 0.2, // Default 20% absence rate
      consecutiveAbsences: 0,
      dayOfWeekFactor: 0.3,
      fineImpact: 0
    };
  }
  getDayOfWeekFactor(dayOfWeek) {
    // Monday=1, Friday=5 tend to have higher absences
    const absenceRates = {
      0: 0.4, // Sunday
      1: 0.6, // Monday
      2: 0.3, // Tuesday
      3: 0.2, // Wednesday
      4: 0.3, // Thursday
      5: 0.5, // Friday
      6: 0.3  // Saturday
    };
    return absenceRates[dayOfWeek] || 0.3;
  }
  async calculateFineImpact(student) {
    try {
      const fines = await Fine.find({ student_id: student._id });
      const unpaidFines = fines.filter(f => !f.is_paid).length;
      return Math.min(unpaidFines / 10, 1); // Normalize
    } catch (error) {
      return 0;
    }
  }
  // Batch prediction for multiple students
  async predictBatchAbsences(studentIds) {
    const predictions = [];
    for (const studentId of studentIds) {
      const prediction = await this.predictAbsence(studentId);
      predictions.push({
        student_id: studentId,
        absence_probability: prediction,
        risk_level: this.getRiskLevel(prediction)
      });
    }
    return predictions;
  }
  getRiskLevel(probability) {
    if (probability >= 0.7) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  }
}
// Grade improvement analyzer
class GradeAnalyzer {
  static async analyzeStudent(studentId) {
    try {
      const student = await Student.findById(studentId).populate('user_id class_id');
      if (!student) return null;
      // Get attendance and exam data
      const [attendance, examResults] = await Promise.all([
        Attendance.find({ student_id: studentId }).sort({ createdAt: -1 }).limit(50),
        ExamResult.find({ student_id: studentId })
          .populate('exam_id')
          .sort({ createdAt: -1 })
      ]);
      const analysis = {
        student_name: student.user_id.name,
        roll_no: student.user_id.roll_no,
        overall_performance: this.calculateOverallPerformance(attendance, examResults),
        attendance_analysis: this.analyzeAttendance(attendance),
        grade_analysis: this.analyzeGrades(examResults),
        recommendations: []
      };
      analysis.recommendations = this.generateRecommendations(analysis);
      return analysis;
    } catch (error) {
      console.error('Grade analysis error:', error);
      return null;
    }
  }
  static calculateOverallPerformance(attendance, examResults) {
    const attendanceRate = attendance.length > 0 
      ? attendance.filter(a => a.status === 'present').length / attendance.length
      : 0;
    const averagePercentage = examResults.length > 0
      ? examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length
      : 0;
    return {
      attendance_percentage: Math.round(attendanceRate * 100),
      grade_average: Math.round(averagePercentage),
      performance_score: Math.round((attendanceRate * 0.4 + averagePercentage/100 * 0.6) * 100)
    };
  }
  static analyzeAttendance(attendance) {
    if (attendance.length === 0) return { status: 'no_data' };
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = presentCount / attendance.length;
    return {
      total_classes: attendance.length,
      present_count: presentCount,
      attendance_rate: Math.round(attendanceRate * 100),
      trend: this.getAttendanceTrend(attendance),
      status: attendanceRate >= 0.75 ? 'good' : attendanceRate >= 0.6 ? 'average' : 'poor'
    };
  }
  static analyzeGrades(examResults) {
    if (examResults.length === 0) return { status: 'no_data' };
    const averageGrade = examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length;
    const trend = this.getGradeTrend(examResults);
    return {
      total_exams: examResults.length,
      average_percentage: Math.round(averageGrade),
      trend,
      status: averageGrade >= 80 ? 'excellent' : averageGrade >= 60 ? 'good' : 'needs_improvement'
    };
  }
  static generateRecommendations(analysis) {
    const recommendations = [];
    // Attendance recommendations
    if (analysis.attendance_analysis.attendance_rate < 75) {
      recommendations.push({
        type: 'attendance',
        priority: 'high',
        message: `Your attendance is ${analysis.attendance_analysis.attendance_rate}%. Aim for at least 75% to avoid penalties.`,
        action: 'Focus on consistent daily attendance'
      });
    }
    // Grade recommendations
    if (analysis.grade_analysis.average_percentage < 60) {
      recommendations.push({
        type: 'grades',
        priority: 'high',
        message: `Your average grade is ${analysis.grade_analysis.average_percentage}%. You need improvement.`,
        action: 'Schedule extra study sessions and seek teacher guidance'
      });
    }
    // Combined recommendations
    if (analysis.attendance_analysis.attendance_rate < 80 && analysis.grade_analysis.average_percentage < 70) {
      recommendations.push({
        type: 'combined',
        priority: 'critical',
        message: 'Both attendance and grades need immediate attention.',
        action: 'Meet with your class teacher to create an improvement plan'
      });
    }
    return recommendations;
  }
  static getAttendanceTrend(attendance) {
    if (attendance.length < 10) return 'insufficient_data';
    const recent = attendance.slice(0, 10);
    const older = attendance.slice(10, 20);
    const recentRate = recent.filter(a => a.status === 'present').length / recent.length;
    const olderRate = older.length > 0 ? older.filter(a => a.status === 'present').length / older.length : recentRate;
    if (recentRate > olderRate + 0.1) return 'improving';
    if (recentRate < olderRate - 0.1) return 'declining';
    return 'stable';
  }
  static getGradeTrend(examResults) {
    if (examResults.length < 3) return 'insufficient_data';
    const recent = examResults.slice(0, 3);
    const older = examResults.slice(3, 6);
    const recentAvg = recent.reduce((sum, r) => sum + r.percentage, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, r) => sum + r.percentage, 0) / older.length : recentAvg;
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }
}
module.exports = {
  AttendancePredictionModel,
  GradeAnalyzer
};
