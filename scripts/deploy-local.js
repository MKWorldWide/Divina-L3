import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying GameDin L3 Contracts to Localhost...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Check balance using provider
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy GameDin Settlement Contract
  console.log("📋 Deploying GameDin Settlement Contract...");
  const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
  const settlement = await GameDinSettlement.deploy(
    deployer.address, // initialOwner
    ethers.parseEther(process.env.INITIAL_SUPPLY || "1000000000")
  );
  await settlement.waitForDeployment();
  console.log("✅ GameDin Settlement deployed to:", await settlement.getAddress());
  
  // Deploy L3 Bridge Contract
  console.log("🌉 Deploying GameDin L3 Bridge Contract...");
  const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
  const bridge = await GameDinL3Bridge.deploy(await settlement.getAddress());
  await bridge.waitForDeployment();
  console.log("✅ GameDin L3 Bridge deployed to:", await bridge.getAddress());
  
  // Deploy NovaSanctum Oracle
  console.log("🔮 Deploying NovaSanctum AI Oracle...");
  const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
  const oracle = await NovaSanctumOracle.deploy(deployer.address); // Pass deployer as initialOwner
  await oracle.waitForDeployment();
  console.log("✅ NovaSanctum Oracle deployed to:", await oracle.getAddress());
  
  // Deploy GameDin Token
  console.log("🪙 Deploying GameDin Token...");
  const GameDinToken = await ethers.getContractFactory("GameDinToken");
  const token = await GameDinToken.deploy("GameDin Token", "GDIN", deployer.address); // Pass name, symbol, owner
  await token.waitForDeployment();
  console.log("✅ GameDin Token deployed to:", await token.getAddress());
  
  // Deploy Gaming Core
  console.log("🎮 Deploying Gaming Core...");
  const GamingCore = await ethers.getContractFactory("GamingCore");
  const gamingCore = await GamingCore.deploy(deployer.address); // Only initialOwner
  await gamingCore.waitForDeployment();
  console.log("✅ Gaming Core deployed to:", await gamingCore.getAddress());
  
  // Deploy NFT Marketplace
  console.log("🖼️ Deploying NFT Marketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(await token.getAddress());
  await marketplace.waitForDeployment();
  console.log("✅ NFT Marketplace deployed to:", await marketplace.getAddress());
  
  // Deploy AI Oracle
  console.log("🤖 Deploying AI Oracle...");
  const AIOracle = await ethers.getContractFactory("AIOracle");
  const aiOracle = await AIOracle.deploy(
    deployer.address,
    await gamingCore.getAddress(),
    await oracle.getAddress(),
    deployer.address, // AthenaMist service (mock)
    ethers.ZeroAddress // Chainlink oracle (mock)
  );
  await aiOracle.waitForDeployment();
  console.log("✅ AI Oracle deployed to:", await aiOracle.getAddress());
  
  // Configure contracts
  console.log("⚙️ Configuring contracts...");
  
  // Add gaming core as authorized game contract
  await token.addGameContract(await gamingCore.getAddress());
  console.log("✅ Gaming Core added as authorized game contract");
  
  // Add deployer as gas sponsor
  await token.addGasSponsor(deployer.address);
  console.log("✅ Deployer added as gas sponsor");
  
  // Set NovaSanctum Oracle in token contract
  await token.setNovaSanctumOracle(await oracle.getAddress());
  console.log("✅ NovaSanctum Oracle set in token contract");
  
  // Set gaming engine in token contract
  await token.setGamingEngine(await gamingCore.getAddress());
  console.log("✅ Gaming Engine set in token contract");
  
  // Add authorized callers to NovaSanctum Oracle
  await oracle.addAuthorizedCaller(await gamingCore.getAddress());
  await oracle.addAuthorizedCaller(deployer.address);
  console.log("✅ Authorized callers added to NovaSanctum Oracle");
  
  // Save deployment addresses
  const addresses = {
    settlement: await settlement.getAddress(),
    bridge: await bridge.getAddress(),
    oracle: await oracle.getAddress(),
    token: await token.getAddress(),
    gamingCore: await gamingCore.getAddress(),
    marketplace: await marketplace.getAddress(),
    aiOracle: await aiOracle.getAddress(),
    deployer: deployer.address,
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(), // Convert BigInt to string
    deployedAt: new Date().toISOString()
  };
  
  // Save to file
  fs.writeFileSync('deployed-addresses-local.json', JSON.stringify(addresses, null, 2));
  
  console.log("📄 Deployment addresses saved to deployed-addresses-local.json");
  
  // Print summary
  console.log("\n🎉 GameDin L3 Local Deployment Complete!");
  console.log("==========================================");
  console.log(`Network: ${addresses.network}`);
  console.log(`Chain ID: ${addresses.chainId}`);
  console.log(`Settlement: ${addresses.settlement}`);
  console.log(`Bridge: ${addresses.bridge}`);
  console.log(`NovaSanctum Oracle: ${addresses.oracle}`);
  console.log(`GameDin Token: ${addresses.token}`);
  console.log(`Gaming Core: ${addresses.gamingCore}`);
  console.log(`NFT Marketplace: ${addresses.marketplace}`);
  console.log(`AI Oracle: ${addresses.aiOracle}`);
  console.log("\n🚀 Ready for testing and development!");
  
  // Start local services
  console.log("\n🔧 Starting local services...");
  console.log("Run these commands in separate terminals:");
  console.log("1. npm run start:node (for local blockchain)");
  console.log("2. npm run start:gaming (for gaming engine)");
  console.log("3. npm run start:ai (for AI services)");
  console.log("4. cd gdi-dapp && npm start (for frontend)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 