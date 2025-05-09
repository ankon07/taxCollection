# Zero-Knowledge Proof (ZKP) System

This directory contains the Zero-Knowledge Proof (ZKP) system for the Tax System application. The ZKP system allows users to prove that their income is above a certain threshold without revealing their actual income.

## Overview

The ZKP system uses [Circom](https://docs.circom.io/) and [SnarkJS](https://github.com/iden3/snarkjs) to generate and verify zero-knowledge proofs. The system consists of the following components:

1. **Circom Circuit**: The circuit defines the computation that we want to prove. In this case, we want to prove that a user's income is above a certain threshold.
2. **ZKP Service**: A JavaScript service that generates and verifies zero-knowledge proofs.
3. **Smart Contracts**: Solidity contracts that verify the proofs on the blockchain.

## Directory Structure

- `circuits/`: Contains the Circom circuit definitions.
- `build/`: Contains the compiled circuit and other build artifacts.
- `temp/`: Temporary directory for proof generation.
- `verification_key.json`: The verification key for the circuit.
- `income_range.wasm`: The WebAssembly file for the circuit.
- `income_range.zkey`: The proving key for the circuit.
- `generate-proof.js`: A helper script for generating proofs.

## Setup

The ZKP system has been set up using the `setup-zkp.js` script in the `blockchain/scripts` directory. This script performs the following steps:

1. Creates the necessary directories.
2. Installs the required dependencies.
3. Downloads or creates the Circom circuit.
4. Compiles the circuit.
5. Generates the proving and verification keys.
6. Creates a helper script for generating proofs.
7. Generates a Solidity verifier contract.
8. Copies the necessary files to the backend.

## Usage

### Generating a Proof

To generate a proof, you can use the `generate-proof.js` script:

```bash
node blockchain/zkp/generate-proof.js <income> <randomSecret> <threshold>
```

For example:

```bash
node blockchain/zkp/generate-proof.js 800000 123456789 700000
```

This will generate a proof that the income (800000) is greater than the threshold (700000) without revealing the actual income.

### Verifying a Proof

To verify a proof, you can use the `verifyProof` method in the `zkpService.js` file:

```javascript
const zkpService = require('./utils/zkpService');
const isValid = await zkpService.verifyProofData(proof, publicSignals);
```

### Verifying a Proof on the Blockchain

To verify a proof on the blockchain, you can use the `verifyZKPOnChain` method in the `blockchainService.js` file:

```javascript
const blockchainService = require('./utils/blockchainService');
const { isValid, txHash } = await blockchainService.verifyZKPOnChain(
  userAddress,
  proof,
  publicSignals
);
```

## Testing

You can test the ZKP system using the following scripts:

- `backend/scripts/test-zkp.js`: Tests the proof generation and verification locally.
- `backend/scripts/test-zkp-blockchain.js`: Tests the proof verification on the blockchain.

## Deployment

To deploy the ZKP system to the blockchain, you can use the `deploy-zkp-verifier.js` script in the `backend/scripts` directory:

```bash
cd blockchain && npx hardhat run ../backend/scripts/deploy-zkp-verifier.js --network sepolia
```

This will deploy the Groth16Verifier, ZKPVerifier, and TaxSystem contracts to the blockchain and update the backend configuration with the contract addresses.

## Integration with the Tax System

The ZKP system is integrated with the Tax System application. Users can generate proofs that their income is above a certain threshold without revealing their actual income. The proofs are verified on the blockchain, and users can make tax payments based on the verified proofs.

## Security Considerations

- The ZKP system uses the Groth16 proving system, which is considered secure.
- The circuit is designed to prevent users from proving false statements.
- The smart contracts verify the proofs on the blockchain, ensuring that the proofs are valid.
- The system uses cryptographic commitments to prevent users from changing their income after generating a proof.

## References

- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Zero-Knowledge Proofs for Engineers](https://blog.zkga.me/intro-to-zksnarks)
