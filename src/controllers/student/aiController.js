const { Student, AICache, HourlyAttendance, ExamResult, Fine, StudentConduct } = require('../../models');
/**
 * GET /api/student/ai/risk
 * Get AI risk assessment (STUB - simplified logic)
 */
exports.getRiskAssessment = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    // Check if cache exists and is fresh
    let cache = await AICache.findOne({ studentId: student._id });
    if (!cache || cache.isStale(24)) {
      // Recalculate
      const [attendanceRecords, results, fines, conduct] = await Promise.all([
        HourlyAttendance.find({ studentId: student._id }),
        ExamResult.find({ studentId: student._id, published: true }),
        Fine.find({ student_id: student._id }),
        StudentConduct.find({ studentId: student._id })
      ]);
      // Calculate attendance percentage
      const totalClasses = attendanceRecords.length;
      const presentClasses = attendanceRecords.filter(r => r.status === 'present').length;
      const attendancePercentage = totalClasses > 0 
        ? Math.round((presentClasses / totalClasses) * 100) 
        : 100;
      // Calculate average marks
      const avgMarks = results.length > 0
        ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
        : 0;
      // Calculate risk scores
      const attendanceRisk = attendancePercentage < 75 ? (75 - attendancePercentage) * 2 : 0;
      const performanceRisk = avgMarks < 50 ? (50 - avgMarks) * 2 : 0;
      const conductRisk = conduct.length * 10; // 10 points per incident
      const overallRisk = Math.min(100, Math.round(
        (attendanceRisk * 0.4) + (performanceRisk * 0.4) + (conductRisk * 0.2)
      ));
      let riskCategory = 'low';
      if (overallRisk >= 75) riskCategory = 'critical';
      else if (overallRisk >= 50) riskCategory = 'high';
      else if (overallRisk >= 25) riskCategory = 'medium';
      const recommendations = [];
      if (attendancePercentage < 75) {
        recommendations.push({
          type: 'attendance',
          message: `Your attendance is ${attendancePercentage}%. Improve it to at least 75% to avoid academic issues.`,
          priority: 'high'
        });
      }
      if (avgMarks < 50) {
        recommendations.push({
          type: 'academic',
          message: 'Your average marks are below 50%. Consider extra study sessions and consulting teachers.',
          priority: 'high'
        });
      }
      if (fines.filter(f => f.status === 'unpaid').length > 0) {
        recommendations.push({
          type: 'discipline',
          message: 'You have unpaid fines. Clear them at the earliest.',
          priority: 'medium'
        });
      }
      // Update or create cache
      if (cache) {
        cache.attendanceRiskScore = attendanceRisk;
        cache.performanceRiskScore = performanceRisk;
        cache.overallRiskScore = overallRisk;
        cache.riskCategory = riskCategory;
        cache.analytics = {
          attendancePercentage,
          totalExams: results.length,
          averageMarks: Math.round(avgMarks),
          totalFines: fines.length,
          unpaidFines: fines.filter(f => f.status === 'unpaid').length,
          conductIncidents: conduct.length
        };
        cache.recommendations = recommendations;
        await cache.save();
      } else {
        cache = await AICache.create({
          studentId: student._id,
          attendanceRiskScore: attendanceRisk,
          performanceRiskScore: performanceRisk,
          overallRiskScore: overallRisk,
          riskCategory,
          analytics: {
            attendancePercentage,
            totalExams: results.length,
            averageMarks: Math.round(avgMarks),
            totalFines: fines.length,
            unpaidFines: fines.filter(f => f.status === 'unpaid').length,
            conductIncidents: conduct.length
          },
          recommendations
        });
      }
    }
    res.json({
      success: true,
      risk: {
        overall: cache.overallRiskScore,
        category: cache.riskCategory,
        attendance: cache.attendanceRiskScore,
        performance: cache.performanceRiskScore
      },
      analytics: cache.analytics,
      recommendations: cache.recommendations
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/ai/study-advice
 * Get AI study suggestions (STUB)
 */
exports.getStudyAdvice = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('courseIds', 'name type');
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const results = await ExamResult.find({
      studentId: student._id,
      published: true
    }).populate('courseId', 'name type').sort({ percentage: 1 }).limit(3);
    const suggestions = results.map(result => ({
      subject: result.courseId?.name || 'Unknown',
      percentage: result.percentage,
      suggestion: result.percentage < 50 
        ? 'Requires immediate attention. Schedule extra study time and consult teacher.'
        : result.percentage < 70
        ? 'Needs improvement. Practice more problems and review concepts.'
        : 'Good progress. Maintain consistency.',
      resources: [
        'Textbook Chapter Review',
        'Online Practice Problems',
        'Teacher Office Hours'
      ]
    }));
    res.json({
      success: true,
      weakSubjects: suggestions,
      generalAdvice: [
        'Create a daily study schedule',
        'Attend all classes regularly',
        'Participate in group study sessions',
        'Clear doubts immediately with teachers'
      ]
    });
  } catch (error) {
    console.error('Study advice error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
module.exports = exports;
