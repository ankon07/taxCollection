const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Groth16VerifierFixed contract...");
  console.log(`Network: ${hre.network.name}`);

  // Get the network name
  const networkName = hre.network.name;

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  // Deploy the Groth16VerifierFixed contract
  const Groth16VerifierFixed = await hre.ethers.getContractFactory("Groth16VerifierFixed");
  const groth16VerifierFixed = await Groth16VerifierFixed.deploy();
  await groth16VerifierFixed.deployed();
  
  const groth16VerifierFixedAddress = groth16VerifierFixed.address;
  console.log(`Groth16VerifierFixed deployed to: ${groth16VerifierFixedAddress}`);

  // Save the deployment info
  const deploymentInfo = {
    network: networkName,
    groth16VerifierFixed: groth16VerifierFixedAddress,
    deploymentTime: new Date().toISOString()
  };
  
  // Create the deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Create the network directory if it doesn't exist
  const networkDir = path.join(deploymentsDir, networkName);
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir);
  }
  
  // Write the deployment info to a file
  fs.writeFileSync(
    path.join(networkDir, 'groth16-verifier-fixed.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to deployments/${networkName}/groth16-verifier-fixed.json`);
  
  // Update the main deployment file
  const mainDeploymentPath = path.join(deploymentsDir, `${networkName}.json`);
  let mainDeployment = {};
  
  if (fs.existsSync(mainDeploymentPath)) {
    mainDeployment = JSON.parse(fs.readFileSync(mainDeploymentPath, 'utf8'));
  }
  
  // Add or update the groth16Verifier address
  mainDeployment.groth16Verifier = groth16VerifierFixedAddress;
  mainDeployment.deploymentTime = new Date().toISOString();
  
  // Write the updated deployment info to the main file
  fs.writeFileSync(
    mainDeploymentPath,
    JSON.stringify(mainDeployment, null, 2)
  );
  console.log(`Main deployment info updated in deployments/${networkName}.json`);
  
  // Copy the ABI to the backend abis directory
  const abiDir = path.join(__dirname, '../../backend/abis');
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  // Copy the ABI to the backend abis directory
  const abiSourcePath = path.join(__dirname, '../artifacts/contracts/Groth16VerifierFixed.sol/Groth16VerifierFixed.json');
  const abiDestPath = path.join(abiDir, 'Groth16VerifierFixed.json');
  
  fs.copyFileSync(abiSourcePath, abiDestPath);
  console.log(`ABI copied to ${abiDestPath}`);
  
  // If on Sepolia, print verification commands
  if (networkName === 'sepolia') {
    console.log("\nTo verify contract on Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${groth16VerifierFixedAddress}`);
  }
  
  // Return the contract address for testing
  return {
    groth16VerifierFixed: groth16VerifierFixedAddress
  };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
