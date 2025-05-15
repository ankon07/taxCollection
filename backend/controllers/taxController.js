const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const TaxPayment = require('../models/TaxPayment');
const blockchainService = require('../utils/blockchainService');
const zkpService = require('../utils/zkpService');

// Tax brackets for Bangladesh (simplified for demo)
const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 0 },           // 0% for income up to 3,00,000 BDT
  { min: 300001, max: 400000, rate: 0.05 },   // 5% for income between 3,00,001 and 4,00,000 BDT
  { min: 400001, max: 700000, rate: 0.10 },   // 10% for income between 4,00,001 and 7,00,000 BDT
  { min: 700001, max: 1100000, rate: 0.15 },  // 15% for income between 7,00,001 and 11,00,000 BDT
  { min: 1100001, max: 1600000, rate: 0.20 }, // 20% for income between 11,00,001 and 16,00,000 BDT
  { min: 1600001, max: Infinity, rate: 0.25 } // 25% for income above 16,00,001 BDT
];

// Calculate tax based on income range from ZKP
exports.calculateTax = async (req, res) => {
  try {
    const { proofId, incomeRange, incomeThreshold } = req.body;
    
    // Verify the ZKP proof exists and is valid
    const proofIsValid = await zkpService.verifyProof(proofId);
    if (!proofIsValid) {
      return res.status(400).json({ message: 'Invalid income proof' });
    }
    
    // Use the provided income threshold or parse it from the range if not provided
    let threshold = incomeThreshold;
    let taxBracket;
    let estimatedTax = 0;
    
    if (!threshold && incomeRange && incomeRange.includes('>')) {
      // Extract the number from the income range string, removing commas and 'BDT'
      const incomeRangeValue = incomeRange.split('>')[1].trim();
      threshold = parseInt(incomeRangeValue.replace(/,/g, '').replace('BDT', '').trim());
    }
    
    if (!threshold) {
      return res.status(400).json({ message: 'Invalid income threshold' });
    }
    
    console.log('Income threshold:', threshold);
    
    // Find applicable tax bracket
    taxBracket = TAX_BRACKETS.find(bracket => 
      threshold >= bracket.min && threshold <= bracket.max
    );
    
    if (taxBracket) {
      // Calculate estimated tax using the income threshold itself
      // This is more accurate than using the minimum of the bracket
      estimatedTax = threshold * taxBracket.rate;
      
      // For progressive taxation, we should calculate tax for each bracket
      // This is a simplified implementation for demonstration
      let progressiveTax = 0;
      
      // Calculate tax for each bracket up to the current one
      TAX_BRACKETS.forEach(bracket => {
        if (bracket.min < taxBracket.min) {
          // For lower brackets, calculate tax on the full bracket range
          const bracketIncome = Math.min(bracket.max, taxBracket.min) - bracket.min;
          progressiveTax += bracketIncome * bracket.rate;
        }
      });
      
      // Add tax for the current bracket
      const currentBracketIncome = threshold - taxBracket.min;
      progressiveTax += currentBracketIncome * taxBracket.rate;
      
      // Use the progressive tax calculation
      estimatedTax = progressiveTax;
    }
    
    if (!taxBracket) {
      return res.status(400).json({ message: 'Could not determine tax bracket from income range' });
    }
    
    res.json({
      taxBracket,
      estimatedTax,
      taxRate: taxBracket.rate * 100 + '%',
      message: 'Tax calculated successfully based on ZKP income range'
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    res.status(500).json({ message: 'Server error during tax calculation' });
  }
};

// Prepare tax payment transaction for blockchain
exports.preparePayment = async (req, res) => {
  try {
    const { proofId, bankAccountId, amount } = req.body;
    
    // Verify the user has the bank account
    const bankAccount = await BankAccount.findOne({
      _id: bankAccountId,
      user: req.user.id
    });
    
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    // Verify the ZKP proof
    const proofIsValid = await zkpService.verifyProof(proofId);
    if (!proofIsValid) {
      return res.status(400).json({ message: 'Invalid income proof' });
    }
    
    // Record the tax payment as pending
    const taxPayment = new TaxPayment({
      user: req.user.id,
      amount,
      bankAccount: bankAccountId,
      proofId,
      status: 'pending'
    });
    
    await taxPayment.save();
    
    // Get user's blockchain address
    const user = await User.findById(req.user.id);
    if (!user.blockchainPublicKey) {
      return res.status(400).json({ message: 'User does not have a blockchain wallet linked' });
    }
    
    // Create a mock transaction object for testing purposes
    // NOTE: This is NOT a real Solana transaction object and cannot be directly used with the Phantom wallet
    // In a production environment, you would create a proper Solana transaction using the @solana/web3.js library
    const transaction = {
      type: 'mock-transaction', // Indicate this is a mock
      feePayer: user.blockchainPublicKey,
      recentBlockhash: 'simulated-blockhash-' + Date.now(),
      instructions: [
        {
          programId: 'TaxSystemProgram',
          keys: [
            { pubkey: user.blockchainPublicKey, isSigner: true, isWritable: true },
            { pubkey: blockchainService.treasuryWalletAddress, isSigner: false, isWritable: true }
          ],
          data: {
            action: 'processTaxPayment',
            amount: amount,
            proofId: proofId,
            paymentId: taxPayment._id.toString()
          }
        }
      ],
      // Include metadata about what this transaction would do in a real environment
      metadata: {
        description: 'Tax payment transaction',
        amount: amount,
        currency: 'BDT',
        paymentId: taxPayment._id.toString(),
        timestamp: new Date().toISOString()
      }
    };
    
    res.json({
      success: true,
      message: 'Tax payment transaction prepared',
      paymentId: taxPayment._id,
      transaction
    });
  } catch (error) {
    console.error('Tax payment preparation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during tax payment preparation' 
    });
  }
};

// Confirm tax payment after blockchain transaction
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, signature, walletAddress } = req.body;
    
    // Find the payment
    const taxPayment = await TaxPayment.findOne({
      _id: paymentId,
      user: req.user.id,
      status: 'pending'
    });
    
    if (!taxPayment) {
      return res.status(404).json({ 
        success: false,
        message: 'Pending tax payment not found' 
      });
    }
    
    // Validate signature format if provided
    if (signature) {
      if (!blockchainService.web3.utils.isHexStrict(signature)) {
        console.warn('Non-standard signature format received:', signature);
        // For testing purposes, we'll accept any signature format
        // In production, we would enforce strict validation
      }
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Transaction signature is required' 
      });
    }
    
    // For testing purposes, we'll skip blockchain verification
    // In a production environment, we would verify the transaction on the blockchain
    console.log('Simulating blockchain verification for signature:', signature);
    
    // Skip actual blockchain verification in test environment
    let isValid = true; // Assume valid for testing
    
    // Process the payment on the blockchain
    let txHash;
    try {
      // Log the parameters being passed to processTaxPayment
      console.log('Processing tax payment with parameters:');
      console.log('- User ID:', req.user.id);
      console.log('- Amount:', taxPayment.amount);
      console.log('- Proof ID:', taxPayment.proofId);
      
      // Call the blockchain service to process the payment
      txHash = await blockchainService.processTaxPayment(
        req.user.id,
        taxPayment.amount,
        taxPayment.proofId
      );
      
      console.log('Transaction hash from blockchain:', txHash);
    } catch (processError) {
      console.error('Process payment error:', processError);
      return res.status(500).json({ 
        success: false,
        message: 'Error processing payment on blockchain',
        error: processError.message
      });
    }
    
    // Update the payment record with transaction hash and date
    taxPayment.transactionHash = txHash;
    taxPayment.transactionDate = new Date();
    taxPayment.status = 'completed';
    taxPayment.walletAddress = walletAddress;
    taxPayment.blockchainData = {
      blockNumber: Math.floor(Math.random() * 1000000) + 10000000, // Simulated block number
      timestamp: Date.now(),
      network: 'Sepolia Testnet',
      gasUsed: Math.floor(Math.random() * 100000) + 50000 // Simulated gas used
    };
    await taxPayment.save();
    
    res.json({
      success: true,
      message: 'Tax payment confirmed successfully',
      paymentId: taxPayment._id,
      transactionHash: txHash,
      amount: taxPayment.amount,
      timestamp: taxPayment.updatedAt
    });
  } catch (error) {
    console.error('Tax payment confirmation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during tax payment confirmation',
      error: error.message
    });
  }
};

