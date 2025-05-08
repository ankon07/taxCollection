const fs = require('fs');
const path = require('path');

// Function to update the test-contracts.js file with deployed contract addresses
async function main() {
  try {
    // Get the network name from command line arguments
    const networkName = process.argv[2] || 'sepolia';
    console.log(`Updating test script with ${networkName} deployment addresses...`);
    
    // Path to the deployment info file
    const deploymentFilePath = path.join(__dirname, '../deployments', `${networkName}.json`);
    
    // Check if the deployment file exists
    if (!fs.existsSync(deploymentFilePath)) {
      console.error(`Error: Deployment file for ${networkName} not found.`);
      console.error(`Please deploy contracts to ${networkName} first using:`);
      console.error(`npm run deploy:${networkName}`);
      process.exit(1);
    }
    
    // Read the deployment info
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFilePath, 'utf8'));
    
    // Path to the test script
    const testScriptPath = path.join(__dirname, 'test-contracts.js');
    
    // Read the test script
    let testScript = fs.readFileSync(testScriptPath, 'utf8');
    
    // Replace the placeholder addresses with the actual deployed addresses
    testScript = testScript.replace(
      /const ZKP_VERIFIER_ADDRESS = "0x...";/,
      `const ZKP_VERIFIER_ADDRESS = "${deploymentInfo.zkpVerifier}";`
    );
    
    testScript = testScript.replace(
      /const TAX_SYSTEM_ADDRESS = "0x...";/,
      `const TAX_SYSTEM_ADDRESS = "${deploymentInfo.taxSystem}";`
    );
    
    // Write the updated test script
    fs.writeFileSync(testScriptPath, testScript);
    
    console.log(`Test script updated successfully with ${networkName} deployment addresses.`);
    console.log(`ZKPVerifier: ${deploymentInfo.zkpVerifier}`);
    console.log(`TaxSystem: ${deploymentInfo.taxSystem}`);
    console.log(`\nYou can now run the test script using:`);
    console.log(`npm run test:${networkName}`);
  } catch (error) {
    console.error('Error updating test script:', error);
    process.exit(1);
  }
}

// Execute the script
main();
