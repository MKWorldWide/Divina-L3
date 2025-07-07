const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🏆 Deploying GameDin Tournament System...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  // Load deployed addresses
  let addresses = {};
  if (fs.existsSync('deployed-addresses.json')) {
    addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
  }
  
  try {
    // Deploy GamingTournament contract
    console.log("\n📋 Deploying GamingTournament Contract...");
    const GamingTournament = await ethers.getContractFactory("GamingTournament");
    
    const tournament = await GamingTournament.deploy(
      addresses.token || "0x0000000000000000000000000000000000000000", // GDI Token
      addresses.gamingCore || "0x0000000000000000000000000000000000000000", // Gaming Core
      addresses.aiOracle || "0x0000000000000000000000000000000000000000" // AI Oracle
    );
    
    await tournament.waitForDeployment();
    const tournamentAddress = await tournament.getAddress();
    
    console.log("✅ GamingTournament deployed to:", tournamentAddress);
    
    // Save addresses
    addresses.tournament = tournamentAddress;
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const deployedTournament = await ethers.getContractAt("GamingTournament", tournamentAddress);
    
    const gdiToken = await deployedTournament.gdiToken();
    const gamingCore = await deployedTournament.gamingCore();
    const aiOracle = await deployedTournament.aiOracle();
    
    console.log("✅ GDI Token address:", gdiToken);
    console.log("✅ Gaming Core address:", gamingCore);
    console.log("✅ AI Oracle address:", aiOracle);
    
    // Check roles
    const hasAdminRole = await deployedTournament.hasRole(await deployedTournament.DEFAULT_ADMIN_ROLE(), deployer.address);
    const hasOrganizerRole = await deployedTournament.hasRole(await deployedTournament.TOURNAMENT_ORGANIZER_ROLE(), deployer.address);
    const hasRefereeRole = await deployedTournament.hasRole(await deployedTournament.MATCH_REFEREE_ROLE(), deployer.address);
    const hasEmergencyRole = await deployedTournament.hasRole(await deployedTournament.EMERGENCY_ROLE(), deployer.address);
    
    console.log("✅ Admin role assigned:", hasAdminRole);
    console.log("✅ Organizer role assigned:", hasOrganizerRole);
    console.log("✅ Referee role assigned:", hasRefereeRole);
    console.log("✅ Emergency role assigned:", hasEmergencyRole);
    
    // Check initial state
    const tournamentCounter = await deployedTournament.tournamentCounter();
    const matchCounter = await deployedTournament.matchCounter();
    const totalTournaments = await deployedTournament.totalTournaments();
    const totalMatches = await deployedTournament.totalMatches();
    const totalPrizePool = await deployedTournament.totalPrizePool();
    
    console.log("✅ Tournament counter:", tournamentCounter.toString());
    console.log("✅ Match counter:", matchCounter.toString());
    console.log("✅ Total tournaments:", totalTournaments.toString());
    console.log("✅ Total matches:", totalMatches.toString());
    console.log("✅ Total prize pool:", ethers.formatEther(totalPrizePool), "GDI");
    
    // Check fees
    const platformFee = await deployedTournament.platformFee();
    const organizerFee = await deployedTournament.organizerFee();
    
    console.log("✅ Platform fee:", platformFee.toString(), "basis points (0.5%)");
    console.log("✅ Organizer fee:", organizerFee.toString(), "basis points (1%)");
    
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
      deployer: deployer.address,
      contracts: {
        tournament: {
          address: tournamentAddress,
          gdiToken: gdiToken,
          gamingCore: gamingCore,
          aiOracle: aiOracle
        }
      },
      roles: {
        admin: hasAdminRole,
        organizer: hasOrganizerRole,
        referee: hasRefereeRole,
        emergency: hasEmergencyRole
      },
      state: {
        tournamentCounter: tournamentCounter.toString(),
        matchCounter: matchCounter.toString(),
        totalTournaments: totalTournaments.toString(),
        totalMatches: totalMatches.toString(),
        totalPrizePool: ethers.formatEther(totalPrizePool)
      },
      fees: {
        platformFee: platformFee.toString(),
        organizerFee: organizerFee.toString()
      }
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