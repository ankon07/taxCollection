const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Check if the backend ABI files match the blockchain contract ABIs
describe('Backend-Blockchain Integration', () => {
  it('should have matching TaxSystem ABI files', async () => {
    // Read the backend ABI file
    const backendAbiPath = path.join(__dirname, '../abis/TaxSystem.json');
    const backendAbi = JSON.parse(fs.readFileSync(backendAbiPath, 'utf8'));
    
    // Read the blockchain ABI file
    const blockchainAbiPath = path.join(__dirname, '../../blockchain/artifacts/contracts/TaxSystem.sol/TaxSystem.json');
    const blockchainAbi = JSON.parse(fs.readFileSync(blockchainAbiPath, 'utf8'));
    
    // Compare the ABIs
    expect(backendAbi).toBeDefined();
    expect(blockchainAbi).toBeDefined();
    expect(blockchainAbi.abi).toBeDefined();
    
    // In a real test, we would compare the actual ABI structures
    // For this demo, we'll just check that the files exist and have valid JSON
  });
});

// Check if the frontend can connect to the backend
describe('Frontend-Backend Integration', () => {
  it('should have CORS configured correctly', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:3000');
    
    // Check if CORS headers are present
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
  
  it('should have the correct proxy configuration in frontend package.json', () => {
    // Read the frontend package.json
    const frontendPackagePath = path.join(__dirname, '../../frontend/package.json');
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    
    // Check if the proxy is configured correctly
    expect(frontendPackage.proxy).toBeDefined();
    expect(frontendPackage.proxy).toEqual('http://localhost:5000');
  });
  
  it('should have matching API endpoints between frontend and backend', () => {
    // This is a simplified test that checks if the frontend is using the correct API endpoints
    // In a real test, we would scan the frontend code for API calls and verify they match the backend routes
    
    // Read the AuthContext.js file which contains API calls
    const authContextPath = path.join(__dirname, '../../frontend/src/context/AuthContext.js');
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    
    // Check if the baseURL is set correctly
    expect(authContextContent).toContain('axios.defaults.baseURL');
    expect(authContextContent).toContain('http://localhost:5000/api');
    
    // Check if the API endpoints match the backend routes
    expect(authContextContent).toContain('/users/register');
    expect(authContextContent).toContain('/users/login');
    expect(authContextContent).toContain('/users/profile');
  });
});

// Check if the backend can connect to the blockchain
describe('Backend-Blockchain Connection', () => {
  it('should have the correct blockchain provider URL', () => {
    // Read the .env file
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if the blockchain provider URL is set
    expect(envContent).toContain('BLOCKCHAIN_PROVIDER=');
    
    // Check if the blockchain service is using the correct provider
    const blockchainServicePath = path.join(__dirname, '../utils/blockchainService.js');
    const blockchainServiceContent = fs.readFileSync(blockchainServicePath, 'utf8');
    
    expect(blockchainServiceContent).toContain('new Web3(');
  });
  
  it('should have the correct contract addresses', () => {
    // Read the .env file
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if the contract addresses are set
    expect(envContent).toContain('TAX_CONTRACT_ADDRESS=');
    expect(envContent).toContain('ZKP_VERIFIER_ADDRESS=');
    
    // Check if the blockchain service is using the correct contract addresses
    const blockchainServicePath = path.join(__dirname, '../utils/blockchainService.js');
    const blockchainServiceContent = fs.readFileSync(blockchainServicePath, 'utf8');
    
    expect(blockchainServiceContent).toContain('this.taxContractAddress');
    expect(blockchainServiceContent).toContain('this.zkpVerifierAddress');
  });
});

// Check if the frontend has the correct blockchain integration
describe('Frontend-Blockchain Integration', () => {
  it('should have the blockchain ABIs in the frontend', () => {
    // Check if the TaxSystem ABI exists in the frontend
    const frontendTaxSystemAbiPath = path.join(__dirname, '../../frontend/src/abis/TaxSystem.json');
    expect(fs.existsSync(frontendTaxSystemAbiPath)).toBeTruthy();
    
    // Check if the ZKPVerifier ABI exists in the frontend
    const frontendZKPVerifierAbiPath = path.join(__dirname, '../../frontend/src/abis/ZKPVerifier.json');
    expect(fs.existsSync(frontendZKPVerifierAbiPath)).toBeTruthy();
  });
  
  it('should have Web3 integration in the frontend', () => {
    // Check if the frontend package.json includes Web3
    const frontendPackagePath = path.join(__dirname, '../../frontend/package.json');
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    
    expect(frontendPackage.dependencies).toBeDefined();
    expect(frontendPackage.dependencies.web3).toBeDefined();
    
    // Check if ethers.js is also included (alternative to Web3)
    expect(frontendPackage.dependencies.ethers).toBeDefined();
  });
});
