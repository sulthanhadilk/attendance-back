const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('./config/database');

const app = express();

// Connect to database
connectDB();

// Create default admin user after DB connection
setTimeout(async () => {
  try {
    const bcrypt = require('bcryptjs');
    const { User } = require('./models');
    
    const existingAdmin = await User.findOne({ email: 'sulusulthan230@gmail.com' });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('Sulu@123', 10);
      await User.create({
        name: 'System Administrator',
        email: 'sulusulthan230@gmail.com',
        password: adminPassword,
        role: 'admin'
      });
      console.log('🎉 Default admin user created: sulusulthan230@gmail.com');
    } else {
      console.log('👤 Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error with admin user:', error.message);
  }
}, 3000);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://attendence-front.vercel.app',
      'https://attendance-back-byl9.onrender.com',
      /^https:\/\/.*\.vercel\.app$/,  // Allow all Vercel subdomains
      /^https:\/\/.*\.onrender\.com$/  // Allow all Render subdomains
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    console.log(`🌐 CORS Request from: ${origin} - ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add preflight handling
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} from ${req.get('Origin') || 'unknown'}`);
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

// Replace hardcoded login with proper auth routes
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
  console.log(`🚀 Islamic College API Server running on port ${PORT}`);
  console.log('📝 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('🔗 API endpoints available at: /api/status and /health');
});

module.exports = app;

module.exports = app;
