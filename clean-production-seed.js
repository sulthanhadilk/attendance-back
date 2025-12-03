const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
  User, Student, Teacher, Class, Session, Subject, 
  Attendance, Fine, Exam, ExamResult, Log
} = require('./src/models');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI || mongoURI === 'undefined') {
      throw new Error('MongoDB URI is not defined. Please set MONGO_URI environment variable.');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📊 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const cleanSeedData = async () => {
  try {
    console.log('🌱 Starting clean seed data process...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
      Session.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
      Fine.deleteMany({}),
      Exam.deleteMany({}),
      ExamResult.deleteMany({}),
      Log.deleteMany({})
    ]);
    console.log('🗑️ Cleared all existing data');

    // Create only the specific admin user requested
    const adminPassword = await bcrypt.hash('Sulu@123', 10);

    // Create Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'sulusulthan230@gmail.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create Activity Log for admin creation
    await Log.create({ 
      user_id: adminUser._id, 
      action: 'Admin account created during clean system initialization' 
    });

    console.log('\n🎉 CLEAN SEED COMPLETED SUCCESSFULLY!');
    console.log('\n📋 ADMIN ACCOUNT CREATED:');
    console.log('👑 Admin: sulusulthan230@gmail.com / Sulu@123');
    console.log('\n🔧 SYSTEM READY FOR USE!');
    console.log('\n📊 FINAL DATA SUMMARY:');
    console.log(`- Users: ${await User.countDocuments()} (1 Admin)`);
    console.log(`- Students: ${await Student.countDocuments()}`);
    console.log(`- Teachers: ${await Teacher.countDocuments()}`);
    console.log(`- Classes: ${await Class.countDocuments()}`);
    console.log(`- Sessions: ${await Session.countDocuments()}`);
    console.log(`- Subjects: ${await Subject.countDocuments()}`);
    console.log(`- Attendance Records: ${await Attendance.countDocuments()}`);
    console.log(`- Fine Records: ${await Fine.countDocuments()}`);
    console.log(`- Exams: ${await Exam.countDocuments()}`);
    console.log(`- Exam Results: ${await ExamResult.countDocuments()}`);
    console.log(`- Activity Logs: ${await Log.countDocuments()}`);

    console.log('\n💡 SYSTEM IS NOW CLEAN!');
    console.log('📝 No example/demo data included.');
    console.log('🎯 Use the admin account to add real teachers, students, and classes.');
    console.log('🚀 Ready for production use!');

  } catch (error) {
    console.error('❌ Clean seed error:', error);
    process.exit(1);
  }
};

const runCleanSeed = async () => {
  await connectDB();
  await cleanSeedData();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
  process.exit(0);
};

runCleanSeed();