// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ZKPVerifier.sol";

/**
 * @title TaxSystem
 * @dev Smart contract for the ZKP-based tax collection system
 */
contract TaxSystem {
    // State variables
    address public owner;
    address public treasuryWallet;
    ZKPVerifier public zkpVerifier;
    
    // Mapping to store tax payments
    mapping(address => mapping(string => TaxPayment)) public taxPayments;
    
    // Mapping to store user commitments
    mapping(address => string) public userCommitments;
    
    // Array to store all tax payment hashes for auditing
    string[] public allTaxPaymentHashes;
    
    // Total tax collected
    uint256 public totalTaxCollected;
    
    // Tax payment struct
    struct TaxPayment {
        address userAddress;
        uint256 amount;
        string proofId;
        uint256 timestamp;
        bool verified;
    }
    
    // Events
    event CommitmentStored(address indexed userAddress, string commitment);
    event TaxPaid(address indexed userAddress, uint256 amount, string proofId, string paymentHash);
    event ProofVerified(address indexed userAddress, string proofId, bool isValid);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _treasuryWallet Address of the treasury wallet
     * @param _zkpVerifier Address of the ZKP verifier contract
     */
    constructor(address _treasuryWallet, address _zkpVerifier) {
        owner = msg.sender;
        treasuryWallet = _treasuryWallet;
        zkpVerifier = ZKPVerifier(_zkpVerifier);
        totalTaxCollected = 0;
    }
    
    /**
     * @dev Store income commitment
     * @param commitment Cryptographic commitment of income
     */
    function storeCommitment(string memory commitment) public {
        userCommitments[msg.sender] = commitment;
        emit CommitmentStored(msg.sender, commitment);
    }
    
    /**
     * @dev Process tax payment
     * @param amount Tax amount
     * @param proofId ID of the ZKP proof
     * @return paymentHash Hash of the tax payment
     */
    function processTaxPayment(uint256 amount, string memory proofId) public returns (string memory paymentHash) {
        // In a real implementation, this would transfer funds from user to treasury
        // For this demo, we'll just record the payment
        
        // Generate a unique payment hash
        paymentHash = generatePaymentHash(msg.sender, amount, proofId);
        
        // Create tax payment record
        TaxPayment memory payment = TaxPayment({
            userAddress: msg.sender,
            amount: amount,
            proofId: proofId,
            timestamp: block.timestamp,
            verified: true
        });
        
        // Store the payment
        taxPayments[msg.sender][paymentHash] = payment;
        allTaxPaymentHashes.push(paymentHash);
        
        // Update total tax collected
        totalTaxCollected += amount;
        
        // Emit event
        emit TaxPaid(msg.sender, amount, proofId, paymentHash);
        
        return paymentHash;
    }
    
    /**
     * @dev Verify tax receipt
     * @param paymentHash Hash of the tax payment
     * @param userAddress Address of the user
     * @return verified Whether the receipt is valid
     */
    function verifyTaxReceipt(string memory paymentHash, address userAddress) public view returns (bool verified) {
        TaxPayment memory payment = taxPayments[userAddress][paymentHash];
        return payment.verified && payment.timestamp > 0;
    }
    
    /**
     * @dev Get treasury balance
     * @return balance Balance of the treasury wallet
     */
    function getTreasuryBalance() public view returns (uint256 balance) {
        // In a real implementation, this would return the actual balance
        // For this demo, we'll return the total tax collected
        return totalTaxCollected;
    }
    
    /**
     * @dev Generate payment hash
     * @param userAddress Address of the user
     * @param amount Tax amount
     * @param proofId ID of the ZKP proof
     * @return paymentHash Hash of the tax payment
     */
    function generatePaymentHash(address userAddress, uint256 amount, string memory proofId) internal view returns (string memory) {
        // In a real implementation, this would use a proper hashing algorithm
        // For this demo, we'll use a simple concatenation
        return string(abi.encodePacked(userAddress, amount, proofId, block.timestamp));
    }
    
    /**
     * @dev Update treasury wallet address
     * @param _treasuryWallet New treasury wallet address
     */
    function updateTreasuryWallet(address _treasuryWallet) public onlyOwner {
        treasuryWallet = _treasuryWallet;
    }
    
    /**
     * @dev Update ZKP verifier contract address
     * @param _zkpVerifier New ZKP verifier contract address
     */
    function updateZKPVerifier(address _zkpVerifier) public onlyOwner {
        zkpVerifier = ZKPVerifier(_zkpVerifier);
    }
}
