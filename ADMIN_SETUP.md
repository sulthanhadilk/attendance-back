# 🔑 Admin Account Setup Guide

## ✅ **Your Admin Credentials**

```
📧 Email: Sulusulthan230@gmail.com
🔐 Password: Sulu@123
👑 Role: Admin
```

## 🚀 **Setup Instructions**

### **Option 1: Automatic Setup (Recommended)**
```bash
# Navigate to backend directory
cd backend

# Create your admin account
npm run seed-admin
```

### **Option 2: Manual Database Entry**
If you have direct MongoDB access, create this document in the `users` collection:

```javascript
{
  "name": "Sulthan Hadil K",
  "email": "Sulusulthan230@gmail.com", 
  "password": "$2a$12$[hashed_password_for_Sulu@123]",
  "role": "admin",
  "isActive": true,
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

## 🎯 **How to Login**

1. **Visit**: https://attendence-front.vercel.app
2. **Select**: "Email Login" (not Roll Number)
3. **Enter**: 
   - Email: `Sulusulthan230@gmail.com`
   - Password: `Sulu@123`
4. **Click**: "Sign In"

## 👥 **After Login - Create More Users**

### **Create Students:**
```
Name: Ahmed Khan
Roll Number: BCA24A001 
Password: student123
Role: Student
```

### **Create Teachers:**
```
Name: Dr. Hassan Ali
Email: hassan@islamiccollege.edu
Password: teacher123  
Role: Teacher
```

### **Create More Admins:**
```
Name: Principal Ahmad
Email: principal@islamiccollege.edu
Password: admin123
Role: Admin
```

## 🛠 **System Features You Can Access**

### **As Admin, you can:**
✅ Create and manage all users
✅ View institution-wide reports  
✅ Access AI-powered analytics
✅ Monitor attendance patterns
✅ Generate automated reports
✅ Manage classes and subjects
✅ Control system settings

## 🤖 **AI Features Available**
- **AI Chatbot**: Intelligent assistant for queries
- **AI Predictions**: Student behavior analysis
- **AI Reports**: Automated report generation  
- **AI Insights**: Institution-wide analytics
- **Smart Analytics**: Predictive attendance patterns

## 🚨 **Important Notes**

1. **Database Connection**: Make sure MongoDB Atlas is connected in Render
2. **Environment Variables**: Ensure `MONGODB_URI` is set in production
3. **Security**: Change default passwords after first login
4. **Backup**: Regularly backup your database

## 📞 **Support**

If you encounter any issues:
1. Check database connection
2. Verify environment variables  
3. Check Render deployment logs
4. Test locally if needed

Your Islamic College EduTrack System is ready to use! 🎉