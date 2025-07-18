const { expect } = require("chai");
const { ethers } = require("hardhat");

const deployedAddresses = require("../deployed-addresses.json");

describe("GameDin L3 Deployed Contracts Tests", function () {
  let deployer;
  let gdiToken;
  let gamingCore;
  let aiOracle;
  let nftMarketplace;
  let bridge;
  let settlement;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    gdiToken = await ethers.getContractAt("GameDinToken", deployedAddresses.token);
    gamingCore = await ethers.getContractAt("GamingCore", deployedAddresses.gamingCore);
    aiOracle = await ethers.getContractAt("AIOracle", deployedAddresses.aiOracle);
    nftMarketplace = await ethers.getContractAt("NFTMarketplace", deployedAddresses.marketplace);
    bridge = await ethers.getContractAt("GameDinL3Bridge", deployedAddresses.bridge);
    settlement = await ethers.getContractAt("GameDinSettlement", deployedAddresses.settlement);
  });

  describe("GDI Token Functions", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await gdiToken.totalSupply();
      const expectedSupply = ethers.parseEther("1000000000");
      expect(totalSupply).to.equal(expectedSupply);
    });
    it("Should allow minting by owner", async function () {
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
    it("Should have correct token name and symbol", async function () {
      const name = await gdiToken.name();
      const symbol = await gdiToken.symbol();
      expect(name).to.equal("GameDin Token");
      expect(symbol).to.equal("GDIN");
    });
  });

  describe("Gaming Core Functions", function () {
    it("Should allow pausing and unpausing", async function () {
      await gamingCore.pause();
      expect(await gamingCore.paused()).to.be.true;
      await gamingCore.unpause();
      expect(await gamingCore.paused()).to.be.false;
    });
    it("Should have correct platform fee", async function () {
      const platformFee = await gamingCore.platformFee();
      expect(platformFee).to.equal(25);
    });
    it("Should have correct AI service fee", async function () {
      const aiServiceFee = await gamingCore.aiServiceFee();
      expect(aiServiceFee).to.equal(15);
    });
  });

  describe("System Integration", function () {
    it("Should have all contracts deployed on the same network", async function () {
      const network = await ethers.provider.getNetwork();
      expect(network.chainId).to.equal(deployedAddresses.chainId);
      expect(network.chainId).to.equal(31337);
    });
    it("Should have deployer with sufficient balance", async function () {
      const balance = await ethers.provider.getBalance(deployer.address);
      expect(balance).to.be.greaterThan(0);
    });
    it("Should have deployer with GDI tokens", async function () {
      const tokenBalance = await gdiToken.balanceOf(deployer.address);
      expect(tokenBalance).to.be.greaterThan(0);
    });
  });
}); 