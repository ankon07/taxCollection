const hre = require("hardhat");

async function main() {
  console.log("Account Information for Sepolia Network");
  console.log("=======================================");
  
  // Get the network
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Get accounts
  const accounts = await hre.ethers.getSigners();
  
  // Display account information
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const address = await account.getAddress();
    const balance = await hre.ethers.provider.getBalance(address);
    const balanceInEth = hre.ethers.utils.formatEther(balance);
    
    console.log(`\nAccount ${i}:`);
    console.log(`Address: ${address}`);
    console.log(`Balance: ${balanceInEth} ETH`);
    
    // If this is the first account (deployer), provide more information
    if (i === 0) {
      console.log("\nThis is your deployer account. Make sure it has enough Sepolia ETH for deployment.");
      
      // Check if balance is sufficient for deployment
      if (parseFloat(balanceInEth) < 0.01) {
        console.log("\n⚠️ WARNING: Your account balance is low!");
        console.log("You may not have enough ETH to deploy contracts and perform transactions.");
        console.log("Get Sepolia ETH from a faucet:");
        console.log("- Alchemy Sepolia Faucet: https://sepoliafaucet.com/");
        console.log("- Infura Sepolia Faucet: https://www.infura.io/faucet/sepolia");
      } else {
        console.log("\n✅ Your account has sufficient balance for deployment.");
      }
    }
  }
  
  console.log("\n=======================================");
  console.log("To deploy contracts to Sepolia:");
  console.log("npm run deploy:sepolia");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
