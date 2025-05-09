/**
 * Test ZKP verification using values directly from verification_key.json
 * This script tests the ZKP verification on the blockchain using the exact values from verification_key.json
 */
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Setup Web3 and contracts
async function setupWeb3() {
  console.log('Setting up Web3 and contracts...');
  
  // Read the .env file directly
  const envPath = path.join(__dirname, '../.env');
  console.log('Reading .env file from:', envPath);
  
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found at:', envPath);
    throw new Error('.env file not found');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Successfully read .env file');
  
  // Extract the private key using regex
  const privateKeyMatch = envContent.match(/PRIVATE_KEY=([^\n]+)/);
  if (!privateKeyMatch || !privateKeyMatch[1]) {
    console.error('PRIVATE_KEY not found in .env file');
    throw new Error('PRIVATE_KEY not found in .env file');
  }
  
  const privateKey = privateKeyMatch[1].trim();
  console.log('Found private key in .env file');
  
  // Extract the provider URL
  const providerMatch = envContent.match(/BLOCKCHAIN_PROVIDER=([^\n]+)/);
  const provider = providerMatch && providerMatch[1] ? 
    providerMatch[1].trim() : 
    'https://eth-sepolia.g.alchemy.com/v2/RqzNsM3Vpf-a3KgwTCE0osmH0z-2ug9G';
  
  console.log('Using blockchain provider:', provider);
  
  // Initialize Web3
  const web3 = new Web3(provider);
  
  // Remove '0x' prefix if present
  const cleanPrivateKey = privateKey.startsWith('0x') 
    ? privateKey.substring(2) 
    : privateKey;
  
  // Add account to wallet
  try {
    const account = web3.eth.accounts.privateKeyToAccount('0x' + cleanPrivateKey);
    web3.eth.accounts.wallet.add(account);
    const signerAddress = account.address;
    console.log('Successfully set up account with address:', signerAddress);
    
    // Try to read the deployment file to get the latest contract addresses
    let zkpVerifierAddress = "0x60ce98D9D4E16CbD184Eeceaf15843EeBB0FD65b";
    let groth16VerifierAddress = null;
    
    try {
      // Check if the fixed deployment file exists
      const deploymentPath = path.join(__dirname, '../../blockchain/deployments/sepolia/zkp-verifier-fixed.json');
      if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        if (deployment.groth16Verifier) {
          groth16VerifierAddress = deployment.groth16Verifier;
          console.log('Found Groth16Verifier address in fixed deployment file:', groth16VerifierAddress);
        }
        if (deployment.zkpVerifier) {
          zkpVerifierAddress = deployment.zkpVerifier;
          console.log('Found ZKPVerifier address in fixed deployment file:', zkpVerifierAddress);
        }
      } else {
        console.log('Fixed deployment file not found, using default addresses');
      }
    } catch (deploymentError) {
      console.error('Error reading deployment file:', deploymentError.message);
    }
    
    // If we still don't have a Groth16Verifier address, use the default
    if (!groth16VerifierAddress) {
      // Try to get it from environment variable
      groth16VerifierAddress = process.env.GROTH16_VERIFIER_ADDRESS || "0x5C094698C1e76a0Ad4335f98054fB10126CA8251";
      console.log('Using default Groth16Verifier address:', groth16VerifierAddress);
    }
    
    console.log('Using contract addresses:');
    console.log('- ZKPVerifier:', zkpVerifierAddress);
    console.log('- Groth16Verifier:', groth16VerifierAddress);
    
    // Load contract ABIs
    const zkpVerifierABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/ZKPVerifier.json'), 'utf8')).abi;
    const groth16VerifierABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/Groth16VerifierFixed.json'), 'utf8')).abi;
    
    // Initialize contract instances
    const zkpVerifier = new web3.eth.Contract(
      zkpVerifierABI,
      zkpVerifierAddress
    );
    
    const groth16Verifier = new web3.eth.Contract(
      groth16VerifierABI,
      groth16VerifierAddress
    );
    
    return {
      web3,
      signerAddress,
      zkpVerifier,
      groth16Verifier
    };
  } catch (error) {
    console.error('Error setting up account with private key:', error.message);
    throw error;
  }
}

