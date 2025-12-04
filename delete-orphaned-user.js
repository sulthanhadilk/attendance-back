require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./src/models');

async function deleteOrphanedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete the orphaned teacher user
    const result = await User.deleteOne({ email: 'sahal@gmail.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Deleted orphaned user: sahal@gmail.com');
    } else {
      console.log('⚠️ User not found');
    }

    // Show remaining users
    const remainingUsers = await User.find({}, 'name email role');
    console.log('\nRemaining users in database:');
    remainingUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
    });

    console.log('\n✅ Cleanup complete! You can now create teachers.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteOrphanedUsers();
