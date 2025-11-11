const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const { User, Student, Teacher, Class, Subject, Session } = require('../models');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({})
    ]);
    
    console.log('🗑️ Cleared existing data');

    // Create Admin User
    const adminPassword = await bcrypt.hash('Sulu@123', 10);
    const admin = await User.create({
      name: 'System Administrator',
      email: 'Sulusulthan230@gmail.com',
      roll_no: 'ADMIN001',
      phone: '+92-300-1234567',
      password: adminPassword,
      role: 'admin'
    });
    
    console.log('👤 Created admin user');

    // Create Academic Session
    const currentSession = await Session.create({
      name: 'Spring 2024',
      type: 'class',
      start_time: '08:00',
      end_time: '16:00'
    });
    
    console.log('📅 Created academic session');

    console.log('📚 No example subjects created - add through admin dashboard');

    console.log('👨‍🏫 No example teachers created - add through admin dashboard');

    console.log('🏫 No example classes created - add through admin dashboard');

    console.log('👨‍🎓 No example students created - add through admin dashboard');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('🔑 Admin: Sulusulthan230@gmail.com / Sulu@123');
    console.log('\n🎯 Total Created:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Teachers: ${await Teacher.countDocuments()}`);
    console.log(`   Students: ${await Student.countDocuments()}`);
    console.log(`   Classes: ${await Class.countDocuments()}`);
    console.log(`   Subjects: ${await Subject.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();