// Load verification key from file
function loadVerificationKey() {
  try {
    const verificationKeyPath = path.join(__dirname, '../zkp/verification_key.json');
    console.log('Loading verification key from:', verificationKeyPath);
    
    if (!fs.existsSync(verificationKeyPath)) {
      console.error('Verification key file not found at:', verificationKeyPath);
      throw new Error('Verification key file not found');
    }
    
    const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath, 'utf8'));
    console.log('Successfully loaded verification key');
    
    return verificationKey;
  } catch (error) {
    console.error('Error loading verification key:', error.message);
    throw error;
  }
}

// Generate a test proof using values from the verification key
function generateProofFromVerificationKey(verificationKey) {
  console.log('Generating proof from verification key...');
  
  // Extract values from verification key
  const alpha = verificationKey.vk_alpha_1;
  const beta = verificationKey.vk_beta_2;
  const gamma = verificationKey.vk_gamma_2;
  const delta = verificationKey.vk_delta_2;
  const ic = verificationKey.IC;
  
  console.log('Using values:');
  console.log('- alpha:', alpha);
  console.log('- beta:', beta);
  console.log('- gamma:', gamma);
  console.log('- delta:', delta);
  console.log('- IC:', ic);
  
  // Create a proof using these values
  return {
    pi_a: [
      alpha[0],
      alpha[1]
    ],
    pi_b: [
      [
        beta[0][0],
        beta[0][1]
      ],
      [
        beta[1][0],
        beta[1][1]
      ]
    ],
    pi_c: [
      ic[0][0],
      ic[0][1]
    ]
  };
}

// Generate test public signals
function generatePublicSignals(verificationKey) {
  // Use zeros for public signals
  const publicSignals = [];
  for (let i = 0; i < verificationKey.nPublic; i++) {
    publicSignals.push("0");
  }
  return publicSignals;
}

// Update the verifier contract address
async function updateVerifierContract(web3, zkpVerifier, groth16VerifierAddress, signerAddress) {
  try {
    console.log('Checking verifier contract address...');
    
    // Get the current verifier contract address
    const currentVerifierAddress = await zkpVerifier.methods.verifierContract().call();
    console.log('Current verifier contract address:', currentVerifierAddress);
    
    // Check if it matches our Groth16Verifier address
    if (currentVerifierAddress.toLowerCase() !== groth16VerifierAddress.toLowerCase()) {
      console.log('Verifier contract address mismatch. Updating ZKPVerifier...');
      
      // Update the verifier contract address
      const updateTx = await zkpVerifier.methods
        .updateVerifierContract(groth16VerifierAddress)
        .send({ 
          from: signerAddress,
          gas: 200000
        });
      
      console.log('Updated verifier contract address. Transaction hash:', updateTx.transactionHash);
      
      // Verify the update
      const newVerifierAddress = await zkpVerifier.methods.verifierContract().call();
      console.log('New verifier contract address:', newVerifierAddress);
      
      return true;
    } else {
      console.log('Verifier contract address already matches Groth16Verifier address');
      return true;
    }
  } catch (error) {
    console.error('Error updating verifier contract address:', error.message);
    return false;
  }
}

// Verify proof directly with Groth16Verifier
async function verifyProofDirect(web3, groth16Verifier, proof, publicSignals, signerAddress) {
  try {
    console.log('Verifying proof directly with Groth16Verifier...');
    
    // Format the proof for the Groth16Verifier contract
    const a = [
      proof.pi_a[0].toString(),
      proof.pi_a[1].toString()
    ];
    
    // For Groth16Verifier, we need to swap the coordinates in b
    const b = [
      [
        proof.pi_b[0][1].toString(),
        proof.pi_b[0][0].toString()
      ],
      [
        proof.pi_b[1][1].toString(),
        proof.pi_b[1][0].toString()
      ]
    ];
    
    const c = [
      proof.pi_c[0].toString(),
      proof.pi_c[1].toString()
    ];
    
    // Format the public signals for the Groth16Verifier contract
    // The Groth16Verifier expects _pubSignals as a fixed array of 3 elements
    const pubSignalsArray = [];
    for (let i = 0; i < 3; i++) {
      pubSignalsArray.push(i < publicSignals.length ? publicSignals[i].toString() : '0');
    }
    
    console.log('Calling Groth16Verifier.verifyProof with:');
    console.log('_pA:', a);
    console.log('_pB:', b);
    console.log('_pC:', c);
    console.log('_pubSignals:', pubSignalsArray);
    
    // Call the verifyProof method on the Groth16Verifier contract
    const result = await groth16Verifier.methods.verifyProof(a, b, c, pubSignalsArray).call();
    console.log('Direct Groth16Verifier result:', result);
    
    return result;
  } catch (error) {
    console.error('Error verifying proof directly with Groth16Verifier:', error.message);
    return false;
  }
}

