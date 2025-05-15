/**
 * Script to fix the walletAddress index issue
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Drops the existing walletAddress index
 * 3. Creates a new index that enforces uniqueness only for non-null values
 * 
 * Run with: node src/backend/scripts/fix-wallet-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

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

const fixWalletIndex = async () => {
  try {
    // Connect to the database
    const db = await connectDB();
    
    // Get the users collection
    const usersCollection = db.collection('users');
    
    // Get all indexes on the users collection
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);
    
    // Check if walletAddress index exists
    const walletAddressIndex = indexes.find(index => 
      index.key && index.key.walletAddress === 1
    );
    
    if (walletAddressIndex) {
      console.log('Found walletAddress index:', walletAddressIndex);
      
      // Drop the existing index
      await usersCollection.dropIndex('walletAddress_1');
      console.log('Dropped walletAddress_1 index');
    } else {
      console.log('No walletAddress index found');
    }
    
    // Create a new index that enforces uniqueness only for non-null values
    await usersCollection.createIndex(
      { walletAddress: 1 },
      { 
        unique: true, 
        partialFilterExpression: { walletAddress: { $type: "string" } },
        name: 'walletAddress_1_partial'
      }
    );
    console.log('Created new partial index on walletAddress');
    
    // Verify the new index was created
    const updatedIndexes = await usersCollection.indexes();
    console.log('Updated indexes:', updatedIndexes);
    
    console.log('Index fix completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing index:', err);
    process.exit(1);
  }
};

// Run the fix function
fixWalletIndex();
