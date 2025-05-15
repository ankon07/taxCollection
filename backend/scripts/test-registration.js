/**
 * Script to test user registration
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Creates a test user
 * 3. Verifies that there's no duplicate key error
 * 
 * Run with: node src/backend/scripts/test-registration.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables or use the default
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://ankonahamed:Meraxix@7@tax-collector.igqblay.mongodb.net/?retryWrites=true&w=majority&appName=tax-collector';
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected...');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const testRegistration = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Generate a random email to avoid unique constraint violations
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const randomMobile = `017${Math.floor(Math.random() * 10000000)}`;
    const randomNID = `BD${Math.floor(Math.random() * 10000000)}`;
    const randomTIN = `TIN${Math.floor(Math.random() * 10000000)}`;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create test user
    const user = new User({
      fullName: 'Test User',
      email: randomEmail,
      mobile: randomMobile,
      nidNumber: randomNID,
      tinNumber: randomTIN,
      password: hashedPassword,
      // walletAddress is intentionally not set to test the fix
    });
    
    // Save the user
    const savedUser = await user.save();
    console.log('Test user created successfully:', savedUser);
    
    // Create another test user to verify no duplicate key error
    const randomEmail2 = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const randomMobile2 = `017${Math.floor(Math.random() * 10000000)}`;
    const randomNID2 = `BD${Math.floor(Math.random() * 10000000)}`;
    const randomTIN2 = `TIN${Math.floor(Math.random() * 10000000)}`;
    
    const user2 = new User({
      fullName: 'Test User 2',
      email: randomEmail2,
      mobile: randomMobile2,
      nidNumber: randomNID2,
      tinNumber: randomTIN2,
      password: hashedPassword,
      // walletAddress is intentionally not set to test the fix
    });
    
    // Save the second user
    const savedUser2 = await user2.save();
    console.log('Second test user created successfully:', savedUser2);
    
    console.log('Registration test completed successfully - no duplicate key error!');
    
    // Clean up - delete the test users
    await User.deleteOne({ _id: savedUser._id });
    await User.deleteOne({ _id: savedUser2._id });
    console.log('Test users deleted');
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing registration:', err);
    process.exit(1);
  }
};

// Run the test function
testRegistration();
