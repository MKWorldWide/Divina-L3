const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🏆 Deploying GameDin Tournament System (Simple)...");
  
  // Load existing deployed addresses
  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
  
  console.log("📋 Using existing contract addresses:");
  console.log("Token:", addresses.token);
  console.log("Gaming Core:", addresses.gamingCore);
  console.log("AI Oracle:", addresses.aiOracle);
  
  try {
    // Deploy GamingTournament contract
    console.log("\n📋 Deploying GamingTournament Contract...");
    const GamingTournament = await ethers.getContractFactory("GamingTournament");
    
    const tournament = await GamingTournament.deploy(
      addresses.token, // GDI Token
      addresses.gamingCore, // Gaming Core
      addresses.aiOracle // AI Oracle
    );
    
    await tournament.waitForDeployment();
    const tournamentAddress = await tournament.getAddress();
    
    console.log("✅ GamingTournament deployed to:", tournamentAddress);
    
    // Save addresses
    addresses.tournament = tournamentAddress;
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    
    console.log("\n🎉 Tournament System Deployment Complete!");
    console.log("==========================================");
    console.log("🏆 Tournament Contract:", tournamentAddress);
    console.log("🎮 Ready for tournament creation and management!");
    console.log("👥 Supports up to 1024 players per tournament");
    console.log("🏅 Multiple tournament types available");
    console.log("💰 Automated prize distribution");
    console.log("🤖 AI integration ready");
    
    // Create deployment summary
    const deploymentSummary = {
      timestamp: new Date().toISOString(),
      tournament: {
        address: tournamentAddress,
        gdiToken: addresses.token,
        gamingCore: addresses.gamingCore,
        aiOracle: addresses.aiOracle
      },
      status: "deployed"
    };
    
    fs.writeFileSync('tournament-deployment-summary.json', JSON.stringify(deploymentSummary, null, 2));
    console.log("\n📄 Deployment summary saved to: tournament-deployment-summary.json");
    
  } catch (error) {
    console.error("❌ Tournament deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 