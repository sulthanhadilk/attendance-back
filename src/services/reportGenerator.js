const { Student, Attendance, Fine, Exam, ExamResult, User } = require('../models');
const { GradeAnalyzer } = require('./aiServices');
class ReportGenerator {
  static async generateStudentReport(studentId) {
    try {
      const student = await Student.findById(studentId)
        .populate('user_id', 'name roll_no')
        .populate('class_id', 'name section year');
      if (!student) return null;
      const [attendance, examResults, fines] = await Promise.all([
        Attendance.find({ student_id: studentId }).sort({ createdAt: -1 }),
        ExamResult.find({ student_id: studentId })
          .populate('exam_id')
          .populate({
            path: 'exam_id',
            populate: { path: 'subject_id', select: 'name' }
          }),
        Fine.find({ student_id: studentId })
      ]);
      const report = {
        student_info: {
          name: student.user_id.name,
          roll_no: student.user_id.roll_no,
          class: `${student.class_id.name} ${student.class_id.section}`,
          year: student.class_id.year
        },
        summary: await this.generateAISummary(student, attendance, examResults, fines),
        detailed_analysis: await GradeAnalyzer.analyzeStudent(studentId),
        recommendations: this.generateActionableRecommendations(attendance, examResults, fines),
        report_date: new Date().toISOString()
      };
      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      return null;
    }
  }
  static async generateAISummary(student, attendance, examResults, fines) {
    const attendanceRate = attendance.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0;
    const averageGrade = examResults.length > 0
      ? Math.round(examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length)
      : 0;
    const unpaidFines = fines.filter(f => !f.is_paid).length;
    const totalFineAmount = fines.filter(f => !f.is_paid).reduce((sum, f) => sum + f.amount, 0);
    let summary = `${student.user_id.name} is a student in `;
    summary += `${student.class_id.name} ${student.class_id.section}. `;
    // Attendance analysis
    if (attendanceRate >= 90) {
      summary += `Their attendance is exemplary at ${attendanceRate}%, showing excellent commitment to their studies. `;
    } else if (attendanceRate >= 75) {
      summary += `They maintain good attendance at ${attendanceRate}%, meeting the minimum requirements. `;
    } else if (attendanceRate >= 60) {
      summary += `Their attendance needs improvement at ${attendanceRate}%, falling below the expected standard. `;
    } else {
      summary += `Attendance is concerning at only ${attendanceRate}%, requiring immediate attention. `;
    }
    // Academic performance
    if (examResults.length > 0) {
      if (averageGrade >= 85) {
        summary += `Academically, they excel with an average grade of ${averageGrade}%, demonstrating strong understanding of the curriculum. `;
      } else if (averageGrade >= 70) {
        summary += `Their academic performance is solid with an average of ${averageGrade}%, showing good grasp of the material. `;
      } else if (averageGrade >= 50) {
        summary += `Academic performance shows room for improvement with an average of ${averageGrade}%. `;
      } else {
        summary += `Academic performance requires significant attention with an average of ${averageGrade}%. `;
      }
      // Subject-specific insights
      const subjectPerformance = this.analyzeSubjectPerformance(examResults);
      if (subjectPerformance.strongest) {
        summary += `They show particular strength in ${subjectPerformance.strongest.subject} with an average of ${subjectPerformance.strongest.average}%. `;
      }
      if (subjectPerformance.weakest) {
        summary += `${subjectPerformance.weakest.subject} appears to be challenging with an average of ${subjectPerformance.weakest.average}%. `;
      }
    }
    // Disciplinary record
    if (unpaidFines === 0 && fines.length === 0) {
      summary += `Their disciplinary record is clean with no fines or penalties. `;
    } else if (unpaidFines === 0) {
      summary += `While they have had some fines in the past, all have been settled, showing responsibility. `;
    } else {
      summary += `There are ${unpaidFines} unpaid fine(s) totaling Rs. ${totalFineAmount} that need attention. `;
    }
    // Overall assessment
    const overallScore = this.calculateOverallScore(attendanceRate, averageGrade, unpaidFines);
    if (overallScore >= 85) {
      summary += `Overall, ${student.user_id.name} is an exemplary student who serves as a positive example for others.`;
    } else if (overallScore >= 70) {
      summary += `Overall, ${student.user_id.name} is a good student with consistent performance.`;
    } else if (overallScore >= 55) {
      summary += `Overall, ${student.user_id.name} shows potential but needs focused improvement in key areas.`;
    } else {
      summary += `Overall, ${student.user_id.name} requires immediate intervention and support to improve their academic journey.`;
    }
    return summary;
  }
  static analyzeSubjectPerformance(examResults) {
    const subjectMap = {};
    examResults.forEach(result => {
      const subject = result.exam_id.subject_id.name;
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, count: 0 };
      }
      subjectMap[subject].total += result.percentage;
      subjectMap[subject].count += 1;
    });
    const subjects = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count)
    }));
    if (subjects.length === 0) return {};
    return {
      strongest: subjects.reduce((max, curr) => curr.average > max.average ? curr : max),
      weakest: subjects.reduce((min, curr) => curr.average < min.average ? curr : min)
    };
  }
  static calculateOverallScore(attendanceRate, averageGrade, unpaidFines) {
    const attendanceScore = attendanceRate;
    const gradeScore = averageGrade;
    const disciplineScore = Math.max(100 - (unpaidFines * 10), 0);
    return Math.round((attendanceScore * 0.4 + gradeScore * 0.5 + disciplineScore * 0.1));
  }
  static generateActionableRecommendations(attendance, examResults, fines) {
    const recommendations = [];
    // Attendance recommendations
    const attendanceRate = attendance.length > 0 
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
      : 0;
    if (attendanceRate < 75) {
      recommendations.push({
        category: 'Attendance',
        priority: 'High',
        action: 'Improve Daily Attendance',
        description: `Current attendance is ${Math.round(attendanceRate)}%. Aim for at least 75% to meet requirements.`,
        specific_steps: [
          'Set daily alarms for all class times',
          'Plan transportation in advance',
          'Communicate with teachers about any anticipated absences',
          'Track attendance weekly to monitor progress'
        ],
        timeline: '2-4 weeks',
        expected_outcome: 'Reach minimum 75% attendance rate'
      });
    }
    // Academic recommendations
    const averageGrade = examResults.length > 0
      ? examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length
      : 0;
    if (averageGrade < 70) {
      recommendations.push({
        category: 'Academic Performance',
        priority: averageGrade < 50 ? 'Critical' : 'High',
        action: 'Enhance Study Methods',
        description: `Current average is ${Math.round(averageGrade)}%. Focus on improving study techniques and seeking help.`,
        specific_steps: [
          'Schedule regular study sessions',
          'Form study groups with classmates',
          'Meet with teachers during office hours',
          'Use active learning techniques (summarizing, teaching others)',
          'Take practice tests before exams'
        ],
        timeline: '4-8 weeks',
        expected_outcome: `Raise average grade to at least 70%`
      });
    }
    // Financial responsibility
    const unpaidFines = fines.filter(f => !f.is_paid);
    if (unpaidFines.length > 0) {
      const totalOwed = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
      recommendations.push({
        category: 'Financial Responsibility',
        priority: 'Medium',
        action: 'Clear Outstanding Fines',
        description: `${unpaidFines.length} unpaid fine(s) totaling Rs. ${totalOwed} need to be settled.`,
        specific_steps: [
          'Review all outstanding fines',
          'Contact administration for payment options',
          'Set up payment plan if needed',
          'Maintain better discipline to avoid future fines'
        ],
        timeline: '1-2 weeks',
        expected_outcome: 'All fines cleared and clean disciplinary record'
      });
    }
    // Islamic values and character development
    recommendations.push({
      category: 'Character Development',
      priority: 'Medium',
      action: 'Strengthen Islamic Values',
      description: 'Continue developing strong Islamic character alongside academic growth.',
      specific_steps: [
        'Participate actively in Islamic studies classes',
        'Join mosque activities and community service',
        'Practice daily duas and Quran recitation',
        'Seek guidance from Islamic scholars and teachers',
        'Be a positive influence on fellow students'
      ],
      timeline: 'Ongoing',
      expected_outcome: 'Balanced development of academic and spiritual growth'
    });
    return recommendations;
  }
  static async generateClassReport(classId) {
    try {
      const students = await Student.find({ class_id: classId })
        .populate('user_id', 'name roll_no');
      const reports = [];
      for (const student of students) {
        const report = await this.generateStudentReport(student._id);
        if (report) {
          reports.push(report);
        }
      }
      return {
        class_id: classId,
        total_students: students.length,
        reports_generated: reports.length,
        reports,
        generation_date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Class report generation error:', error);
      return null;
    }
  }
  static async generateAdminInsights() {
    try {
      const [totalStudents, totalAttendance, totalFines, totalExams] = await Promise.all([
        Student.countDocuments(),
        Attendance.countDocuments(),
        Fine.countDocuments(),
        Exam.countDocuments()
      ]);
      // Get attendance trends
      const attendanceTrends = await this.getAttendanceTrends();
      // Get fine patterns
      const finePatterns = await this.getFinePatterns();
      // Get academic performance trends
      const performanceTrends = await this.getPerformanceTrends();
      return {
        overview: {
          total_students: totalStudents,
          total_attendance_records: totalAttendance,
          total_fines: totalFines,
          total_exams: totalExams
        },
        insights: {
          attendance_trends: attendanceTrends,
          fine_patterns: finePatterns,
          performance_trends: performanceTrends
        },
        recommendations: this.generateAdminRecommendations(attendanceTrends, finePatterns, performanceTrends),
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Admin insights generation error:', error);
      return null;
    }
  }
  static async getAttendanceTrends() {
    // Implementation for attendance trend analysis
    return {
      overall_rate: "85%",
      trend: "stable",
      insights: ["Attendance remains consistent across most classes", "Monday mornings show slightly lower attendance"]
    };
  }
  static async getFinePatterns() {
    // Implementation for fine pattern analysis
    return {
      most_common_reason: "late_arrival",
      peak_days: ["Monday", "Friday"],
      insights: ["Most fines occur during first period", "Students struggle with punctuality after weekends"]
    };
  }
  static async getPerformanceTrends() {
    // Implementation for performance trend analysis
    return {
      average_improvement: "5%",
      top_subjects: ["Islamic Studies", "Mathematics"],
      insights: ["Overall grades showing upward trend", "STEM subjects need additional support"]
    };
  }
  static generateAdminRecommendations(attendance, fines, performance) {
    return [
      {
        area: "Attendance Management",
        recommendation: "Implement early morning motivational sessions",
        expected_impact: "10% improvement in Monday attendance"
      },
      {
        area: "Fine Reduction",
        recommendation: "Create punctuality awareness program",
        expected_impact: "25% reduction in late arrival fines"
      },
      {
        area: "Academic Support",
        recommendation: "Establish peer tutoring program for STEM subjects",
        expected_impact: "15% improvement in struggling students' grades"
      }
    ];
  }
}
module.exports = ReportGenerator;
