const User = require('../models/User');
const ZkpProof = require('../models/ZkpProof');
const TaxPayment = require('../models/TaxPayment');
const blockchainService = require('../utils/blockchainService');
const zkpService = require('../utils/zkpService');

// Get blockchain network status
exports.getBlockchainStatus = async (req, res) => {
  try {
    const status = await blockchainService.getNetworkStatus();
    
    res.json({
      message: 'Blockchain status retrieved successfully',
      status
    });
  } catch (error) {
    console.error('Get blockchain status error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching blockchain status',
      error: error.message,
      details: 'Unable to connect to the blockchain network. Please check your connection and try again.'
    });
  }
};

// Get transaction details by hash
exports.getTransaction = async (req, res) => {
  try {
    const { txHash } = req.params;
    
    if (!txHash) {
      return res.status(400).json({ message: 'Transaction hash is required' });
    }
    
    // Validate transaction hash format
    if (!blockchainService.web3.utils.isHexStrict(txHash)) {
      return res.status(400).json({ 
        message: 'Invalid transaction hash format',
        error: 'Transaction hash must be a valid hexadecimal string starting with 0x'
      });
    }
    
    try {
      const transaction = await blockchainService.getTransaction(txHash);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json({
        message: 'Transaction retrieved successfully',
        transaction
      });
    } catch (txError) {
      console.error('Get transaction error:', txError);
      
      // Check if it's a "not found" error
      if (txError.message.includes('not found')) {
        return res.status(404).json({ 
          message: 'Transaction not found on the blockchain',
          error: txError.message
        });
      }
      
      // Check if it's an invalid hash error
      if (txError.message.includes('Invalid transaction hash') || 
          txError.message.includes('not a valid hex string')) {
        return res.status(400).json({ 
          message: 'Invalid transaction hash',
          error: txError.message
        });
      }
      
      throw txError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error('Get transaction error:', error);
    
    res.status(500).json({ 
      message: 'Server error while fetching transaction',
      error: error.message,
      details: 'Unable to retrieve transaction data from the blockchain. Please check the transaction hash and try again.'
    });
  }
};

// Store income commitment on blockchain
exports.storeCommitment = async (req, res) => {
  try {
    const { proofId } = req.body;
    
    if (!proofId) {
      return res.status(400).json({ message: 'Proof ID is required' });
    }
    
    // Find the ZKP proof record
    const zkpProofRecord = await ZkpProof.findOne({
      _id: proofId,
      user: req.user.id
    });
    
    if (!zkpProofRecord) {
      return res.status(404).json({ message: 'ZKP proof record not found' });
    }
    
    // Get user's blockchain public key
    const user = await User.findById(req.user.id);
    if (!user.blockchainPublicKey) {
      return res.status(400).json({ message: 'User does not have blockchain keys generated' });
    }
    
    // Store commitment on blockchain
    const txHash = await blockchainService.storeCommitment(
      user.blockchainPublicKey,
      zkpProofRecord.commitment
    );
    
    // Update the ZKP proof record
    zkpProofRecord.transactionHash = txHash;
    zkpProofRecord.onBlockchain = true;
    await zkpProofRecord.save();
    
    res.json({
      message: 'Commitment stored on blockchain successfully',
      proofId: zkpProofRecord._id,
      transactionHash: txHash
    });
  } catch (error) {
    console.error('Store commitment error:', error);
    res.status(500).json({ message: 'Server error while storing commitment on blockchain' });
  }
};

// Verify ZKP on blockchain
exports.verifyZKPOnChain = async (req, res) => {
  try {
    const { proofId } = req.body;
    
    if (!proofId) {
      return res.status(400).json({ message: 'Proof ID is required' });
    }
    
    // Find the ZKP proof record
    const zkpProofRecord = await ZkpProof.findOne({
      _id: proofId,
      user: req.user.id,
      status: 'proof_generated'
    });
    
    if (!zkpProofRecord) {
      return res.status(404).json({ message: 'ZKP proof record not found or invalid status' });
    }
    
    // Get user's blockchain public key
    const user = await User.findById(req.user.id);
    if (!user.blockchainPublicKey) {
      return res.status(400).json({ message: 'User does not have blockchain keys generated' });
    }
    
    // Verify ZKP on blockchain
    const { isValid, txHash } = await blockchainService.verifyZKPOnChain(
      user.blockchainPublicKey,
      zkpProofRecord.proof,
      zkpProofRecord.publicSignals
    );
    
    if (!isValid) {
      return res.status(400).json({ message: 'Zero-Knowledge Proof verification failed on blockchain' });
    }
    
    // Update the ZKP proof record
    zkpProofRecord.status = 'proof_verified_on_chain';
    zkpProofRecord.verificationTransactionHash = txHash;
    zkpProofRecord.verifiedAt = Date.now();
    await zkpProofRecord.save();
    
    res.json({
      message: 'Zero-Knowledge Proof verified on blockchain successfully',
      proofId: zkpProofRecord._id,
      transactionHash: txHash,
      status: 'proof_verified_on_chain'
    });
  } catch (error) {
    console.error('Verify ZKP on chain error:', error);
    res.status(500).json({ message: 'Server error during ZKP verification on blockchain' });
  }
};

// Process tax deduction on blockchain
exports.deductTax = async (req, res) => {
  try {
    const { proofId, amount } = req.body;
    
    if (!proofId || !amount) {
      return res.status(400).json({ message: 'Proof ID and amount are required' });
    }
    
    // Find the ZKP proof record
    const zkpProofRecord = await ZkpProof.findOne({
      _id: proofId,
      user: req.user.id,
      status: 'proof_verified_on_chain'
    });
    
    if (!zkpProofRecord) {
      return res.status(404).json({ message: 'ZKP proof record not found or not verified on chain' });
    }
    
    // Get user's blockchain public key
    const user = await User.findById(req.user.id);
    if (!user.blockchainPublicKey) {
      return res.status(400).json({ message: 'User does not have blockchain keys generated' });
    }
    
    // Process tax deduction on blockchain
    const txHash = await blockchainService.processTaxPayment(
      user.blockchainPublicKey,
      amount,
      zkpProofRecord._id
    );
    
    // Create tax payment record
    const taxPayment = new TaxPayment({
      user: req.user.id,
      amount,
      proofId: zkpProofRecord._id,
      transactionHash: txHash,
      status: 'completed'
    });
    
    await taxPayment.save();
    
    res.json({
      message: 'Tax deduction processed on blockchain successfully',
      paymentId: taxPayment._id,
      transactionHash: txHash,
      amount
    });
  } catch (error) {
    console.error('Deduct tax error:', error);
    res.status(500).json({ message: 'Server error during tax deduction on blockchain' });
  }
};

// Get treasury wallet balance
exports.getTreasuryBalance = async (req, res) => {
  try {
    const balance = await blockchainService.getTreasuryBalance();
    
    res.json({
      message: 'Treasury balance retrieved successfully',
      balance
    });
  } catch (error) {
    console.error('Get treasury balance error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching treasury balance',
      error: error.message,
      details: 'Unable to retrieve treasury balance from the blockchain. Please try again later.'
    });
  }
};

// Get user's blockchain transactions
exports.getUserTransactions = async (req, res) => {
  try {
    // Get user's blockchain public key
    const user = await User.findById(req.user.id);
    if (!user.blockchainPublicKey) {
      return res.status(400).json({ message: 'User does not have blockchain keys generated' });
    }
    
    const transactions = await blockchainService.getUserTransactions(user.blockchainPublicKey);
    
    res.json({
      message: 'User transactions retrieved successfully',
      transactions
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user transactions',
      error: error.message,
      details: 'Unable to retrieve transaction history from the blockchain. Please try again later.'
    });
  }
};