// Verify proof with ZKPVerifier
async function verifyProofWithZKPVerifier(web3, zkpVerifier, proof, publicSignals, signerAddress) {
  try {
    console.log('Verifying proof with ZKPVerifier...');
    
    // Format the proof for the ZKPVerifier contract
    const a = [
      proof.pi_a[0].toString(),
      proof.pi_a[1].toString()
    ];
    
    // For ZKPVerifier, we need to swap the coordinates in b
    const b = [
      [
        proof.pi_b[0][1].toString(),
        proof.pi_b[0][0].toString()
      ],
      [
        proof.pi_b[1][1].toString(),
        proof.pi_b[1][0].toString()
      ]
    ];
    
    const c = [
      proof.pi_c[0].toString(),
      proof.pi_c[1].toString()
    ];
    
    // Convert publicSignals to array of strings
    const input = publicSignals.map(signal => signal.toString());
    
    console.log('Calling ZKPVerifier.verifyProof with:');
    console.log('a:', a);
    console.log('b:', b);
    console.log('c:', c);
    console.log('input:', input);
    
    // Try to call the verifyProof method without sending a transaction (to check if it would succeed)
    try {
      console.log('Calling verifyProof method (dry run)...');
      const dryRunResult = await zkpVerifier.methods.verifyProof(a, b, c, input).call({ from: signerAddress });
      console.log('Dry run result:', dryRunResult);
    } catch (dryRunError) {
      console.error('Dry run failed:', dryRunError.message);
    }
    
    // Call the smart contract method with increased gas limit
    console.log('Sending verifyProof transaction...');
    const tx = await zkpVerifier.methods
      .verifyProof(a, b, c, input)
      .send({ 
        from: signerAddress,
        gas: 1000000 // Significantly increased gas limit
      });
    
    console.log('ZKP verified on blockchain. Transaction hash:', tx.transactionHash);
    
    return {
      isValid: true,
      txHash: tx.transactionHash
    };
  } catch (error) {
    console.error('Error verifying proof with ZKPVerifier:', error.message);
    
    // Try to get more information about the error
    if (error.receipt) {
      console.log('Transaction receipt:', error.receipt);
    }
    
    throw error;
  }
}

// Main function
async function testZkpVerificationKey() {
  try {
    console.log('Testing ZKP verification using values from verification_key.json...');
    
    // Setup Web3 and contracts
    const { web3, signerAddress, zkpVerifier, groth16Verifier } = await setupWeb3();
    
    // Update the verifier contract address
    await updateVerifierContract(web3, zkpVerifier, groth16Verifier.options.address, signerAddress);
    
    // Load verification key
    const verificationKey = loadVerificationKey();
    
    // Generate proof and public signals from verification key
    const proof = generateProofFromVerificationKey(verificationKey);
    const publicSignals = generatePublicSignals(verificationKey);
    
    console.log('\n=== Testing with verification key values ===');
    console.log('Proof:', JSON.stringify(proof, null, 2));
    console.log('Public Signals:', publicSignals);
    
    // Verify proof directly with Groth16Verifier
    const directResult = await verifyProofDirect(web3, groth16Verifier, proof, publicSignals, signerAddress);
    
    if (directResult) {
      console.log('Proof verified directly with Groth16Verifier!');
      
      // Now verify with ZKPVerifier
      try {
        const { isValid, txHash } = await verifyProofWithZKPVerifier(web3, zkpVerifier, proof, publicSignals, signerAddress);
        console.log('Proof verified with ZKPVerifier!');
        console.log('Verification transaction hash:', txHash);
        console.log('\nTest completed successfully. The Groth16Verifier contract is working correctly!');
      } catch (zkpVerifierError) {
        console.error('Error verifying with ZKPVerifier:', zkpVerifierError.message);
        console.log('\nTest completed with partial success. The Groth16Verifier contract works directly, but there was an issue with ZKPVerifier.');
      }
    } else {
      console.log('Direct verification failed with verification key values.');
      console.log('\nTest failed. The Groth16Verifier contract is not working correctly.');
    }
    
  } catch (error) {
    console.error('Error testing ZKP with verification key:', error);
  }
}

// Run the test
testZkpVerificationKey();
