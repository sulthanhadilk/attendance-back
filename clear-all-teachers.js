const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const clearTeachers = async () => {
  try {
    // Get all teachers
    const Teacher = require('./src/models/Teacher');
    const User = require('./src/models/User');

    const teachers = await Teacher.find();
    console.log(`Found ${teachers.length} teachers`);

    // Delete associated users and teachers
    for (const teacher of teachers) {
      await User.findByIdAndDelete(teacher.user_id);
      await Teacher.findByIdAndDelete(teacher._id);
      console.log(`Deleted teacher: ${teacher.employee_id}`);
    }

    console.log('✅ All teachers cleared successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing teachers:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await clearTeachers();
};

run();
