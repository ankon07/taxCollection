/**
 * Test Runner Script for ZKP Tax System Backend
 * 
 * This script runs all the test files in sequence to ensure proper test isolation.
 * It's useful for testing the integration between different components of the system.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Get all test files
const testsDir = path.join(__dirname);
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.endsWith('.test.js') && file !== 'runTests.js');

console.log(`${colors.bright}${colors.fg.cyan}ZKP Tax System Backend Tests${colors.reset}\n`);
console.log(`${colors.fg.yellow}Found ${testFiles.length} test files:${colors.reset}`);
testFiles.forEach(file => console.log(`- ${file}`));
console.log('');

// Run tests sequentially
async function runTests() {
  let passedTests = 0;
  let failedTests = 0;
  
  for (const file of testFiles) {
    console.log(`${colors.bright}${colors.fg.blue}Running ${file}...${colors.reset}`);
    
    try {
      await new Promise((resolve, reject) => {
        const testProcess = spawn('npx', ['jest', path.join(testsDir, file), '--no-cache'], {
          stdio: 'inherit',
          shell: true
        });
        
        testProcess.on('close', code => {
          if (code === 0) {
            console.log(`${colors.fg.green}✓ ${file} passed${colors.reset}\n`);
            passedTests++;
            resolve();
          } else {
            console.log(`${colors.fg.red}✗ ${file} failed${colors.reset}\n`);
            failedTests++;
            resolve(); // Continue with next test even if this one fails
          }
        });
        
        testProcess.on('error', err => {
          console.error(`${colors.fg.red}Error running ${file}:${colors.reset}`, err);
          failedTests++;
          resolve(); // Continue with next test even if this one fails
        });
      });
    } catch (err) {
      console.error(`${colors.fg.red}Error running ${file}:${colors.reset}`, err);
      failedTests++;
    }
  }
  
  // Print summary
  console.log(`${colors.bright}${colors.fg.cyan}Test Summary:${colors.reset}`);
  console.log(`${colors.fg.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.fg.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.fg.yellow}Total: ${testFiles.length}${colors.reset}`);
  
  if (failedTests > 0) {
    console.log(`\n${colors.fg.red}Some tests failed. Please check the output above for details.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.fg.green}All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error(`${colors.fg.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
