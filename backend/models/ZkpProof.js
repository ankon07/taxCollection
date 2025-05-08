const mongoose = require('mongoose');

const ZkpProofSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commitment: {
    type: String,
    required: true
  },
  proof: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  publicSignals: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  incomeRange: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: [
      'commitment_generated',
      'proof_generated',
      'proof_verified',
      'proof_verified_on_chain',
      'expired',
      'revoked'
    ],
    default: 'commitment_generated'
  },
  transactionHash: {
    type: String,
    default: null
  },
  verificationTransactionHash: {
    type: String,
    default: null
  },
  onBlockchain: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Proofs expire after 1 year by default
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return oneYearFromNow;
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

module.exports = mongoose.model('ZkpProof', ZkpProofSchema);
