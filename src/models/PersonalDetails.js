const mongoose = require('mongoose');

const PersonalDetailsSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  dob: { type: Date },
  gender: { type: String },
  bloodGroup: { type: String },
  religion: { type: String },
  caste: { type: String },
  category: { type: String },
  district: { type: String },
  state: { type: String },
  city: { type: String },
  pinCode: { type: String },
});

module.exports = mongoose.model('PersonalDetails', PersonalDetailsSchema);