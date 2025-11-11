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
    
    // Don't exit in production, allow server to start
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;