const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const testPasswords = async () => {
  try {
    const User = require('./src/models/User');

    const users = await User.find({});
    console.log('\n🔐 Testing Password Verification:\n');
    
    for (const user of users) {
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      
      let testPassword = '';
      if (user.role === 'admin') {
        testPassword = 'Sulu@123';
      } else if (user.role === 'teacher') {
        testPassword = '123456';
      }
      
      if (testPassword) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`   Password "${testPassword}": ${isMatch ? '✅ CORRECT' : '❌ WRONG'}`);
        
        if (!isMatch) {
          console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);
        }
      }
    }
    
    console.log('\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await testPasswords();
};

run();
