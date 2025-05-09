# ZKP Tax System

A blockchain-based tax collection system using Zero-Knowledge Proofs for privacy-preserving income verification.

![ZKP Tax System](https://via.placeholder.com/800x400?text=ZKP+Tax+System)

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Blockchain Technology](#blockchain-technology)
- [Backend Structure](#backend-structure)
- [User Guide](#user-guide)
- [Technical Overview](#technical-overview)
- [Privacy and Security](#privacy-and-security)
- [Installation and Setup](#installation-and-setup)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

The ZKP Tax System is a modern, privacy-focused tax collection platform that leverages blockchain technology and Zero-Knowledge Proofs (ZKPs) to enable secure, transparent, and privacy-preserving tax payments. The system allows taxpayers to:

- Declare income without revealing exact amounts
- Prove they are in the correct tax bracket without disclosing precise income
- Make tax payments with blockchain-based verification
- Receive immutable tax receipts stored on the blockchain
- Manage bank accounts for automated tax deductions
- View tax payment history with verifiable receipts

By using Zero-Knowledge Proofs, the system ensures that taxpayers can prove they have paid the correct amount of tax without revealing their exact income, providing a balance between transparency for tax authorities and privacy for taxpayers.

## System Architecture

The ZKP Tax System consists of four main components:

### 1. Frontend Application (React)

The user interface that allows taxpayers to interact with the system. It includes:

- User authentication and profile management
- Income declaration with ZKP generation
- Tax calculation based on income brackets
- Tax payment processing
- Bank account management
- Tax history and receipt viewing

### 2. Backend API (Express.js)

The server-side application that handles:

- User authentication and authorization
- Tax calculation logic
- ZKP generation and verification
- Communication with the blockchain
- Database operations
- API endpoints for the frontend

### 3. Blockchain Layer (Ethereum)

Smart contracts that provide:

- Immutable storage of tax payment records
- Verification of Zero-Knowledge Proofs
- Secure tax payment processing
- Tamper-proof tax receipts
- Transparent treasury management

### 4. Zero-Knowledge Proof System

Cryptographic protocols that enable:

- Privacy-preserving income verification
- Proof of correct tax bracket without revealing exact income
- Secure commitment schemes for income declaration
- Verification of tax compliance without compromising privacy

## Key Features

### For Taxpayers

- **Privacy-Preserving Income Declaration**: Declare income and generate cryptographic commitments without revealing exact amounts.
- **Secure Tax Bracket Verification**: Prove you're in the correct tax bracket without disclosing your precise income.
- **Blockchain-Based Tax Payments**: Make tax payments that are recorded on the blockchain for transparency and immutability.
- **Digital Tax Receipts**: Receive verifiable tax receipts stored on the blockchain.
- **Bank Account Integration**: Link bank accounts for automated tax deductions.
- **Tax History Dashboard**: View your tax payment history with detailed information and receipts.

### For Tax Authorities

- **Verifiable Tax Compliance**: Verify taxpayers are in the correct tax bracket without seeing their exact income.
- **Transparent Tax Collection**: Monitor tax collection with blockchain-based transparency.
- **Immutable Payment Records**: Access tamper-proof records of all tax payments.
- **Automated Verification**: Automatically verify Zero-Knowledge Proofs for tax bracket compliance.
- **Treasury Management**: Track total tax collected and manage the treasury wallet.

## Blockchain Technology

The ZKP Tax System leverages several blockchain technologies and libraries to provide secure, transparent, and privacy-preserving tax collection:

### Core Blockchain Infrastructure

- **Ethereum**: The system uses Ethereum as its primary blockchain platform, providing a secure and decentralized foundation for smart contracts and transactions.
- **Sepolia Testnet**: For testing and development, the system is deployed on the Sepolia testnet, allowing for realistic testing without using real ETH.
- **Smart Contracts**: Written in Solidity 0.8.x, the smart contracts handle ZKP verification, tax payment processing, and receipt generation.

### Smart Contract Components

- **ZKPVerifier**: A specialized contract that verifies zero-knowledge proofs submitted by taxpayers.
- **ZKPVerifierFixed**: An optimized version of the verifier with improved gas efficiency.
- **ZKPVerifierGenerated**: Automatically generated from the verification key using snarkjs.
- **TaxSystem**: The main contract that handles tax payments, receipts, and treasury management.

### Development and Deployment Tools

- **Hardhat**: Used as the primary development environment for compiling, testing, and deploying smart contracts.
- **ethers.js**: Library for interacting with the Ethereum blockchain from both the frontend and backend.
- **Web3.js**: Alternative library used for specific blockchain interactions.
- **Hardhat Plugins**:
  - **hardhat-deploy**: For managing deployments across different networks
  - **hardhat-gas-reporter**: For optimizing gas usage
  - **hardhat-contract-sizer**: For monitoring contract size

### Zero-Knowledge Proof Integration

- **circom**: Used to create the ZKP circuits for income range verification.
- **snarkjs**: JavaScript library that generates and verifies ZKPs.
- **groth16**: The proving system used for efficient ZKP generation and verification.

### Deployment Process

1. ZKP circuits are compiled using circom to generate the necessary files.
2. A trusted setup is performed to generate proving and verification keys.
3. The verifier contract is generated from the verification key.
4. Smart contracts are deployed to the target network (local, testnet, or mainnet).
5. Contract addresses and ABIs are updated in the backend and frontend configurations.

## Backend Structure

The backend of the ZKP Tax System is built with Node.js and Express.js, organized in a modular architecture for maintainability and scalability:

### Core Components

- **Server**: The main Express application that handles HTTP requests and middleware integration.
- **Routes**: API endpoints organized by domain (user, tax, blockchain, zkp).
- **Controllers**: Business logic handlers that process requests and return responses.
- **Models**: MongoDB schemas and models for data persistence.
- **Middleware**: Request processing functions for authentication, error handling, etc.
- **Utils**: Utility services and helper functions.

### API Structure

The backend API is organized into four main domains:

1. **User API** (`/userRoutes.js`):
   - User registration and authentication
   - Profile management
   - Session handling

2. **Tax API** (`/taxRoutes.js`):
   - Tax bracket information
   - Tax calculation
   - Payment processing
   - Receipt generation
   - Tax history

3. **Blockchain API** (`/blockchainRoutes.js`):
   - Smart contract interaction
   - Transaction submission
   - Blockchain data retrieval
   - Treasury management

4. **ZKP API** (`/zkpRoutes.js`):
   - Income commitment generation
   - ZKP generation
   - ZKP verification
   - Public parameters retrieval

### Services and Utilities

- **blockchainService.js**: Handles all interactions with the Ethereum blockchain, including contract calls and transaction submission.
- **zkpService.js**: Manages ZKP operations, including commitment generation, proof creation, and verification.
- **authMiddleware.js**: Handles user authentication and authorization for protected routes.

### Database Models

- **User.js**: Stores user account information and profile details.
- **BankAccount.js**: Manages linked bank accounts for tax payments.
- **TaxPayment.js**: Records tax payment information and receipt details.
- **ZkpProof.js**: Stores ZKP-related data, including commitments and proofs.

### Integration Points

- **Blockchain Integration**: The backend communicates with the Ethereum blockchain using ethers.js through the blockchainService.
- **ZKP Integration**: Zero-knowledge proof operations are handled by snarkjs through the zkpService.
- **Frontend Communication**: The backend exposes RESTful APIs that the React frontend consumes using Axios.

## User Guide

### Registration and Authentication

1. **Create an Account**: Sign up with your email, password, and personal information.
2. **Verify Your Identity**: Complete the identity verification process.
3. **Set Up Your Profile**: Add additional information to your profile.

### Income Declaration

1. **Navigate to Income Declaration**: Go to the "Declare Income" section from the dashboard.
2. **Enter Your Income**: Input your income for the current fiscal year.
3. **Generate ZKP**: The system will generate a Zero-Knowledge Proof that you're in the correct tax bracket.
4. **Submit Declaration**: Submit your income declaration with the ZKP.

### Tax Calculation

1. **Go to Tax Calculation**: Access the "Calculate Tax" section from the dashboard.
2. **Select Income Commitment**: Choose your income commitment from the dropdown (displays the full commitment ID).
3. **Select Income Range**: Choose the income range that applies to you.
4. **Calculate Tax**: The system will calculate your tax based on the selected range.
5. **Review Calculation**: Review the tax calculation details before proceeding to payment.

### Bank Account Management

1. **Access Bank Accounts**: Go to the "Bank Accounts" section from the dashboard.
2. **Add a Bank Account**: Link a new bank account by providing the required details.
3. **Set Primary Account**: Designate a primary account for tax deductions.
4. **Manage Accounts**: View, edit, or remove linked bank accounts.

### Tax Payment

1. **Navigate to Tax Payment**: Go to the "Pay Tax" section from the dashboard.
2. **Select Payment Method**: Choose to pay from a linked bank account or using cryptocurrency.
3. **Review Payment Details**: Verify the payment amount and details.
4. **Confirm Payment**: Authorize the payment, which will be recorded on the blockchain.
5. **Receive Receipt**: Get a digital tax receipt stored on the blockchain.

### Tax History and Receipts

1. **View Tax History**: Access the "Tax History" section to see all your tax payments.
2. **Filter and Search**: Filter payments by date, amount, or status.
3. **View Receipt Details**: Click on a payment to see the detailed receipt.
4. **Verify Receipt**: Verify the authenticity of the receipt on the blockchain.
5. **Download Receipt**: Download a PDF version of the receipt for your records.

## Technical Overview

### Frontend Technologies

- **React**: JavaScript library for building the user interface
- **Material-UI**: React component library for consistent design
- **Web3.js**: Library for interacting with Ethereum blockchain
- **Axios**: HTTP client for API requests
- **React Router**: For navigation between pages
- **Context API**: For state management
- **react-toastify**: For displaying notifications

### Backend Technologies

- **Node.js**: JavaScript runtime for the server
- **Express.js**: Web framework for the API
- **MongoDB**: Database for storing user data and tax records
- **Mongoose**: ODM for MongoDB
- **JSON Web Tokens (JWT)**: For authentication
- **bcrypt**: For password hashing
- **snarkjs**: Library for Zero-Knowledge Proof operations
- **ethers.js**: Library for Ethereum blockchain interaction

### Blockchain Technologies

- **Ethereum**: Blockchain platform for smart contracts
- **Solidity**: Programming language for smart contracts
- **Hardhat**: Development environment for Ethereum
- **ethers.js**: Library for interacting with Ethereum
- **circom**: Language for creating ZKP circuits
- **groth16**: Proving system for ZKPs

### Zero-Knowledge Proof Implementation

The system uses the following ZKP components:

- **Commitment Scheme**: Hash-based commitments for income declaration
- **Range Proofs**: ZKPs that prove income is within a specific range
- **Verification Circuit**: Circuit for verifying the ZKPs on-chain
- **snarkjs**: JavaScript library for generating and verifying ZKPs
- **WASM**: WebAssembly for efficient ZKP operations

## Privacy and Security

### Privacy Features

- **Zero-Knowledge Proofs**: Prove statements about your income without revealing the actual amount
- **Cryptographic Commitments**: Securely commit to your income without disclosing it
- **Minimal Data Collection**: Only essential information is collected and stored
- **Decentralized Verification**: Verification happens on the blockchain without central authority access to private data

### Security Measures

- **Blockchain Immutability**: Tax records are stored on the blockchain, making them tamper-proof
- **Smart Contract Security**: Smart contracts are audited for security vulnerabilities
- **Encryption**: Sensitive data is encrypted in transit and at rest
- **Authentication**: Secure authentication with JWT and password hashing
- **Authorization**: Role-based access control for different system functions

## Installation and Setup

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- MongoDB (local or cloud instance)
- Ethereum development environment (Hardhat)
- MetaMask or another Ethereum wallet

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ankon07/taxCollection.git
   cd zkp-tax-system
   ```

2. **Install Dependencies**:
   ```bash
   # Install backend dependencies
   cd src/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install

   # Install blockchain dependencies
   cd ../blockchain
   npm install
   ```

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env` in each directory and update the values
   - Set up MongoDB connection string in `src/backend/.env`
   - Configure blockchain provider URL and contract addresses
   - Set JWT secret for authentication

4. **Deploy Smart Contracts** (for development):
   ```bash
   cd src/blockchain
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. **Update Contract Addresses**:
   - Copy the deployed contract addresses to `src/backend/.env`
   - Update the contract ABIs in `src/backend/abis` and `src/frontend/src/abis`

### Running the Application

You can use the provided script to run both the backend and frontend concurrently:

```bash
./src/run-dev.sh
```

Or run them separately:

```bash
# Run the backend server
cd src/backend
npm run dev

# Run the frontend server
cd src/frontend
npm start
```

The backend server will run on http://localhost:5000 and the frontend on http://localhost:3000.

## Development

### Testing

#### Backend Tests

To run all backend tests:

```bash
cd src/backend
npm test
```

To run tests with coverage:

```bash
cd src/backend
npm run test:coverage
```

To run tests sequentially using the custom runner:

```bash
cd src/backend
npm run test:run
```

#### Smart Contract Tests

To test the smart contracts:

```bash
cd src/blockchain
npx hardhat test
```

To test on the Sepolia testnet:

```bash
cd src/blockchain
./scripts/run-sepolia-tests.sh
```

#### Integration Tests

To test the integration between frontend, backend, and blockchain:

```bash
cd src/backend
npm test -- tests/integration.test.js
```

### Code Structure

- **src/backend/**: Backend API server
  - **controllers/**: Request handlers
    - **blockchainController.js**: Handles blockchain interactions
    - **taxController.js**: Manages tax calculations and payments
    - **userController.js**: Handles user authentication and profile management
    - **zkpController.js**: Manages ZKP operations
  - **models/**: Database models
    - **BankAccount.js**: Bank account schema
    - **TaxPayment.js**: Tax payment schema
    - **User.js**: User schema
    - **ZkpProof.js**: ZKP proof schema
  - **routes/**: API routes
    - **blockchainRoutes.js**: Blockchain-related endpoints
    - **taxRoutes.js**: Tax-related endpoints
    - **userRoutes.js**: User-related endpoints
    - **zkpRoutes.js**: ZKP-related endpoints
  - **middleware/**: Express middleware
    - **authMiddleware.js**: Authentication middleware
  - **utils/**: Utility functions
    - **blockchainService.js**: Blockchain interaction service
    - **zkpService.js**: ZKP operations service
  - **tests/**: Test files

- **src/frontend/**: Frontend application
  - **src/components/**: React components
    - **auth/**: Authentication components
    - **bank/**: Bank account management components
    - **dashboard/**: Dashboard components
    - **layout/**: Layout components
    - **profile/**: User profile components
    - **tax/**: Tax-related components
    - **wallet/**: Wallet connection components
  - **src/context/**: Context providers
    - **AuthContext.js**: Authentication context
    - **WalletContext.js**: Wallet connection context
  - **src/abis/**: Contract ABIs

- **src/blockchain/**: Smart contracts and blockchain integration
  - **contracts/**: Solidity smart contracts
    - **TaxSystem.sol**: Main tax system contract
    - **ZKPVerifier.sol**: ZKP verification contract
    - **ZKPVerifierFixed.sol**: Optimized ZKP verifier
    - **ZKPVerifierGenerated.sol**: Generated ZKP verifier
  - **scripts/**: Deployment and testing scripts
  - **test/**: Contract test files
  - **deployments/**: Deployment artifacts

- **src/zkp/**: Zero-Knowledge Proof circuits and keys
  - **circuits/**: ZKP circuit definitions
  - **build/**: Compiled circuits and keys

## Troubleshooting

### Common Issues

#### Backend Connection Issues

- **MongoDB Connection Failure**:
  - Check that MongoDB is running
  - Verify the connection string in `.env`
  - Ensure network connectivity to the MongoDB server

- **API Endpoint Errors**:
  - Check the server logs for specific error messages
  - Verify that the routes are correctly defined
  - Ensure the controllers are handling requests properly

#### Frontend Issues

- **API Connection Errors**:
  - Check that the backend server is running
  - Verify the proxy setting in `package.json`
  - Check for CORS issues in the browser console

- **Wallet Connection Problems**:
  - Ensure MetaMask or another wallet is installed
  - Check that the wallet is connected to the correct network
  - Verify that the user has granted permission to the application

- **Rendering Issues**:
  - Check for JavaScript errors in the console
  - Verify that the data is being properly fetched from the API
  - Ensure that components are receiving the expected props

#### Blockchain Issues

- **Smart Contract Interaction Failures**:
  - Check that the contract addresses are correct
  - Verify that the ABIs match the deployed contracts
  - Ensure the user has sufficient funds for gas fees

- **Transaction Errors**:
  - Check the transaction parameters
  - Verify that the user has approved any required token allowances
  - Check for gas estimation errors

- **ZKP Verification Failures**:
  - Ensure the ZKP is generated correctly
  - Verify that the verification key matches the proving key
  - Check that the circuit inputs are valid

### Getting Help

If you encounter issues not covered in this troubleshooting guide:

1. Check the project's issue tracker for similar problems
2. Review the logs for error messages
3. Consult the documentation for the specific component causing the issue