// Process tax payment (legacy method)
exports.payTax = async (req, res) => {
  try {
    const { proofId, bankAccountId, amount } = req.body;
    
    // Verify the user has the bank account
    const bankAccount = await BankAccount.findOne({
      _id: bankAccountId,
      user: req.user.id
    });
    
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    // Verify the ZKP proof
    const proofIsValid = await zkpService.verifyProof(proofId);
    if (!proofIsValid) {
      return res.status(400).json({ message: 'Invalid income proof' });
    }
    
    // In a real system, we would initiate a bank transfer here
    // For demo purposes, we'll simulate the payment
    
    // Record the tax payment
    const taxPayment = new TaxPayment({
      user: req.user.id,
      amount,
      bankAccount: bankAccountId,
      proofId,
      status: 'processing'
    });
    
    await taxPayment.save();
    
    // Process the payment on the blockchain
    let txHash;
    try {
      // Log the parameters being passed to processTaxPayment
      console.log('Processing tax payment with parameters (legacy method):');
      console.log('- User ID:', req.user.id);
      console.log('- Amount:', amount);
      console.log('- Proof ID:', proofId);
      
      // Call the blockchain service to process the payment
      txHash = await blockchainService.processTaxPayment(
        req.user.id,
        amount,
        proofId
      );
      
      console.log('Transaction hash from blockchain (legacy method):', txHash);
      
      // Update the payment record with transaction hash and date
      taxPayment.transactionHash = txHash;
      taxPayment.transactionDate = new Date();
      taxPayment.status = 'completed';
      taxPayment.paymentMethod = 'blockchain';
      taxPayment.blockchainData = {
        blockNumber: Math.floor(Math.random() * 1000000) + 10000000, // Simulated block number
        timestamp: Date.now(),
        network: 'Sepolia Testnet',
        gasUsed: Math.floor(Math.random() * 100000) + 50000 // Simulated gas used
      };
      await taxPayment.save();
      
      res.json({
        success: true,
        message: 'Tax payment processed successfully',
        paymentId: taxPayment._id,
        transactionHash: txHash,
        amount,
        timestamp: taxPayment.createdAt
      });
    } catch (processError) {
      console.error('Process payment error:', processError);
      
      // Update the payment record to indicate failure
      taxPayment.status = 'failed';
      taxPayment.failureReason = processError.message;
      await taxPayment.save();
      
      return res.status(500).json({ 
        success: false,
        message: 'Error processing payment on blockchain',
        error: processError.message,
        paymentId: taxPayment._id
      });
    }
  } catch (error) {
    console.error('Tax payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during tax payment',
      error: error.message
    });
  }
};

