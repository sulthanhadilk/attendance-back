const mongoose = require('mongoose');

const libraryIssueSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryBook',
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  fine: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Method to check if book is overdue
libraryIssueSchema.methods.isOverdue = function() {
  return !this.returnedAt && new Date() > this.dueDate;
};

// Update status based on dates
libraryIssueSchema.pre('save', function(next) {
  if (this.returnedAt) {
    this.status = 'returned';
  } else if (new Date() > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'issued';
  }
  next();
});

// Indexes
libraryIssueSchema.index({ studentId: 1, status: 1 });
libraryIssueSchema.index({ bookId: 1, status: 1 });
libraryIssueSchema.index({ dueDate: 1 });

module.exports = mongoose.model('LibraryIssue', libraryIssueSchema);
