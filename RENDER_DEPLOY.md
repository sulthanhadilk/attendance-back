# Islamic College Attendance System - Backend
# Render.com Deployment Configuration

## Quick Deploy to Render

1. **Push to GitHub/GitLab**:
   ```bash
   git add .
   git commit -m "Deploy Islamic College system"
   git push
   ```

2. **Create New Web Service on Render**:
   - Go to https://render.com/
   - Connect your repository
   - Select "Web Service"
   - Choose your repository

3. **Render Configuration**:
   ```
   Name: islamic-college-backend
   Environment: Node
   Build Command: npm install
   Start Command: node src/server.js
   ```

4. **Environment Variables** (Add in Render Dashboard):
   ```
   MONGO_URI=mongodb+srv://sulusulthan_x:Sulu%40123@cluster0.ftnqd5y.mongodb.net/attendance?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=islamic_college_jwt_production_secret_key_2025_ultra_secure
   NODE_ENV=production
   PORT=5000
   ```

5. **Deploy**: Click "Create Web Service"

## Your Backend URL will be:
`https://islamic-college-backend.onrender.com`

## Health Check Endpoint:
`https://islamic-college-backend.onrender.com/api/status`

---

## Default Accounts for Testing:
- **Admin**: admin@college.com / password123
- **Teacher**: teacher@college.com / password123  
- **Student**: STU001 / password123