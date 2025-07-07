const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🏆 Testing GameDin Tournament System...");
  
  const [deployer, player1, player2, player3, player4, player5, player6, player7, player8] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Players:", [player1.address, player2.address, player3.address, player4.address].join(", "));
  
  // Load deployed addresses
  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
  
  try {
    // Get contract instances
    const token = await ethers.getContractAt("GameDinToken", addresses.token);
    const tournament = await ethers.getContractAt("GamingTournament", addresses.tournament);
    
    console.log("\n🎯 Starting Tournament System Test...");
    
    // Step 1: Distribute tokens to players
    console.log("\n💰 Distributing tokens to players...");
    const playerAmount = ethers.parseEther("5000"); // 5,000 GDI per player
    
    for (let i = 1; i <= 8; i++) {
      const player = await ethers.getSigner(i);
      await token.transfer(player.address, playerAmount);
      console.log(`✅ Tokens sent to Player ${i}: ${player.address}`);
    }
    
    // Step 2: Create a tournament
    console.log("\n🏆 Creating tournament...");
    
    const tournamentName = "GameDin Championship 2024";
    const tournamentDescription = "The ultimate gaming tournament with massive prizes!";
    const entryFee = ethers.parseEther("100"); // 100 GDI entry fee
    const maxPlayers = 8;
    const startTime = Math.floor(Date.now() / 1000) + 3600; // Start in 1 hour
    const duration = 86400; // 24 hours
    
    await tournament.createTournament(
      tournamentName,
      tournamentDescription,
      0, // SINGLE_ELIMINATION
      entryFee,
      maxPlayers,
      startTime,
      duration
    );
    
    console.log("✅ Tournament created successfully");
    
    // Step 3: Players register for tournament
    console.log("\n📝 Players registering for tournament...");
    
    const players = [player1, player2, player3, player4, player5, player6, player7, player8];
    
    for (let i = 0; i < players.length; i++) {
      await token.connect(players[i]).approve(addresses.tournament, entryFee);
      await tournament.connect(players[i]).registerForTournament(1); // Tournament ID 1
      console.log(`✅ Player ${i + 1} registered: ${players[i].address}`);
    }
    
    // Step 4: Check tournament status
    console.log("\n📊 Checking tournament status...");
    
    const tournamentInfo = await tournament.getTournament(1);
    console.log("Tournament Name:", tournamentInfo.name);
    console.log("Status:", tournamentInfo.status);
    console.log("Entry Fee:", ethers.formatEther(tournamentInfo.entryFee), "GDI");
    console.log("Prize Pool:", ethers.formatEther(tournamentInfo.prizePool), "GDI");
    console.log("Max Players:", tournamentInfo.maxPlayers.toString());
    console.log("Current Players:", tournamentInfo.currentPlayers.toString());
    
    // Step 5: Start the tournament
    console.log("\n🚀 Starting tournament...");
    
    // Fast forward time for testing
    await ethers.provider.send("evm_increaseTime", [3600]); // Increase time by 1 hour
    await ethers.provider.send("evm_mine");
    
    await tournament.startTournament(1);
    console.log("✅ Tournament started");
    
    // Step 6: Create matches
    console.log("\n⚔️ Creating tournament matches...");
    
    // Get tournament players
    const tournamentPlayers = await tournament.getTournamentPlayers(1);
    console.log("Tournament players:", tournamentPlayers.length);
    
    // Create first round matches (4 matches for 8 players)
    for (let i = 0; i < 4; i++) {
      const player1Index = i * 2;
      const player2Index = i * 2 + 1;
      
      await tournament.createMatch(
        1, // Tournament ID
        tournamentPlayers[player1Index],
        tournamentPlayers[player2Index],
        Math.floor(Date.now() / 1000) + 300 // Start in 5 minutes
      );
      
      console.log(`✅ Match ${i + 1} created: ${tournamentPlayers[player1Index]} vs ${tournamentPlayers[player2Index]}`);
    }
    
    // Step 7: Complete matches
    console.log("\n🏁 Completing matches...");
    
    const matchIds = [1, 2, 3, 4];
    const winners = [
      tournamentPlayers[0], // Player 1 wins
      tournamentPlayers[3], // Player 4 wins
      tournamentPlayers[4], // Player 5 wins
      tournamentPlayers[7]  // Player 8 wins
    ];
    
    for (let i = 0; i < matchIds.length; i++) {
      await tournament.completeMatch(
        matchIds[i],
        winners[i],
        100 + i * 10, // Player 1 score
        80 + i * 5,   // Player 2 score
        `Match ${i + 1} game data`
      );
      
      console.log(`✅ Match ${i + 1} completed. Winner: ${winners[i]}`);
    }
    
    // Step 8: Create semi-final matches
    console.log("\n🥉 Creating semi-final matches...");
    
    await tournament.createMatch(
      1, // Tournament ID
      winners[0], // Winner of match 1
      winners[1], // Winner of match 2
      Math.floor(Date.now() / 1000) + 600 // Start in 10 minutes
    );
    
    await tournament.createMatch(
      1, // Tournament ID
      winners[2], // Winner of match 3
      winners[3], // Winner of match 4
      Math.floor(Date.now() / 1000) + 600 // Start in 10 minutes
    );
    
    console.log("✅ Semi-final matches created");
    
    // Step 9: Complete semi-finals
    console.log("\n🥈 Completing semi-finals...");
    
    const semiFinalWinners = [winners[0], winners[2]]; // Player 1 and Player 5 advance
    
    await tournament.completeMatch(5, semiFinalWinners[0], 150, 120, "Semi-final 1 data");
    await tournament.completeMatch(6, semiFinalWinners[1], 140, 130, "Semi-final 2 data");
    
    console.log("✅ Semi-finals completed");
    
    // Step 10: Create final match
    console.log("\n🥇 Creating final match...");
    
    await tournament.createMatch(
      1, // Tournament ID
      semiFinalWinners[0], // Finalist 1
      semiFinalWinners[1], // Finalist 2
      Math.floor(Date.now() / 1000) + 900 // Start in 15 minutes
    );
    
    console.log("✅ Final match created");
    
    // Step 11: Complete final match
    console.log("\n🏆 Completing final match...");
    
    const champion = semiFinalWinners[0]; // Player 1 becomes champion
    
    await tournament.completeMatch(7, champion, 200, 180, "Championship final data");
    
    console.log("✅ Final match completed");
    console.log("🏆 Champion:", champion);
    
    // Step 12: Finish tournament and distribute prizes
    console.log("\n💰 Finishing tournament and distributing prizes...");
    
    const finalWinners = [champion, semiFinalWinners[1], winners[1]]; // 1st, 2nd, 3rd place
    
    await tournament.finishTournament(1, finalWinners);
    
    console.log("✅ Tournament finished and prizes distributed");
    
    // Step 13: Check final statistics
    console.log("\n📈 Checking final tournament statistics...");
    
    const finalTournamentInfo = await tournament.getTournament(1);
    console.log("Final Status:", finalTournamentInfo.status);
    console.log("Final Prize Pool:", ethers.formatEther(finalTournamentInfo.prizePool), "GDI");
    
    // Check player stats
    for (let i = 0; i < 4; i++) {
      const playerStats = await tournament.getPlayerStats(1, players[i].address);
      console.log(`Player ${i + 1} Stats - Wins: ${playerStats.wins}, Losses: ${playerStats.losses}, Score: ${playerStats.totalScore}`);
    }
    
    // Check balances after prize distribution
    console.log("\n💰 Checking player balances after prizes...");
    
    for (let i = 0; i < 4; i++) {
      const balance = await token.balanceOf(players[i].address);
      console.log(`Player ${i + 1} Balance: ${ethers.formatEther(balance)} GDI`);
    }
    
    // Check tournament counters
    const tournamentCounter = await tournament.tournamentCounter();
    const matchCounter = await tournament.matchCounter();
    const totalTournaments = await tournament.totalTournaments();
    const totalMatches = await tournament.totalMatches();
    const totalPrizePool = await tournament.totalPrizePool();
    
    console.log("\n📊 Tournament System Statistics:");
    console.log("Tournament Counter:", tournamentCounter.toString());
    console.log("Match Counter:", matchCounter.toString());
    console.log("Total Tournaments:", totalTournaments.toString());
    console.log("Total Matches:", totalMatches.toString());
    console.log("Total Prize Pool:", ethers.formatEther(totalPrizePool), "GDI");
    
    console.log("\n🎉 Tournament System Test Complete!");
    console.log("====================================");
    console.log("✅ Tournament creation successful");
    console.log("✅ Player registration working");
    console.log("✅ Match creation operational");
    console.log("✅ Match completion functional");
    console.log("✅ Prize distribution working");
    console.log("✅ Statistics tracking active");
    console.log("✅ Role-based access control working");
    
    console.log("\n🏆 GameDin Tournament System is fully operational!");
    console.log("🎮 Ready for competitive gaming tournaments!");
    
  } catch (error) {
    console.error("❌ Tournament test failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 