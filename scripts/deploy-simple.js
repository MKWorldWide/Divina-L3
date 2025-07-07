const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Simple Deployment Test...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  try {
    // Test 1: Deploy GameDinSettlement
    console.log("\n📋 Testing GameDinSettlement deployment...");
    const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
    const settlement = await GameDinSettlement.deploy(
      deployer.address,
      ethers.parseEther("1000000000")
    );
    await settlement.waitForDeployment();
    console.log("✅ GameDinSettlement deployed to:", await settlement.getAddress());
    
    // Test 2: Deploy GameDinToken
    console.log("\n🪙 Testing GameDinToken deployment...");
    const GameDinToken = await ethers.getContractFactory("GameDinToken");
    const token = await GameDinToken.deploy(
      "GameDin Token",
      "GDI",
      deployer.address
    );
    await token.waitForDeployment();
    console.log("✅ GameDinToken deployed to:", await token.getAddress());
    
    // Test 3: Deploy NovaSanctumOracle
    console.log("\n🔮 Testing NovaSanctumOracle deployment...");
    const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
    const oracle = await NovaSanctumOracle.deploy(deployer.address);
    await oracle.waitForDeployment();
    console.log("✅ NovaSanctumOracle deployed to:", await oracle.getAddress());
    
    console.log("\n🎉 Basic deployment test completed successfully!");
    
  } catch (error) {
    console.error("❌ Deployment test failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 