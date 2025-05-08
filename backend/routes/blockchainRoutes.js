const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const authMiddleware = require('../middleware/authMiddleware');

// Public blockchain routes
router.get('/status', blockchainController.getBlockchainStatus);
router.get('/transaction/:txHash', blockchainController.getTransaction);

// Protected blockchain routes
router.use(authMiddleware);
router.post('/store-commitment', blockchainController.storeCommitment);
router.post('/verify-zkp', blockchainController.verifyZKPOnChain);
router.post('/deduct-tax', blockchainController.deductTax);
router.get('/treasury-balance', blockchainController.getTreasuryBalance);
router.get('/user-transactions', blockchainController.getUserTransactions);

module.exports = router;
