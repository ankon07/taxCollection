# ZKP-Based Blockchain Tax Collection System - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Technologies Used](#technologies-used)
4. [User Features](#user-features)
5. [Getting Started](#getting-started)
6. [Dashboard](#dashboard)
7. [Income Declaration](#income-declaration)
8. [Tax Calculation](#tax-calculation)
9. [Bank Account Management](#bank-account-management)
10. [Tax Payment](#tax-payment)
11. [Tax History](#tax-history)
12. [Wallet Integration](#wallet-integration)
13. [Zero-Knowledge Proofs](#zero-knowledge-proofs)
14. [Blockchain Verification](#blockchain-verification)
15. [Security Features](#security-features)
16. [Troubleshooting](#troubleshooting)

## Introduction

The ZKP-Based Blockchain Tax Collection System is a modern, secure platform that combines blockchain technology with zero-knowledge proofs to provide a transparent, efficient, and privacy-preserving tax collection system. This system allows users to declare income, calculate taxes, make payments, and verify tax receipts while maintaining privacy through advanced cryptographic techniques.

## System Architecture

The system consists of three main components:

1. **Frontend**: A React-based web application that provides the user interface
2. **Backend**: A Node.js/Express server that handles business logic and API endpoints
3. **Blockchain**: Smart contracts deployed on Ethereum (Sepolia testnet) that handle on-chain verification and payments

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│ Blockchain  │
│  (React.js) │◀────│ (Node.js)   │◀────│ (Ethereum)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Technologies Used

### Frontend
- **React.js**: JavaScript library for building user interfaces
- **Material-UI**: React component library implementing Google's Material Design
- **Ethers.js**: Library for interacting with the Ethereum blockchain
- **Web3.js**: Library for interacting with the Ethereum blockchain
- **Formik & Yup**: Form handling and validation
- **React Router**: Navigation and routing
- **Axios**: HTTP client for API requests
- **React-Toastify**: Toast notifications
- **jsPDF**: PDF generation for tax receipts
- **snarkjs**: JavaScript implementation of zk-SNARKs

### Backend
- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Joi**: Data validation
- **Web3.js**: Ethereum blockchain interaction
- **snarkjs**: Zero-knowledge proof generation and verification

### Blockchain
- **Solidity**: Smart contract programming language
- **Hardhat**: Ethereum development environment
- **OpenZeppelin Contracts**: Secure smart contract library
- **Ethers.js**: Ethereum blockchain interaction
- **Web3.js**: Ethereum blockchain interaction

## User Features

The system provides the following key features:

1. **User Authentication**: Secure registration and login
2. **Income Declaration**: Declare income with privacy-preserving zero-knowledge proofs
3. **Tax Calculation**: Calculate tax liability based on income and applicable rates
4. **Bank Account Management**: Link bank accounts for automated tax deduction
5. **Tax Payment**: Pay taxes through blockchain transactions
6. **Tax History**: View history of tax payments and receipts
7. **Blockchain Verification**: Verify tax payments on the blockchain
8. **Zero-Knowledge Proofs**: Prove income ranges without revealing exact income

## Getting Started

### Registration and Login

1. Navigate to the registration page
2. Fill in your personal details (name, email, password)
3. Submit the registration form
4. Verify your email address (if required)
5. Log in with your credentials

### Profile Setup

1. Complete your profile with additional information
2. Set up two-factor authentication (if available)
3. Connect your blockchain wallet (optional but recommended)

## Dashboard

The dashboard provides an overview of your tax status and pending actions:

- **Total Tax Paid**: Summary of all tax payments
- **Tax Status**: Current status for the fiscal year
- **Bank Accounts**: Number of linked bank accounts
- **Pending Actions**: Tasks requiring your attention
- **Recent Tax Payments**: Latest tax payment history
- **Quick Actions**: Shortcuts to common tasks

## Income Declaration

The income declaration process uses zero-knowledge proofs to maintain privacy:

1. Navigate to the Income Declaration page
2. Enter your income details
3. Generate a cryptographic commitment
4. Select an income range to prove (e.g., "Income > 700,000 BDT")
5. Generate a zero-knowledge proof
6. Submit the proof for verification

The system will verify that your income falls within the declared range without revealing the exact amount.

## Tax Calculation

The tax calculation feature determines your tax liability:

1. Navigate to the Tax Calculation page
2. Review your income details (from your income declaration)
3. View the calculated tax amount based on applicable tax rates
4. Review tax deductions and exemptions (if applicable)
5. Confirm the final tax amount

## Bank Account Management

Link your bank accounts for automated tax deduction:

1. Navigate to the Bank Accounts page
2. Click "Add Bank Account"
3. Enter your bank account details
4. Verify the account (may require additional authentication)
5. Set up automatic deduction preferences (if applicable)

## Tax Payment

Pay your taxes through the system:

1. Navigate to the Tax Payment page
2. Review your tax liability
3. Select a payment method:
   - Bank account transfer
   - Blockchain wallet payment
4. Confirm the payment
5. Receive a tax receipt with blockchain verification

## Tax History

View your tax payment history:

1. Navigate to the Tax History page
2. View a list of all tax payments
3. Filter by fiscal year or payment status
4. Click on a payment to view details
5. Download tax receipts as PDF

## Wallet Integration

Connect your blockchain wallet for on-chain verification:

1. Navigate to the Connect Wallet page
2. Click "Connect Phantom Wallet"
3. Approve the connection request in your wallet
4. Link the wallet to your account
5. Use the wallet for tax payments and verification

## Zero-Knowledge Proofs

The system uses zero-knowledge proofs to protect your privacy:

1. **Commitment Generation**: Create a cryptographic commitment to your income
2. **Proof Generation**: Generate a proof that your income falls within a specific range
3. **Verification**: The system verifies the proof without learning your exact income
4. **On-chain Verification**: The proof can be verified on the blockchain

### Available Income Ranges

The system supports the following income ranges for zero-knowledge proofs:

- Income > 300,000 BDT
- Income > 400,000 BDT
- Income > 700,000 BDT
- Income > 1,100,000 BDT
- Income > 1,600,000 BDT

## Blockchain Verification

Verify tax payments and receipts on the blockchain:

1. Navigate to the Tax Receipt page
2. View the transaction hash for your payment
3. Click "Verify on Blockchain" to check the transaction status
4. View the blockchain confirmation details

## Security Features

The system implements several security features:

1. **Password Hashing**: Passwords are securely hashed using bcrypt
2. **JWT Authentication**: Secure token-based authentication
3. **Zero-Knowledge Proofs**: Privacy-preserving income verification
4. **Blockchain Verification**: Immutable record of tax payments
5. **Data Encryption**: Sensitive data is encrypted

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   - Ensure you have the Phantom wallet extension installed
   - Check that you're connected to the correct network (Sepolia testnet)
   - Try disconnecting and reconnecting the wallet

2. **Tax Payment Failures**
   - Verify you have sufficient funds in your wallet
   - Check that your wallet is properly connected
   - Ensure you've completed the income declaration process

3. **Zero-Knowledge Proof Generation Failures**
   - Ensure your income and random secret match your commitment
   - Verify that your income is above the selected threshold
   - Try generating the proof again with a new random secret

### Support

If you encounter issues not covered in this manual, please contact support at support@zkp-tax-system.com or use the in-app support feature.
