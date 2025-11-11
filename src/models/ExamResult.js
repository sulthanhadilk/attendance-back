const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  marks_obtained: { type: Number, required: true, min: 0 },
  max_marks: { type: Number, required: true, min: 1 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'] },
  percentage: { type: Number },
}, { timestamps: true });

// Auto-calculate grade and percentage before saving
examResultSchema.pre('save', function(next) {
  // Calculate percentage
  this.percentage = Math.round((this.marks_obtained / this.max_marks) * 100);
  
  // Auto-assign grade based on Islamic College grading system
  if (this.percentage >= 90) this.grade = 'A';
  else if (this.percentage >= 75) this.grade = 'B';
  else if (this.percentage >= 60) this.grade = 'C';
  else if (this.percentage >= 45) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

examResultSchema.index({ exam_id: 1, student_id: 1, subject_id: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
