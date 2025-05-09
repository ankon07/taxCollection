const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ZKP Tax System contracts...");
  console.log(`Network: ${hre.network.name}`);

  // Get the network name
  const networkName = hre.network.name;

  // For the ZKPVerifier, we need a verifier contract address
  // Since we don't have an actual zk-SNARK verifier contract deployed yet,
  // we'll use a placeholder address that we can update later
  const [deployer] = await hre.ethers.getSigners();
  
  // Use deployer address as a temporary placeholder for the verifier contract
  // In a production environment, this would be the address of a real zk-SNARK verifier
  const mockVerifierAddress = deployer.address;
  
  // Deploy ZKPVerifier contract with the mock verifier address
  const ZKPVerifier = await hre.ethers.getContractFactory("ZKPVerifier");
  const zkpVerifier = await ZKPVerifier.deploy(mockVerifierAddress);
  await zkpVerifier.deployed();
  
  const zkpVerifierAddress = zkpVerifier.address;
  console.log(`ZKPVerifier deployed to: ${zkpVerifierAddress}`);

  // Deploy TaxSystem contract with ZKPVerifier address
  // Create a treasury wallet address (in a real deployment, this would be a real address)
  const treasuryWallet = deployer.address; // Using deployer as treasury for demo
  
  const TaxSystem = await hre.ethers.getContractFactory("TaxSystem");
  const taxSystem = await TaxSystem.deploy(treasuryWallet, zkpVerifierAddress);
  await taxSystem.deployed();
  
  const taxSystemAddress = taxSystem.address;
  console.log(`TaxSystem deployed to: ${taxSystemAddress}`);
  console.log(`Treasury wallet set to: ${treasuryWallet}`);

  console.log("Deployment complete!");
  
  // Save the contract addresses to a file
  const deploymentInfo = {
    network: networkName,
    zkpVerifier: zkpVerifierAddress,
    taxSystem: taxSystemAddress,
    treasuryWallet,
    deploymentTime: new Date().toISOString()
  };
  
  // Create the deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Write the deployment info to a file
  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to deployments/${networkName}.json`);
  
  // If on Sepolia, print verification commands
  if (networkName === 'sepolia') {
    console.log("\nTo verify contracts on Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${zkpVerifierAddress}`);
    console.log(`npx hardhat verify --network sepolia ${taxSystemAddress} ${treasuryWallet} ${zkpVerifierAddress}`);
  }
  
  // Return the contract addresses for testing
  return {
    zkpVerifier: zkpVerifierAddress,
    taxSystem: taxSystemAddress,
    treasuryWallet
  };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
