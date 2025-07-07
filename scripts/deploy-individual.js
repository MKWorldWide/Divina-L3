const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Individual Contract Deployment Test...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const deployedContracts = {};
  
  try {
    // Test 1: GameDinSettlement
    console.log("\n📋 Testing GameDinSettlement...");
    const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
    const settlement = await GameDinSettlement.deploy(
      deployer.address,
      ethers.parseEther("1000000000")
    );
    await settlement.waitForDeployment();
    deployedContracts.settlement = await settlement.getAddress();
    console.log("✅ GameDinSettlement:", deployedContracts.settlement);
    
    // Test 2: NovaSanctumOracle
    console.log("\n🔮 Testing NovaSanctumOracle...");
    const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
    const oracle = await NovaSanctumOracle.deploy(deployer.address);
    await oracle.waitForDeployment();
    deployedContracts.oracle = await oracle.getAddress();
    console.log("✅ NovaSanctumOracle:", deployedContracts.oracle);
    
    // Test 3: GameDinToken
    console.log("\n🪙 Testing GameDinToken...");
    const GameDinToken = await ethers.getContractFactory("GameDinToken");
    const token = await GameDinToken.deploy(
      "GameDin Token",
      "GDI",
      deployer.address
    );
    await token.waitForDeployment();
    deployedContracts.token = await token.getAddress();
    console.log("✅ GameDinToken:", deployedContracts.token);
    
    // Test 4: GamingCore
    console.log("\n🎮 Testing GamingCore...");
    const GamingCore = await ethers.getContractFactory("GamingCore");
    const gamingCore = await GamingCore.deploy(deployer.address);
    await gamingCore.waitForDeployment();
    deployedContracts.gamingCore = await gamingCore.getAddress();
    console.log("✅ GamingCore:", deployedContracts.gamingCore);
    
    // Test 5: NFTMarketplace
    console.log("\n🖼️ Testing NFTMarketplace...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy(deployedContracts.token);
    await marketplace.waitForDeployment();
    deployedContracts.marketplace = await marketplace.getAddress();
    console.log("✅ NFTMarketplace:", deployedContracts.marketplace);
    
    // Test 6: AIOracle
    console.log("\n🤖 Testing AIOracle...");
    const AIOracle = await ethers.getContractFactory("AIOracle");
    const aiOracle = await AIOracle.deploy(
      deployer.address,
      deployedContracts.gamingCore,
      deployedContracts.oracle,
      deployedContracts.oracle,
      ethers.ZeroAddress
    );
    await aiOracle.waitForDeployment();
    deployedContracts.aiOracle = await aiOracle.getAddress();
    console.log("✅ AIOracle:", deployedContracts.aiOracle);
    
    // Test 7: GameDinL3Bridge
    console.log("\n🌉 Testing GameDinL3Bridge...");
    const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
    const bridge = await GameDinL3Bridge.deploy(deployedContracts.settlement);
    await bridge.waitForDeployment();
    deployedContracts.bridge = await bridge.getAddress();
    console.log("✅ GameDinL3Bridge:", deployedContracts.bridge);
    
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("=====================================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    
    // Save addresses
    const fs = require('fs');
    const addresses = {
      ...deployedContracts,
      deployer: deployer.address,
      network: "hardhat",
      chainId: 31337,
      deployedAt: new Date().toISOString()
    };
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("\n📄 Addresses saved to deployed-addresses.json");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 