require('dotenv').config();
const mongoose = require('mongoose');
const { User, Teacher, Student } = require('./src/models');

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all teachers
    const teachers = await Teacher.find();
    console.log(`Found ${teachers.length} teachers`);
    
    // Delete teacher user accounts
    for (const teacher of teachers) {
      const user = await User.findByIdAndDelete(teacher.user_id);
      if (user) {
        console.log(`  - Deleted user: ${user.email}`);
      }
    }
    
    // Delete all teacher records
    const deletedTeachers = await Teacher.deleteMany();
    console.log(`✅ Deleted ${deletedTeachers.deletedCount} teacher records\n`);

    // Find all students
    const students = await Student.find();
    console.log(`Found ${students.length} students`);
    
    // Delete student user accounts
    for (const student of students) {
      const user = await User.findByIdAndDelete(student.user_id);
      if (user) {
        console.log(`  - Deleted user: ${user.email}`);
      }
    }
    
    // Delete all student records
    const deletedStudents = await Student.deleteMany();
    console.log(`✅ Deleted ${deletedStudents.deletedCount} student records\n`);

    // Show remaining users (should only be admins)
    const remainingUsers = await User.find({}, 'name email role');
    console.log('Remaining users in database:');
    remainingUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
    });

    console.log('\n✅ Database cleared successfully!');
    console.log('You can now create teachers and students without conflicts.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
