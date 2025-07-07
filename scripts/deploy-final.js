const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Final GameDin L3 Deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  try {
    // Step 1: Deploy GameDinSettlement
    console.log("\n📋 Deploying GameDinSettlement...");
    const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
    const settlement = await GameDinSettlement.deploy(
      deployer.address,
      ethers.parseEther("1000000000")
    );
    await settlement.waitForDeployment();
    const settlementAddress = await settlement.getAddress();
    console.log("✅ GameDinSettlement deployed to:", settlementAddress);
    
    // Step 2: Deploy GameDinL3Bridge
    console.log("\n🌉 Deploying GameDinL3Bridge...");
    const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
    const bridge = await GameDinL3Bridge.deploy(settlementAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log("✅ GameDinL3Bridge deployed to:", bridgeAddress);
    
    // Step 3: Deploy NovaSanctumOracle
    console.log("\n🔮 Deploying NovaSanctumOracle...");
    const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
    const oracle = await NovaSanctumOracle.deploy(deployer.address);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("✅ NovaSanctumOracle deployed to:", oracleAddress);
    
    // Step 4: Deploy GameDinToken
    console.log("\n🪙 Deploying GameDinToken...");
    const GameDinToken = await ethers.getContractFactory("GameDinToken");
    const token = await GameDinToken.deploy(
      "GameDin Token",
      "GDI",
      deployer.address
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ GameDinToken deployed to:", tokenAddress);
    
    // Step 5: Deploy GamingCore
    console.log("\n🎮 Deploying GamingCore...");
    const GamingCore = await ethers.getContractFactory("GamingCore");
    const gamingCore = await GamingCore.deploy(
      tokenAddress,
      oracleAddress
    );
    await gamingCore.waitForDeployment();
    const gamingCoreAddress = await gamingCore.getAddress();
    console.log("✅ GamingCore deployed to:", gamingCoreAddress);
    
    // Step 6: Deploy NFTMarketplace
    console.log("\n🖼️ Deploying NFTMarketplace...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy(tokenAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ NFTMarketplace deployed to:", marketplaceAddress);
    
    // Step 7: Deploy AIOracle
    console.log("\n🤖 Deploying AIOracle...");
    const AIOracle = await ethers.getContractFactory("AIOracle");
    const aiOracle = await AIOracle.deploy(
      deployer.address, // initialOwner
      gamingCoreAddress, // gamingCore
      oracleAddress, // novaSanctumService
      oracleAddress, // athenaMistService (using same oracle for now)
      ethers.ZeroAddress // chainlinkOracle (placeholder)
    );
    await aiOracle.waitForDeployment();
    const aiOracleAddress = await aiOracle.getAddress();
    console.log("✅ AIOracle deployed to:", aiOracleAddress);
    
    // Step 8: Configure contracts
    console.log("\n⚙️ Configuring contracts...");
    
    // Add gaming core as authorized game contract
    await token.addGameContract(gamingCoreAddress);
    console.log("✅ Gaming Core added as authorized game contract");
    
    // Add deployer as gas sponsor
    await token.addGasSponsor(deployer.address);
    console.log("✅ Deployer added as gas sponsor");
    
    // Set NovaSanctum Oracle in token contract
    await token.setNovaSanctumOracle(oracleAddress);
    console.log("✅ NovaSanctum Oracle set in token contract");
    
    // Set gaming engine in token contract
    await token.setGamingEngine(gamingCoreAddress);
    console.log("✅ Gaming Engine set in token contract");
    
    // Add authorized callers to NovaSanctum Oracle
    await oracle.addAuthorizedCaller(gamingCoreAddress);
    await oracle.addAuthorizedCaller(deployer.address);
    console.log("✅ Authorized callers added to NovaSanctum Oracle");
    
    // Save deployment addresses
    const addresses = {
      settlement: settlementAddress,
      bridge: bridgeAddress,
      oracle: oracleAddress,
      token: tokenAddress,
      gamingCore: gamingCoreAddress,
      marketplace: marketplaceAddress,
      aiOracle: aiOracleAddress,
      deployer: deployer.address,
      network: "hardhat",
      chainId: 31337,
      deployedAt: new Date().toISOString()
    };
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    
    console.log("\n📄 Deployment addresses saved to deployed-addresses.json");
    
    // Print summary
    console.log("\n🎉 GameDin L3 Deployment Complete!");
    console.log("=====================================");
    console.log(`Network: ${addresses.network}`);
    console.log(`Chain ID: ${addresses.chainId}`);
    console.log(`GameDin Settlement: ${addresses.settlement}`);
    console.log(`GameDin L3 Bridge: ${addresses.bridge}`);
    console.log(`NovaSanctum Oracle: ${addresses.oracle}`);
    console.log(`GameDin Token: ${addresses.token}`);
    console.log(`Gaming Core: ${addresses.gamingCore}`);
    console.log(`NFT Marketplace: ${addresses.marketplace}`);
    console.log(`AI Oracle: ${addresses.aiOracle}`);
    console.log("\n🚀 GameDin L3 Gaming Blockchain is ready!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 