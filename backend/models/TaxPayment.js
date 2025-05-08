const mongoose = require('mongoose');

const TaxPaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  bankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    default: null
  },
  proofId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ZkpProof',
    required: true
  },
  transactionHash: {
    type: String,
    default: null
  },
  transactionDate: {
    type: Date,
    default: null
  },
  walletAddress: {
    type: String,
    default: null
  },
  blockchainData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  receiptId: {
    type: String,
    default: function() {
      // Generate a unique receipt ID
      return 'RCPT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'processing'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'blockchain', 'phantom_wallet'],
    default: 'bank_transfer'
  },
  fiscalYear: {
    type: String,
    default: function() {
      // Get current fiscal year (July to June in Bangladesh)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed
      
      // If current month is before July, fiscal year is previous year to current year
      // Otherwise, fiscal year is current year to next year
      return month < 7 
        ? `${year-1}-${year}` 
        : `${year}-${year+1}`;
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TaxPayment', TaxPaymentSchema);
