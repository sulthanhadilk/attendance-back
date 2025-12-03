const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');
const { Student, Attendance, Fine, ExamResult, User, Class, Subject, Exam } = require('../models');

class ExportService {
  // Export attendance report as CSV
  static async exportAttendanceCSV(classId, startDate, endDate) {
    try {
      const attendance = await Attendance.find({
        date: { $gte: startDate, $lte: endDate }
      })
      .populate({
        path: 'student_id',
        populate: { path: 'user_id', select: 'name roll_no' }
      })
      .populate('session_id', 'name')
      .populate({
        path: 'teacher_id',
        populate: { path: 'user_id', select: 'name' }
      });

      const csvData = attendance.map(record => ({
        student_name: record.student_id.user_id.name,
        roll_no: record.student_id.user_id.roll_no,
        session: record.session_id.name,
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        marked_by: record.teacher_id.user_id.name,
        time: record.createdAt.toISOString()
      }));

      const fileName = `attendance_report_${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../exports', fileName);

      // Ensure exports directory exists
      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'student_name', title: 'Student Name' },
          { id: 'roll_no', title: 'Roll No' },
          { id: 'session', title: 'Session' },
          { id: 'date', title: 'Date' },
          { id: 'status', title: 'Status' },
          { id: 'marked_by', title: 'Marked By' },
          { id: 'time', title: 'Timestamp' }
        ]
      });

      await csvWriter.writeRecords(csvData);
      return { fileName, filePath, recordCount: csvData.length };
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export attendance data');
    }
  }

  // Export fines report as CSV
  static async exportFinesCSV(startDate, endDate) {
    try {
      const fines = await Fine.find({
        date: { $gte: startDate, $lte: endDate }
      })
      .populate({
        path: 'student_id',
        populate: { path: 'user_id', select: 'name roll_no' }
      })
      .populate({
        path: 'teacher_id',
        populate: { path: 'user_id', select: 'name' }
      });

      const csvData = fines.map(fine => ({
        student_name: fine.student_id.user_id.name,
        roll_no: fine.student_id.user_id.roll_no,
        amount: fine.amount,
        reason: fine.reason === 'Custom' ? fine.custom_reason : fine.reason,
        is_paid: fine.is_paid ? 'Paid' : 'Unpaid',
        date: fine.date.toISOString().split('T')[0],
        imposed_by: fine.teacher_id.user_id.name,
        created_at: fine.createdAt.toISOString()
      }));

      const fileName = `fines_report_${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../exports', fileName);

      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'student_name', title: 'Student Name' },
          { id: 'roll_no', title: 'Roll No' },
          { id: 'amount', title: 'Amount (₹)' },
          { id: 'reason', title: 'Reason' },
          { id: 'is_paid', title: 'Status' },
          { id: 'date', title: 'Date' },
          { id: 'imposed_by', title: 'Imposed By' },
          { id: 'created_at', title: 'Created At' }
        ]
      });

      await csvWriter.writeRecords(csvData);
      return { fileName, filePath, recordCount: csvData.length };
    } catch (error) {
      console.error('Fines CSV export error:', error);
      throw new Error('Failed to export fines data');
    }
  }

  // Generate student report card as PDF
  static async generateStudentReportCardPDF(studentId, examId = null) {
    try {
      const student = await Student.findById(studentId)
        .populate('user_id', 'name roll_no')
        .populate('class_id', 'name section year');

      if (!student) throw new Error('Student not found');

      // Get exam results
      let examResults;
      if (examId) {
        examResults = await ExamResult.find({ student_id: studentId, exam_id: examId })
          .populate('subject_id', 'name type')
          .populate('exam_id', 'name date');
      } else {
        // Get latest exam results
        const latestExam = await Exam.findOne({ class_id: student.class_id._id })
          .sort({ createdAt: -1 });
        
        if (latestExam) {
          examResults = await ExamResult.find({ student_id: studentId, exam_id: latestExam._id })
            .populate('subject_id', 'name type')
            .populate('exam_id', 'name date');
        } else {
          examResults = [];
        }
      }

      // Get attendance summary
      const totalAttendance = await Attendance.countDocuments({ student_id: studentId });
      const presentAttendance = await Attendance.countDocuments({ 
        student_id: studentId, 
        status: 'present' 
      });
      const attendancePercentage = totalAttendance > 0 ? 
        Math.round((presentAttendance / totalAttendance) * 100) : 0;

      // Get fines summary
      const totalFines = await Fine.aggregate([
        { $match: { student_id: studentId } },
        { $group: { _id: null, total: { $sum: '$amount' }, unpaid: { $sum: { $cond: [{ $eq: ['$is_paid', false] }, '$amount', 0] } } } }
      ]);

      const finesSummary = totalFines.length > 0 ? totalFines[0] : { total: 0, unpaid: 0 };

      // Create PDF
      const fileName = `report_card_${student.user_id.roll_no}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../exports', fileName);

      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .text('ISLAMIC COLLEGE REPORT CARD', { align: 'center' })
         .moveDown();

      // Student Information
      doc.fontSize(14)
         .text(`Name: ${student.user_id.name}`, 50, doc.y)
         .text(`Roll No: ${student.user_id.roll_no}`, 300, doc.y)
         .moveDown()
         .text(`Class: ${student.class_id.name} ${student.class_id.section}`, 50, doc.y)
         .text(`Year: ${student.class_id.year}`, 300, doc.y)
         .moveDown(2);

      // Academic Performance
      doc.fontSize(16)
         .text('ACADEMIC PERFORMANCE', { underline: true })
         .moveDown();

      // Separate Islamic and School subjects
      const islamicSubjects = examResults.filter(r => r.subject_id.type === 'Islamic');
      const schoolSubjects = examResults.filter(r => r.subject_id.type === 'School');

      if (islamicSubjects.length > 0) {
        doc.fontSize(14)
           .text('Islamic Subjects:', { underline: true })
           .moveDown(0.5);

        islamicSubjects.forEach(result => {
          const percentage = Math.round((result.marks_obtained / result.max_marks) * 100);
          doc.fontSize(12)
             .text(`${result.subject_id.name}: ${result.marks_obtained}/${result.max_marks} (${percentage}%) - Grade: ${result.grade}`)
             .moveDown(0.3);
        });
        doc.moveDown();
      }

      if (schoolSubjects.length > 0) {
        doc.fontSize(14)
           .text('School Subjects:', { underline: true })
           .moveDown(0.5);

        schoolSubjects.forEach(result => {
          const percentage = Math.round((result.marks_obtained / result.max_marks) * 100);
          doc.fontSize(12)
             .text(`${result.subject_id.name}: ${result.marks_obtained}/${result.max_marks} (${percentage}%) - Grade: ${result.grade}`)
             .moveDown(0.3);
        });
        doc.moveDown();
      }

      // Overall grades summary
      if (examResults.length > 0) {
        const totalMarks = examResults.reduce((sum, r) => sum + r.marks_obtained, 0);
        const totalMaxMarks = examResults.reduce((sum, r) => sum + r.max_marks, 0);
        const overallPercentage = Math.round((totalMarks / totalMaxMarks) * 100);
        
        doc.fontSize(14)
           .text(`Overall Performance: ${totalMarks}/${totalMaxMarks} (${overallPercentage}%)`)
           .moveDown(2);
      }

      // Attendance Summary
      doc.fontSize(16)
         .text('ATTENDANCE SUMMARY', { underline: true })
         .moveDown();

      doc.fontSize(12)
         .text(`Total Classes: ${totalAttendance}`)
         .text(`Classes Attended: ${presentAttendance}`)
         .text(`Attendance Percentage: ${attendancePercentage}%`)
         .moveDown(2);

      // Fines Summary
      doc.fontSize(16)
         .text('FINES SUMMARY', { underline: true })
         .moveDown();

      doc.fontSize(12)
         .text(`Total Fines: ₹${finesSummary.total}`)
         .text(`Unpaid Fines: ₹${finesSummary.unpaid}`)
         .moveDown(2);

      // Footer
      doc.fontSize(10)
         .text(`Report generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({ fileName, filePath });
        });
        stream.on('error', reject);
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate report card PDF');
    }
  }

  // Export exam results as CSV
  static async exportExamResultsCSV(examId) {
    try {
      const examResults = await ExamResult.find({ exam_id: examId })
        .populate({
          path: 'student_id',
          populate: { path: 'user_id', select: 'name roll_no' }
        })
        .populate('subject_id', 'name type')
        .populate('exam_id', 'name date');

      const csvData = examResults.map(result => {
        const percentage = Math.round((result.marks_obtained / result.max_marks) * 100);
        return {
          student_name: result.student_id.user_id.name,
          roll_no: result.student_id.user_id.roll_no,
          exam_name: result.exam_id.name,
          subject: result.subject_id.name,
          subject_type: result.subject_id.type,
          marks_obtained: result.marks_obtained,
          max_marks: result.max_marks,
          percentage: percentage,
          grade: result.grade,
          exam_date: result.exam_id.date.toISOString().split('T')[0]
        };
      });

      const fileName = `exam_results_${examId}_${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../exports', fileName);

      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'student_name', title: 'Student Name' },
          { id: 'roll_no', title: 'Roll No' },
          { id: 'exam_name', title: 'Exam Name' },
          { id: 'subject', title: 'Subject' },
          { id: 'subject_type', title: 'Subject Type' },
          { id: 'marks_obtained', title: 'Marks Obtained' },
          { id: 'max_marks', title: 'Max Marks' },
          { id: 'percentage', title: 'Percentage' },
          { id: 'grade', title: 'Grade' },
          { id: 'exam_date', title: 'Exam Date' }
        ]
      });

      await csvWriter.writeRecords(csvData);
      return { fileName, filePath, recordCount: csvData.length };
    } catch (error) {
      console.error('Exam results CSV export error:', error);
      throw new Error('Failed to export exam results');
    }
  }
}

module.exports = ExportService;