const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Web3 } = require('web3');
const axios = require('axios');

// Mock NID verification API
const mockNIDVerification = async (nidNumber, fullName) => {
  // In a real system, this would call the actual NID verification API
  console.log(`Verifying NID: ${nidNumber} for ${fullName}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, we'll verify any NID that starts with "BD"
  return {
    verified: nidNumber.startsWith('BD'),
    message: nidNumber.startsWith('BD') 
      ? 'NID verification successful' 
      : 'Invalid NID number'
  };
};

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, nidNumber, tinNumber, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobile }, { nidNumber }, { tinNumber }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email, mobile, NID, or TIN' 
      });
    }
    
    // Verify NID (mock implementation)
    const nidVerification = await mockNIDVerification(nidNumber, fullName);
    if (!nidVerification.verified) {
      return res.status(400).json({ message: nidVerification.message });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      fullName,
      email,
      mobile,
      nidNumber,
      tinNumber,
      password: hashedPassword,
      // Explicitly set walletAddress to undefined to avoid MongoDB setting it to null
      walletAddress: undefined
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        nidNumber: user.nidNumber,
        tinNumber: user.tinNumber
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        nidNumber: user.nidNumber,
        tinNumber: user.tinNumber,
        hasBlockchainKeys: !!user.blockchainPublicKey
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Verify NID
exports.verifyNID = async (req, res) => {
  try {
    const { nidNumber, fullName } = req.body;
    
    // Call mock NID verification
    const verification = await mockNIDVerification(nidNumber, fullName);
    
    res.json(verification);
  } catch (error) {
    console.error('NID verification error:', error);
    res.status(500).json({ message: 'Server error during NID verification' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { fullName, email, mobile } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Link bank account (mock implementation)
exports.linkBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountType } = req.body;
    
    // In a real system, this would call the Open Banking API
    // For demo purposes, we'll just create a record
    
    const bankAccount = new BankAccount({
      user: req.user.id,
      bankName,
      accountNumber,
      accountType,
      isVerified: true // In a real system, this would be set after verification
    });
    
    await bankAccount.save();
    
    res.status(201).json({
      message: 'Bank account linked successfully',
      bankAccount
    });
  } catch (error) {
    console.error('Link bank account error:', error);
    res.status(500).json({ message: 'Server error while linking bank account' });
  }
};

// Get user's bank accounts
exports.getBankAccounts = async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({ user: req.user.id });
    
    res.json(bankAccounts);
  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({ message: 'Server error while fetching bank accounts' });
  }
};

// Delete user's bank account
exports.deleteBankAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    
    // Find the bank account
    const bankAccount = await BankAccount.findById(accountId);
    
    // Check if bank account exists
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    // Check if the bank account belongs to the user
    if (bankAccount.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this bank account' });
    }
    
    // Delete the bank account
    await BankAccount.findByIdAndDelete(accountId);
    
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ message: 'Server error while deleting bank account' });
  }
};

// Generate blockchain keys for user
exports.generateBlockchainKeys = async (req, res) => {
  try {
    // Create a new Web3 instance
    const web3 = new Web3();
    
    // Generate a new account
    const account = web3.eth.accounts.create();
    
    // Update user with blockchain keys
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        blockchainPublicKey: account.address,
        blockchainPrivateKey: account.privateKey // In a real system, this would be encrypted or stored securely
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Blockchain keys generated successfully',
      publicKey: account.address
    });
  } catch (error) {
    console.error('Generate blockchain keys error:', error);
    res.status(500).json({ message: 'Server error while generating blockchain keys' });
  }
};

// Link Phantom wallet to user account
exports.linkWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false,
        message: 'Wallet address is required' 
      });
    }
    
    // Update user with wallet address
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Phantom wallet linked successfully',
      walletAddress
    });
  } catch (error) {
    console.error('Link wallet error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while linking wallet' 
    });
  }
};
