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

const fixAdminPassword = async () => {
  try {
    const User = require('./src/models/User');

    const admin = await User.findOne({ email: 'sulusulthan230@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log(`\n👤 Found admin: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Current password hash: ${admin.password ? admin.password.substring(0, 30) + '...' : 'NULL/EMPTY'}`);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Sulu@123', 10);
    console.log(`   New password hash: ${hashedPassword.substring(0, 30)}...`);
    
    // Update the password directly
    await User.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } }
    );
    
    // Fetch updated user
    const updatedAdmin = await User.findById(admin._id);
    
    console.log('\n✅ Admin password reset successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Email: sulusulthan230@gmail.com');
    console.log('   Password: Sulu@123');
    
    // Verify the password works
    const isMatch = await bcrypt.compare('Sulu@123', updatedAdmin.password);
    console.log(`\n✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await fixAdminPassword();
};

run();
