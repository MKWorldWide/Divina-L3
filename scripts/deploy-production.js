const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting GameDin L3 Production Deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy contracts in the correct order
  console.log("\n📋 Deploying contracts...");

  // 1. Deploy GameDinToken first
  console.log("🪙 Deploying GameDinToken...");
  const GameDinToken = await ethers.getContractFactory("GameDinToken");
  const gdiToken = await GameDinToken.deploy("GameDin Token", "GDIN", deployer.address);
  await gdiToken.waitForDeployment();
  console.log("✅ GameDinToken deployed to:", gdiToken.target);

  // 2. Deploy GamingCore
  console.log("🎮 Deploying GamingCore...");
  const GamingCore = await ethers.getContractFactory("GamingCore");
  const gamingCore = await GamingCore.deploy(deployer.address);
  await gamingCore.waitForDeployment();
  console.log("✅ GamingCore deployed to:", gamingCore.target);

  // 3. Deploy NovaSanctumOracle (for AI services)
  console.log("🔮 Deploying NovaSanctumOracle...");
  const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
  const novaSanctumOracle = await NovaSanctumOracle.deploy(deployer.address);
  await novaSanctumOracle.waitForDeployment();
  console.log("✅ NovaSanctumOracle deployed to:", novaSanctumOracle.target);

  // 4. Deploy AIOracle with proper configuration
  console.log("🤖 Deploying AIOracle...");
  const AIOracle = await ethers.getContractFactory("AIOracle");
  const aiOracle = await AIOracle.deploy(
    deployer.address,
    gamingCore.target,
    novaSanctumOracle.target, // novaSanctumService
    novaSanctumOracle.target, // athenaMistService (using same for now)
    ethers.ZeroAddress // chainlinkOracle (placeholder)
  );
  await aiOracle.waitForDeployment();
  console.log("✅ AIOracle deployed to:", aiOracle.target);

  // 5. Deploy NFTMarketplace
  console.log("🖼️ Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy(deployer.address);
  await nftMarketplace.waitForDeployment();
  console.log("✅ NFTMarketplace deployed to:", nftMarketplace.target);

  // 6. Deploy Bridge
  console.log("🌉 Deploying GameDinL3Bridge...");
  const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
  const bridge = await GameDinL3Bridge.deploy();
  await bridge.waitForDeployment();
  console.log("✅ GameDinL3Bridge deployed to:", bridge.target);

  // 7. Deploy Settlement
  console.log("💰 Deploying GameDinSettlement...");
  const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
  const settlement = await GameDinSettlement.deploy();
  await settlement.waitForDeployment();
  console.log("✅ GameDinSettlement deployed to:", settlement.target);

  // Configure contracts
  console.log("\n🔧 Configuring contracts...");

  // Configure GameDinToken
  console.log("🪙 Configuring GameDinToken...");
  await gdiToken.addGameContract(gamingCore.target);
  await gdiToken.addGasSponsor(deployer.address);
  await gdiToken.setNovaSanctumOracle(novaSanctumOracle.target);
  await gdiToken.setGamingEngine(gamingCore.target);
  console.log("✅ GameDinToken configured");

  // Configure GamingCore
  console.log("🎮 Configuring GamingCore...");
  // GamingCore configuration is done during deployment
  console.log("✅ GamingCore configured");

  // Configure NovaSanctumOracle
  console.log("🔮 Configuring NovaSanctumOracle...");
  await novaSanctumOracle.addAuthorizedCaller(gamingCore.target);
  await novaSanctumOracle.addAuthorizedCaller(deployer.address);
  console.log("✅ NovaSanctumOracle configured");

  // Configure NFTMarketplace
  console.log("🖼️ Configuring NFTMarketplace...");
  // NFTMarketplace is configured during deployment
  console.log("✅ NFTMarketplace configured");

  // Configure Bridge
  console.log("🌉 Configuring Bridge...");
  await bridge.setMinimumBridgeAmount(ethers.parseEther("0.001"));
  await bridge.setBridgeFee(ethers.parseEther("0.0001"));
  console.log("✅ Bridge configured");

  // Configure Settlement
  console.log("💰 Configuring Settlement...");
  await settlement.setSettlementTimeout(3600); // 1 hour
  await settlement.setMinimumSettlementAmount(ethers.parseEther("0.01"));
  console.log("✅ Settlement configured");

  // Save deployment addresses
  const deploymentData = {
    settlement: settlement.target,
    oracle: novaSanctumOracle.target,
    token: gdiToken.target,
    gamingCore: gamingCore.target,
    marketplace: nftMarketplace.target,
    aiOracle: aiOracle.target,
    bridge: bridge.target,
    deployer: deployer.address,
    network: "hardhat",
    chainId: 31337,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(deploymentData, null, 2));
  console.log("\n📄 Deployment addresses saved to deployed-addresses.json");

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  // Check token supply
  const totalSupply = await gdiToken.totalSupply();
  console.log("✅ GDI Token total supply:", ethers.formatEther(totalSupply));

  // Check token name and symbol
  const name = await gdiToken.name();
  const symbol = await gdiToken.symbol();
  console.log("✅ Token name:", name);
  console.log("✅ Token symbol:", symbol);

  // Check deployer balance
  const deployerBalance = await gdiToken.balanceOf(deployer.address);
  console.log("✅ Deployer GDI balance:", ethers.formatEther(deployerBalance));

  // Check contract owners
  const tokenOwner = await gdiToken.owner();
  const coreOwner = await gamingCore.owner();
  const oracleOwner = await aiOracle.owner();
  console.log("✅ Token owner:", tokenOwner);
  console.log("✅ Core owner:", coreOwner);
  console.log("✅ Oracle owner:", oracleOwner);

  console.log("\n🎉 GameDin L3 Production Deployment Complete!");
  console.log("\n📊 Deployment Summary:");
  console.log("=====================================");
  console.log("settlement:", settlement.target);
  console.log("oracle:", novaSanctumOracle.target);
  console.log("token:", gdiToken.target);
  console.log("gamingCore:", gamingCore.target);
  console.log("marketplace:", nftMarketplace.target);
  console.log("aiOracle:", aiOracle.target);
  console.log("bridge:", bridge.target);
  console.log("=====================================");
  console.log("\n🚀 System is ready for production use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 