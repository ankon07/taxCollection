const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Generating verifier contract from verification key...');
  
  // Paths
  const verificationKeyPath = path.join(__dirname, '../zkp/verification_key.json');
  const outputPath = path.join(__dirname, '../contracts/Groth16VerifierGenerated.sol');
  
  // Check if verification key exists
  if (!fs.existsSync(verificationKeyPath)) {
    console.error(`Verification key not found at ${verificationKeyPath}`);
    process.exit(1);
  }
  
  try {
    // Generate verifier contract using snarkjs
    console.log('Executing snarkjs to generate verifier contract...');
    execSync(`npx snarkjs zkey export solidityverifier ${verificationKeyPath} ${outputPath}`);
    
    console.log(`Verifier contract generated at ${outputPath}`);
    
    // Read the generated contract
    const verifierCode = fs.readFileSync(outputPath, 'utf8');
    
    // Modify the contract to add helper functions
    const modifiedVerifierCode = verifierCode.replace(
      'contract Verifier {',
      'contract Groth16VerifierGenerated {'
    ).replace(
      'function verifyProof(',
      'function verifyProof('
    ) + `
    
    // Helper function to verify proof directly from JavaScript-friendly parameters
    function verifyProofDirect(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) public view returns (bool) {
        // Convert memory arrays to calldata format
        uint[2] memory _pA = a;
        uint[2][2] memory _pB;
        _pB[0][0] = b[0][0];
        _pB[0][1] = b[0][1];
        _pB[1][0] = b[1][0];
        _pB[1][1] = b[1][1];
        uint[2] memory _pC = c;
        
        // Convert input to fixed size array if needed
        uint[3] memory _pubSignals;
        for (uint i = 0; i < 3 && i < input.length; i++) {
            _pubSignals[i] = input[i];
        }
        
        return verifyProof(_pA, _pB, _pC, _pubSignals);
    }`;
    
    // Write the modified contract back to the file
    fs.writeFileSync(outputPath, modifiedVerifierCode);
    
    console.log('Contract modified with helper functions');
    
    // Copy the contract to the backend abis directory
    const abiDir = path.join(__dirname, '../../backend/abis');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    
    // Compile the contract to get the ABI
    console.log('Compiling contract to generate ABI...');
    execSync('npx hardhat compile');
    
    // Copy the ABI to the backend abis directory
    const abiSourcePath = path.join(__dirname, '../artifacts/contracts/Groth16VerifierGenerated.sol/Groth16VerifierGenerated.json');
    const abiDestPath = path.join(abiDir, 'Groth16VerifierGenerated.json');
    
    fs.copyFileSync(abiSourcePath, abiDestPath);
    console.log(`ABI copied to ${abiDestPath}`);
    
    console.log('Verifier contract generation completed successfully');
  } catch (error) {
    console.error('Error generating verifier contract:', error.message);
    process.exit(1);
  }
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
