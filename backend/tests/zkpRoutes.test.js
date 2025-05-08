const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const ZkpProof = require('../models/ZkpProof');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock user data
const testUser = {
  fullName: 'ZKP Test User',
  email: 'zkptest@example.com',
  mobile: '01712345670',
  nidNumber: 'BD123456781',
  tinNumber: 'TIN123456781',
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
});

// Clean up after tests
afterAll(async () => {
  await User.deleteMany({});
  await ZkpProof.deleteMany({});
  await mongoose.connection.close();
});

describe('ZKP API', () => {
  describe('POST /api/zkp/generate-commitment', () => {
    it('should generate a commitment', async () => {
      const res = await request(app)
        .post('/api/zkp/generate-commitment')
        .set('x-auth-token', authToken)
        .send({
          income: 750000,
          randomSecret: 'random-salt-value'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('proofId');
      expect(res.body).toHaveProperty('commitment');
      expect(res.body).toHaveProperty('availableIncomeRanges');
      
      // Save proof ID for later tests
      proofId = res.body.proofId;
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/zkp/generate-commitment')
        .send({
          income: 750000,
          randomSecret: 'random-salt-value'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });

    it('should require income and random secret', async () => {
      const res = await request(app)
        .post('/api/zkp/generate-commitment')
        .set('x-auth-token', authToken)
        .send({
          income: 750000
          // Missing randomSecret
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('required');
    });
  });

  describe('POST /api/zkp/generate-proof', () => {
    it('should generate a ZKP proof', async () => {
      const res = await request(app)
        .post('/api/zkp/generate-proof')
        .set('x-auth-token', authToken)
        .send({
          proofId,
          income: 750000,
          randomSecret: 'random-salt-value',
          incomeRange: 'income > 700000'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('proofId');
      expect(res.body).toHaveProperty('incomeRange');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toEqual('proof_generated');
    });

    it('should require all parameters', async () => {
      const res = await request(app)
        .post('/api/zkp/generate-proof')
        .set('x-auth-token', authToken)
        .send({
          proofId,
          income: 750000,
          // Missing randomSecret and incomeRange
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('required');
    });

    it('should validate income and random secret match commitment', async () => {
      const res = await request(app)
        .post('/api/zkp/generate-proof')
        .set('x-auth-token', authToken)
        .send({
          proofId,
          income: 800000, // Different income
          randomSecret: 'different-salt-value', // Different salt
          incomeRange: 'income > 700000'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('do not match');
    });
  });

  describe('POST /api/zkp/verify-proof', () => {
    it('should verify a ZKP proof', async () => {
      const res = await request(app)
        .post('/api/zkp/verify-proof')
        .set('x-auth-token', authToken)
        .send({
          proofId
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('proofId');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toEqual('proof_verified');
      expect(res.body).toHaveProperty('verifiedAt');
    });

    it('should require proof ID', async () => {
      const res = await request(app)
        .post('/api/zkp/verify-proof')
        .set('x-auth-token', authToken)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('required');
    });

    it('should reject invalid proof ID', async () => {
      const res = await request(app)
        .post('/api/zkp/verify-proof')
        .set('x-auth-token', authToken)
        .send({
          proofId: new mongoose.Types.ObjectId()
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/zkp/public-params', () => {
    it('should get public parameters', async () => {
      const res = await request(app)
        .get('/api/zkp/public-params')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('publicParams');
      expect(res.body).toHaveProperty('availableIncomeRanges');
      expect(Array.isArray(res.body.availableIncomeRanges)).toBeTruthy();
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/zkp/public-params');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });
  });
});
