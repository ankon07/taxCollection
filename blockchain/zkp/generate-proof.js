/**
 * Helper script for generating ZKP proofs
 * Usage: node generate-proof.js <income> <randomSecret> <threshold>
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse arguments
const income = parseInt(process.argv[2]) || 800000;
const randomSecret = parseInt(process.argv[3]) || Math.floor(Math.random() * 1000000000);
const threshold = parseInt(process.argv[4]) || 700000;

console.log(`Generating proof for income: ${income}, threshold: ${threshold}, randomSecret: ${randomSecret}`);

// Paths
const BUILD_DIR = path.join(__dirname, 'build');
const inputPath = path.join(BUILD_DIR, 'input.json');
const wasmPath = path.join(BUILD_DIR, 'income_range_js', 'income_range.wasm');
const zkeyPath = path.join(BUILD_DIR, 'income_range.zkey');
const proofPath = path.join(BUILD_DIR, 'proof.json');
const publicPath = path.join(BUILD_DIR, 'public.json');
const verificationKeyPath = path.join(__dirname, 'verification_key.json');

// Create input file
const input = {
  income,
  randomSecret,
  threshold
};

fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));

try {
  // Generate proof
  console.log('Generating proof...');
  execSync(`npx snarkjs groth16 fullprove ${inputPath} ${wasmPath} ${zkeyPath} ${proofPath} ${publicPath}`, { stdio: 'inherit' });
  
  // Verify proof
  console.log('Verifying proof...');
  const result = execSync(`npx snarkjs groth16 verify ${verificationKeyPath} ${publicPath} ${proofPath}`).toString();
  
  console.log('Proof verification result:', result);
  
  // Read the proof and public signals
  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
  const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  
  // Format the proof for the smart contract
  const solidityProof = {
    pi_a: proof.pi_a,
    pi_b: proof.pi_b,
    pi_c: proof.pi_c,
    protocol: "groth16"
  };
  
  console.log('\nProof for smart contract:');
  console.log(JSON.stringify(solidityProof, null, 2));
  
  console.log('\nPublic signals for smart contract:');
  console.log(JSON.stringify(publicSignals, null, 2));
  
  // Save the formatted proof
  const formattedProofPath = path.join(BUILD_DIR, 'formatted_proof.json');
  fs.writeFileSync(formattedProofPath, JSON.stringify({
    proof: solidityProof,
    publicSignals
  }, null, 2));
  
  console.log(`\nFormatted proof saved to ${formattedProofPath}`);
  
} catch (error) {
  console.error('Error generating proof:', error.message);
  process.exit(1);
}
