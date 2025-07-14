/**
 * 🎮 SIMPLE GAMING TEST
 * 
 * 📋 PURPOSE: Test gaming engine functionality
 * 🎯 COVERAGE: Game creation, player management
 */

const GamingEngine = require('../src/gaming/GamingEngine.js');

async function testGaming() {
  console.log('🎮 Testing Gaming Engine...');
  
  try {
    // Create gaming engine
    const gamingEngine = new GamingEngine({
      port: 9000,
      maxPlayersPerGame: 4
    });
    
    // Start engine
    await gamingEngine.start();
    console.log('✅ Gaming Engine started');
    
    // Create a game
    const game = await gamingEngine.createGame({
      type: 'battle_royale',
      maxPlayers: 4
    });
    console.log(`✅ Game created: ${game.id}`);
    
    // Join players
    const player1 = { id: 'player1', address: '0x123' };
    const player2 = { id: 'player2', address: '0x456' };
    
    await gamingEngine.joinGame(game.id, player1);
    await gamingEngine.joinGame(game.id, player2);
    console.log('✅ Players joined game');
    
    // Get game state
    const gameState = await gamingEngine.getGameState(game.id);
    console.log(`✅ Game state: ${gameState.players.length} players`);
    
    // Start game
    await gamingEngine.startGame(game.id);
    console.log('✅ Game started');
    
    // End game
    await gamingEngine.endGame(game.id, {
      winner: player1.id,
      scores: { [player1.id]: 100, [player2.id]: 85 }
    });
    console.log('✅ Game ended');
    
    // Stop engine
    await gamingEngine.stop();
    console.log('✅ Gaming Engine stopped');
    
    console.log('🎉 Gaming test PASSED!');
    return true;
    
  } catch (error) {
    console.log(`❌ Gaming test FAILED: ${error.message}`);
    return false;
  }
}

// Run test
testGaming().then(success => {
  process.exit(success ? 0 : 1);
}); 