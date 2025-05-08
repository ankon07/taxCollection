const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKP Tax System", function () {
  let zkpVerifier;
  let taxSystem;
  let owner;
  let user1;
  let user2;
  let treasuryWallet;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, treasuryWallet] = await ethers.getSigners();

    // Deploy ZKPVerifier
    const ZKPVerifier = await ethers.getContractFactory("ZKPVerifier");
    zkpVerifier = await ZKPVerifier.deploy();
    await zkpVerifier.waitForDeployment();

    // Deploy TaxSystem
    const TaxSystem = await ethers.getContractFactory("TaxSystem");
    taxSystem = await TaxSystem.deploy(treasuryWallet.address, await zkpVerifier.getAddress());
    await taxSystem.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await zkpVerifier.owner()).to.equal(owner.address);
      expect(await taxSystem.owner()).to.equal(owner.address);
    });

    it("Should set the right treasury wallet", async function () {
      expect(await taxSystem.treasuryWallet()).to.equal(treasuryWallet.address);
    });

    it("Should set the right ZKP verifier address", async function () {
      expect(await taxSystem.zkpVerifier()).to.equal(await zkpVerifier.getAddress());
    });
  });

  describe("Storing Commitments", function () {
    it("Should store a commitment", async function () {
      const commitment = "0x123456789abcdef";
      
      // Store commitment directly in ZKPVerifier
      await zkpVerifier.storeCommitment(user1.address, commitment);
      expect(await zkpVerifier.getUserCommitment(user1.address)).to.equal(commitment);
      
      // Store commitment through TaxSystem
      await taxSystem.connect(user1).storeCommitment(commitment);
      expect(await taxSystem.userCommitments(user1.address)).to.equal(commitment);
    });
  });

  describe("Tax Payments", function () {
    it("Should process a tax payment", async function () {
      const amount = 1000; // 1000 BDT
      const proofId = "proof123";
      
      // Process tax payment
      const tx = await taxSystem.connect(user1).processTaxPayment(amount, proofId);
      
      // Get payment hash from event
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'TaxPaid');
      const paymentHash = event.args[3]; // Fourth argument is paymentHash
      
      // Verify tax receipt
      expect(await taxSystem.verifyTaxReceipt(paymentHash, user1.address)).to.be.true;
      
      // Check total tax collected
      expect(await taxSystem.totalTaxCollected()).to.equal(amount);
    });
  });

  describe("Treasury Balance", function () {
    it("Should return the correct treasury balance", async function () {
      const amount1 = 1000; // 1000 BDT
      const amount2 = 2000; // 2000 BDT
      
      // Process tax payments
      await taxSystem.connect(user1).processTaxPayment(amount1, "proof1");
      await taxSystem.connect(user2).processTaxPayment(amount2, "proof2");
      
      // Check total tax collected
      expect(await taxSystem.totalTaxCollected()).to.equal(amount1 + amount2);
      
      // Check treasury balance
      expect(await taxSystem.getTreasuryBalance()).to.equal(amount1 + amount2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update treasury wallet", async function () {
      const newTreasuryWallet = user2.address;
      
      // Update treasury wallet
      await taxSystem.updateTreasuryWallet(newTreasuryWallet);
      
      // Check treasury wallet
      expect(await taxSystem.treasuryWallet()).to.equal(newTreasuryWallet);
    });
    
    it("Should not allow non-owner to update treasury wallet", async function () {
      const newTreasuryWallet = user2.address;
      
      // Try to update treasury wallet as non-owner
      await expect(
        taxSystem.connect(user1).updateTreasuryWallet(newTreasuryWallet)
      ).to.be.revertedWith("Only owner can call this function");
    });
    
    it("Should allow owner to update ZKP verifier", async function () {
      // Deploy a new ZKP verifier
      const ZKPVerifier = await ethers.getContractFactory("ZKPVerifier");
      const newZkpVerifier = await ZKPVerifier.deploy();
      await newZkpVerifier.waitForDeployment();
      
      // Update ZKP verifier
      await taxSystem.updateZKPVerifier(await newZkpVerifier.getAddress());
      
      // Check ZKP verifier
      expect(await taxSystem.zkpVerifier()).to.equal(await newZkpVerifier.getAddress());
    });
  });
});
