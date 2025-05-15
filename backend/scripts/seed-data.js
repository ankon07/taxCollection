/**
 * Seed script to populate the database with sample data for testing
 * 
 * This script creates:
 * 1. A test user
 * 2. Bank accounts for the user
 * 3. ZKP proofs for the user
 * 4. Tax payment records for the user
 * 
 * Run with: node src/backend/scripts/seed-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ObjectId } = mongoose.Types;

// Import models
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const ZkpProof = require('../models/ZkpProof');
const TaxPayment = require('../models/TaxPayment');

// MongoDB connection
const connectDB = async () => {
  try {
    // Hardcoded MongoDB URI from .env file
    const mongoURI = 'mongodb+srv://ankonahamed:sz64yqOhykCruF5i@maindb.ar5mlut.mongodb.net/?retryWrites=true&w=majority&appName=MainDB';
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected to Atlas...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Create a test user
const createUser = async () => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists');
      return existingUser;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create new user
    const user = new User({
      fullName: 'Test User',
      email: 'test@example.com',
      mobile: '01712345678',
      nidNumber: 'BD1234567890',
      tinNumber: 'TIN1234567890',
      password: hashedPassword,
      blockchainPublicKey: '0x09D49Fd8214287A20D1A3c1142EadA7Ad1490357', // Real blockchain public key
      blockchainPrivateKey: '0xa76c4fa04faee85e1a718f3b21fbb59f79d034837723b320709531d9e072d0c6', // Real blockchain private key
      walletAddress: '0x09D49Fd8214287A20D1A3c1142EadA7Ad1490357' // Real wallet address - this is fine since it's a non-null value
    });
    
    await user.save();
    console.log('Test user created');
    return user;
  } catch (err) {
    console.error('Error creating test user:', err);
    throw err;
  }
};

// Create bank accounts for the user
const createBankAccounts = async (userId) => {
  try {
    // Check if bank accounts already exist for this user
    const existingAccounts = await BankAccount.find({ user: userId });
    
    if (existingAccounts.length > 0) {
      console.log(`${existingAccounts.length} bank accounts already exist for this user`);
      return existingAccounts;
    }
    
    // Create bank accounts
    const bankAccounts = [
      {
        user: userId,
        bankName: 'Bangladesh Bank',
        accountNumber: '1234567890',
        accountType: 'Savings',
        isVerified: true
      },
      {
        user: userId,
        bankName: 'Sonali Bank',
        accountNumber: '0987654321',
        accountType: 'Current',
        isVerified: true
      }
    ];
    
    const createdAccounts = await BankAccount.insertMany(bankAccounts);
    console.log(`${createdAccounts.length} bank accounts created`);
    return createdAccounts;
  } catch (err) {
    console.error('Error creating bank accounts:', err);
    throw err;
  }
};

// Create ZKP proofs for the user
const createZkpProofs = async (userId) => {
  try {
    // Check if ZKP proofs already exist for this user
    const existingProofs = await ZkpProof.find({ user: userId });
    
    if (existingProofs.length > 0) {
      console.log(`${existingProofs.length} ZKP proofs already exist for this user`);
      return existingProofs;
    }
    
    // Create ZKP proofs
    const zkpProofs = [
      {
        user: userId,
        commitment: '0x' + '3'.repeat(64),
        proof: { /* Mock proof data */ 
          pi_a: [
            "0x" + "1".repeat(64),
            "0x" + "2".repeat(64),
            "1"
          ],
          pi_b: [
            [
              "0x" + "3".repeat(64),
              "0x" + "4".repeat(64)
            ],
            [
              "0x" + "5".repeat(64),
              "0x" + "6".repeat(64)
            ],
            ["1", "0"]
          ],
          pi_c: [
            "0x" + "7".repeat(64),
            "0x" + "8".repeat(64),
            "1"
          ],
          protocol: "groth16"
        },
        publicSignals: [
          "0x" + "3".repeat(64),
          "700000",
          "1"
        ],
        incomeRange: 'income > 700000',
        status: 'proof_verified',
        verifiedAt: new Date(),
        metadata: {
          incomeRanges: [
            'income > 300000',
            'income > 400000',
            'income > 700000',
            'income > 1100000',
            'income > 1600000'
          ]
        }
      },
      {
        user: userId,
        commitment: '0x' + '4'.repeat(64),
        proof: { /* Mock proof data */ 
          pi_a: [
            "0x" + "a".repeat(64),
            "0x" + "b".repeat(64),
            "1"
          ],
          pi_b: [
            [
              "0x" + "c".repeat(64),
              "0x" + "d".repeat(64)
            ],
            [
              "0x" + "e".repeat(64),
              "0x" + "f".repeat(64)
            ],
            ["1", "0"]
          ],
          pi_c: [
            "0x" + "1".repeat(64),
            "0x" + "2".repeat(64),
            "1"
          ],
          protocol: "groth16"
        },
        publicSignals: [
          "0x" + "4".repeat(64),
          "1100000",
          "1"
        ],
        incomeRange: 'income > 1100000',
        status: 'proof_verified',
        verifiedAt: new Date(),
        metadata: {
          incomeRanges: [
            'income > 300000',
            'income > 400000',
            'income > 700000',
            'income > 1100000',
            'income > 1600000'
          ]
        }
      }
    ];
    
    const createdProofs = await ZkpProof.insertMany(zkpProofs);
    console.log(`${createdProofs.length} ZKP proofs created`);
    return createdProofs;
  } catch (err) {
    console.error('Error creating ZKP proofs:', err);
    throw err;
  }
};

