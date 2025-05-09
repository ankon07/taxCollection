/**
 * Setup script for Circom and SnarkJS
 * This script downloads and sets up the necessary components for ZKP generation
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Paths
const ZKP_DIR = path.join(__dirname, '../zkp');
const CIRCUITS_DIR = path.join(ZKP_DIR, 'circuits');
const BUILD_DIR = path.join(ZKP_DIR, 'build');
const VERIFICATION_KEY_PATH = path.join(ZKP_DIR, 'verification_key.json');
const PROVING_KEY_PATH = path.join(ZKP_DIR, 'proving_key.json');

// Create necessary directories
async function createDirectories() {
  console.log('Creating directories...');
  
  if (!fs.existsSync(ZKP_DIR)) {
    await mkdirAsync(ZKP_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(CIRCUITS_DIR)) {
    await mkdirAsync(CIRCUITS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(BUILD_DIR)) {
    await mkdirAsync(BUILD_DIR, { recursive: true });
  }
}

// Install dependencies
async function installDependencies() {
  console.log('Installing dependencies...');
  
  try {
    // Check if snarkjs is already installed
    try {
      execSync('npx snarkjs --version', { stdio: 'ignore' });
      console.log('SnarkJS is already installed');
    } catch (error) {
      console.log('Installing SnarkJS...');
      execSync('npm install -g snarkjs', { stdio: 'inherit' });
    }
    
    // Install other dependencies
    console.log('Installing other dependencies...');
    execSync('npm install --save-dev circomlib', { stdio: 'inherit' });
    
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
    throw error;
  }
}

// Download Circom circuit for income range proof
async function downloadCircuit() {
  console.log('Downloading income range proof circuit...');
  
  const circuitPath = path.join(CIRCUITS_DIR, 'income_range.circom');
  
  if (fs.existsSync(circuitPath)) {
    console.log('Circuit already exists, skipping download');
    return;
  }
  
  // Create a basic income range proof circuit
  const circuitContent = `pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template IncomeRangeProof() {
    signal input income;
    signal input randomSecret;
    signal input threshold;
    signal output commitment;
    signal output result;

    // Calculate commitment = hash(income, randomSecret)
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== income;
    poseidon.inputs[1] <== randomSecret;
    commitment <== poseidon.out;

    // Check if income > threshold
    component gt = GreaterThan(64);
    gt.in[0] <== income;
    gt.in[1] <== threshold;
    result <== gt.out;

    // Enforce that result is 1 (income > threshold)
    result === 1;
}

component main {public [threshold, commitment]} = IncomeRangeProof();
`;

  await writeFileAsync(circuitPath, circuitContent);
  console.log(`Circuit written to ${circuitPath}`);
}

// Compile the circuit
async function compileCircuit() {
  console.log('Compiling circuit...');
  
  const circuitPath = path.join(CIRCUITS_DIR, 'income_range.circom');
  const r1csPath = path.join(BUILD_DIR, 'income_range.r1cs');
  const wasmPath = path.join(BUILD_DIR, 'income_range_js', 'income_range.wasm');
  
  if (fs.existsSync(r1csPath) && fs.existsSync(wasmPath)) {
    console.log('Circuit already compiled, skipping compilation');
    return;
  }
  
  try {
    // Check if circom is installed
    try {
      execSync('circom --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('Circom not found. Please install Circom manually:');
      console.log('1. Visit https://docs.circom.io/getting-started/installation/');
      console.log('2. Follow the installation instructions for your platform');
      console.log('3. Run this script again after installing Circom');
      throw new Error('Circom not installed');
    }
    
    // Compile the circuit
    console.log('Compiling circuit with Circom...');
    execSync(`circom ${circuitPath} --r1cs --wasm -o ${BUILD_DIR}`, { stdio: 'inherit' });
    
    console.log('Circuit compiled successfully');
  } catch (error) {
    console.error('Error compiling circuit:', error.message);
    throw error;
  }
}

// Setup the circuit (generate proving and verification keys)
async function setupCircuit() {
  console.log('Setting up circuit...');
  
  const r1csPath = path.join(BUILD_DIR, 'income_range.r1cs');
  const ptauPath = path.join(BUILD_DIR, 'pot12_final.ptau');
  const zkeyPath = path.join(BUILD_DIR, 'income_range.zkey');
  
  if (fs.existsSync(VERIFICATION_KEY_PATH) && fs.existsSync(zkeyPath)) {
    console.log('Circuit already set up, skipping setup');
    return;
  }
  
  try {
    // Download Powers of Tau file if not exists
    if (!fs.existsSync(ptauPath)) {
      console.log('Downloading Powers of Tau file...');
      try {
        await downloadFile('https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau', ptauPath);
      } catch (error) {
        console.log('Failed to download from primary source, trying alternative source...');
        await downloadFile('https://www.dropbox.com/scl/fi/e3hrdh8z3l3c7n7uy0hhp/powersOfTau28_hez_final_12.ptau?rlkey=xtd3j5lbdvjgw0wl1ht1bxwvl&dl=1', ptauPath);
      }
    }
    
    // Generate zkey
    console.log('Generating zkey...');
    execSync(`npx snarkjs groth16 setup ${r1csPath} ${ptauPath} ${zkeyPath}`, { stdio: 'inherit' });
    
    // Export verification key
    console.log('Exporting verification key...');
    execSync(`npx snarkjs zkey export verificationkey ${zkeyPath} ${VERIFICATION_KEY_PATH}`, { stdio: 'inherit' });
    
    console.log('Circuit setup completed successfully');
  } catch (error) {
    console.error('Error setting up circuit:', error.message);
    throw error;
  }
}

// Download a file from a URL
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Generate a sample proof
async function generateSampleProof() {
  console.log('Generating sample proof...');
  
  const inputPath = path.join(BUILD_DIR, 'input.json');
  const wasmPath = path.join(BUILD_DIR, 'income_range_js', 'income_range.wasm');
  const zkeyPath = path.join(BUILD_DIR, 'income_range.zkey');
  const proofPath = path.join(BUILD_DIR, 'proof.json');
  const publicPath = path.join(BUILD_DIR, 'public.json');
  
  // Create input file
  const input = {
    income: 800000,
    randomSecret: 123456789,
    threshold: 700000
  };
  
  await writeFileAsync(inputPath, JSON.stringify(input, null, 2));
  
  try {
    // Generate proof
    console.log('Generating proof...');
    execSync(`npx snarkjs groth16 fullprove ${inputPath} ${wasmPath} ${zkeyPath} ${proofPath} ${publicPath}`, { stdio: 'inherit' });
    
    // Verify proof
    console.log('Verifying proof...');
    const result = execSync(`npx snarkjs groth16 verify ${VERIFICATION_KEY_PATH} ${publicPath} ${proofPath}`).toString();
    
    console.log('Proof verification result:', result);
    
    // Copy the verification key to the backend
    const backendPath = path.join(__dirname, '../../backend/zkp');
    if (!fs.existsSync(backendPath)) {
      await mkdirAsync(backendPath, { recursive: true });
    }
    
    fs.copyFileSync(VERIFICATION_KEY_PATH, path.join(backendPath, 'verification_key.json'));
    console.log('Verification key copied to backend');
    
    console.log('Sample proof generated and verified successfully');
  } catch (error) {
    console.error('Error generating sample proof:', error.message);
    throw error;
  }
}

// Create a helper script for generating proofs
async function createHelperScript() {
  console.log('Creating helper script...');
  
  const helperPath = path.join(ZKP_DIR, 'generate-proof.js');
  
  const helperContent = `/**
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

console.log(\`Generating proof for income: \${income}, threshold: \${threshold}, randomSecret: \${randomSecret}\`);

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
  execSync(\`npx snarkjs groth16 fullprove \${inputPath} \${wasmPath} \${zkeyPath} \${proofPath} \${publicPath}\`, { stdio: 'inherit' });
  
  // Verify proof
  console.log('Verifying proof...');
  const result = execSync(\`npx snarkjs groth16 verify \${verificationKeyPath} \${publicPath} \${proofPath}\`).toString();
  
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
  
  console.log('\\nProof for smart contract:');
  console.log(JSON.stringify(solidityProof, null, 2));
  
  console.log('\\nPublic signals for smart contract:');
  console.log(JSON.stringify(publicSignals, null, 2));
  
  // Save the formatted proof
  const formattedProofPath = path.join(BUILD_DIR, 'formatted_proof.json');
  fs.writeFileSync(formattedProofPath, JSON.stringify({
    proof: solidityProof,
    publicSignals
  }, null, 2));
  
  console.log(\`\\nFormatted proof saved to \${formattedProofPath}\`);
  
} catch (error) {
  console.error('Error generating proof:', error.message);
  process.exit(1);
}
`;

  await writeFileAsync(helperPath, helperContent);
  console.log(`Helper script written to ${helperPath}`);
}

// Generate Solidity verifier contract
async function generateVerifierContract() {
  console.log('Generating Solidity verifier contract...');
  
  const zkeyPath = path.join(BUILD_DIR, 'income_range.zkey');
  const verifierPath = path.join(ZKP_DIR, 'verifier.sol');
  
  if (fs.existsSync(verifierPath)) {
    console.log('Verifier contract already exists, skipping generation');
    return;
  }
  
  try {
    // Generate Solidity verifier
    console.log('Generating Solidity verifier...');
    execSync(`npx snarkjs zkey export solidityverifier ${zkeyPath} ${verifierPath}`, { stdio: 'inherit' });
    
    // Copy the verifier contract to the contracts directory
    const contractsDir = path.join(__dirname, '../contracts');
    const targetPath = path.join(contractsDir, 'ZKPVerifierGenerated.sol');
    
    fs.copyFileSync(verifierPath, targetPath);
    console.log(`Verifier contract copied to ${targetPath}`);
    
    console.log('Solidity verifier generated successfully');
  } catch (error) {
    console.error('Error generating Solidity verifier:', error.message);
    throw error;
  }
}

// Update the ZKP verifier contract to use the generated verifier
async function updateZKPVerifierContract() {
  console.log('Updating ZKP verifier contract...');
  
  const zkpVerifierPath = path.join(__dirname, '../contracts/ZKPVerifier.sol');
  
  if (!fs.existsSync(zkpVerifierPath)) {
    console.warn('ZKPVerifier.sol not found, skipping update');
    return;
  }
  
  try {
    // Read the current contract
    const contractContent = fs.readFileSync(zkpVerifierPath, 'utf8');
    
    // Check if the contract already imports the generated verifier
    if (contractContent.includes('import "./ZKPVerifierGenerated.sol"')) {
      console.log('ZKPVerifier.sol already imports the generated verifier, skipping update');
      return;
    }
    
    // Update the contract to import and use the generated verifier
    const updatedContent = contractContent.replace(
      'contract ZKPVerifier {',
      'import "./ZKPVerifierGenerated.sol";\n\ncontract ZKPVerifier {'
    );
    
    // Write the updated contract
    fs.writeFileSync(zkpVerifierPath, updatedContent);
    console.log('ZKPVerifier.sol updated successfully');
  } catch (error) {
    console.error('Error updating ZKPVerifier.sol:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Setting up ZKP environment for real blockchain use...');
    
    await createDirectories();
    await installDependencies();
    await downloadCircuit();
    
    console.log('\nCircuit is ready for compilation.');
    console.log('To complete the setup, you need to have Circom installed.');
    console.log('If you have Circom installed, the script will continue with compilation.');
    console.log('If not, please install Circom manually and run this script again.');
    
    try {
      await compileCircuit();
      await setupCircuit();
      await generateSampleProof();
      await generateVerifierContract();
      await updateZKPVerifierContract();
      await createHelperScript();
      
      // Copy verification key to backend
      const backendZkpDir = path.join(__dirname, '../../backend/zkp');
      if (!fs.existsSync(backendZkpDir)) {
        await mkdirAsync(backendZkpDir, { recursive: true });
      }
      
      fs.copyFileSync(VERIFICATION_KEY_PATH, path.join(backendZkpDir, 'verification_key.json'));
      console.log('Verification key copied to backend');
      
      // Copy wasm and zkey to backend
      const wasmPath = path.join(BUILD_DIR, 'income_range_js', 'income_range.wasm');
      const zkeyPath = path.join(BUILD_DIR, 'income_range.zkey');
      
      fs.copyFileSync(wasmPath, path.join(backendZkpDir, 'income_range.wasm'));
      fs.copyFileSync(zkeyPath, path.join(backendZkpDir, 'income_range.zkey'));
      console.log('WASM and zkey files copied to backend');
      
      console.log('\nZKP environment setup completed successfully!');
      console.log('\nThe system is now configured to use real ZKP proofs with the blockchain.');
      console.log(`\nTo generate a proof, run: node ${path.join(ZKP_DIR, 'generate-proof.js')} <income> <randomSecret> <threshold>`);
      console.log('For example: node blockchain/zkp/generate-proof.js 800000 123456789 700000');
      
      console.log('\nTo deploy the updated contracts to the blockchain:');
      console.log('1. Run: cd blockchain && npx hardhat run scripts/deploy.js --network sepolia');
      console.log('2. Update the contract addresses in the backend configuration');
      
    } catch (error) {
      if (error.message === 'Circom not installed') {
        console.log('\nSetup partially completed. Please install Circom and run this script again to complete the setup.');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('Error setting up ZKP environment:', error);
    process.exit(1);
  }
}

// Run the script
main();
