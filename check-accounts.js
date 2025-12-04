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

const checkAccounts = async () => {
  try {
    const User = require('./src/models/User');
    const Teacher = require('./src/models/Teacher');
    const Admin = require('./src/models/Admin');

    const users = await User.find({});
    console.log('\n📋 All Users in Database:');
    console.log('========================');
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Roll No: ${user.roll_no || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user._id}`);
      
      if (user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user_id: user._id });
        if (teacher) {
          console.log(`   Employee ID: ${teacher.employee_id}`);
          console.log(`   Department: ${teacher.department}`);
        }
      }
      
      if (user.role === 'admin') {
        const admin = await Admin.findOne({ user_id: user._id });
        console.log(`   Admin ID: ${admin?._id || 'N/A'}`);
      }
    }
    
    console.log('\n========================');
    console.log(`Total users: ${users.length}`);
    console.log('\n🔑 Login Credentials:');
    users.forEach(u => {
      if (u.role === 'admin') {
        console.log(`\nAdmin: ${u.email} / Password: Sulu@123`);
      } else if (u.role === 'teacher') {
        console.log(`\nTeacher: ${u.email} / Password: 123456`);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await checkAccounts();
};

run();