// Create tax payment records for the user
const createTaxPayments = async (userId, bankAccounts, zkpProofs) => {
  try {
    // Check if tax payments already exist for this user
    const existingPayments = await TaxPayment.find({ user: userId });
    
    if (existingPayments.length > 0) {
      console.log(`${existingPayments.length} tax payments already exist for this user`);
      return existingPayments;
    }
    
    // Create tax payments with different statuses and payment methods
    const taxPayments = [
      {
        user: userId,
        amount: 70000, // 10% of 700,000
        bankAccount: bankAccounts[0]._id,
        proofId: zkpProofs[0]._id,
        transactionHash: '0x' + '1'.repeat(64),
        walletAddress: '0x09D49Fd8214287A20D1A3c1142EadA7Ad1490357',
        status: 'completed',
        paymentMethod: 'bank_transfer',
        fiscalYear: '2024-2025',
        metadata: {
          taxRate: 0.10,
          incomeRange: 'income > 700000',
          paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        user: userId,
        amount: 165000, // 15% of 1,100,000
        bankAccount: bankAccounts[1]._id,
        proofId: zkpProofs[1]._id,
        transactionHash: '0x' + '2'.repeat(64),
        walletAddress: '0x09D49Fd8214287A20D1A3c1142EadA7Ad1490357',
        status: 'completed',
        paymentMethod: 'blockchain',
        fiscalYear: '2024-2025',
        metadata: {
          taxRate: 0.15,
          incomeRange: 'income > 1100000',
          paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        user: userId,
        amount: 50000, // Partial payment
        bankAccount: bankAccounts[0]._id,
        proofId: zkpProofs[0]._id,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        fiscalYear: '2024-2025',
        metadata: {
          taxRate: 0.10,
          incomeRange: 'income > 700000',
          paymentDate: new Date()
        },
        createdAt: new Date()
      }
    ];
    
    const createdPayments = await TaxPayment.insertMany(taxPayments);
    console.log(`${createdPayments.length} tax payments created`);
    return createdPayments;
  } catch (err) {
    console.error('Error creating tax payments:', err);
    throw err;
  }
};

// Main function to seed the database
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Create test user
    const user = await createUser();
    
    // Create bank accounts for the user
    const bankAccounts = await createBankAccounts(user._id);
    
    // Create ZKP proofs for the user
    const zkpProofs = await createZkpProofs(user._id);
    
    // Create tax payments for the user
    await createTaxPayments(user._id, bankAccounts, zkpProofs);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
