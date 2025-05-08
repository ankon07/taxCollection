const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock user data
const testUser = {
  fullName: 'Test User',
  email: 'test@example.com',
  mobile: '01712345678',
  nidNumber: 'BD123456789',
  tinNumber: 'TIN123456789',
  password: 'password123'
};

let authToken;

// Connect to test database before running tests
beforeAll(async () => {
  // Clear users collection
  await User.deleteMany({});
});

// Clean up after tests
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('User Authentication API', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual(testUser.email);
    });

    it('should not register a user with existing email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual(testUser.email);
      
      // Save token for protected route tests
      authToken = res.body.token;
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email');
      expect(res.body.email).toEqual(testUser.email);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('No token');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('x-auth-token', 'invalidtoken');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('not valid');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updatedData = {
        fullName: 'Updated Name',
        email: testUser.email,
        mobile: '01798765432'
      };

      const res = await request(app)
        .put('/api/users/profile')
        .set('x-auth-token', authToken)
        .send(updatedData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.fullName).toEqual(updatedData.fullName);
      expect(res.body.user.mobile).toEqual(updatedData.mobile);
    });
  });

  describe('POST /api/users/verify-nid', () => {
    it('should verify a valid NID', async () => {
      const res = await request(app)
        .post('/api/users/verify-nid')
        .send({
          nidNumber: 'BD987654321',
          fullName: 'Test User'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('verified');
      expect(res.body.verified).toBeTruthy();
    });

    it('should reject an invalid NID', async () => {
      const res = await request(app)
        .post('/api/users/verify-nid')
        .send({
          nidNumber: '123456789',
          fullName: 'Test User'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('verified');
      expect(res.body.verified).toBeFalsy();
    });
  });

  describe('POST /api/users/link-bank', () => {
    it('should link a bank account', async () => {
      const bankData = {
        bankName: 'Test Bank',
        accountNumber: '1234567890',
        accountType: 'Savings'
      };

      const res = await request(app)
        .post('/api/users/link-bank')
        .set('x-auth-token', authToken)
        .send(bankData);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('bankAccount');
      expect(res.body.bankAccount.bankName).toEqual(bankData.bankName);
      expect(res.body.bankAccount.accountNumber).toEqual(bankData.accountNumber);
    });
  });

  describe('GET /api/users/bank-accounts', () => {
    it('should get user bank accounts', async () => {
      const res = await request(app)
        .get('/api/users/bank-accounts')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('bankName');
      expect(res.body[0]).toHaveProperty('accountNumber');
    });
  });

  describe('POST /api/users/generate-keys', () => {
    it('should generate blockchain keys', async () => {
      const res = await request(app)
        .post('/api/users/generate-keys')
        .set('x-auth-token', authToken);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('publicKey');
      expect(res.body.publicKey).toMatch(/^0x[a-fA-F0-9]{40}$/); // Ethereum address format
    });
  });
});
