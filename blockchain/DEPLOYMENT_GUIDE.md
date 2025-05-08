# Deployment Guide for ZKP Tax System Smart Contracts

This guide provides step-by-step instructions for deploying the ZKP Tax System smart contracts to the Sepolia testnet and testing their functionality.

## Prerequisites

Before you begin, make sure you have:

1. Node.js and npm installed
2. An Ethereum wallet with a private key (e.g., Metamask)
3. Sepolia ETH in your wallet (from a faucet)
4. An Alchemy or Infura API key for Sepolia
5. An Etherscan API key for contract verification

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the `src/blockchain` directory with the following content:
   ```
   # Ethereum wallet private key for deployment
   PRIVATE_KEY=your_private_key_here
   
   # Infura or Alchemy API key for Sepolia testnet
   SEPOLIA_API_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key_here
   
   # Etherscan API key for contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

3. Replace the placeholder values with your actual private key and API keys.

## Check Account Balance

Before deploying, check that your account has sufficient Sepolia ETH:

```
npm run accounts:sepolia
```

If your balance is low, get Sepolia ETH from a faucet:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## Deployment Process

### 1. Compile Smart Contracts

```
npm run compile
```

This will compile the smart contracts and generate the artifacts in the `artifacts` directory.

### 2. Deploy to Sepolia

```
npm run deploy:sepolia
```

This will:
- Deploy the ZKPVerifier contract
- Deploy the TaxSystem contract with the ZKPVerifier address
- Save the deployment information to `deployments/sepolia.json`
- Print verification commands

The output will look something like:

```
Deploying ZKP Tax System contracts...
Network: sepolia
ZKPVerifier deployed to: 0x...
TaxSystem deployed to: 0x...
Treasury wallet set to: 0x...
Deployment complete!
Deployment info saved to deployments/sepolia.json

To verify contracts on Etherscan:
npx hardhat verify --network sepolia 0x... (ZKPVerifier address)
npx hardhat verify --network sepolia 0x... 0x... 0x... (TaxSystem, treasury, ZKPVerifier addresses)
```

### 3. Verify Contracts on Etherscan

Use the commands printed by the deployment script to verify your contracts on Etherscan:

```
npx hardhat verify --network sepolia <ZKPVerifier-address>
npx hardhat verify --network sepolia <TaxSystem-address> <treasury-wallet-address> <ZKPVerifier-address>
```

After successful verification, you'll be able to interact with your contracts through Etherscan's UI.

## Testing Deployed Contracts

### 1. Update Test Script with Deployed Addresses

```
npm run update-test:sepolia
```

This will update the `test-contracts.js` file with the addresses of your deployed contracts from `deployments/sepolia.json`.

### 2. Run Tests on Deployed Contracts

```
npm run test:sepolia
```

This will execute a series of tests on your deployed contracts:
1. Store an income commitment
2. Process a tax payment
3. Get treasury balance
4. Update treasury wallet (admin function)

The test script will output detailed information about each test, including transaction hashes and verification results.

## Troubleshooting

### Deployment Failures

- **Insufficient Gas**: Increase the `gasMultiplier` in `hardhat.config.js`
- **Nonce Error**: Your account might have pending transactions. Wait for them to complete or reset your account nonce in Metamask.
- **API Rate Limit**: If using a free API key, you might hit rate limits. Wait and try again later.

### Verification Failures

- **Contract Not Found**: Make sure you're using the correct contract address
- **Constructor Arguments**: Ensure you're providing the correct constructor arguments in the right order
- **Compiler Version Mismatch**: Make sure the compiler version in `hardhat.config.js` matches the one used for deployment

## Interacting with Deployed Contracts

After deployment and verification, you can interact with your contracts through:

1. **Etherscan UI**: Use the "Write Contract" and "Read Contract" tabs on Etherscan
2. **Custom Frontend**: Update your frontend to use the deployed contract addresses
3. **Hardhat Console**: Use `npx hardhat console --network sepolia` to interact with contracts programmatically

## Deployment to Mainnet

When you're ready to deploy to mainnet:

1. Update your `.env` file with mainnet API URLs
2. Ensure your wallet has sufficient ETH for deployment
3. Update `hardhat.config.js` to include mainnet configuration
4. Run `npx hardhat run scripts/deploy.js --network mainnet`

**IMPORTANT**: Mainnet deployments involve real funds. Double-check everything before deploying.
