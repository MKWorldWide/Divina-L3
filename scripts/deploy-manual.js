const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Manual Deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  try {
    // Deploy GameDinSettlement
    console.log("\n📋 Deploying GameDinSettlement...");
    const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
    const settlement = await GameDinSettlement.deploy(
      deployer.address,
      ethers.parseEther("1000000000")
    );
    await settlement.waitForDeployment();
    console.log("✅ GameDinSettlement deployed to:", await settlement.getAddress());
    
    // Deploy GameDinL3Bridge
    console.log("\n🌉 Deploying GameDinL3Bridge...");
    const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
    const settlementAddress = await settlement.getAddress();
    const bridge = await GameDinL3Bridge.deploy(settlementAddress);
    await bridge.waitForDeployment();
    console.log("✅ GameDinL3Bridge deployed to:", await bridge.getAddress());
    
    // Deploy NovaSanctumOracle
    console.log("\n🔮 Deploying NovaSanctumOracle...");
    const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
    const oracle = await NovaSanctumOracle.deploy(deployer.address);
    await oracle.waitForDeployment();
    console.log("✅ NovaSanctumOracle deployed to:", await oracle.getAddress());
    
    // Deploy GameDinToken
    console.log("\n🪙 Deploying GameDinToken...");
    const GameDinToken = await ethers.getContractFactory("GameDinToken");
    const token = await GameDinToken.deploy(
      "GameDin Token",
      "GDI",
      deployer.address
    );
    await token.waitForDeployment();
    console.log("✅ GameDinToken deployed to:", await token.getAddress());
    
    // Deploy GamingCore
    console.log("\n🎮 Deploying GamingCore...");
    const GamingCore = await ethers.getContractFactory("GamingCore");
    const tokenAddress = await token.getAddress();
    const oracleAddress = await oracle.getAddress();
    const gamingCore = await GamingCore.deploy(
      tokenAddress,
      oracleAddress
    );
    await gamingCore.waitForDeployment();
    console.log("✅ GamingCore deployed to:", await gamingCore.getAddress());
    
    // Deploy NFTMarketplace
    console.log("\n🖼️ Deploying NFTMarketplace...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy(tokenAddress);
    await marketplace.waitForDeployment();
    console.log("✅ NFTMarketplace deployed to:", await marketplace.getAddress());
    
    // Deploy AIOracle
    console.log("\n🤖 Deploying AIOracle...");
    const AIOracle = await ethers.getContractFactory("AIOracle");
    const gamingCoreAddress = await gamingCore.getAddress();
    const aiOracle = await AIOracle.deploy(
      deployer.address, // initialOwner
      gamingCoreAddress, // gamingCore
      oracleAddress, // novaSanctumService
      oracleAddress, // athenaMistService (using same oracle for now)
      ethers.ZeroAddress // chainlinkOracle (placeholder)
    );
    await aiOracle.waitForDeployment();
    console.log("✅ AIOracle deployed to:", await aiOracle.getAddress());
    
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("==========================================");
    console.log(`GameDinSettlement: ${await settlement.getAddress()}`);
    console.log(`GameDinL3Bridge: ${await bridge.getAddress()}`);
    console.log(`NovaSanctumOracle: ${await oracle.getAddress()}`);
    console.log(`GameDinToken: ${await token.getAddress()}`);
    console.log(`GamingCore: ${await gamingCore.getAddress()}`);
    console.log(`NFTMarketplace: ${await marketplace.getAddress()}`);
    console.log(`AIOracle: ${await aiOracle.getAddress()}`);
    
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