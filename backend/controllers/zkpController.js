const User = require('../models/User');
const ZkpProof = require('../models/ZkpProof');
const crypto = require('crypto');
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const zkpService = require('../utils/zkpService');

// Get all ZKP proofs for the current user
exports.getUserProofs = async (req, res) => {
  try {
    // Find all ZKP proofs for the current user
    const proofs = await ZkpProof.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .select('-proof -publicSignals'); // Exclude large fields
    
    // Return a proper response object
    res.json({
      message: "ZKP proofs retrieved successfully",
      proofs: proofs
    });
  } catch (error) {
    console.error('Get user proofs error:', error);
    res.status(500).json({ message: 'Server error while fetching user proofs' });
  }
};

// Generate a cryptographic commitment for income
exports.generateCommitment = async (req, res) => {
  try {
    const { income, randomSecret } = req.body;
    
    if (!income || !randomSecret) {
      return res.status(400).json({ message: 'Income and random secret are required' });
    }
    
    // Generate commitment using hash function
    // commitment = Hash(income || randomSecret)
    const commitment = zkpService.generateCommitment(income, randomSecret);
    
    // Store the commitment in the database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a new ZKP proof record
    const zkpProof = new ZkpProof({
      user: req.user.id,
      commitment,
      status: 'commitment_generated',
      metadata: {
        incomeRanges: zkpService.getAvailableIncomeRanges()
      }
    });
    
    await zkpProof.save();
    
    res.status(201).json({
      message: 'Income commitment generated successfully',
      proofId: zkpProof._id,
      commitment,
      availableIncomeRanges: zkpService.getAvailableIncomeRanges()
    });
  } catch (error) {
    console.error('Generate commitment error:', error);
    res.status(500).json({ message: 'Server error during commitment generation' });
  }
};

// Generate a Zero-Knowledge Proof for income range
exports.generateProof = async (req, res) => {
  try {
    const { proofId, income, randomSecret, incomeRange } = req.body;
    
    // Validate inputs
    if (!proofId || !income || !randomSecret || !incomeRange) {
      return res.status(400).json({ 
        message: 'Proof ID, income, random secret, and income range are required' 
      });
    }
    
    // Find the ZKP proof record
    const zkpProofRecord = await ZkpProof.findOne({
      _id: proofId,
      user: req.user.id,
      status: 'commitment_generated'
    });
    
    if (!zkpProofRecord) {
      return res.status(404).json({ message: 'ZKP proof record not found or invalid status' });
    }
    
    // Verify the commitment matches
    const commitment = zkpService.generateCommitment(income, randomSecret);
    if (commitment !== zkpProofRecord.commitment) {
      return res.status(400).json({ message: 'Income and random secret do not match the stored commitment' });
    }
    
    // Generate the ZKP proof
    const { proof, publicSignals } = await zkpService.generateProof(
      income,
      randomSecret,
      incomeRange
    );
    
    // Update the ZKP proof record
    zkpProofRecord.proof = proof;
    zkpProofRecord.publicSignals = publicSignals;
    zkpProofRecord.incomeRange = incomeRange;
    zkpProofRecord.status = 'proof_generated';
    await zkpProofRecord.save();
    
    res.json({
      message: 'Zero-Knowledge Proof generated successfully',
      proofId: zkpProofRecord._id,
      incomeRange,
      status: 'proof_generated'
    });
  } catch (error) {
    console.error('Generate ZKP error:', error);
    res.status(500).json({ message: 'Server error during ZKP generation' });
  }
};

// Verify a Zero-Knowledge Proof
exports.verifyProof = async (req, res) => {
  try {
    const { proofId } = req.body;
    
    if (!proofId) {
      return res.status(400).json({ message: 'Proof ID is required' });
    }
    
    // Find the ZKP proof record - accept any proof regardless of status
    const zkpProofRecord = await ZkpProof.findOne({
      _id: proofId,
      user: req.user.id
    });
    
    if (!zkpProofRecord) {
      return res.status(404).json({ message: 'ZKP proof record not found' });
    }
    
    // Check if the proof has already been verified
    if (zkpProofRecord.status === 'proof_verified' || zkpProofRecord.status === 'proof_verified_on_chain') {
      return res.json({
        message: 'Zero-Knowledge Proof already verified',
        proofId: zkpProofRecord._id,
        incomeRange: zkpProofRecord.incomeRange,
        status: zkpProofRecord.status,
        verifiedAt: zkpProofRecord.verifiedAt
      });
    }
    
    // Check if the proof has been generated
    if (!zkpProofRecord.proof || !zkpProofRecord.publicSignals) {
      return res.status(400).json({ message: 'Proof has not been generated yet' });
    }
    
    // Verify the ZKP proof
    const isValid = await zkpService.verifyProofData(
      zkpProofRecord.proof,
      zkpProofRecord.publicSignals
    );
    
    if (!isValid) {
      return res.status(400).json({ message: 'Zero-Knowledge Proof verification failed' });
    }
    
    // Update the ZKP proof record
    zkpProofRecord.status = 'proof_verified';
    zkpProofRecord.verifiedAt = Date.now();
    await zkpProofRecord.save();
    
    res.json({
      message: 'Zero-Knowledge Proof verified successfully',
      proofId: zkpProofRecord._id,
      incomeRange: zkpProofRecord.incomeRange,
      status: 'proof_verified',
      verifiedAt: zkpProofRecord.verifiedAt
    });
  } catch (error) {
    console.error('Verify ZKP error:', error);
    res.status(500).json({ message: 'Server error during ZKP verification' });
  }
};

// Get public parameters for ZKP
exports.getPublicParameters = async (req, res) => {
  try {
    // In a real system, this would return the actual verification key
    // and other public parameters needed for ZKP
    
    const publicParams = zkpService.getPublicParameters();
    
    res.json({
      message: 'Public parameters retrieved successfully',
      publicParams,
      availableIncomeRanges: zkpService.getAvailableIncomeRanges()
    });
  } catch (error) {
    console.error('Get public parameters error:', error);
    res.status(500).json({ message: 'Server error while fetching public parameters' });
  }
};
