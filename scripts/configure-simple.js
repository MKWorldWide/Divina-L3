const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("⚙️ Configuring GameDin L3 Contracts (Simple)...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Load deployed addresses
  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
  
  try {
    // Get contract instances
    const token = await ethers.getContractAt("GameDinToken", addresses.token);
    const oracle = await ethers.getContractAt("NovaSanctumOracle", addresses.oracle);
    const aiOracle = await ethers.getContractAt("AIOracle", addresses.aiOracle);
    const marketplace = await ethers.getContractAt("NFTMarketplace", addresses.marketplace);
    
    console.log("\n🔧 Configuring contracts...");
    
    // Configure GameDinToken
    console.log("\n🪙 Configuring GameDinToken...");
    await token.addGameContract(addresses.gamingCore);
    console.log("✅ Gaming Core added as authorized game contract");
    
    await token.addGasSponsor(deployer.address);
    console.log("✅ Deployer added as gas sponsor");
    
    await token.setNovaSanctumOracle(addresses.oracle);
    console.log("✅ NovaSanctum Oracle set in token contract");
    
    await token.setGamingEngine(addresses.gamingCore);
    console.log("✅ Gaming Engine set in token contract");
    
    // Configure NovaSanctumOracle
    console.log("\n🔮 Configuring NovaSanctumOracle...");
    await oracle.addAuthorizedCaller(addresses.gamingCore);
    console.log("✅ Gaming Core added as authorized caller");
    
    await oracle.addAuthorizedCaller(deployer.address);
    console.log("✅ Deployer added as authorized caller");
    
    // Configure AIOracle
    console.log("\n🤖 Configuring AIOracle...");
    await aiOracle.setGamingCore(addresses.gamingCore);
    console.log("✅ Gaming Core set in AI Oracle");
    
    await aiOracle.setNovaSanctumService(addresses.oracle);
    console.log("✅ NovaSanctum Service set in AI Oracle");
    
    await aiOracle.setAthenaMistService(addresses.oracle);
    console.log("✅ AthenaMist Service set in AI Oracle");
    
    // Configure NFTMarketplace
    console.log("\n🖼️ Configuring NFTMarketplace...");
    await marketplace.setGdiToken(addresses.token);
    console.log("✅ GDI Token set in NFT Marketplace");
    
    console.log("\n🎉 Core contracts configured successfully!");
    
    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    
    // Test token balance
    const balance = await token.balanceOf(deployer.address);
    console.log(`✅ Deployer token balance: ${ethers.formatEther(balance)} GDI`);
    
    // Test oracle authorization
    const isAuthorized = await oracle.authorizedCallers(deployer.address);
    console.log(`✅ Deployer authorized in oracle: ${isAuthorized}`);
    
    // Test AI oracle configuration
    const gamingCoreInAI = await aiOracle.gamingCore();
    console.log(`✅ AI Oracle Gaming Core: ${gamingCoreInAI}`);
    
    console.log("\n🚀 GameDin L3 Gaming Blockchain is operational!");
    console.log("=============================================");
    console.log("📋 Contract Addresses:");
    console.log(`   Settlement: ${addresses.settlement}`);
    console.log(`   Bridge: ${addresses.bridge}`);
    console.log(`   Oracle: ${addresses.oracle}`);
    console.log(`   Token: ${addresses.token}`);
    console.log(`   Gaming Core: ${addresses.gamingCore}`);
    console.log(`   NFT Marketplace: ${addresses.marketplace}`);
    console.log(`   AI Oracle: ${addresses.aiOracle}`);
    console.log("\n🎮 Ready for gaming operations!");
    console.log("\n💡 Note: Some contracts may need manual configuration for advanced features.");
    
  } catch (error) {
    console.error("❌ Configuration failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 