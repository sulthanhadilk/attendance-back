const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  answerKey: { type: String },
}, { _id: false });
const questionBankSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions: [questionSchema],
}, { timestamps: true });
questionBankSchema.index({ teacherId: 1, courseId: 1 });
module.exports = mongoose.model('QuestionBank', questionBankSchema);
