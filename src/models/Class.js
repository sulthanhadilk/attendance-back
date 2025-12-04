const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  section: { type: String, trim: true },
  year: { type: Number, required: true },
  
  // Additional fields for Islamic College
  semester: { type: Number, min: 1, max: 8 },
  batch: { type: String, trim: true }, // e.g., "2021-2024"
  type: { type: String, enum: ['school', 'islamic'], default: 'school' },
  
  // Courses assigned to this class
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Main teacher/class teacher
  mainTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  
  // Students enrolled in this class
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
}, { timestamps: true });

classSchema.index({ name: 1, section: 1, year: 1 }, { unique: true });
classSchema.index({ mainTeacherId: 1 });
classSchema.index({ type: 1, semester: 1 });

module.exports = mongoose.model('Class', classSchema);
