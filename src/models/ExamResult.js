const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  // legacy link to Exam (optional)
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  // New fields per teacher-module spec (keep legacy fields for compatibility)
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  examType: { type: String, enum: ['school', 'islamic'] },
  internalOrExternal: { type: String, enum: ['internal', 'external'] },
  examName: { type: String },
  marksObtained: { type: Number, min: 0 },
  maxMarks: { type: Number, min: 1 },
  enteredByTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'] },
  percentage: { type: Number },
}, { timestamps: true });

// Auto-calculate grade and percentage before saving
examResultSchema.pre('save', function(next) {
  // Determine source fields for marks/max
  const marks = (typeof this.marksObtained === 'number') ? this.marksObtained : this.marks_obtained;
  const max = (typeof this.maxMarks === 'number') ? this.maxMarks : this.max_marks;
  if (typeof marks === 'number' && typeof max === 'number' && max > 0) {
    this.percentage = Math.round((marks / max) * 100);

    // Auto-assign grade based on percentage
    if (this.percentage >= 90) this.grade = 'A';
    else if (this.percentage >= 75) this.grade = 'B';
    else if (this.percentage >= 60) this.grade = 'C';
    else if (this.percentage >= 45) this.grade = 'D';
    else this.grade = 'F';
  }
  
  next();
});

// Indexes to support lookups; uniqueness kept loose to allow multiple exam types
examResultSchema.index({ exam_id: 1 });
examResultSchema.index({ studentId: 1, classId: 1, examName: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
