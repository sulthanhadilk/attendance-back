# Islamic College Attendance & Exam Management System API

A comprehensive backend API for managing Islamic college operations including attendance tracking, exam management, student information, and administrative functions.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- Secure password hashing

### Admin Features
- Student management (CRUD operations)
- Teacher management (CRUD operations)
- Class and subject management
- Academic session management
- Comprehensive reporting
- Fine management

### Teacher Features
- Attendance marking and tracking
- Class management
- Exam creation and result entry
- Student performance tracking
- Attendance reports

### Student Features
- View attendance records
- Check exam results and grades
- View fine details
- Class schedule access
- Personal profile management

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Environment**: dotenv
- **CORS**: Cross-origin resource sharing enabled

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account OR local MongoDB installation
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` file with your configurations:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Seed the database with initial data
   node src/seeders/seed.js
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/status` - Server status

### Admin Routes (`/api/admin`)
- `GET /dashboard` - Dashboard statistics
- `GET /students` - List all students
- `POST /students` - Create new student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `GET /teachers` - List all teachers
- `POST /teachers` - Create new teacher
- `GET /classes` - List all classes
- `POST /classes` - Create new class
- `GET /subjects` - List all subjects
- `POST /subjects` - Create new subject
- `GET /sessions` - List academic sessions
- `POST /sessions` - Create new session
- `GET /reports/attendance` - Attendance reports
- `GET /reports/fines` - Fine reports

### Teacher Routes (`/api/teacher`)
- `GET /dashboard` - Teacher dashboard
- `GET /classes` - Get assigned classes
- `GET /classes/:classId/students` - Get class students
- `POST /attendance` - Mark attendance
- `GET /attendance/:classId/:subjectId` - Attendance history
- `GET /exams` - Get created exams
- `POST /exams` - Create new exam
- `POST /exams/results` - Add exam results

### Student Routes (`/api/student`)
- `GET /dashboard` - Student dashboard
- `GET /profile` - Student profile
- `GET /attendance` - Attendance records
- `GET /fines` - Fine records
- `GET /results` - Exam results
- `GET /exams/upcoming` - Upcoming exams
- `GET /schedule` - Class schedule

## 🗄️ Database Schema

### Collections:
1. **users** - User accounts (admin, teacher, student)
2. **students** - Student profiles and details
3. **teachers** - Teacher profiles and qualifications
4. **classes** - Class information and assignments
5. **subjects** - Subject definitions (Islamic & Academic)
6. **sessions** - Academic sessions/semesters
7. **attendance** - Daily attendance records
8. **fines** - Fine records and payments
9. **exams** - Exam definitions and schedules
10. **exam_results** - Exam results with auto-grading
11. **logs** - System activity logs

## 🔐 Default Login Credentials

After running the seeder, use these credentials:

### Admin
- **Email**: admin@islamiccollege.edu
- **Password**: admin123

### Teacher
- **Email**: hassan@islamiccollege.edu
- **Password**: teacher123

### Student
- **Email**: usman@student.islamiccollege.edu
- **Password**: student123

## 🚀 Deployment

### Railway/Render/Heroku
1. Connect your repository
2. Set environment variables
3. Deploy automatically

### Manual Deployment
1. Build the application
2. Set production environment variables
3. Start with `npm start`

### Environment Variables for Production
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/islamic_college_db
JWT_SECRET=super_secure_jwt_secret_key
NODE_ENV=production
PORT=5000
```

## 📊 Features in Detail

### Islamic College Specific Features
- **Islamic Subjects**: Quran, Hadith, Fiqh, Arabic Language
- **Academic Subjects**: Computer Science, Mathematics, Sciences
- **Dual Focus**: Religious and academic education tracking
- **Fine System**: Automated fine generation for absences
- **Grading System**: Islamic grading with percentage calculation

### Advanced Features
- **Auto-grading**: Automatic grade assignment based on percentage
- **Attendance Tracking**: Date and time-based attendance
- **Report Generation**: Comprehensive reporting system
- **Role-based Dashboard**: Different interfaces for different roles
- **Activity Logging**: System activity tracking

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── seeders/        # Database seeders
│   └── server.js       # Main server file
├── .env                # Environment variables
├── .env.example        # Environment template
└── package.json        # Dependencies
```

### Adding New Features
1. Create model in `models/`
2. Add controller in `controllers/`
3. Define routes in `routes/`
4. Update middleware if needed
5. Test with API client

## 🛡️ Security Features
- JWT authentication with expiration
- Password hashing with bcrypt
- Role-based authorization
- Input validation
- CORS configuration
- Error handling middleware

## 📝 API Documentation
The API follows RESTful conventions with consistent response formats:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🤝 Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License
This project is licensed under the MIT License.

## 🆘 Support
For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for Islamic Education Management**