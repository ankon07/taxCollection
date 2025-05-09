// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ZKPVerifier.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TaxSystem
 * @dev Smart contract for ZKP-based tax collection system with real payments
 */
contract TaxSystem is ReentrancyGuard {
    // State variables
    address public immutable owner;
    address public treasuryWallet;
    ZKPVerifier public zkpVerifier;
    
    // Mapping to store tax payments
    mapping(address => mapping(bytes32 => TaxPayment)) public taxPayments;
    
    // Array to store all tax payment hashes for auditing
    bytes32[] public allTaxPaymentHashes;
    
    // Total tax collected
    uint256 public totalTaxCollected;
    
    // Tax payment struct
    struct TaxPayment {
        address userAddress;
        uint256 amount;
        bytes32 proofId;
        uint256 timestamp;
        bool verified;
    }
    
    // Events
    event CommitmentStored(address indexed userAddress, bytes32 commitment);
    event TaxPaid(address indexed userAddress, uint256 amount, bytes32 proofId, bytes32 paymentHash);
    event ProofVerified(address indexed userAddress, bytes32 proofId, bool isValid);
    event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event ZKPVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    
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
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_zkpVerifier != address(0), "Invalid ZKP verifier");
        owner = msg.sender;
        treasuryWallet = _treasuryWallet;
        zkpVerifier = ZKPVerifier(_zkpVerifier);
        totalTaxCollected = 0;
    }
    
    /**
     * @dev Store income commitment
     * @param commitment Cryptographic commitment of income (keccak256 hash)
     */
    function storeCommitment(bytes32 commitment) external {
        require(commitment != bytes32(0), "Invalid commitment");
        zkpVerifier.storeCommitment(commitment);
        emit CommitmentStored(msg.sender, commitment);
    }
    
    /**
     * @dev Process tax payment with ZKP verification
     * @param amount Tax amount in wei
     * @param a zk-SNARK proof parameter A
     * @param b zk-SNARK proof parameter B
     * @param c zk-SNARK proof parameter C
     * @param input Public inputs for the proof
     * @return paymentHash Hash of the tax payment
     */
    function processTaxPayment(
        uint256 amount,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external payable nonReentrant returns (bytes32 paymentHash) {
        require(msg.value == amount, "Incorrect payment amount");
        require(amount > 0, "Amount must be greater than zero");
        
        // Verify the zk-SNARK proof
        bool isValid = zkpVerifier.verifyProof(a, b, c, input);
        require(isValid, "Invalid ZKP proof");
        
        // Generate a unique proof ID
        bytes32 proofId = keccak256(abi.encodePacked(a, b, c, input));
        
        // Generate a unique payment hash
        paymentHash = keccak256(
            abi.encodePacked(
                msg.sender,
                amount,
                proofId,
                block.timestamp,
                block.chainid
            )
        );
        
        // Check for replay attack
        require(taxPayments[msg.sender][paymentHash].timestamp == 0, "Payment already processed");
        
        // Transfer funds to treasury
        (bool success, ) = treasuryWallet.call{value: amount}("");
        require(success, "Transfer to treasury failed");
        
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
        
        // Emit events
        emit ProofVerified(msg.sender, proofId, isValid);
        emit TaxPaid(msg.sender, amount, proofId, paymentHash);
        
        return paymentHash;
    }
    
    /**
     * @dev Verify tax receipt
     * @param paymentHash Hash of the tax payment
     * @param userAddress Address of the user
     * @return verified Whether the receipt is valid
     */
    function verifyTaxReceipt(bytes32 paymentHash, address userAddress) external view returns (bool verified) {
        TaxPayment memory payment = taxPayments[userAddress][paymentHash];
        return payment.verified && payment.timestamp > 0;
    }
    
    /**
     * @dev Get treasury balance
     * @return balance Balance of the treasury wallet
     */
    function getTreasuryBalance() external view returns (uint256 balance) {
        return treasuryWallet.balance;
    }
    
    /**
     * @dev Update treasury wallet address
     * @param _treasuryWallet New treasury wallet address
     */
    function updateTreasuryWallet(address _treasuryWallet) external onlyOwner {
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        address oldWallet = treasuryWallet;
        treasuryWallet = _treasuryWallet;
        emit TreasuryWalletUpdated(oldWallet, _treasuryWallet);
    }
    
    /**
     * @dev Update ZKP verifier contract address
     * @param _zkpVerifier New ZKP verifier contract address
     */
    function updateZKPVerifier(address _zkpVerifier) external onlyOwner {
        require(_zkpVerifier != address(0), "Invalid ZKP verifier");
        address oldVerifier = address(zkpVerifier);
        zkpVerifier = ZKPVerifier(_zkpVerifier);
        emit ZKPVerifierUpdated(oldVerifier, _zkpVerifier);
    }
}