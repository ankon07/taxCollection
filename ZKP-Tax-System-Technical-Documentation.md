# ZKP Tax System Technical Documentation

## Overview

The ZKP Tax System is a blockchain-based application that leverages Zero-Knowledge Proofs (ZKPs) to enable privacy-preserving tax calculations and payments. This system allows taxpayers to prove they are paying the correct amount of tax without revealing their exact income, while ensuring transparency and immutability of tax records through blockchain technology.

## Smart Contracts Architecture

The system consists of two main smart contracts:

### 1. TaxSystem.sol

This contract manages tax payments with zero-knowledge proof verification.

**Key Functions:**
- `storeCommitment(string memory commitment)`: Stores a cryptographic commitment of a user's income.
- `processTaxPayment(uint256 amount, string memory proofId)`: Processes a tax payment and returns a payment hash.
- `verifyTaxReceipt(string memory paymentHash, address userAddress)`: Verifies if a tax receipt is valid.
- `getTreasuryBalance()`: Returns the balance of the treasury wallet.
- `generatePaymentHash(address userAddress, uint256 amount, string memory proofId)`: Generates a unique hash for a tax payment.
- `updateTreasuryWallet(address _treasuryWallet)`: Updates the treasury wallet address.
- `updateZKPVerifier(address _zkpVerifier)`: Updates the ZKP verifier contract address.

### 2. ZKPVerifier.sol

This contract handles the verification of Zero-Knowledge Proofs.

**Key Functions:**
- `storeCommitment(address userAddress, string memory commitment)`: Stores a user's income commitment.
- `verifyProof(address userAddress, bytes memory proof, bytes memory publicSignals)`: Verifies a ZKP proof.
- `isProofVerified(string memory proofId)`: Checks if a proof has been verified.
- `generateProofId(address userAddress, bytes memory proof, bytes memory publicSignals)`: Generates a unique ID for a proof.
- `getUserCommitment(address userAddress)`: Retrieves a user's commitment.

## Deployment Process

The `deploy.js` script handles the deployment of both contracts:
1. First, it deploys the ZKPVerifier contract
2. Then, it deploys the TaxSystem contract, passing the ZKPVerifier address and treasury wallet address
3. It saves deployment information to a JSON file in the deployments directory

## Backend Services

### BlockchainService

This service handles interactions with the blockchain:
- Loads contract ABIs
- Initializes contract instances
- Provides methods to interact with the contracts:
  - `storeCommitment`: Stores income commitments on the blockchain
  - `verifyZKPOnChain`: Verifies ZKP proofs on the blockchain
  - `processTaxPayment`: Processes tax payments on the blockchain
  - `verifyTaxReceipt`: Verifies tax receipts on the blockchain
  - `getTreasuryBalance`: Gets the treasury wallet balance
  - `getUserTransactions`: Retrieves a user's blockchain transactions
  - `getNetworkStatus`: Gets blockchain network status
  - `getTransaction`: Gets transaction details by hash

### ZkpService

This service handles Zero-Knowledge Proof operations:
- Defines income ranges for ZKP proofs
- Provides methods for:
  - `generateCommitment`: Creates cryptographic commitments for income
  - `generateProof`: Generates ZKP proofs for income ranges
  - `verifyProofData`: Verifies ZKP proofs
  - `verifyProof`: Verifies proofs by ID
  - `getAvailableIncomeRanges`: Gets available income ranges for ZKP proofs
  - `getPublicParameters`: Gets public parameters for ZKP

### TaxController

This controller handles tax-related operations:
- Defines tax brackets
- Provides endpoints for:
  - `calculateTax`: Calculates tax based on income range from ZKP
  - `preparePayment`: Prepares tax payment transactions for the blockchain
  - `confirmPayment`: Confirms tax payments after blockchain transactions
  - `payTax`: Processes tax payments (legacy method)
  - `getTaxHistory`: Retrieves a user's tax payment history
  - `getTaxReceipt`: Gets tax receipts by ID
  - `getTaxBrackets`: Retrieves tax brackets

## How Tax Calculation and Transactions Work

1. **Income Declaration with Privacy**:
   - Users declare their income by creating a cryptographic commitment using `generateCommitment`
   - This commitment is stored on the blockchain using `storeCommitment`

2. **Zero-Knowledge Proof Generation**:
   - Users generate a ZKP proof that their income falls within a specific range using `generateProof`
   - This allows them to prove their income bracket without revealing the exact amount

3. **Tax Calculation**:
   - The system calculates tax based on the proven income range using `calculateTax`
   - It applies the appropriate tax rate from the defined tax brackets

