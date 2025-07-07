const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying GameDin L3 Deployment...");
  
  try {
    // Get deployed contracts
    const GameDinSettlement = await ethers.getContract("GameDinSettlement");
    const GameDinL3Bridge = await ethers.getContract("GameDinL3Bridge");
    const NovaSanctumOracle = await ethers.getContract("NovaSanctumOracle");
    const GameDinToken = await ethers.getContract("GameDinToken");
    const GamingCore = await ethers.getContract("GamingCore");
    const NFTMarketplace = await ethers.getContract("NFTMarketplace");
    const AIOracle = await ethers.getContract("AIOracle");
    
    console.log("\n✅ Deployment Verification Complete!");
    console.log("=====================================");
    console.log(`GameDin Settlement: ${GameDinSettlement.address}`);
    console.log(`GameDin L3 Bridge: ${GameDinL3Bridge.address}`);
    console.log(`NovaSanctum Oracle: ${NovaSanctumOracle.address}`);
    console.log(`GameDin Token: ${GameDinToken.address}`);
    console.log(`Gaming Core: ${GamingCore.address}`);
    console.log(`NFT Marketplace: ${NFTMarketplace.address}`);
    console.log(`AI Oracle: ${AIOracle.address}`);
    
    // Test basic functionality
    console.log("\n🧪 Testing Basic Functionality...");
    
    // Check settlement token
    const settlementName = await GameDinSettlement.name();
    const settlementSymbol = await GameDinSettlement.symbol();
    console.log(`Settlement Token: ${settlementName} (${settlementSymbol})`);
    
    // Check bridge configuration
    const bridgeSettlement = await GameDinL3Bridge.settlementContract();
    console.log(`Bridge Settlement Contract: ${bridgeSettlement}`);
    
    // Check oracle status
    const oracleOwner = await NovaSanctumOracle.owner();
    console.log(`Oracle Owner: ${oracleOwner}`);
    
    console.log("\n🎉 All contracts deployed and verified successfully!");
    
  } catch (error) {
    console.error("❌ Deployment verification failed:", error.message);
    
    // Check which contracts are available
    console.log("\n📋 Available Contracts:");
    const contractNames = [
      "GameDinSettlement",
      "GameDinL3Bridge", 
      "NovaSanctumOracle",
      "GameDinToken",
      "GamingCore",
      "NFTMarketplace",
      "AIOracle"
    ];
    
    for (const name of contractNames) {
      try {
        const contract = await ethers.getContract(name);
        console.log(`✅ ${name}: ${contract.address}`);
      } catch (e) {
        console.log(`❌ ${name}: Not deployed`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 