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

const seedData = async () => {
  try {
    console.log('🌱 Starting comprehensive seed data process...');

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
    console.log('🗑️ Cleared existing data');

    // Create default users
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Create Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@college.com',
      password: defaultPassword,
      role: 'admin'
    });
    console.log('👑 Admin user created: admin@college.com / password123');

    // 2. Create Teacher User
    const teacherUser = await User.create({
      name: 'Ustadh Ahmad',
      email: 'teacher@college.com',
      password: defaultPassword,
      role: 'teacher'
    });

    // 3. Create Student User
    const studentUser = await User.create({
      name: 'Muhammad Abdullah',
      email: 'student@college.com',
      roll_no: 'STU001',
      password: defaultPassword,
      role: 'student'
    });
    console.log('👨‍🎓 Student user created: STU001 / password123');

    // 4. Create additional sample users
    const teacher2User = await User.create({
      name: 'Ustadha Fatimah',
      email: 'fatimah.teacher@college.com',
      password: defaultPassword,
      role: 'teacher'
    });

    const student2User = await User.create({
      name: 'Aisha Rahman',
      email: 'aisha.student@college.com',
      roll_no: 'STU002',
      password: defaultPassword,
      role: 'student'
    });

    const student3User = await User.create({
      name: 'Omar Hassan',
      email: 'omar.student@college.com',
      roll_no: 'STU003',
      password: defaultPassword,
      role: 'student'
    });

    // 5. Create Classes
    const class9A = await Class.create({
      name: 'Class IX',
      section: 'A',
      year: 2025
    });

    const class10B = await Class.create({
      name: 'Class X',
      section: 'B', 
      year: 2025
    });
    console.log('🏫 Classes created');

    // 6. Create Teachers
    const teacher1 = await Teacher.create({
      user_id: teacherUser._id,
      department: 'Islamic Studies',
      subjects: [] // Will be populated after subjects are created
    });

    const teacher2 = await Teacher.create({
      user_id: teacher2User._id,
      department: 'Mathematics',
      subjects: []
    });
    console.log('👨‍🏫 Teachers created');

    // 7. Create Students
    const student1 = await Student.create({
      user_id: studentUser._id,
      class_id: class9A._id,
      guardian_name: 'Abdul Rahman',
      guardian_phone: '+91-9876543210'
    });

    const student2 = await Student.create({
      user_id: student2User._id,
      class_id: class9A._id,
      guardian_name: 'Yasmin Rahman',
      guardian_phone: '+91-9876543211'
    });

    const student3 = await Student.create({
      user_id: student3User._id,
      class_id: class10B._id,
      guardian_name: 'Ibrahim Hassan',
      guardian_phone: '+91-9876543212'
    });
    console.log('👨‍🎓 Students created');

    // 8. Create Sessions
    const sessions = await Session.insertMany([
      { name: 'Fajr Prayer', type: 'prayer', start_time: '05:30', end_time: '06:00' },
      { name: 'Morning Assembly', type: 'class', start_time: '08:00', end_time: '08:30' },
      { name: 'Period 1', type: 'class', start_time: '08:30', end_time: '09:15' },
      { name: 'Period 2', type: 'class', start_time: '09:15', end_time: '10:00' },
      { name: 'Break', type: 'break', start_time: '10:00', end_time: '10:15' },
      { name: 'Period 3', type: 'class', start_time: '10:15', end_time: '11:00' },
      { name: 'Period 4', type: 'class', start_time: '11:00', end_time: '11:45' },
      { name: 'Zuhr Prayer', type: 'prayer', start_time: '12:30', end_time: '13:00' },
      { name: 'Lunch', type: 'break', start_time: '13:00', end_time: '14:00' },
      { name: 'Period 5', type: 'class', start_time: '14:00', end_time: '14:45' },
      { name: 'Period 6', type: 'class', start_time: '14:45', end_time: '15:30' },
      { name: 'Asr Prayer', type: 'prayer', start_time: '15:30', end_time: '16:00' },
      { name: 'Maghrib Prayer', type: 'prayer', start_time: '18:30', end_time: '19:00' }
    ]);
    console.log('🕐 Sessions created');

    // 9. Create Subjects
    const islamicSubjects = await Subject.insertMany([
      { name: 'Quran Recitation', type: 'Islamic', class_id: class9A._id, teacher_id: teacher1._id },
      { name: 'Hadith Studies', type: 'Islamic', class_id: class9A._id, teacher_id: teacher1._id },
      { name: 'Fiqh (Islamic Jurisprudence)', type: 'Islamic', class_id: class9A._id, teacher_id: teacher1._id },
      { name: 'Islamic History', type: 'Islamic', class_id: class9A._id, teacher_id: teacher1._id },
      { name: 'Arabic Language', type: 'Islamic', class_id: class9A._id, teacher_id: teacher1._id }
    ]);

    const schoolSubjects = await Subject.insertMany([
      { name: 'Mathematics', type: 'School', class_id: class9A._id, teacher_id: teacher2._id },
      { name: 'Science', type: 'School', class_id: class9A._id, teacher_id: teacher2._id },
      { name: 'English', type: 'School', class_id: class9A._id, teacher_id: teacher2._id },
      { name: 'History', type: 'School', class_id: class9A._id, teacher_id: teacher2._id },
      { name: 'Geography', type: 'School', class_id: class9A._id, teacher_id: teacher2._id }
    ]);

    // Update teachers with their subjects
    await Teacher.findByIdAndUpdate(teacher1._id, {
      $push: { subjects: { $each: islamicSubjects.map(s => s._id) } }
    });
    
    await Teacher.findByIdAndUpdate(teacher2._id, {
      $push: { subjects: { $each: schoolSubjects.map(s => s._id) } }
    });

    console.log('📚 Subjects created and assigned');

    // 10. Create Sample Attendance Records (last 30 days)
    const attendanceRecords = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Skip weekends (Friday and Saturday in Islamic calendar)
      if (date.getDay() === 5 || date.getDay() === 6) continue;

      // Create attendance for different sessions
      const sessionsToAttend = sessions.filter(s => s.type === 'prayer' || s.name.includes('Period'));
      
      for (const student of [student1, student2, student3]) {
        for (const session of sessionsToAttend.slice(0, 3)) { // First 3 sessions per day
          const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          attendanceRecords.push({
            student_id: student._id,
            session_id: session._id,
            teacher_id: teacher1._id,
            date: date,
            status: status,
            createdAt: date
          });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`📋 ${attendanceRecords.length} attendance records created`);

    // 11. Create Sample Fines
    const fineReasons = ['Late', 'Absent', 'Misbehavior'];
    const fines = [];
    
    for (let i = 0; i < 10; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
      
      fines.push({
        student_id: [student1._id, student2._id, student3._id][Math.floor(Math.random() * 3)],
        teacher_id: teacher1._id,
        amount: [10, 20, 50, 100][Math.floor(Math.random() * 4)],
        reason: fineReasons[Math.floor(Math.random() * fineReasons.length)],
        is_paid: Math.random() > 0.3, // 70% paid, 30% unpaid
        date: randomDate
      });
    }

    await Fine.insertMany(fines);
    console.log(`💰 ${fines.length} fine records created`);

    // 12. Create Sample Exams
    const exam1 = await Exam.create({
      name: 'Mid-Term Assessment 2025',
      date: new Date('2025-01-15'),
      class_id: class9A._id,
      created_by: adminUser._id
    });

    const exam2 = await Exam.create({
      name: 'Final Assessment 2025',
      date: new Date('2025-03-15'),
      class_id: class9A._id,
      created_by: adminUser._id
    });

    console.log('📝 Exams created');

    // 13. Create Sample Exam Results
    const examResults = [];
    const allSubjects = [...islamicSubjects, ...schoolSubjects];
    
    for (const student of [student1, student2, student3]) {
      for (const subject of allSubjects) {
        // Results for exam1
        const marks1 = Math.floor(Math.random() * 40) + 60; // 60-100 marks
        examResults.push({
          exam_id: exam1._id,
          student_id: student._id,
          subject_id: subject._id,
          marks_obtained: marks1,
          max_marks: 100,
          grade: marks1 >= 90 ? 'A' : marks1 >= 75 ? 'B' : marks1 >= 60 ? 'C' : marks1 >= 45 ? 'D' : 'F'
        });

        // Results for exam2
        const marks2 = Math.floor(Math.random() * 35) + 65; // 65-100 marks
        examResults.push({
          exam_id: exam2._id,
          student_id: student._id,
          subject_id: subject._id,
          marks_obtained: marks2,
          max_marks: 100,
          grade: marks2 >= 90 ? 'A' : marks2 >= 75 ? 'B' : marks2 >= 60 ? 'C' : marks2 >= 45 ? 'D' : 'F'
        });
      }
    }

    await ExamResult.insertMany(examResults);
    console.log(`📊 ${examResults.length} exam results created`);

    // 14. Create Activity Logs
    const logs = await Log.insertMany([
      { user_id: adminUser._id, action: 'System initialized with seed data' },
      { user_id: adminUser._id, action: 'Created default admin account' },
      { user_id: teacherUser._id, action: 'Teacher account activated' },
      { user_id: studentUser._id, action: 'Student enrolled in Islamic College' },
      { user_id: adminUser._id, action: 'Created classes and subjects structure' },
      { user_id: adminUser._id, action: 'Populated initial attendance and exam data' }
    ]);

    console.log(`📝 ${logs.length} activity logs created`);

    console.log('\n🎉 SEED DATA COMPLETED SUCCESSFULLY!');
    console.log('\n📋 DEFAULT ACCOUNTS CREATED:');
    console.log('👑 Admin: admin@college.com / password123');
    console.log('👨‍🏫 Teacher: teacher@college.com / password123');
    console.log('👨‍🎓 Student: STU001 / password123');
    console.log('\n🔧 SYSTEM READY FOR TESTING!');
    console.log('\n📊 DATA SUMMARY:');
    console.log(`- Users: ${await User.countDocuments()}`);
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

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
  process.exit(0);
};

runSeed();