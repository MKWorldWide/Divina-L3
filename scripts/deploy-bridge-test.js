const { ethers } = require("hardhat");

async function main() {
  console.log("🌉 Testing Bridge Deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  try {
    // First deploy settlement
    console.log("\n📋 Deploying GameDinSettlement...");
    const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
    const settlement = await GameDinSettlement.deploy(
      deployer.address,
      ethers.parseEther("1000000000")
    );
    await settlement.waitForDeployment();
    const settlementAddress = await settlement.getAddress();
    console.log("✅ GameDinSettlement deployed to:", settlementAddress);
    
    // Now try to deploy bridge
    console.log("\n🌉 Deploying GameDinL3Bridge...");
    const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
    
    // Try different approaches
    console.log("Attempting deployment with settlement address:", settlementAddress);
    
    const bridge = await GameDinL3Bridge.deploy(settlementAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log("✅ GameDinL3Bridge deployed to:", bridgeAddress);
    
    // Test bridge functionality
    console.log("\n🧪 Testing bridge functionality...");
    const settlementContract = await bridge.settlementContract();
    console.log("Bridge settlement contract:", settlementContract);
    console.log("Expected settlement contract:", settlementAddress);
    console.log("Match:", settlementContract === settlementAddress);
    
  } catch (error) {
    console.error("❌ Bridge deployment failed:", error.message);
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