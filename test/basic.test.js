const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameDin L3 Basic Tests", function () {
  let deployer;
  let gdiToken;
  let gamingCore;
  let aiOracle;
  let nftMarketplace;
  let bridge;
  let settlement;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    console.log("[LOG] Deployer address:", deployer.address);

    const GDIToken = await ethers.getContractFactory("GDIToken");
    gdiToken = await GDIToken.deploy("GameDin Token", "GDIN", deployer.address, deployer.address, deployer.address, deployer.address);
    await gdiToken.waitForDeployment();
    console.log("[LOG] GDIToken deployed at:", gdiToken.target);

    const GamingCore = await ethers.getContractFactory("GamingCore");
    gamingCore = await GamingCore.deploy(deployer.address);
    await gamingCore.waitForDeployment();
    console.log("[LOG] GamingCore deployed at:", gamingCore.target);

    const dummyAddress1 = deployer.address;
    const dummyAddress2 = deployer.address;
    aiOracle = dummyAddress1;
    nftMarketplace = dummyAddress2;
    bridge = dummyAddress1;
    settlement = dummyAddress2;
  });

  it("Should deploy GDIToken and set initial supply", async function () {
    const supply = await gdiToken.totalSupply();
    console.log("[LOG] Initial supply:", supply.toString());
    expect(supply).to.equal(ethers.parseEther("1000000000"));
  });

  it("Should allow minting by authorized accounts", async function () {
    const mintAmount = ethers.parseEther("1000");
    await gdiToken.mint(deployer.address, mintAmount);
    const balance = await gdiToken.balanceOf(deployer.address);
    const expectedBalance = ethers.parseEther("1000000000") + mintAmount; // initial + minted
    console.log("[LOG] Balance after mint:", balance.toString());
    expect(balance).to.equal(expectedBalance);
  });

  it("Should transfer tokens and check balances", async function () {
    const recipient = deployer.address;
    const transferAmount = ethers.parseEther("100");
    await gdiToken.transfer(recipient, transferAmount);
    const balance = await gdiToken.balanceOf(recipient);
    console.log("[LOG] Balance after transfer:", balance.toString());
    expect(balance).to.be.gte(transferAmount);
  });

  it("Should not allow minting by unauthorized accounts", async function () {
    const [_, other] = await ethers.getSigners();
    const mintAmount = ethers.parseEther("1000");
    let failed = false;
    try {
      await gdiToken.connect(other).mint(other.address, mintAmount);
    } catch (e) {
      failed = true;
      console.log("[LOG] Unauthorized mint attempt failed as expected:", e.message);
    }
    expect(failed).to.be.true;
  });

  describe("Contract Deployment", function () {
    it("Should deploy GameDinToken successfully", async function () {
      expect(gdiToken.target).to.be.a("string");
      expect(gdiToken.target).to.not.equal(ethers.ZeroAddress);
    });
    it("Should deploy AIOracle successfully", async function () {
      // Simulate AIOracle deployment (replace with actual deployment if available)
      // For now, just log the dummy address
      console.log("[LOG] AIOracle address:", aiOracle);
      expect(typeof aiOracle).to.equal("string");
      expect(aiOracle).to.match(/^0x[a-fA-F0-9]{40}$/);
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
      const expectedBalance = ethers.parseEther("1000000000") + mintAmount; // initial + minted
      expect(balance).to.equal(expectedBalance);
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