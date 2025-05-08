const hre = require("hardhat");

async function main() {
  console.log("Testing ZKP Tax System contracts on Sepolia...");
  console.log("==============================================");

  // Get the deployed contract addresses
  // You need to replace these with the actual deployed contract addresses on Sepolia
  const ZKP_VERIFIER_ADDRESS = "0x1C568689269FDAAbF2778700A614347D4d350e66"; // Replace with actual deployed address
  const TAX_SYSTEM_ADDRESS = "0x4ec418640be48ab54cbFbbc762383d16056b2432"; // Replace with actual deployed address
  
  // Get the contract factories
  const ZKPVerifier = await hre.ethers.getContractFactory("ZKPVerifier");
  const TaxSystem = await hre.ethers.getContractFactory("TaxSystem");
  
  // Get the deployed contracts
  const zkpVerifier = await ZKPVerifier.attach(ZKP_VERIFIER_ADDRESS);
  const taxSystem = await TaxSystem.attach(TAX_SYSTEM_ADDRESS);
  
  // Get signers
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  // Use deployer as user1 for testing on Sepolia
  const user1 = deployer;
  
  console.log("Connected to contracts:");
  console.log(`- ZKPVerifier: ${ZKP_VERIFIER_ADDRESS}`);
  console.log(`- TaxSystem: ${TAX_SYSTEM_ADDRESS}`);
  console.log(`- Deployer: ${deployer.address}`);
  console.log(`- Test User (same as deployer): ${user1.address}`);
  console.log("");
  
  // Test 1: Store a commitment
  console.log("Test 1: Storing income commitment");
  try {
    // Generate a mock commitment (in a real app, this would be a proper hash)
    const mockCommitment = "0x" + Math.random().toString(16).substring(2, 66);
    console.log(`- Generated commitment: ${mockCommitment}`);
    
    // Store commitment in ZKPVerifier
    const tx1 = await zkpVerifier.storeCommitment(user1.address, mockCommitment);
    await tx1.wait();
    console.log(`- Stored commitment in ZKPVerifier: ${tx1.hash}`);
    
    // Store commitment in TaxSystem
    const tx2 = await taxSystem.connect(user1).storeCommitment(mockCommitment);
    await tx2.wait();
    console.log(`- Stored commitment in TaxSystem: ${tx2.hash}`);
    
    // Verify commitment was stored
    const storedCommitment = await zkpVerifier.getUserCommitment(user1.address);
    console.log(`- Retrieved commitment: ${storedCommitment}`);
    console.log(`- Verification: ${storedCommitment === mockCommitment ? "SUCCESS" : "FAILED"}`);
    
    console.log("✅ Test 1 completed successfully");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }
  console.log("");
  
  // Test 2: Process a tax payment
  console.log("Test 2: Processing tax payment");
  try {
    // Mock values for tax payment
    const amount = 1000; // 1000 BDT
    const proofId = "proof_" + Date.now();
    console.log(`- Amount: ${amount} BDT`);
    console.log(`- Proof ID: ${proofId}`);
    
    // Get initial total tax collected
    const initialTotalTax = await taxSystem.totalTaxCollected();
    console.log(`- Initial total tax collected: ${initialTotalTax} BDT`);
    
    // Process tax payment
    const tx = await taxSystem.connect(user1).processTaxPayment(amount, proofId);
    await tx.wait();
    console.log(`- Payment transaction: ${tx.hash}`);
    
    // Check total tax collected after payment
    const newTotalTax = await taxSystem.totalTaxCollected();
    console.log(`- New total tax collected: ${newTotalTax} BDT`);
    console.log(`- Increase in tax collected: ${newTotalTax - initialTotalTax} BDT`);
    
    // Verify the increase matches our payment amount
    console.log(`- Verification: ${newTotalTax - initialTotalTax === amount ? "SUCCESS" : "FAILED"}`);
    
    console.log("✅ Test 2 completed successfully");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }
  console.log("");
  
  // Test 3: Get treasury balance
  console.log("Test 3: Getting treasury balance");
  try {
    const treasuryBalance = await taxSystem.getTreasuryBalance();
    console.log(`- Treasury balance: ${treasuryBalance} BDT`);
    
    console.log("✅ Test 3 completed successfully");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }
  console.log("");
  
  // Test 4: Update treasury wallet (admin function)
  console.log("Test 4: Updating treasury wallet (admin function)");
  try {
    // Get current treasury wallet
    const currentTreasuryWallet = await taxSystem.treasuryWallet();
    console.log(`- Current treasury wallet: ${currentTreasuryWallet}`);
    
    // Update treasury wallet to user1's address
    const tx = await taxSystem.updateTreasuryWallet(user1.address);
    await tx.wait();
    console.log(`- Update transaction: ${tx.hash}`);
    
    // Get new treasury wallet
    const newTreasuryWallet = await taxSystem.treasuryWallet();
    console.log(`- New treasury wallet: ${newTreasuryWallet}`);
    console.log(`- Verification: ${newTreasuryWallet === user1.address ? "SUCCESS" : "FAILED"}`);
    
    // Restore original treasury wallet
    const restoreTx = await taxSystem.updateTreasuryWallet(currentTreasuryWallet);
    await restoreTx.wait();
    console.log(`- Restored original treasury wallet: ${restoreTx.hash}`);
    
    console.log("✅ Test 4 completed successfully");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }
  console.log("");
  
  console.log("All tests completed!");
  console.log("==============================================");
}

// Execute the test script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
