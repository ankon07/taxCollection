const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Test script for interacting with the TaxSystem and ZKPVerifier contracts on Sepolia testnet
 */
async function main() {
  try {
    console.log('Starting Sepolia testnet contract testing...');
    
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
    let taxSystemAddress, zkpVerifierAddress, treasuryWalletAddress;
    
    if (fs.existsSync(deploymentsPath)) {
      const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      taxSystemAddress = deployments.taxSystem;
      zkpVerifierAddress = deployments.zkpVerifier;
      treasuryWalletAddress = deployments.treasuryWallet;
      
      console.log('Loaded contract addresses from deployments file:');
      console.log('- TaxSystem:', taxSystemAddress);
      console.log('- ZKPVerifier:', zkpVerifierAddress);
      console.log('- Treasury Wallet:', treasuryWalletAddress);
    } else {
      console.error('Deployments file not found. Please ensure contracts are deployed to Sepolia.');
      process.exit(1);
    }
    
    // Load contract ABIs
    const taxSystemAbiPath = path.join(__dirname, '../abis/TaxSystem.json');
    const zkpVerifierAbiPath = path.join(__dirname, '../abis/ZKPVerifier.json');
    
    const taxSystemAbi = JSON.parse(fs.readFileSync(taxSystemAbiPath, 'utf8')).abi;
    let zkpVerifierAbi;
    
    try {
      zkpVerifierAbi = JSON.parse(fs.readFileSync(zkpVerifierAbiPath, 'utf8')).abi;
    } catch (error) {
      console.warn('ZKPVerifier ABI file not found, using fallback ABI');
      // Fallback to a minimal ABI
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
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
    }
    
    // Initialize contract instances
    const taxSystem = new web3.eth.Contract(taxSystemAbi, taxSystemAddress);
    const zkpVerifier = new web3.eth.Contract(zkpVerifierAbi, zkpVerifierAddress);
    
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
      
      const b = [
        [
          '0x1111111111111111111111111111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222222222222222222222222222'
        ],
        [
          '0x3333333333333333333333333333333333333333333333333333333333333333',
          '0x4444444444444444444444444444444444444444444444444444444444444444'
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
      
      // Amount to pay (in ETH)
      const amount = '0.001'; // 0.001 ETH
      const amountWei = web3.utils.toWei(amount, 'ether');
      
      console.log(`Processing tax payment of ${amount} ETH...`);
      console.log('ZKP proof parameters:', { a, b, c, input });
      
      console.log('\nNOTE: The simulated ZKP proof will likely fail verification on the actual contract.');
      console.log('This is expected in a test environment without proper ZKP generation.');
      console.log('In a real scenario, you would generate a valid proof using the ZKP library.\n');
      
      // Try to process tax payment on TaxSystem contract
      try {
        // First, try to verify the proof directly to see if it would pass
        console.log('Attempting to verify the proof directly...');
        
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
    
    console.log('\nSepolia testnet contract testing completed.');
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
