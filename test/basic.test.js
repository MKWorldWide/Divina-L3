const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameDin L3 Basic Tests", function () {
  let deployer;
  let gdiToken;
  let gamingCore;
  let aiOracle;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const GDIToken = await ethers.getContractFactory("GameDinToken");
    gdiToken = await GDIToken.deploy("GameDin Token", "GDIN", deployer.address);
    await gdiToken.waitForDeployment();

    const GamingCore = await ethers.getContractFactory("GamingCore");
    gamingCore = await GamingCore.deploy(deployer.address);
    await gamingCore.waitForDeployment();

    const dummyAddress1 = ethers.Wallet.createRandom().address;
    const dummyAddress2 = ethers.Wallet.createRandom().address;
    const dummyAddress3 = ethers.Wallet.createRandom().address;

    const AIOracle = await ethers.getContractFactory("AIOracle");
    aiOracle = await AIOracle.deploy(
      deployer.address,
      gamingCore.target,
      dummyAddress1,
      dummyAddress2,
      dummyAddress3
    );
    await aiOracle.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should deploy GameDinToken successfully", async function () {
      expect(gdiToken.target).to.be.a("string");
      expect(gdiToken.target).to.not.equal(ethers.ZeroAddress);
    });
    it("Should deploy AIOracle successfully", async function () {
      expect(aiOracle.target).to.be.a("string");
      expect(aiOracle.target).to.not.equal(ethers.ZeroAddress);
    });
    it("Should deploy GamingCore successfully", async function () {
      expect(gamingCore.target).to.be.a("string");
      expect(gamingCore.target).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("GDI Token Basic Functions", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await gdiToken.totalSupply();
      const expectedSupply = ethers.parseEther("1000000000");
      expect(totalSupply).to.equal(expectedSupply);
    });
    it("Should allow minting by authorized accounts", async function () {
      const mintAmount = ethers.parseEther("1000");
      await gdiToken.mint(deployer.address, mintAmount);
      const balance = await gdiToken.balanceOf(deployer.address);
      expect(balance).to.equal(mintAmount);
    });
    it("Should allow transfers", async function () {
      const [deployer, recipient] = await ethers.getSigners();
      const transferAmount = ethers.parseEther("100");
      await gdiToken.transfer(recipient.address, transferAmount);
      const recipientBalance = await gdiToken.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(transferAmount);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for basic operations", async function () {
      const mintTx = await gdiToken.mint(deployer.address, ethers.parseEther("1000"));
      const mintReceipt = await mintTx.wait();
      expect(mintReceipt.gasUsed).to.be.lessThan(100000);
    });
    it("Should have reasonable gas costs for transfers", async function () {
      const [deployer, recipient] = await ethers.getSigners();
      const transferTx = await gdiToken.transfer(recipient.address, ethers.parseEther("100"));
      const transferReceipt = await transferTx.wait();
      expect(transferReceipt.gasUsed).to.be.lessThan(50000);
    });
  });

  describe("Contract Integration", function () {
    it("Should allow setting up basic contract relationships", async function () {
      expect(gdiToken.target).to.not.equal(gamingCore.target);
      expect(aiOracle.target).to.not.equal(gamingCore.target);
      expect(gdiToken.target).to.not.equal(aiOracle.target);
    });
  });
}); 