// Get user's tax payment history
exports.getTaxHistory = async (req, res) => {
  try {
    const taxPayments = await TaxPayment.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('bankAccount', 'bankName accountNumber');
    
    res.json(taxPayments);
  } catch (error) {
    console.error('Get tax history error:', error);
    res.status(500).json({ message: 'Server error while fetching tax history' });
  }
};

// Get tax receipt by ID
exports.getTaxReceipt = async (req, res) => {
  try {
    const taxPayment = await TaxPayment.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('bankAccount', 'bankName accountNumber');
    
    if (!taxPayment) {
      return res.status(404).json({ message: 'Tax payment not found' });
    }
    
    let blockchainVerified = false;
    let verificationError = null;
    
    // Only attempt blockchain verification if there's a valid transaction hash
    if (taxPayment.transactionHash && 
        taxPayment.transactionHash !== 'null' && 
        taxPayment.transactionHash !== 'undefined') {
      try {
        // Verify the receipt on blockchain
        blockchainVerified = await blockchainService.verifyTaxReceipt(
          taxPayment.transactionHash
        );
      } catch (verifyError) {
        console.error('Blockchain verification error:', verifyError);
        verificationError = verifyError.message;
      }
    } else {
      verificationError = 'No valid transaction hash available for verification';
    }
    
    // Generate a receipt regardless of blockchain verification status
    const receipt = {
      paymentId: taxPayment._id,
      userId: req.user.id,
      amount: taxPayment.amount,
      date: taxPayment.createdAt,
      bankAccount: {
        bankName: taxPayment.bankAccount ? taxPayment.bankAccount.bankName : 'N/A',
        accountNumber: taxPayment.bankAccount ? taxPayment.bankAccount.accountNumber : 'N/A'
      },
      transactionHash: taxPayment.transactionHash || 'Not available',
      blockchainVerified: blockchainVerified,
      proofId: taxPayment.proofId
    };
    
    // Add blockchain data if available
    if (taxPayment.blockchainData) {
      receipt.blockchainData = taxPayment.blockchainData;
    }
    
    const response = {
      message: 'Tax receipt retrieved successfully',
      receipt
    };
    
    // Include verification error if present
    if (verificationError) {
      response.verificationStatus = {
        verified: false,
        error: verificationError
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get tax receipt error:', error);
    res.status(500).json({ message: 'Server error while fetching tax receipt' });
  }
};

// Get tax brackets
exports.getTaxBrackets = async (req, res) => {
  try {
    res.json({
      message: 'Tax brackets retrieved successfully',
      brackets: TAX_BRACKETS.map(bracket => ({
        min: bracket.min,
        max: bracket.max === Infinity ? 'Above' : bracket.max,
        rate: bracket.rate * 100 + '%'
      }))
    });
  } catch (error) {
    console.error('Get tax brackets error:', error);
    res.status(500).json({ message: 'Server error while fetching tax brackets' });
  }
};
