const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ZKPVerifierGenerated contract...");
  console.log(`Network: ${hre.network.name}`);

  // Get the network name
  const networkName = hre.network.name;

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy ZKPVerifierGenerated contract (Groth16Verifier)
  const Groth16Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const groth16Verifier = await Groth16Verifier.deploy();
  await groth16Verifier.deployed();
  
  const groth16VerifierAddress = groth16Verifier.address;
  console.log(`ZKPVerifierGenerated (Groth16Verifier) deployed to: ${groth16VerifierAddress}`);

  // Update the ZKPVerifier contract with the new verifier address
  const ZKPVerifier = await hre.ethers.getContractFactory("ZKPVerifier");
  const zkpVerifier = await hre.ethers.getContractAt("ZKPVerifier", process.env.ZKP_VERIFIER_ADDRESS || "0x60ce98D9D4E16CbD184Eeceaf15843EeBB0FD65b");
  
  // Update the verifier contract address
  const updateTx = await zkpVerifier.updateVerifierContract(groth16VerifierAddress);
  await updateTx.wait();
  console.log(`Updated ZKPVerifier to use the new Groth16Verifier at: ${groth16VerifierAddress}`);

  // Save the contract addresses to a file
  const deploymentInfo = {
    network: networkName,
    groth16Verifier: groth16VerifierAddress,
    zkpVerifier: zkpVerifier.address,
    deploymentTime: new Date().toISOString()
  };
  
  // Create the deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Create a network-specific directory if it doesn't exist
  const networkDir = path.join(deploymentsDir, networkName);
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir);
  }
  
  // Write the deployment info to a file
  fs.writeFileSync(
    path.join(networkDir, `zkp-verifier-generated.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to deployments/${networkName}/zkp-verifier-generated.json`);
  
  // Update the main deployment file if it exists
  const mainDeploymentPath = path.join(deploymentsDir, `${networkName}.json`);
  if (fs.existsSync(mainDeploymentPath)) {
    try {
      const mainDeployment = JSON.parse(fs.readFileSync(mainDeploymentPath, 'utf8'));
      mainDeployment.groth16Verifier = groth16VerifierAddress;
      mainDeployment.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(
        mainDeploymentPath,
        JSON.stringify(mainDeployment, null, 2)
      );
      console.log(`Updated main deployment file at deployments/${networkName}.json`);
    } catch (error) {
      console.error(`Error updating main deployment file: ${error.message}`);
    }
  }
  
  // If on Sepolia, print verification commands
  if (networkName === 'sepolia') {
    console.log("\nTo verify contracts on Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${groth16VerifierAddress}`);
  }
  
  // Return the contract addresses for testing
  return {
    groth16Verifier: groth16VerifierAddress,
    zkpVerifier: zkpVerifier.address
  };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