4. **Tax Payment Processing**:
   - Users initiate a tax payment using `preparePayment`
   - The payment is processed on the blockchain using `processTaxPayment`
   - A unique payment hash is generated using `generatePaymentHash`

5. **Payment Verification**:
   - Tax receipts can be verified using `verifyTaxReceipt`
   - The blockchain transaction can be verified using `verifyTaxReceipt` in the blockchain service

## Benefits of Blockchain Technology in the Tax System

### 1. Immutability and Transparency

- **Tamper-proof Records**: All tax payments are recorded on the blockchain, creating an immutable record that cannot be altered or deleted.
- **Transparent Audit Trail**: Government authorities and taxpayers can verify all transactions on the blockchain, ensuring transparency in tax collection.
- **Public Verification**: Anyone can verify that a tax payment has been made without needing access to private information.

### 2. Privacy Protection

- **Zero-Knowledge Proofs**: Users can prove they are paying the correct amount of tax without revealing their exact income.
- **Cryptographic Commitments**: Income information is stored as cryptographic commitments, protecting sensitive financial data.
- **Selective Disclosure**: Users control what information is shared with tax authorities.

### 3. Efficiency and Automation

- **Smart Contracts**: Tax calculations and payments are automated through smart contracts, reducing manual processing.
- **Instant Verification**: Tax receipts can be verified instantly on the blockchain.
- **Reduced Administrative Overhead**: Automated processes reduce the need for manual verification and paperwork.

### 4. Security

- **Cryptographic Security**: Blockchain's cryptographic foundations provide strong security for tax records.
- **Decentralization**: No single point of failure in the tax record system.
- **Fraud Prevention**: The immutable nature of blockchain makes tax fraud more difficult to commit.

### 5. Global Accessibility

- **Borderless Access**: Taxpayers can interact with the system from anywhere in the world.
- ** 24/7 Availability**: The blockchain operates continuously, allowing tax payments at any time.
- **Reduced Geographical Barriers**: Simplifies tax compliance for international taxpayers.

## System Tasks and Workflows

### User Registration and Authentication

1. Users register with the system providing basic information
2. Authentication is handled securely with JWT tokens
3. Users can update their profile information

### Wallet Connection

1. Users connect their blockchain wallet to the system
2. The system stores the user's blockchain public key
3. The wallet is used for signing tax payment transactions

### Bank Account Management

1. Users can add bank accounts to the system
2. Bank accounts are used as payment sources for tax payments
3. Users can view and manage their bank accounts

### Income Declaration

1. Users declare their income privately using zero-knowledge proofs
2. The system generates a cryptographic commitment of the income
3. The commitment is stored on the blockchain

### Tax Calculation

1. The system calculates tax based on the income range proven by ZKP
2. Tax brackets are applied according to the tax code
3. Users receive an estimated tax amount

### Tax Payment

1. Users initiate a tax payment from their connected bank account
2. The payment is processed on the blockchain
3. A unique payment hash and receipt are generated

### Tax Receipt Verification

1. Users can view their tax payment history
2. Tax receipts can be verified on the blockchain
3. The system provides proof of payment for tax authorities

### Administrative Functions

1. Treasury wallet management
2. Tax bracket updates
3. System monitoring and maintenance

## Technical Implementation Details

### Frontend Components

- **Authentication**: Login, Register, Profile management
- **Dashboard**: Overview of tax status and history
- **Wallet Connection**: Interface for connecting blockchain wallets
- **Bank Accounts**: Management of payment sources
- **Tax Declaration**: Income declaration with ZKP
- **Tax Calculation**: Visualization of tax brackets and calculated amounts
- **Tax Payment**: Interface for initiating and confirming payments
- **Tax History**: Record of past payments and receipts

### Backend APIs

- **User API**: User registration, authentication, and profile management
- **Blockchain API**: Interaction with blockchain contracts
- **ZKP API**: Generation and verification of zero-knowledge proofs
- **Tax API**: Tax calculation, payment processing, and receipt generation

### Blockchain Integration

- **Contract Deployment**: Automated deployment script for smart contracts
- **Transaction Handling**: Processing and verification of blockchain transactions
- **Event Monitoring**: Listening for relevant events from smart contracts

### Security Measures

- **JWT Authentication**: Secure user authentication
- **Cryptographic Commitments**: Protection of sensitive income data
- **Zero-Knowledge Proofs**: Privacy-preserving verification of income ranges
- **Blockchain Verification**: Tamper-proof record of tax payments

## Conclusion

The ZKP Tax System demonstrates how blockchain technology and zero-knowledge proofs can be combined to create a privacy-preserving, transparent, and efficient tax system. By leveraging these technologies, the system provides benefits to both taxpayers and tax authorities, ensuring privacy while maintaining compliance and transparency.
