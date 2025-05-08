const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const authMiddleware = require('../middleware/authMiddleware');

// All tax routes require authentication
router.use(authMiddleware);

// Tax calculation and payment routes
router.post('/calculate', taxController.calculateTax);
router.post('/prepare-payment', taxController.preparePayment);
router.post('/confirm-payment', taxController.confirmPayment);
router.post('/pay', taxController.payTax); // Legacy endpoint
router.get('/history', taxController.getTaxHistory);
router.get('/receipt/:id', taxController.getTaxReceipt);
router.get('/brackets', taxController.getTaxBrackets);

module.exports = router;
