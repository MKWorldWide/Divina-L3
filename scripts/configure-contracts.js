const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("⚙️ Configuring GameDin L3 Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Load deployed addresses
  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
  
  try {
    // Get contract instances
    const token = await ethers.getContractAt("GameDinToken", addresses.token);
    const oracle = await ethers.getContractAt("NovaSanctumOracle", addresses.oracle);
    const gamingCore = await ethers.getContractAt("GamingCore", addresses.gamingCore);
    const aiOracle = await ethers.getContractAt("AIOracle", addresses.aiOracle);
    const marketplace = await ethers.getContractAt("NFTMarketplace", addresses.marketplace);
    const bridge = await ethers.getContractAt("GameDinL3Bridge", addresses.bridge);
    const settlement = await ethers.getContractAt("GameDinSettlement", addresses.settlement);
    
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
    
    // Configure GamingCore
    console.log("\n🎮 Configuring GamingCore...");
    await gamingCore.setGdiToken(addresses.token);
    console.log("✅ GDI Token set in Gaming Core");
    
    await gamingCore.setAIOracle(addresses.aiOracle);
    console.log("✅ AI Oracle set in Gaming Core");
    
    await gamingCore.setTreasury(deployer.address);
    console.log("✅ Treasury set in Gaming Core");
    
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
    
    // Configure Bridge
    console.log("\n🌉 Configuring Bridge...");
    await bridge.configureBridge(
      addresses.settlement,
      true, // isActive
      3, // minConfirmations
      ethers.parseEther("100000"), // maxAmount
      ethers.parseEther("0.001") // fee
    );
    console.log("✅ Bridge configured");
    
    // Configure Settlement
    console.log("\n📋 Configuring Settlement...");
    await settlement.configureBridge(
      addresses.bridge,
      true, // isActive
      3, // minConfirmations
      ethers.parseEther("1000000"), // maxAmount
      ethers.parseEther("0.001") // fee
    );
    console.log("✅ Settlement bridge configured");
    
    console.log("\n🎉 All contracts configured successfully!");
    
    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    
    // Test token balance
    const balance = await token.balanceOf(deployer.address);
    console.log(`✅ Deployer token balance: ${ethers.formatEther(balance)} GDI`);
    
    // Test oracle authorization
    const isAuthorized = await oracle.authorizedCallers(deployer.address);
    console.log(`✅ Deployer authorized in oracle: ${isAuthorized}`);
    
    // Test gaming core configuration
    const gdiToken = await gamingCore.gdiToken();
    console.log(`✅ Gaming Core GDI Token: ${gdiToken}`);
    
    // Test AI oracle configuration
    const gamingCoreInAI = await aiOracle.gamingCore();
    console.log(`✅ AI Oracle Gaming Core: ${gamingCoreInAI}`);
    
    console.log("\n🚀 GameDin L3 Gaming Blockchain is fully operational!");
    console.log("==================================================");
    console.log("📋 Contract Addresses:");
    console.log(`   Settlement: ${addresses.settlement}`);
    console.log(`   Bridge: ${addresses.bridge}`);
    console.log(`   Oracle: ${addresses.oracle}`);
    console.log(`   Token: ${addresses.token}`);
    console.log(`   Gaming Core: ${addresses.gamingCore}`);
    console.log(`   NFT Marketplace: ${addresses.marketplace}`);
    console.log(`   AI Oracle: ${addresses.aiOracle}`);
    console.log("\n🎮 Ready for gaming operations!");
    
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