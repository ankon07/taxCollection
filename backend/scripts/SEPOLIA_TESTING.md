# Sepolia Testnet Contract Testing

This directory contains scripts for testing the ZKP Tax System smart contracts on the Sepolia testnet.

## Overview

The test scripts allow you to interact with the deployed smart contracts on the Sepolia testnet to verify their functionality. The main functions tested include:

1. Getting the treasury balance
2. Storing a commitment
3. Processing a tax payment with ZKP verification
4. Verifying a tax receipt
5. Checking the total tax collected

## Prerequisites

Before running the tests, ensure you have:

1. Node.js and npm installed
2. The required npm packages installed (`web3`, `crypto`, etc.)
3. Access to the Sepolia testnet via an Ethereum provider (e.g., Alchemy, Infura)
4. A private key with some Sepolia ETH for transaction fees

## Getting Sepolia ETH

To run the tests, you'll need some Sepolia ETH. You can get it from:

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## Configuration

The test scripts use environment variables for configuration:

- `BLOCKCHAIN_PROVIDER`: URL of the Ethereum provider (default: Alchemy Sepolia endpoint)
- `PRIVATE_KEY`: Your private key for signing transactions

You can set these in the `run-sepolia-tests.sh` script or export them in your terminal before running the tests.

## Running the Tests

### Using the Shell Script

The easiest way to run the tests is using the provided shell script:

```bash
./backend/scripts/run-sepolia-tests.sh
```

### Manually

Alternatively, you can run the test script directly:

```bash
# Set environment variables
export BLOCKCHAIN_PROVIDER="your_provider_url"
export PRIVATE_KEY="your_private_key"

# Run the test script
node backend/scripts/test-sepolia-contracts.js
```

## Test Script Details

The `test-sepolia-contracts.js` script performs the following tests:

1. **Get Treasury Balance**: Retrieves the current balance of the treasury wallet.
2. **Store Commitment**: Generates a commitment for a simulated income and stores it on the ZKPVerifier contract.
3. **Process Tax Payment**: Simulates a tax payment with a ZKP proof and processes it on the TaxSystem contract.
4. **Verify Tax Receipt**: Verifies the tax receipt generated from the payment.
5. **Get Treasury Balance Again**: Checks the updated treasury balance after the payment.
6. **Get Total Tax Collected**: Retrieves the total amount of tax collected by the system.

## Troubleshooting

If you encounter issues:

1. **Connection Issues**: Ensure your Ethereum provider URL is correct and accessible.
2. **Transaction Failures**: Make sure your account has enough Sepolia ETH for gas fees.
3. **Contract Errors**: Verify that the contract addresses in the deployment file are correct.
4. **Invalid Proofs**: The test uses simulated ZKP proofs which may not pass verification in the actual contracts. This is expected in a test environment.

## Security Notes

- The test script includes a default private key for testing. **NEVER** use this key for real funds.
- When using your own private key, be careful not to commit it to version control.
- These tests are for development and testing purposes only and should not be used with real funds.
