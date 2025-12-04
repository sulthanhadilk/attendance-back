const { Student, Attendance, Fine, Exam, ExamResult, User } = require('../models');
class ChatbotService {
  constructor() {
    this.responses = {
      greeting: [
        "Assalamu Alaikum! How can I help you today?",
        "Peace be upon you! What would you like to know?",
        "Hello! I'm here to help with your Islamic College queries."
      ],
      unknown: [
        "I'm not sure about that. Try asking about your attendance, grades, or fines.",
        "I can help you with attendance records, exam results, and fine status. What would you like to know?",
        "Please ask me about your academic records, attendance, or upcoming exams."
      ]
    };
    this.patterns = {
      attendance: /attendance|present|absent|classes/i,
      grades: /grade|marks|result|exam|score/i,
      fines: /fine|penalty|payment|money/i,
      schedule: /schedule|timetable|class|next/i,
      greeting: /hello|hi|assalam|peace|salam/i,
      help: /help|what|how/i
    };
  }
  async processMessage(message, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return "I couldn't find your user information.";
      const student = await Student.findOne({ user_id: userId });
      if (!student && user.role === 'student') {
        return "I couldn't find your student profile.";
      }
      // Analyze message intent
      const intent = this.analyzeIntent(message);
      // Process based on intent
      switch (intent) {
        case 'greeting':
          return this.getRandomResponse('greeting');
        case 'attendance':
          return await this.handleAttendanceQuery(message, student, user);
        case 'grades':
          return await this.handleGradesQuery(message, student, user);
        case 'fines':
          return await this.handleFinesQuery(message, student, user);
        case 'schedule':
          return await this.handleScheduleQuery(message, student, user);
        case 'help':
          return this.getHelpMessage(user.role);
        default:
          return this.getRandomResponse('unknown');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      return "I'm experiencing some difficulties. Please try again later.";
    }
  }
  analyzeIntent(message) {
    const msg = message.toLowerCase();
    if (this.patterns.greeting.test(msg)) return 'greeting';
    if (this.patterns.attendance.test(msg)) return 'attendance';
    if (this.patterns.grades.test(msg)) return 'grades';
    if (this.patterns.fines.test(msg)) return 'fines';
    if (this.patterns.schedule.test(msg)) return 'schedule';
    if (this.patterns.help.test(msg)) return 'help';
    return 'unknown';
  }
  async handleAttendanceQuery(message, student, user) {
    if (user.role !== 'student') {
      return "I can only show attendance information for students.";
    }
    try {
      // Get attendance data
      const attendance = await Attendance.find({ student_id: student._id })
        .populate('subject_id', 'name')
        .sort({ createdAt: -1 })
        .limit(30);
      if (attendance.length === 0) {
        return "No attendance records found for you yet.";
      }
      const totalClasses = attendance.length;
      const presentClasses = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = Math.round((presentClasses / totalClasses) * 100);
      // Check for specific time period in message
      if (message.includes('month') || message.includes('this month')) {
        return await this.getMonthlyAttendance(student._id);
      }
      if (message.includes('week') || message.includes('this week')) {
        return await this.getWeeklyAttendance(student._id);
      }
      return `📊 Your Attendance Summary:
• Total Classes: ${totalClasses}
• Present: ${presentClasses}
• Attendance Rate: ${attendanceRate}%
• Status: ${attendanceRate >= 75 ? '✅ Good' : '⚠️ Needs Improvement'}
${attendanceRate < 75 ? 'Note: Maintain at least 75% attendance to avoid penalties.' : ''}`;
    } catch (error) {
      return "I couldn't retrieve your attendance information right now.";
    }
  }
  async handleGradesQuery(message, student, user) {
    if (user.role !== 'student') {
      return "I can only show grade information for students.";
    }
    try {
      const results = await ExamResult.find({ student_id: student._id })
        .populate({
          path: 'exam_id',
          populate: { path: 'subject_id', select: 'name' }
        })
        .sort({ createdAt: -1 })
        .limit(10);
      if (results.length === 0) {
        return "No exam results found for you yet.";
      }
      const totalExams = results.length;
      const averagePercentage = Math.round(
        results.reduce((sum, r) => sum + r.percentage, 0) / totalExams
      );
      const gradeDistribution = results.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {});
      let response = `📈 Your Grade Summary:
• Total Exams: ${totalExams}
• Average Score: ${averagePercentage}%
• Performance: ${averagePercentage >= 80 ? '🌟 Excellent' : averagePercentage >= 60 ? '👍 Good' : '📚 Needs Improvement'}
Grade Distribution:`;
      Object.entries(gradeDistribution)
        .sort()
        .forEach(([grade, count]) => {
          response += `\n• ${grade}: ${count} exam${count > 1 ? 's' : ''}`;
        });
      if (message.includes('latest') || message.includes('recent')) {
        const latest = results[0];
        response += `\n\n📝 Latest Result:
• Subject: ${latest.exam_id.subject_id.name}
• Score: ${latest.obtained_marks}/${latest.total_marks} (${latest.percentage}%)
• Grade: ${latest.grade}`;
      }
      return response;
    } catch (error) {
      return "I couldn't retrieve your grade information right now.";
    }
  }
  async handleFinesQuery(message, student, user) {
    if (user.role !== 'student') {
      return "I can only show fine information for students.";
    }
    try {
      const fines = await Fine.find({ student_id: student._id })
        .sort({ fine_date: -1 });
      if (fines.length === 0) {
        return "🎉 Great news! You have no fines on your record.";
      }
      const totalFines = fines.length;
      const paidFines = fines.filter(f => f.is_paid).length;
      const unpaidFines = totalFines - paidFines;
      const totalAmount = fines.reduce((sum, f) => sum + f.amount, 0);
      const paidAmount = fines.filter(f => f.is_paid).reduce((sum, f) => sum + f.amount, 0);
      const unpaidAmount = totalAmount - paidAmount;
      let response = `💰 Your Fine Summary:
• Total Fines: ${totalFines}
• Paid: ${paidFines}
• Unpaid: ${unpaidFines}
• Total Amount: Rs. ${totalAmount}
• Amount Paid: Rs. ${paidAmount}
• Outstanding: Rs. ${unpaidAmount}`;
      if (unpaidFines > 0) {
        response += `\n\n⚠️ You have ${unpaidFines} unpaid fine${unpaidFines > 1 ? 's' : ''} totaling Rs. ${unpaidAmount}.`;
        response += `\nPlease clear your dues as soon as possible.`;
      } else {
        response += `\n\n✅ All fines are cleared!`;
      }
      return response;
    } catch (error) {
      return "I couldn't retrieve your fine information right now.";
    }
  }
  async handleScheduleQuery(message, student, user) {
    try {
      if (user.role === 'student') {
        const upcomingExams = await Exam.find({
          class_id: student.class_id,
          exam_date: { $gte: new Date() }
        })
        .populate('subject_id', 'name')
        .sort({ exam_date: 1 })
        .limit(5);
        if (upcomingExams.length === 0) {
          return "📅 No upcoming exams scheduled at the moment.";
        }
        let response = "📅 Upcoming Exams:\n";
        upcomingExams.forEach((exam, index) => {
          const examDate = new Date(exam.exam_date);
          response += `\n${index + 1}. **${exam.subject_id.name}**`;
          response += `\n   📅 Date: ${examDate.toLocaleDateString()}`;
          response += `\n   ⏰ Time: ${exam.exam_time}`;
          response += `\n   📊 Total Marks: ${exam.total_marks}`;
          if (index < upcomingExams.length - 1) response += '\n';
        });
        return response;
      }
      return "I can show schedule information for students.";
    } catch (error) {
      return "I couldn't retrieve schedule information right now.";
    }
  }
  async getMonthlyAttendance(studentId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyAttendance = await Attendance.find({
      student_id: studentId,
      createdAt: { $gte: startOfMonth }
    });
    const totalClasses = monthlyAttendance.length;
    const presentClasses = monthlyAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    return `📅 This Month's Attendance:
• Classes Attended: ${presentClasses}/${totalClasses}
• Monthly Rate: ${attendanceRate}%
• Status: ${attendanceRate >= 75 ? '✅ On Track' : '⚠️ Below Target'}`;
  }
  async getWeeklyAttendance(studentId) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklyAttendance = await Attendance.find({
      student_id: studentId,
      createdAt: { $gte: weekStart }
    });
    const totalClasses = weeklyAttendance.length;
    const presentClasses = weeklyAttendance.filter(a => a.status === 'present').length;
    return `📅 This Week's Attendance:
• Classes Attended: ${presentClasses}/${totalClasses}
• Days Present: ${presentClasses}
• Status: ${totalClasses === presentClasses ? '🌟 Perfect Week!' : '📚 Keep it up!'}`;
  }
  getHelpMessage(userRole) {
    const commonHelp = `🤖 I can help you with:
• "What's my attendance?" - View attendance records
• "Show my grades" - Check exam results
• "What are my fines?" - Check fine status`;
    if (userRole === 'student') {
      return commonHelp + `
• "When is my next exam?" - Upcoming exams
• "My attendance this month" - Monthly stats
💡 Just ask me naturally! For example:
"How's my attendance looking?" or "Do I have any unpaid fines?"`;
    }
    return commonHelp + `\n\n💡 I'm designed primarily for student queries.`;
  }
  getRandomResponse(type) {
    const responses = this.responses[type] || this.responses.unknown;
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
module.exports = ChatbotService;
