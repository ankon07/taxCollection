const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Test script for processing tax payments using the updated ABI files
 */
async function main() {
  try {
    console.log('Starting tax payment testing with updated ABI files...');
    
    // Initialize Web3 with Sepolia provider
    const provider = process.env.BLOCKCHAIN_PROVIDER || 'https://eth-sepolia.g.alchemy.com/v2/RqzNsM3Vpf-a3KgwTCE0osmH0z-2ug9G';
    console.log('Using blockchain provider:', provider);
    const web3 = new Web3(provider);
    
    // Load private key from environment variable or use a default test key
    // WARNING: Never use this private key for real funds, it's for testing only
    const privateKey = process.env.PRIVATE_KEY || '0xa76c4fa04faee85e1a718f3b21fbb59f79d034837723b320709531d9e072d0c6';
    
    // Add account to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    const userAddress = account.address;
    console.log('Using account address:', userAddress);
    
    // Load contract addresses from deployment file
    const deploymentsPath = path.join(__dirname, '../../blockchain/deployments/sepolia.json');
    let taxSystemAddress, zkpVerifierAddress, groth16VerifierAddress, treasuryWalletAddress;
    
    if (fs.existsSync(deploymentsPath)) {
      const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      taxSystemAddress = deployments.taxSystem || deployments.TaxSystem?.address;
      zkpVerifierAddress = deployments.zkpVerifier || deployments.ZKPVerifier?.address;
      groth16VerifierAddress = deployments.groth16Verifier || deployments.Groth16Verifier?.address;
      treasuryWalletAddress = deployments.treasuryWallet || deployments.deployer;
      
      console.log('Loaded contract addresses from deployments file:');
      console.log('- TaxSystem:', taxSystemAddress);
      console.log('- ZKPVerifier:', zkpVerifierAddress);
      console.log('- Groth16Verifier:', groth16VerifierAddress);
      console.log('- Treasury Wallet:', treasuryWalletAddress);
    } else {
      console.warn('Deployments file not found. Using default addresses for testing.');
      taxSystemAddress = '0x6BF3C89B947293d4abA1b16B9BcD2183b7466A21';
      zkpVerifierAddress = '0x60ce98D9D4E16CbD184Eeceaf15843EeBB0FD65b';
      groth16VerifierAddress = '0xEF571DDFD02EF7a96c7f960354797E42e6E06411';
      treasuryWalletAddress = '0x09D49Fd8214287A20D1A3c1142EadA7Ad1490357';
    }
    
    // Load contract ABIs
    const abisDir = path.join(__dirname, '../abis');
    
    // Load TaxSystem ABI
    let taxSystemAbi;
    try {
      const taxSystemAbiPath = path.join(abisDir, 'TaxSystem.json');
      taxSystemAbi = JSON.parse(fs.readFileSync(taxSystemAbiPath, 'utf8')).abi;
      console.log('Loaded TaxSystem ABI successfully');
    } catch (error) {
      console.error('Error loading TaxSystem ABI:', error.message);
      process.exit(1);
    }
    
    // Load ZKPVerifier ABI
    let zkpVerifierAbi;
    try {
      const zkpVerifierAbiPath = path.join(abisDir, 'ZKPVerifier.json');
      zkpVerifierAbi = JSON.parse(fs.readFileSync(zkpVerifierAbiPath, 'utf8')).abi;
      console.log('Loaded ZKPVerifier ABI successfully');
    } catch (error) {
      console.warn('Error loading ZKPVerifier ABI:', error.message);
      console.warn('Using fallback ABI');
      zkpVerifierAbi = [
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "commitment",
              "type": "bytes32"
            }
          ],
          "name": "storeCommitment",
          "outputs": [
            {
              "internalType": "bool",
              "name": "success",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256[2]",
              "name": "a",
              "type": "uint256[2]"
            },
            {
              "internalType": "uint256[2][2]",
              "name": "b",
              "type": "uint256[2][2]"
            },
            {
              "internalType": "uint256[2]",
              "name": "c",
              "type": "uint256[2]"
            },
            {
              "internalType": "uint256[]",
              "name": "input",
              "type": "uint256[]"
            }
          ],
          "name": "verifyProof",
          "outputs": [
            {
              "internalType": "bool",
              "name": "isValid",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
    }
    
    // Load Groth16Verifier ABI
    let groth16VerifierAbi;
    try {
      // Load the fixed verifier
      const fixedAbiPath = path.join(abisDir, 'Groth16VerifierFixed.json');
      
      if (fs.existsSync(fixedAbiPath)) {
        groth16VerifierAbi = JSON.parse(fs.readFileSync(fixedAbiPath, 'utf8')).abi;
        console.log('Loaded Groth16VerifierFixed ABI successfully');
      } else {
        throw new Error('Groth16VerifierFixed.json not found');
      }
    } catch (error) {
      console.warn('Error loading Groth16Verifier ABI:', error.message);
      console.warn('Using fallback ABI');
      groth16VerifierAbi = [
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
      ];
    }
    
    // Initialize contract instances
    const taxSystem = new web3.eth.Contract(taxSystemAbi, taxSystemAddress);
    const zkpVerifier = new web3.eth.Contract(zkpVerifierAbi, zkpVerifierAddress);
    const groth16Verifier = new web3.eth.Contract(groth16VerifierAbi, groth16VerifierAddress);
    
    // Check network status
    const networkId = await web3.eth.net.getId();
    let networkName;
    switch (parseInt(networkId.toString())) {
      case 1:
        networkName = 'Ethereum Mainnet';
        break;
      case 11155111:
        networkName = 'Sepolia Testnet';
        break;
      case 5:
        networkName = 'Goerli Testnet';
        break;
      default:
        networkName = `Unknown Network (ID: ${networkId.toString()})`;
    }
    
    console.log(`Connected to ${networkName} (ID: ${networkId})`);
    
    // Get account balance
    const balanceWei = await web3.eth.getBalance(userAddress);
    const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
    console.log(`Account balance: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) < 0.01) {
      console.warn('WARNING: Account balance is low. You may need to get Sepolia ETH from a faucet.');
      console.warn('Sepolia faucet: https://sepoliafaucet.com/');
    }
    
    // Test 1: Get Treasury Balance
    console.log('\n--- Test 1: Get Treasury Balance ---');
    try {
      const treasuryBalance = await taxSystem.methods.getTreasuryBalance().call();
      console.log(`Treasury balance: ${web3.utils.fromWei(treasuryBalance, 'ether')} ETH`);
    } catch (error) {
      console.error('Error getting treasury balance:', error.message);
    }
    
    // Test 2: Store Commitment
    console.log('\n--- Test 2: Store Commitment ---');
    try {
      // Generate a test commitment
      const income = 500000; // 500,000 BDT
      const randomSecret = crypto.randomBytes(32).toString('hex');
      const commitmentData = `${income.toString()}:${randomSecret}`;
      const commitment = web3.utils.keccak256(web3.utils.utf8ToHex(commitmentData));
      
      console.log(`Generated commitment: ${commitment}`);
      
      // Store commitment on ZKPVerifier contract
      console.log('Storing commitment on ZKPVerifier contract...');
      const storeCommitmentTx = await zkpVerifier.methods.storeCommitment(commitment).send({
        from: userAddress,
        gas: 200000
      });
      
      console.log(`Commitment stored successfully. Transaction hash: ${storeCommitmentTx.transactionHash}`);
      console.log(`Gas used: ${storeCommitmentTx.gasUsed}`);
    } catch (error) {
      console.error('Error storing commitment:', error.message);
    }
    
    // Test 3: Process Tax Payment
    console.log('\n--- Test 3: Process Tax Payment ---');
    try {
      // Generate simulated ZKP proof
      // Note: These values are for testing only and will likely fail verification
      // In a real scenario, you would generate a valid proof using the ZKP library
      const a = [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
      ];
      
      // IMPORTANT: The order of b needs to be swapped for the Groth16Verifier
      // The contract expects b in a different format than what's typically provided
      const b = [
        [
          '0x2222222222222222222222222222222222222222222222222222222222222222', // Swapped
          '0x1111111111111111111111111111111111111111111111111111111111111111'  // Swapped
        ],
        [
          '0x4444444444444444444444444444444444444444444444444444444444444444', // Swapped
          '0x3333333333333333333333333333333333333333333333333333333333333333'  // Swapped
        ]
      ];
      
      const c = [
        '0x5555555555555555555555555555555555555555555555555555555555555555',
        '0x6666666666666666666666666666666666666666666666666666666666666666'
      ];
      
      // Generate a test commitment for the public input
      const income = 500000; // 500,000 BDT
      const randomSecret = crypto.randomBytes(32).toString('hex');
      const commitmentData = `${income.toString()}:${randomSecret}`;
      const commitment = web3.utils.keccak256(web3.utils.utf8ToHex(commitmentData));
      
      // Public inputs for the ZKP
      const input = [
        commitment, // The commitment
        '0x0000000000000000000000000000000000000000000000000000000000046500', // Threshold (300,000 in hex)
        '0x0000000000000000000000000000000000000000000000000000000000000001'  // Result (1 = true, income > threshold)
      ];
      
      // Format the public signals for the Groth16Verifier contract
      // The Groth16Verifier expects _pubSignals as a fixed array of 3 elements
      const pubSignalsArray = [];
      for (let i = 0; i < 3; i++) {
        pubSignalsArray.push(i < input.length ? input[i] : '0');
      }
      
      // Amount to pay (in ETH)
      const amount = '0.001'; // 0.001 ETH
      const amountWei = web3.utils.toWei(amount, 'ether');
      
      console.log(`Processing tax payment of ${amount} ETH...`);
      console.log('ZKP proof parameters:');
      console.log('- a:', a);
      console.log('- b:', b);
      console.log('- c:', c);
      console.log('- input:', input);
      
      // Generate a real ZKP proof using the income_range circuit
      console.log('\nGenerating a real ZKP proof using the income_range circuit...');
      
      // Create input for the ZKP circuit
      const zkpInput = {
        income: 800000, // Make sure income is greater than threshold
        randomSecret: Math.floor(Math.random() * 1000000000),
        threshold: 700000
      };
      
      console.log('ZKP input:', zkpInput);
      
      // Write input to file
      const inputPath = path.join(__dirname, '../../blockchain/zkp/build/input.json');
      fs.writeFileSync(inputPath, JSON.stringify(zkpInput, null, 2));
      
      // Generate proof using snarkjs
      try {
        console.log('Executing snarkjs to generate proof...');
        
        const wasmPath = path.join(__dirname, '../../blockchain/zkp/build/income_range_js/income_range.wasm');
        const zkeyPath = path.join(__dirname, '../../blockchain/zkp/build/income_range.zkey');
        const proofPath = path.join(__dirname, '../../blockchain/zkp/build/proof.json');
        const publicPath = path.join(__dirname, '../../blockchain/zkp/build/public.json');
        
        // Execute snarkjs to generate proof
        await execAsync(`cd ${path.dirname(path.dirname(inputPath))} && npx snarkjs groth16 fullprove ${inputPath} ${wasmPath} ${zkeyPath} ${proofPath} ${publicPath}`);
        
        // Read the generated proof and public signals
        const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
        const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
        
        console.log('Successfully generated real ZKP proof');
        
        // Format the proof for the contract
        const realA = [proof.pi_a[0], proof.pi_a[1]];
        
        // IMPORTANT: The order of b needs to be swapped for the Groth16Verifier
        const realB = [
          [proof.pi_b[0][1], proof.pi_b[0][0]], // Swap these coordinates
          [proof.pi_b[1][1], proof.pi_b[1][0]]
        ];
        
        const realC = [proof.pi_c[0], proof.pi_c[1]];
        const realInput = publicSignals;
        
        // Verify the proof directly with Groth16Verifier
        console.log('\nAttempting to verify the real proof with Groth16Verifier...');
        try {
          // Try using verifyProofDirect which is designed for memory arrays
          console.log('Using verifyProofDirect function...');
          const directResult = await groth16Verifier.methods.verifyProofDirect(realA, realB, realC, realInput).call();
          console.log('Direct Groth16Verifier result with real proof:', directResult);
          
          if (directResult) {
            console.log('Real proof verified successfully with Groth16Verifier!');
            
            // Use the real proof for the tax payment
            a = realA;
            b = realB;
            c = realC;
            input = realInput;
          } else {
            console.log('Real proof verification failed with Groth16Verifier');
            console.log('Falling back to simulated proof data');
          }
        } catch (directVerifyError) {
          console.error('Direct verification with real proof failed:', directVerifyError.message);
          console.log('Falling back to simulated proof data');
        }
      } catch (proofGenError) {
        console.error('Error generating real ZKP proof:', proofGenError.message);
        console.log('Falling back to simulated proof data');
      }
      
      // Try to process tax payment on TaxSystem contract
      console.log('\nAttempting to process tax payment on TaxSystem contract...');
      try {
        // Process tax payment on TaxSystem contract
        const processTaxTx = await taxSystem.methods.processTaxPayment(
          amountWei, a, b, c, input
        ).send({
          from: userAddress,
          value: amountWei,
          gas: 500000
        });
        
        console.log(`Tax payment processed successfully. Transaction hash: ${processTaxTx.transactionHash}`);
        console.log(`Gas used: ${processTaxTx.gasUsed}`);
        
        // Extract payment hash from the transaction receipt
        const paymentHash = processTaxTx.events.TaxPaid.returnValues.paymentHash;
        console.log(`Payment hash: ${paymentHash}`);
        
        // Test 4: Verify Tax Receipt
        console.log('\n--- Test 4: Verify Tax Receipt ---');
        try {
          const isVerified = await taxSystem.methods.verifyTaxReceipt(paymentHash, userAddress).call();
          console.log(`Tax receipt verification result: ${isVerified ? 'Valid' : 'Invalid'}`);
        } catch (error) {
          console.error('Error verifying tax receipt:', error.message);
        }
      } catch (txError) {
        console.error('Error processing tax payment transaction:', txError.message);
        
        // Try to get more information about why the transaction failed
        if (txError.receipt) {
          console.log('\nTransaction Receipt:');
          console.log('- Status:', txError.receipt.status ? 'Success' : 'Failed');
          console.log('- Gas Used:', txError.receipt.gasUsed);
          console.log('- Block Number:', txError.receipt.blockNumber);
          
          // Check for revert reason if available
          if (txError.reason) {
            console.log('- Revert Reason:', txError.reason);
          }
        }
        
        console.log('\nThe transaction likely failed because the simulated ZKP proof did not pass verification.');
        console.log('This is expected behavior when using mock proof data.');
        console.log('For actual testing, you would need to generate a valid ZKP proof using the proper circuit and witness.');
      }
    } catch (error) {
      console.error('Error in tax payment test:', error.message);
    }
    
    // Test 5: Get Treasury Balance Again
    console.log('\n--- Test 5: Get Treasury Balance Again ---');
    try {
      const treasuryBalance = await taxSystem.methods.getTreasuryBalance().call();
      console.log(`Treasury balance: ${web3.utils.fromWei(treasuryBalance, 'ether')} ETH`);
    } catch (error) {
      console.error('Error getting treasury balance:', error.message);
    }
    
    // Test 6: Get Total Tax Collected
    console.log('\n--- Test 6: Get Total Tax Collected ---');
    try {
      const totalTaxCollected = await taxSystem.methods.totalTaxCollected().call();
      console.log(`Total tax collected: ${web3.utils.fromWei(totalTaxCollected, 'ether')} ETH`);
    } catch (error) {
      console.error('Error getting total tax collected:', error.message);
    }
    
    console.log('\nTax payment testing completed.');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
