#!/usr/bin/env node
/**
 * One-time admin creation script
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from env (or argv)
 * Connects to MongoDB via MONGO_URI
 * Inserts admin if not exists with hashed password
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI is required');
  process.exit(1);
}

const email = ADMIN_EMAIL || process.argv[2];
const password = ADMIN_PASSWORD || process.argv[3];

if (!email || !password) {
  console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/createAdmin.js');
  console.error('Or: node scripts/createAdmin.js <email> <password>');
  process.exit(1);
}

(async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGO_URI);
    // Load existing models or define minimal schemas
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, unique: true, lowercase: true, trim: true },
      roll_no: { type: String, uppercase: true, trim: true, sparse: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin','teacher','student'], required: true, default: 'admin' },
      is_active: { type: Boolean, default: true }
    }, { timestamps: true }));

    const Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
      name: { type: String, default: 'Admin' },
      email: { type: String, unique: true, required: true, index: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin','superadmin'], default: 'admin' },
      isSuperAdmin: { type: Boolean, default: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true }));

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('Admin user already exists:', existingUser.email);
      await mongoose.disconnect();
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: 'System Administrator',
      email: email.toLowerCase(),
      password: hash,
      role: 'admin'
    });

    await Admin.create({
      userId: user._id,
      name: 'System Administrator',
      email: email.toLowerCase(),
      password: hash,
      role: 'superadmin',
      isSuperAdmin: true
    });

    console.log('Admin user created and linked:', email.toLowerCase());
    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  }
})();
