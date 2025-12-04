const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('./config/database');
const app = express();
// Connect to database
connectDB();
// IMPORTANT: No auto-creation of users in production.
// Use scripts/createAdmin.js once to bootstrap the first admin.
// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, health checks)
    if (!origin) return callback(null, true);
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const allowed = [FRONTEND_URL].filter(Boolean);
    const vercel = /^https:\/\/.*\.vercel\.app$/;
    const render = /^https:\/\/.*\.onrender\.com$/;
    const isAllowed = allowed.includes(origin) || vercel.test(origin) || render.test(origin);
    console.log(`CORS ${isAllowed ? 'ALLOW' : 'BLOCK'}: ${origin}`);
    return isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use((req, res, next) => {
  console.log(`?? ${req.method} ${req.path} from ${req.get('Origin') || 'unknown'}`);
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.get('Origin'));
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', true);
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Static file serving for uploads (profile pictures, etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Health check endpoint for Render (no auth required)
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Server running...', 
    timestamp: new Date().toISOString(), 
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    render_test: 'SUCCESS',
    database: 'Connected'
  });
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin')); 
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));
app.use('/api/ai', require('./routes/ai'));
// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Islamic College Attendance & Exam Management System API',
    version: '1.0.0',
    status: 'Active',
    endpoints: {
      status: '/api/status',
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      teacher: '/api/teacher',
      student: '/api/student',
      ai: '/api/ai'
    }
  });
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ msg: 'API endpoint not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something went wrong!' });
});
const PORT = process.env.PORT || 5000;
// Simple server startup
app.listen(PORT, () => {
  console.log(`?? Islamic College API Server running on port ${PORT}`);
  console.log('?? Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('?? API endpoints available at: /api/status and /health');
});
module.exports = app;
module.exports = app;
