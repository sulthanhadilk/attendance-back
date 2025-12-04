const mongoose = require('mongoose');

const libraryBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number
  },
  category: {
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Academic', 'Islamic', 'Reference', 'Biography', 'Science', 'History', 'Other'],
    default: 'Other'
  },
  language: {
    type: String,
    default: 'English'
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  issuedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCount: {
    type: Number,
    default: 0
  },
  shelfLocation: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  }
}, { timestamps: true });

// Virtual for available books
libraryBookSchema.virtual('available').get(function() {
  return this.quantity - this.issuedCount;
});

// Pre-save to calculate availableCount
libraryBookSchema.pre('save', function(next) {
  this.availableCount = this.quantity - this.issuedCount;
  next();
});

// Indexes
libraryBookSchema.index({ title: 1 });
libraryBookSchema.index({ author: 1 });
libraryBookSchema.index({ isbn: 1 });
libraryBookSchema.index({ category: 1 });

module.exports = mongoose.model('LibraryBook', libraryBookSchema);
