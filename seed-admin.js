const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/islamic_college_db');
    console.log('📦 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'Sulusulthan230@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Sulu@123', 12);

    // Create admin user
    const adminUser = new User({
      name: 'Sulthan Hadil K',
      email: 'Sulusulthan230@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: Sulusulthan230@gmail.com');
    console.log('🔐 Password: Sulu@123');
    console.log('👑 Role: admin');
    console.log('🆔 User ID:', adminUser._id);
    
    console.log('\n🚀 You can now login at: https://attendence-front.vercel.app');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding
seedAdmin();