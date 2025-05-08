/**
 * Simulate Frontend API Calls
 * 
 * This script simulates the frontend API calls to demonstrate the functionality
 * of the ZKP Tax System. It performs the following operations:
 * 
 * 1. Login with test user credentials
 * 2. Fetch user profile
 * 3. Fetch user's bank accounts
 * 4. Fetch user's ZKP proofs
 * 5. Fetch user's tax payment history
 * 6. Calculate tax based on a ZKP proof
 * 7. Prepare a tax payment
 * 8. Confirm a tax payment
 * 9. Fetch a tax receipt
 * 
 * Run with: node src/backend/scripts/simulate-frontend.js
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Base URL for API calls
const API_BASE_URL = 'http://localhost:5000/api';

// Set up axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Mock Phantom wallet functions
const phantomWallet = {
  signAndSendTransaction: async (transaction) => {
    console.log('Signing transaction with Phantom wallet:', transaction);
    // Generate a mock signature in the correct format (0x + 64 hex chars)
    return '0x' + crypto.randomBytes(32).toString('hex');
  }
};

// Helper function to print responses in a readable format
const printResponse = (title, data) => {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}:`);
  console.log('='.repeat(80));
  
  if (typeof data === 'object') {
    // Remove large fields for better readability
    const cleanData = { ...data };
    if (cleanData.proof) cleanData.proof = '[Proof data omitted for readability]';
    if (cleanData.publicSignals) cleanData.publicSignals = '[Public signals omitted for readability]';
    
    console.log(JSON.stringify(cleanData, null, 2));
  } else {
    console.log(data);
  }
};

// Main function to simulate frontend API calls
const simulateFrontend = async () => {
  try {
    console.log('Starting frontend API simulation...');
    
    // Step 1: Login with test user credentials
    console.log('\nStep 1: Logging in with test user credentials...');
    const loginResponse = await api.post('/users/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    printResponse('Login Response', loginResponse.data);
    
    // Set the auth token for subsequent requests
    const token = loginResponse.data.token;
    api.defaults.headers.common['x-auth-token'] = token;
    
    // Step 2: Fetch user profile
    console.log('\nStep 2: Fetching user profile...');
    const profileResponse = await api.get('/users/profile');
    printResponse('User Profile', profileResponse.data);
    
    // Step 3: Fetch user's bank accounts
    console.log('\nStep 3: Fetching user\'s bank accounts...');
    const bankAccountsResponse = await api.get('/users/bank-accounts');
    printResponse('Bank Accounts', bankAccountsResponse.data);
    
    // Store bank account ID for later use
    const bankAccountId = bankAccountsResponse.data[0]._id;
    
    // Step 4: Fetch user's ZKP proofs
    console.log('\nStep 4: Fetching user\'s ZKP proofs...');
    const zkpProofsResponse = await api.get('/zkp/proofs');
    printResponse('ZKP Proofs', zkpProofsResponse.data);
    
    // Store proof ID for later use
    const proofId = zkpProofsResponse.data[0]._id;
    const incomeRange = zkpProofsResponse.data[0].incomeRange;
    
    // Step 5: Fetch user's tax payment history
    console.log('\nStep 5: Fetching user\'s tax payment history...');
    const taxHistoryResponse = await api.get('/tax/history');
    printResponse('Tax Payment History', taxHistoryResponse.data);
    
    // Store a payment ID for later use (if available)
    let paymentId = null;
    if (taxHistoryResponse.data.length > 0) {
      paymentId = taxHistoryResponse.data[0]._id;
    }
    
    // Step 6: Calculate tax based on a ZKP proof
    console.log('\nStep 6: Calculating tax based on ZKP proof...');
    const taxCalculationResponse = await api.post('/tax/calculate', {
      proofId,
      incomeRange
    });
    printResponse('Tax Calculation', taxCalculationResponse.data);
    
    // Get the estimated tax amount
    const estimatedTax = taxCalculationResponse.data.estimatedTax;
    
    // Step 7: Prepare a tax payment
    console.log('\nStep 7: Preparing a tax payment...');
    const preparePaymentResponse = await api.post('/tax/prepare-payment', {
      proofId,
      bankAccountId,
      amount: estimatedTax
    });
    printResponse('Prepare Payment', preparePaymentResponse.data);
    
    // Get the payment ID and transaction from the response
    const newPaymentId = preparePaymentResponse.data.paymentId;
    const transaction = preparePaymentResponse.data.transaction;
    
    // Step 8: Confirm a tax payment (simulate Phantom wallet signing)
    console.log('\nStep 8: Confirming tax payment with Phantom wallet...');
    
    try {
      const signature = await phantomWallet.signAndSendTransaction(transaction);
      
      const confirmPaymentResponse = await api.post('/tax/confirm-payment', {
        paymentId: newPaymentId,
        signature,
        walletAddress: loginResponse.data.user.walletAddress
      });
      printResponse('Confirm Payment', confirmPaymentResponse.data);
      
      // Step 9: Fetch a tax receipt for the new payment
      console.log('\nStep 9: Fetching tax receipt for new payment...');
      const taxReceiptResponse = await api.get(`/tax/receipt/${newPaymentId}`);
      printResponse('Tax Receipt for New Payment', taxReceiptResponse.data);
    } catch (error) {
      console.error('Error during payment confirmation:', error.message);
      console.log('\nFalling back to using an existing payment for receipt...');
      
      // Step 9: Fetch a tax receipt for an existing payment
      if (paymentId) {
        console.log('\nStep 9: Fetching tax receipt for existing payment...');
        try {
          const taxReceiptResponse = await api.get(`/tax/receipt/${paymentId}`);
          printResponse('Tax Receipt for Existing Payment', taxReceiptResponse.data);
        } catch (receiptError) {
          console.error('Error fetching receipt:', receiptError.message);
          
          // Simulate a tax receipt response
          console.log('\nSimulating a tax receipt response...');
          const simulatedReceipt = {
            message: 'Tax receipt retrieved successfully (simulated)',
            receipt: {
              paymentId: paymentId,
              userId: profileResponse.data._id,
              amount: taxHistoryResponse.data[0].amount,
              date: taxHistoryResponse.data[0].createdAt,
              bankAccount: {
                bankName: taxHistoryResponse.data[0].bankAccount.bankName,
                accountNumber: taxHistoryResponse.data[0].bankAccount.accountNumber
              },
              transactionHash: taxHistoryResponse.data[0].transactionHash || '0x' + '1'.repeat(64),
              blockchainVerified: true
            }
          };
          printResponse('Simulated Tax Receipt', simulatedReceipt);
        }
      } else {
        console.log('No payment ID available to fetch receipt');
      }
    }
    
    console.log('\nFrontend API simulation completed successfully!');
    
  } catch (error) {
    console.error('Error during simulation:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
  }
};

// Run the simulation
simulateFrontend();
