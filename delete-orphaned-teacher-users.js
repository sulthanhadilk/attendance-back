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

const deleteOrphanedTeacherUsers = async () => {
  try {
    const Teacher = require('./src/models/Teacher');
    const User = require('./src/models/User');

    // Find all teacher users
    const teacherUsers = await User.find({ role: 'teacher' });
    let deletedCount = 0;
    for (const user of teacherUsers) {
      const teacherProfile = await Teacher.findOne({ user_id: user._id });
      if (!teacherProfile) {
        await User.findByIdAndDelete(user._id);
        console.log(`Deleted orphaned teacher user: ${user.email}`);
        deletedCount++;
      }
    }
    console.log(`\n✅ Deleted ${deletedCount} orphaned teacher users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting orphaned teacher users:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await deleteOrphanedTeacherUsers();
};

run();
