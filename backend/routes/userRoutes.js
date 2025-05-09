const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/verify-nid', userController.verifyNID);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.post('/link-bank', authMiddleware, userController.linkBankAccount);
router.get('/bank-accounts', authMiddleware, userController.getBankAccounts);
router.delete('/bank-accounts/:id', authMiddleware, userController.deleteBankAccount);
router.post('/generate-keys', authMiddleware, userController.generateBlockchainKeys);
router.post('/link-wallet', authMiddleware, userController.linkWallet);

module.exports = router;
