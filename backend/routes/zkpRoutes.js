const express = require('express');
const router = express.Router();
const zkpController = require('../controllers/zkpController');
const authMiddleware = require('../middleware/authMiddleware');

// All ZKP routes require authentication
router.use(authMiddleware);

// ZKP routes
router.post('/generate-commitment', zkpController.generateCommitment);
router.post('/generate-proof', zkpController.generateProof);
router.post('/verify-proof', zkpController.verifyProof);
router.get('/public-params', zkpController.getPublicParameters);
router.get('/proofs', zkpController.getUserProofs);

module.exports = router;
