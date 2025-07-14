/**
 * 🤖 SIMPLE AI TEST
 * 
 * 📋 PURPOSE: Test AI service functionality
 * 🎯 COVERAGE: AI initialization, request processing
 */

const UnifiedAIService = require('../src/ai/UnifiedAIService.js');

async function testAI() {
  console.log('🤖 Testing AI Service...');
  
  try {
    // Create AI service
    const aiService = new UnifiedAIService({
      orchestration: {
        enableNovaSanctum: true,
        enableAthenaMist: true,
        primaryService: 'novaSanctum',
        fallbackService: 'athenaMist'
      }
    });
    
    // Initialize service
    await aiService.initialize();
    console.log('✅ AI Service initialized');
    
    // Get status
    const status = await aiService.getStatus();
    console.log(`✅ AI Status: ${status.isOnline ? 'Online' : 'Offline'}`);
    
    // Process AI request
    const response = await aiService.processRequest({
      type: 'game_insight',
      data: { gameId: 'test-123' }
    });
    console.log(`✅ AI Response: ${response.service}`);
    
    // Generate game insight
    const insight = await aiService.generateGameInsight({
      type: 'battle_royale',
      players: 4,
      duration: 300
    });
    console.log(`✅ Game insight generated`);
    
    // Generate player recommendations
    const recommendations = await aiService.generatePlayerRecommendations({
      id: 'player1',
      gamesPlayed: 10,
      winRate: 0.6
    });
    console.log(`✅ Player recommendations generated`);
    
    // Shutdown service
    await aiService.shutdown();
    console.log('✅ AI Service shut down');
    
    console.log('🎉 AI test PASSED!');
    return true;
    
  } catch (error) {
    console.log(`❌ AI test FAILED: ${error.message}`);
    return false;
  }
}

// Run test
testAI().then(success => {
  process.exit(success ? 0 : 1);
}); 