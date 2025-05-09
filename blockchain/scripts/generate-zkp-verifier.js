/**
 * Generate a new ZKPVerifierGenerated contract from the verification key
 * This script generates a new ZKPVerifierGenerated.sol file from the verification key
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Generating ZKPVerifierGenerated contract from verification key...');
  
  // Use the local installation of snarkjs
  console.log('Using local installation of snarkjs...');
  
  // Paths
  const verificationKeyPath = path.join(__dirname, '../zkp/verification_key.json');
  const outputPath = path.join(__dirname, '../contracts/ZKPVerifierGenerated.sol');
  
  // Check if verification key exists
  if (!fs.existsSync(verificationKeyPath)) {
    console.error(`Verification key not found at: ${verificationKeyPath}`);
    process.exit(1);
  }
  
  // Generate the verifier contract
  try {
    console.log('Generating verifier contract...');
    const command = `npx snarkjs zkey export solidityverifier ${verificationKeyPath} ${outputPath}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`Verifier contract generated at: ${outputPath}`);
    
    // Read the generated contract
    const verifierContract = fs.readFileSync(outputPath, 'utf8');
    console.log('Verifier contract generated successfully.');
    
    // Also copy to the backend abis directory
    const backendAbisDir = path.join(__dirname, '../../backend/abis');
    if (!fs.existsSync(backendAbisDir)) {
      fs.mkdirSync(backendAbisDir, { recursive: true });
    }
    
    // Create the ABI file
    const contractName = 'Groth16Verifier';
    const abiJson = {
      contractName,
      abi: [
        {
          "inputs": [
            {
              "internalType": "uint256[2]",
              "name": "_pA",
              "type": "uint256[2]"
            },
            {
              "internalType": "uint256[2][2]",
              "name": "_pB",
              "type": "uint256[2][2]"
            },
            {
              "internalType": "uint256[2]",
              "name": "_pC",
              "type": "uint256[2]"
            },
            {
              "internalType": "uint256[3]",
              "name": "_pubSignals",
              "type": "uint256[3]"
            }
          ],
          "name": "verifyProof",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(backendAbisDir, 'ZKPVerifierGenerated.json'),
      JSON.stringify(abiJson, null, 2)
    );
    console.log(`ABI file generated at: ${path.join(backendAbisDir, 'ZKPVerifierGenerated.json')}`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error generating verifier contract:', error.message);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
