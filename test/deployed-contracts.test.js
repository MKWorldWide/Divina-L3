const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameDin L3 Deployed Contracts Tests", function () {
  let deployer;
  let gdiToken;
  let gamingCore;
  let aiOracle;
  let nftMarketplace;
  let bridge;
  let settlement;

  // Load deployed addresses
  const deployedAddresses = require("../deployed-addresses.json");

  beforeEach(async function () {
    // Get signers
    [deployer] = await ethers.getSigners();

    // Connect to deployed contracts
    gdiToken = await ethers.getContractAt("GameDinToken", deployedAddresses.token);
    gamingCore = await ethers.getContractAt("GamingCore", deployedAddresses.gamingCore);
    aiOracle = await ethers.getContractAt("AIOracle", deployedAddresses.aiOracle);
    nftMarketplace = await ethers.getContractAt("NFTMarketplace", deployedAddresses.marketplace);
    bridge = await ethers.getContractAt("GameDinL3Bridge", deployedAddresses.bridge);
    settlement = await ethers.getContractAt("GameDinSettlement", deployedAddresses.settlement);

    console.log("Connected to deployed contracts:");
    console.log("GDI Token:", gdiToken.target);
    console.log("Gaming Core:", gamingCore.target);
    console.log("AI Oracle:", aiOracle.target);
    console.log("NFT Marketplace:", nftMarketplace.target);
    console.log("Bridge:", bridge.target);
    console.log("Settlement:", settlement.target);
  });

  describe("Contract Connections", function () {
    it("Should connect to all deployed contracts successfully", async function () {
      expect(gdiToken.target).to.equal(deployedAddresses.token);
      expect(gamingCore.target).to.equal(deployedAddresses.gamingCore);
      expect(aiOracle.target).to.equal(deployedAddresses.aiOracle);
      expect(nftMarketplace.target).to.equal(deployedAddresses.marketplace);
      expect(bridge.target).to.equal(deployedAddresses.bridge);
      expect(settlement.target).to.equal(deployedAddresses.settlement);
    });

    it("Should have correct deployer as owner", async function () {
      const tokenOwner = await gdiToken.owner();
      const coreOwner = await gamingCore.owner();
      const oracleOwner = await aiOracle.owner();
      
      expect(tokenOwner).to.equal(deployedAddresses.deployer);
      expect(coreOwner).to.equal(deployedAddresses.deployer);
      expect(oracleOwner).to.equal(deployedAddresses.deployer);
    });
  });

  describe("GDI Token Functions", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await gdiToken.totalSupply();
      const expectedSupply = ethers.parseEther("1000000000"); // 1 billion tokens
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
      expect(platformFee).to.equal(25); // 0.25%
    });

    it("Should have correct AI service fee", async function () {
      const aiServiceFee = await gamingCore.aiServiceFee();
      expect(aiServiceFee).to.equal(15); // 0.15%
    });
  });

  describe("AI Oracle Functions", function () {
    it("Should have correct request fee", async function () {
      const requestFee = await aiOracle.requestFee();
      expect(requestFee).to.equal(ethers.parseEther("0.001")); // 0.001 ETH
    });

    it("Should have correct response timeout", async function () {
      const responseTimeout = await aiOracle.responseTimeout();
      expect(responseTimeout).to.equal(300); // 5 minutes
    });

    it("Should have correct min confidence", async function () {
      const minConfidence = await aiOracle.minConfidence();
      expect(minConfidence).to.equal(70); // 70%
    });
  });

  describe("NFT Marketplace Functions", function () {
    it("Should have correct platform fee", async function () {
      const platformFee = await nftMarketplace.platformFee();
      expect(platformFee).to.equal(250); // 2.5%
    });

    it("Should have correct royalty fee", async function () {
      const royaltyFee = await nftMarketplace.royaltyFee();
      expect(royaltyFee).to.equal(1000); // 10%
    });
  });

  describe("Bridge Functions", function () {
    it("Should have correct minimum bridge amount", async function () {
      const minBridgeAmount = await bridge.minBridgeAmount();
      expect(minBridgeAmount).to.be.greaterThan(0);
    });

    it("Should have correct bridge fee", async function () {
      const bridgeFee = await bridge.bridgeFee();
      expect(bridgeFee).to.be.greaterThanOrEqual(0);
    });
  });

  describe("Settlement Functions", function () {
    it("Should have correct settlement timeout", async function () {
      const settlementTimeout = await settlement.settlementTimeout();
      expect(settlementTimeout).to.be.greaterThan(0);
    });

    it("Should have correct minimum settlement amount", async function () {
      const minSettlementAmount = await settlement.minSettlementAmount();
      expect(minSettlementAmount).to.be.greaterThan(0);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for token transfers", async function () {
      const [deployer, recipient] = await ethers.getSigners();
      const transferAmount = ethers.parseEther("100");
      
      const transferTx = await gdiToken.transfer(recipient.address, transferAmount);
      const transferReceipt = await transferTx.wait();
      
      // Gas cost should be reasonable (less than 50k gas for transfers)
      expect(transferReceipt.gasUsed).to.be.lessThan(50000);
      console.log("Token transfer gas used:", transferReceipt.gasUsed.toString());
    });

    it("Should have reasonable gas costs for minting", async function () {
      const mintAmount = ethers.parseEther("1000");
      const mintTx = await gdiToken.mint(deployer.address, mintAmount);
      const mintReceipt = await mintTx.wait();
      
      // Gas cost should be reasonable (less than 100k gas for minting)
      expect(mintReceipt.gasUsed).to.be.lessThan(100000);
      console.log("Token mint gas used:", mintReceipt.gasUsed.toString());
    });

    it("Should have reasonable gas costs for pausing", async function () {
      const pauseTx = await gamingCore.pause();
      const pauseReceipt = await pauseTx.wait();
      
      // Gas cost should be reasonable (less than 30k gas for pausing)
      expect(pauseReceipt.gasUsed).to.be.lessThan(30000);
      console.log("Pause gas used:", pauseReceipt.gasUsed.toString());
    });
  });

  describe("System Integration", function () {
    it("Should have all contracts deployed on the same network", async function () {
      const network = await ethers.provider.getNetwork();
      expect(network.chainId).to.equal(deployedAddresses.chainId);
      expect(network.chainId).to.equal(31337); // Hardhat network
    });

    it("Should have deployer with sufficient balance", async function () {
      const balance = await ethers.provider.getBalance(deployer.address);
      expect(balance).to.be.greaterThan(0);
      console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
    });

    it("Should have deployer with GDI tokens", async function () {
      const tokenBalance = await gdiToken.balanceOf(deployer.address);
      expect(tokenBalance).to.be.greaterThan(0);
      console.log("Deployer GDI balance:", ethers.formatEther(tokenBalance), "GDIN");
    });
  });
}); 