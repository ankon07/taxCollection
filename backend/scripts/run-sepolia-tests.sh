#!/bin/bash

# Script to run Sepolia testnet contract tests

# Set environment variables
# Replace these values with your own if needed
export BLOCKCHAIN_PROVIDER="https://eth-sepolia.g.alchemy.com/v2/RqzNsM3Vpf-a3KgwTCE0osmH0z-2ug9G"

# Uncomment and set your private key if you have one
# WARNING: Be careful with private keys, never commit them to git
# export PRIVATE_KEY="your_private_key_here"

# Run the test script
echo "Running Sepolia testnet contract tests..."
node backend/scripts/test-sepolia-contracts.js

# Exit with the same status as the test script
exit $?
