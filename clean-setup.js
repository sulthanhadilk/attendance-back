const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
  User, Student, Teacher, Class, Session, Subject, 
  Attendance, Fine, Exam, ExamResult, Log
} = require('./src/models');

// Connect to MongoDB
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

const cleanSetup = async () => {
  try {
    console.log('🌱 Starting clean system setup...');
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
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
    console.log('🗑️ Cleared existing data');

    // Create only the specific admin user
    const adminPassword = await bcrypt.hash('Sulu@123', 10);
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'Sulusulthan230@gmail.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('👑 Admin user created: Sulusulthan230@gmail.com / Sulu@123');

    // Log admin creation activity
    await Log.create({
      user_id: adminUser._id,
      action: 'Admin user account created during system initialization'
    });

    console.log('\n🎉 CLEAN SYSTEM SETUP COMPLETED!');
    console.log('\n📋 ADMIN ACCOUNT:');
    console.log('👑 Admin: Sulusulthan230@gmail.com / Sulu@123');
    console.log('\n🔧 SYSTEM READY - You can now add your own data through the admin panel!');
    console.log('\n✨ Login to your system and start adding:');
    console.log('   - Teachers and their subjects');
    console.log('   - Students and their classes');
    console.log('   - Class schedules and sessions');
    console.log('   - Begin marking attendance and managing exams');

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
};

// Run the setup
const runSetup = async () => {
  await connectDB();
  await cleanSetup();
  
  console.log('\n🚀 Disconnecting from database...');
  await mongoose.disconnect();
  console.log('✅ Setup completed successfully!');
  process.exit(0);
};

runSetup().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});