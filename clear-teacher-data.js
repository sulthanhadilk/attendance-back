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

const clearAllTeacherData = async () => {
  try {
    const Teacher = require('./src/models/Teacher');
    const User = require('./src/models/User');

    // Delete all teachers first
    const teachers = await Teacher.find();
    console.log(`Found ${teachers.length} teachers`);
    for (const teacher of teachers) {
      await Teacher.findByIdAndDelete(teacher._id);
      console.log(`Deleted teacher: ${teacher.employee_id}`);
    }

    // Delete all teacher users (role: 'teacher')
    const teacherUsers = await User.find({ role: 'teacher' });
    console.log(`Found ${teacherUsers.length} teacher users`);
    for (const user of teacherUsers) {
      await User.findByIdAndDelete(user._id);
      console.log(`Deleted user: ${user.email}`);
    }

    // Also check for orphaned users (like sahal@gmail.com)
    const allUsers = await User.find({});
    console.log(`\nTotal remaining users: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (role: ${u.role})`);
    });

    console.log('\n✅ All teacher data cleared successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await clearAllTeacherData();
};

run();
