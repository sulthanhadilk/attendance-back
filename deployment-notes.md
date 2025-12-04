# Deployment Notes for Islamic College Attendance System

## MongoDB Atlas Connection

**Final MONGO_URI** (with URL-encoded password):
```
mongodb+srv://sulthanhadilk:Sulu%40123@cluster0.7pxwkgg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**Important:** The password `Sulu@123` contains `@`, so it must be URL-encoded as `Sulu%40123` in the connection string.

---

## Environment Variables for Render (Backend)

When deploying to Render, set these environment variables in the Render dashboard:

```
MONGO_URI=mongodb+srv://sulthanhadilk:Sulu%40123@cluster0.7pxwkgg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=8f9a3b2e7d6c1a5b4e8f9a3b2e7d6c1a5b4e8f9a3b2e7d6c1a5b4e8f9a3b2e7
FRONTEND_URL=https://your-frontend.vercel.app
TEACHER_AI_ENABLED=true
ADMIN_AI_ENABLED=true
```

**Note:** Update `FRONTEND_URL` with your actual Vercel deployment URL after frontend is deployed.

---

## Environment Variables for Vercel (Frontend)

When deploying to Vercel, set this environment variable:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

**Note:** Replace `your-backend.onrender.com` with your actual Render backend URL.

---

## Backend Start Command

For Render, use this start command:
```
node src/server.js
```

Build command (if needed):
```
npm install
```

---

## Deployment Checklist

### Backend Deployment (Render)

1. ✅ Push backend code to GitHub
2. ✅ Create a new Web Service on Render
3. ✅ Connect your GitHub repository
4. ✅ Set root directory to: `attendance-back/attendance-back-master`
5. ✅ Set build command: `npm install`
6. ✅ Set start command: `node src/server.js`
7. ✅ Add all environment variables listed above
8. ✅ Deploy and wait for the service to start
9. ✅ Copy the Render backend URL (e.g., `https://your-backend.onrender.com`)
10. ✅ Test the health endpoint: `https://your-backend.onrender.com/api/status`

### Frontend Deployment (Vercel)

1. ✅ Push frontend code to GitHub
2. ✅ Create a new project on Vercel
3. ✅ Import your GitHub repository
4. ✅ Set root directory to: `attendence-front/attendence-front-main`
5. ✅ Framework preset: Vite
6. ✅ Build command: `npm run build`
7. ✅ Output directory: `dist`
8. ✅ Add environment variable: `VITE_API_BASE_URL` = your Render backend URL
9. ✅ Deploy
10. ✅ Copy the Vercel frontend URL (e.g., `https://your-project.vercel.app`)

### Final Configuration

1. ✅ Go back to Render
2. ✅ Update the `FRONTEND_URL` environment variable with your Vercel URL
3. ✅ Restart the Render service
4. ✅ Test login at your Vercel URL with admin credentials

---

## Admin Credentials

**Initial Admin Created:**
- Email: `Sulusulthan230@gmail.com`
- Password: `Sulu@123`

**Important:** This admin was created using the one-time script `scripts/createAdmin.js`. Do not run this script again with the same email.

---

## Testing Checklist

After deployment:

1. ✅ Test backend health: `GET https://your-backend.onrender.com/api/status`
2. ✅ Test backend auth: `GET https://your-backend.onrender.com/health`
3. ✅ Open frontend in browser
4. ✅ Try logging in with admin credentials
5. ✅ Verify redirect to admin dashboard

---

## Local Development

### Backend (PowerShell)
```powershell
cd C:\Users\HP\Desktop\project-sulu\attendance-back\attendance-back-master
npm install
npm run dev
```

### Frontend (PowerShell)
```powershell
cd C:\Users\HP\Desktop\project-sulu\attendence-front\attendence-front-main
npm install
npm run dev
```

**Note:** For local development, create a `.env` file in both directories with appropriate values pointing to localhost or your deployed services.

---

## Troubleshooting

### Backend won't connect to MongoDB
- Verify MongoDB Atlas Network Access allows connections from anywhere (0.0.0.0/0)
- Check that the password is URL-encoded correctly (`@` → `%40`)
- Confirm the database user has read/write permissions

### Frontend can't reach backend
- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check that `FRONTEND_URL` is set correctly in Render
- Ensure CORS is configured properly (check browser console for CORS errors)

### Login fails
- Verify admin was created successfully in MongoDB Atlas
- Check browser network tab for the exact error response
- Confirm JWT_SECRET is set on Render

---

## Important Security Notes

- ✅ Never commit the `.env` file to git (it's in `.gitignore`)
- ✅ Only set environment variables in deployment platform dashboards
- ✅ JWT_SECRET should be at least 32 characters long
- ✅ Passwords are hashed with bcrypt before storage
- ✅ No auto-seeding or sample data in production

---

## Next Steps After Deployment

Once logged in as admin, you can:
1. Create departments
2. Create courses
3. Create classes
4. Create teachers
5. Create students
6. Assign teachers to classes
7. Set up timetables
8. Begin marking attendance

All through the admin dashboard UI.
