const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const TaxPayment = require('../models/TaxPayment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock user data
const testUser = {
  fullName: 'Tax Test User',
  email: 'taxtest@example.com',
  mobile: '01712345679',
  nidNumber: 'BD123456780',
  tinNumber: 'TIN123456780',
  password: 'password123'
};

let authToken;
let userId;
let bankAccountId;
let taxPaymentId;

// Connect to test database before running tests
beforeAll(async () => {
  // Clear collections
  await User.deleteMany({});
  await BankAccount.deleteMany({});
  await TaxPayment.deleteMany({});

  // Create test user
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testUser.password, salt);
  
  const user = new User({
    ...testUser,
    password: hashedPassword
  });
  
  await user.save();
  userId = user._id;
  
  // Generate auth token
  authToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1d' }
  );
  
  // Create a bank account for the user
  const bankAccount = new BankAccount({
    user: userId,
    bankName: 'Test Bank',
    accountNumber: '9876543210',
    accountType: 'Savings',
    isVerified: true
  });
  
  await bankAccount.save();
  bankAccountId = bankAccount._id;
});

// Clean up after tests
afterAll(async () => {
  await User.deleteMany({});
  await BankAccount.deleteMany({});
  await TaxPayment.deleteMany({});
  await mongoose.connection.close();
});

describe('Tax API', () => {
  describe('POST /api/tax/calculate', () => {
    it('should calculate tax based on income range', async () => {
      const res = await request(app)
        .post('/api/tax/calculate')
        .set('x-auth-token', authToken)
        .send({
          proofId: 'mock-proof-id',
          incomeRange: 'income > 700000',
          incomeThreshold: 700000
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('taxBracket');
      expect(res.body).toHaveProperty('estimatedTax');
      expect(res.body).toHaveProperty('taxRate');
    });

    it('should reject invalid income range', async () => {
      const res = await request(app)
        .post('/api/tax/calculate')
        .set('x-auth-token', authToken)
        .send({
          proofId: 'mock-proof-id',
          incomeRange: 'invalid range'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/tax/calculate')
        .send({
          proofId: 'mock-proof-id',
          incomeRange: 'income > 700000'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });
  });

  describe('POST /api/tax/pay', () => {
    it('should process tax payment', async () => {
      const res = await request(app)
        .post('/api/tax/pay')
        .set('x-auth-token', authToken)
        .send({
          proofId: 'mock-proof-id',
          bankAccountId: bankAccountId,
          amount: 50000
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('paymentId');
      expect(res.body).toHaveProperty('transactionHash');
      expect(res.body).toHaveProperty('amount');
      
      // Save payment ID for receipt test
      taxPaymentId = res.body.paymentId;
    });

    it('should reject payment with invalid bank account', async () => {
      const res = await request(app)
        .post('/api/tax/pay')
        .set('x-auth-token', authToken)
        .send({
          proofId: 'mock-proof-id',
          bankAccountId: new mongoose.Types.ObjectId(), // Random ID
          amount: 50000
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Bank account not found');
    });
  });

  describe('GET /api/tax/history', () => {
    it('should get tax payment history', async () => {
      const res = await request(app)
        .get('/api/tax/history')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('amount');
      expect(res.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /api/tax/receipt/:id', () => {
    it('should get tax receipt by ID', async () => {
      const res = await request(app)
        .get(`/api/tax/receipt/${taxPaymentId}`)
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('receipt');
      expect(res.body.receipt).toHaveProperty('paymentId');
      expect(res.body.receipt).toHaveProperty('amount');
      expect(res.body.receipt).toHaveProperty('transactionHash');
    });

    it('should not get receipt with invalid ID', async () => {
      const res = await request(app)
        .get(`/api/tax/receipt/${new mongoose.Types.ObjectId()}`)
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/tax/brackets', () => {
    it('should get tax brackets', async () => {
      const res = await request(app)
        .get('/api/tax/brackets')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('brackets');
      expect(Array.isArray(res.body.brackets)).toBeTruthy();
      expect(res.body.brackets.length).toBeGreaterThan(0);
      expect(res.body.brackets[0]).toHaveProperty('min');
      expect(res.body.brackets[0]).toHaveProperty('max');
      expect(res.body.brackets[0]).toHaveProperty('rate');
    });
  });
});
