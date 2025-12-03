const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const connectDB = async () => {
  try {
    // Default MongoDB URI for development/testing
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/islamic_college_db';
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    
    if (!mongoURI || mongoURI === 'undefined') {
      throw new Error('MongoDB URI is not defined. Please set MONGO_URI or MONGODB_URI environment variable.');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📡 MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Make sure to set MONGO_URI environment variable');
    // Do not exit the process on connection failure.
    // Keep the API running so health checks and non-DB routes work.
    // In production, upstream health checks will still reflect DB issues via dependent routes.
    // Optionally, you could implement a retry here if desired.
  }
};

module.exports = connectDB;