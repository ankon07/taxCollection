const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  nidNumber: {
    type: String,
    required: true,
    unique: true
  },
  tinNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  blockchainPublicKey: {
    type: String,
    default: null
  },
  blockchainPrivateKey: {
    type: String,
    default: null
  },
  walletAddress: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a custom index that enforces uniqueness only for non-null wallet addresses
UserSchema.index({ 
  walletAddress: 1 
}, { 
  unique: true, 
  partialFilterExpression: { walletAddress: { $type: "string" } } 
});

module.exports = mongoose.model('User', UserSchema);
