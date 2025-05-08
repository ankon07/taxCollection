const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const ZkpProof = require('../models/ZkpProof');
const TaxPayment = require('../models/TaxPayment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock user data
const testUser = {
  fullName: 'Blockchain Test User',
  email: 'blockchaintest@example.com',
  mobile: '01712345671',
  nidNumber: 'BD123456782',
  tinNumber: 'TIN123456782',
  password: 'password123'
};

let authToken;
let userId;
let proofId;

// Connect to test database before running tests
beforeAll(async () => {
  // Clear collections
  await User.deleteMany({});
  await ZkpProof.deleteMany({});
  await TaxPayment.deleteMany({});

  // Create test user
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testUser.password, salt);
  
  const user = new User({
    ...testUser,
    password: hashedPassword,
    blockchainPublicKey: '0x1234567890123456789012345678901234567890'
  });
  
  await user.save();
  userId = user._id;
  
  // Generate auth token
  authToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1d' }
  );
  
  // Create a ZKP proof record
  const zkpProof = new ZkpProof({
    user: userId,
    commitment: 'test-commitment-hash',
    status: 'proof_generated',
    proof: { /* mock proof data */ },
    publicSignals: ['signal1', 'signal2'],
    incomeRange: 'income > 700000'
  });
  
  await zkpProof.save();
  proofId = zkpProof._id;
});

// Clean up after tests
afterAll(async () => {
  await User.deleteMany({});
  await ZkpProof.deleteMany({});
  await TaxPayment.deleteMany({});
  await mongoose.connection.close();
});

describe('Blockchain API', () => {
  describe('GET /api/blockchain/status', () => {
    it('should get blockchain status', async () => {
      const res = await request(app)
        .get('/api/blockchain/status');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toHaveProperty('networkId');
      expect(res.body.status).toHaveProperty('isConnected');
    });
  });

  describe('GET /api/blockchain/transaction/:txHash', () => {
    it('should get transaction details', async () => {
      const res = await request(app)
        .get('/api/blockchain/transaction/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('transaction');
      expect(res.body.transaction).toHaveProperty('hash');
      expect(res.body.transaction).toHaveProperty('status');
    });

    it('should require transaction hash', async () => {
      const res = await request(app)
        .get('/api/blockchain/transaction/');
      
      expect(res.statusCode).toEqual(404); // Route not found
    });
  });

  describe('POST /api/blockchain/store-commitment', () => {
    it('should store commitment on blockchain', async () => {
      const res = await request(app)
        .post('/api/blockchain/store-commitment')
        .set('x-auth-token', authToken)
        .send({
          proofId
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('proofId');
      expect(res.body).toHaveProperty('transactionHash');
      expect(res.body.transactionHash).toMatch(/^0x[a-f0-9]+$/);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/blockchain/store-commitment')
        .send({
          proofId
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });

    it('should require proof ID', async () => {
      const res = await request(app)
        .post('/api/blockchain/store-commitment')
        .set('x-auth-token', authToken)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('required');
    });
  });

  describe('POST /api/blockchain/verify-zkp', () => {
    it('should verify ZKP on blockchain', async () => {
      const res = await request(app)
        .post('/api/blockchain/verify-zkp')
        .set('x-auth-token', authToken)
        .send({
          proofId
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('proofId');
      expect(res.body).toHaveProperty('transactionHash');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toEqual('proof_verified_on_chain');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/blockchain/verify-zkp')
        .send({
          proofId
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });

    it('should require proof ID', async () => {
      const res = await request(app)
        .post('/api/blockchain/verify-zkp')
        .set('x-auth-token', authToken)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('required');
    });
  });

  describe('POST /api/blockchain/deduct-tax', () => {
    it('should process tax deduction on blockchain', async () => {
      // First, update the ZKP proof status to verified on chain
      await ZkpProof.findByIdAndUpdate(proofId, {
        status: 'proof_verified_on_chain',
        verificationTransactionHash: '0x' + '1'.repeat(64),
        verifiedAt: new Date()
      });
      
      const res = await request(app)
        .post('/api/blockchain/deduct-tax')
        .set('x-auth-token', authToken)
        .send({
          proofId,
          amount: 50000
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('paymentId');
      expect(res.body).toHaveProperty('transactionHash');
      expect(res.body).toHaveProperty('amount');
      expect(res.body.amount).toEqual(50000);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/blockchain/deduct-tax')
        .send({
          proofId,
          amount: 50000
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });

    it('should require proof ID and amount', async () => {
      const res = await request(app)
        .post('/api/blockchain/deduct-tax')
        .set('x-auth-token', authToken)
        .send({
          proofId
          // Missing amount
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('required');
    });
  });

  describe('GET /api/blockchain/treasury-balance', () => {
    it('should get treasury balance', async () => {
      const res = await request(app)
        .get('/api/blockchain/treasury-balance')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('balance');
      expect(res.body.balance).toHaveProperty('balance');
      expect(res.body.balance).toHaveProperty('balanceBDT');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/blockchain/treasury-balance');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });
  });

  describe('GET /api/blockchain/user-transactions', () => {
    it('should get user transactions', async () => {
      const res = await request(app)
        .get('/api/blockchain/user-transactions')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBeTruthy();
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/blockchain/user-transactions');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });
  });
});
