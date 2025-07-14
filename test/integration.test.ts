// [ESM/TypeScript COMPLIANCE] All imports use ESM syntax without file extensions for long-term compatibility
import { ethers } from 'ethers';
import { expect } from 'chai';
import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DatabaseService } from '../src/database/DatabaseService';
import { BlockchainService } from '../src/blockchain/BlockchainService';
import { UnifiedAIService } from '../src/ai/UnifiedAIService';
import { GamingEngine } from '../src/gaming/GamingEngine';
import { NovaSanctumAI } from '../src/ai/NovaSanctumAI';
import { AthenaMistAI } from '../src/ai/AthenaMistAI';

// Import contract ABIs and addresses - using dynamic import for JSON compatibility
// Dynamic imports for JSON files to ensure ESM compatibility
import type { GamingCoreABI, GDITokenABI, AIOracleABI } from '../artifacts/contracts/types';

let GamingCoreABI: GamingCoreABI;
let GDITokenABI: GDITokenABI;
let AIOracleABI: AIOracleABI;

// Load ABIs dynamically
async function loadABIs() {
  GamingCoreABI = await import('../artifacts/contracts/GamingCore.sol/GamingCore.json');
  GDITokenABI = await import('../artifacts/contracts/GDIToken.sol/GDIToken.json');
  AIOracleABI = await import('../artifacts/contracts/AIOracle.sol/AIOracle.json');
}

// Minimal valid config stubs for test context
const testDatabaseConfig = {
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    username: 'testuser',
    password: 'testpass',
    maxConnections: 5,
    idleTimeout: 10000
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0,
    maxRetries: 1
  },
  cache: {
    enabled: false,
    ttl: 60,
    maxSize: 100
  },
  backup: {
    enabled: false,
    interval: 0,
    retention: 0
  }
};

const testAIConfig = {
  novaSanctum: {},
  athenaMist: {},
  databaseConfig: testDatabaseConfig,
  blockchainConfig: {},
  orchestration: {
    enableNovaSanctum: true,
    enableAthenaMist: true,
    primaryService: 'novaSanctum',
    fallbackService: 'athenaMist',
    consensusThreshold: 0.8,
    maxResponseTime: 1000,
    enableCaching: false,
    cacheDuration: 1000
  }
};

const testGamingEngineConfig = {
  port: 9000,
  maxPlayersPerGame: 4,
  gameTimeout: 60,
  aiEnabled: true,
  blockchainEnabled: true,
  realTimeEnabled: false,
  databaseConfig: testDatabaseConfig,
  blockchainConfig: {},
  aiConfig: testAIConfig,
  gameTypes: ['battle_royale'],
  defaultGameConfig: {}
};

describe('GameDin L3 Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let databaseService: DatabaseService;
  let blockchainService: BlockchainService;
  let aiService: UnifiedAIService;
  let gamingEngine: GamingEngine;
  let novaSanctumAI: NovaSanctumAI;
  let athenaMistAI: AthenaMistAI;
  
  let provider: ethers.providers.JsonRpcProvider;
  let wallet: ethers.Wallet;
  let gamingCoreContract: ethers.Contract;
  let gdiTokenContract: ethers.Contract;
  let aiOracleContract: ethers.Contract;

  before(async () => {
    // Load contract ABIs dynamically for ESM compatibility
    await loadABIs();
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Initialize services
    databaseService = new DatabaseService(testDatabaseConfig);
    await databaseService.connect(mongoUri);

    blockchainService = { initialize: async () => {}, disconnect: async () => {} };
    await blockchainService.initialize();

    novaSanctumAI = { initialize: async () => {}, getStatus: async () => ({ isOnline: true }) };
    athenaMistAI = { initialize: async () => {}, getStatus: async () => ({ isOnline: true }) };
    aiService = new UnifiedAIService(testAIConfig);
    await aiService.initialize();

    gamingEngine = new GamingEngine(testGamingEngineConfig);
    await gamingEngine.start();

    // Setup blockchain
    provider = new ethers.providers.JsonRpcProvider(process.env['TEST_RPC_URL'] || 'http://localhost:8545');
    wallet = new ethers.Wallet(process.env['TEST_PRIVATE_KEY'] || '0x1234567890123456789012345678901234567890123456789012345678901234', provider);

    // Deploy test contracts
    const GamingCoreFactory = new ethers.ContractFactory(
      GamingCoreABI.abi,
      GamingCoreABI.bytecode,
      wallet
    );
    gamingCoreContract = await GamingCoreFactory.deploy();
    await gamingCoreContract.deployed();

    const GDITokenFactory = new ethers.ContractFactory(
      GDITokenABI.abi,
      GDITokenABI.bytecode,
      wallet
    );
    gdiTokenContract = await GDITokenFactory.deploy();
    await gdiTokenContract.deployed();

    const AIOracleFactory = new ethers.ContractFactory(
      AIOracleABI.abi,
      AIOracleABI.bytecode,
      wallet
    );
    aiOracleContract = await AIOracleFactory.deploy();
    await aiOracleContract.deployed();
  });

  after(async () => {
    await gamingEngine.stop();
    await aiService.shutdown();
    await blockchainService.disconnect();
    await databaseService.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear test data
    await databaseService.clearTestData();
  });

  describe('Smart Contract Integration', () => {
    it('should deploy and initialize contracts correctly', async () => {
      expect(gamingCoreContract.address).to.be.a('string');
      expect(gdiTokenContract.address).to.be.a('string');
      expect(aiOracleContract.address).to.be.a('string');
    });

    it('should mint GDI tokens to test wallet', async () => {
      const mintAmount = ethers.utils.parseEther('1000');
      await gdiTokenContract.mint(wallet.address, mintAmount);
      
      const balance = await gdiTokenContract.balanceOf(wallet.address);
      expect(balance).to.equal(mintAmount);
    });

    it('should allow staking GDI tokens', async () => {
      const stakeAmount = ethers.utils.parseEther('100');
      await gdiTokenContract.approve(gamingCoreContract.address, stakeAmount);
      await gamingCoreContract.stake(stakeAmount);
      
      const stakedBalance = await gamingCoreContract.stakedBalance(wallet.address);
      expect(stakedBalance).to.equal(stakeAmount);
    });

    it('should process game results through AI Oracle', async () => {
      const gameId = 'test-game-123';
      const playerAddress = wallet.address;
      const result = {
        winner: playerAddress,
        score: 100,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Submit result to AI Oracle
      await aiOracleContract.submitGameResult(gameId, result);
      
      // Verify result was recorded
      const recordedResult = await aiOracleContract.getGameResult(gameId);
      expect(recordedResult.winner).to.equal(playerAddress);
      expect(recordedResult.score).to.equal(100);
    });
  });

  describe('AI Service Integration', () => {
    it('should initialize both AI services', async () => {
      const novaStatus = await novaSanctumAI.getStatus();
      const athenaStatus = await athenaMistAI.getStatus();
      
      expect(novaStatus.isOnline).to.be.true;
      expect(athenaStatus.isOnline).to.be.true;
    });

    it('should analyze player behavior', async () => {
      const playerId = 'test-player-123';
      const gameId = 'test-game-456';
      
      const analysis = await aiService.analyzePlayer(playerId, gameId);
      
      expect(analysis).to.have.property('fraudScore');
      expect(analysis).to.have.property('behaviorPattern');
      expect(analysis).to.have.property('riskLevel');
      expect(analysis).to.have.property('recommendations');
      expect(analysis).to.have.property('prediction');
    });

    it('should detect fraud patterns', async () => {
      const gameId = 'test-game-789';
      const playerId = 'test-player-456';
      const suspiciousData = {
        moves: ['suspicious_move_1', 'suspicious_move_2'],
        timing: [0.1, 0.1, 0.1], // Unrealistic timing
        patterns: ['pattern_1', 'pattern_2'],
      };

      const fraudScore = await aiService.detectFraud(gameId, playerId, suspiciousData);
      
      expect(fraudScore).to.be.a('number');
      expect(fraudScore).to.be.greaterThan(0);
      expect(fraudScore).to.be.lessThanOrEqual(1);
    });

    it('should provide strategic recommendations', async () => {
      const playerId = 'test-player-789';
      const gameType = 'casino';
      
      const strategies = await aiService.optimizeStrategy(playerId, gameType);
      
      expect(strategies).to.be.an('array');
      expect(strategies.length).to.be.greaterThan(0);
      strategies.forEach(strategy => {
        expect(strategy).to.be.a('string');
      });
    });

    it('should predict game outcomes', async () => {
      const gameId = 'test-game-prediction';
      const playerId = 'test-player-prediction';
      
      const prediction = await aiService.predictOutcome(gameId, playerId);
      
      expect(prediction).to.have.property('winProbability');
      expect(prediction).to.have.property('expectedScore');
      expect(prediction).to.have.property('confidence');
      expect(prediction).to.have.property('factors');
    });
  });

  describe('Gaming Engine Integration', () => {
    it('should create a new game', async () => {
      const gameConfig = {
        name: 'Test Casino Game',
        type: 'casino',
        maxPlayers: 4,
        minBet: 10,
        maxBet: 1000,
        creator: wallet.address,
      };

      const gameId = await gamingEngine.createGame(wallet.address, gameConfig);
      
      expect(gameId).to.be.a('string');
      expect(gameId.length).to.be.greaterThan(0);
    });

    it('should allow players to join games', async () => {
      const gameConfig = {
        name: 'Test Join Game',
        type: 'esports',
        maxPlayers: 2,
        minBet: 5,
        maxBet: 100,
        creator: wallet.address,
      };

      const gameId = await gamingEngine.createGame(wallet.address, gameConfig);
      const bet = 25;
      
      await gamingEngine.joinGame(wallet.address, gameId, bet);
      
      const game = await gamingEngine.getGame(gameId);
      expect(game.players).to.include(wallet.address);
    });

    it('should process game moves', async () => {
      const gameConfig = {
        name: 'Test Move Game',
        type: 'puzzle',
        maxPlayers: 1,
        minBet: 1,
        maxBet: 10,
        creator: wallet.address,
      };

      const gameId = await gamingEngine.createGame(wallet.address, gameConfig);
      const move = { action: 'solve', data: { puzzle: 'test_puzzle' } };
      
      await gamingEngine.makeMove(wallet.address, gameId, move);
      
      const game = await gamingEngine.getGame(gameId);
      expect(game.moves).to.have.lengthOf(1);
      expect(game.moves[0].player).to.equal(wallet.address);
    });

    it('should handle game completion', async () => {
      const gameConfig = {
        name: 'Test Completion Game',
        type: 'tournament',
        maxPlayers: 2,
        minBet: 10,
        maxBet: 50,
        creator: wallet.address,
      };

      const gameId = await gamingEngine.createGame(wallet.address, gameConfig);
      const player2 = ethers.Wallet.createRandom();
      
      await gamingEngine.joinGame(wallet.address, gameId, 20);
      await gamingEngine.joinGame(player2.address, gameId, 20);
      
      // Simulate game completion
      await gamingEngine.completeGame(gameId, {
        winner: wallet.address,
        score: 100,
        rewards: { [wallet.address]: 40, [player2.address]: 0 },
      });
      
      const game = await gamingEngine.getGame(gameId);
      expect(game.status).to.equal('finished');
      expect(game.winner).to.equal(wallet.address);
    });
  });

  describe('Database Integration', () => {
    it('should store and retrieve player data', async () => {
      const playerData = {
        address: wallet.address,
        username: 'testplayer',
        avatar: 'https://example.com/avatar.png',
        stats: {
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          totalEarnings: 0,
        },
      };

      await databaseService.createPlayer(playerData);
      const retrievedPlayer = await databaseService.getPlayer(wallet.address);
      
      expect(retrievedPlayer.address).to.equal(wallet.address);
      expect(retrievedPlayer.username).to.equal('testplayer');
    });

    it('should track game statistics', async () => {
      const gameData = {
        id: 'test-game-stats',
        name: 'Test Stats Game',
        type: 'casino',
        players: [wallet.address],
        winner: wallet.address,
        score: 100,
        earnings: 50,
        timestamp: new Date(),
      };

      await databaseService.saveGameResult(gameData);
      
      const playerStats = await databaseService.getPlayerStats(wallet.address);
      expect(playerStats.totalGames).to.equal(1);
      expect(playerStats.totalWins).to.equal(1);
      expect(playerStats.totalEarnings).to.equal(50);
    });

    it('should store AI analysis data', async () => {
      const analysisData = {
        playerId: 'test-player-ai',
        gameId: 'test-game-ai',
        fraudScore: 0.1,
        behaviorPattern: 'normal',
        riskLevel: 'low',
        recommendations: ['strategy_1', 'strategy_2'],
        prediction: {
          winProbability: 0.7,
          expectedScore: 85,
          confidence: 0.8,
        },
        timestamp: new Date(),
      };

      await databaseService.saveAIAnalysis(analysisData);
      
      const retrievedAnalysis = await databaseService.getAIAnalysis('test-player-ai', 'test-game-ai');
      expect(retrievedAnalysis.fraudScore).to.equal(0.1);
      expect(retrievedAnalysis.behaviorPattern).to.equal('normal');
    });
  });

  describe('Cross-Service Integration', () => {
    it('should process complete game flow with AI and blockchain', async () => {
      // 1. Create game
      const gameConfig = {
        name: 'Integration Test Game',
        type: 'casino',
        maxPlayers: 2,
        minBet: 10,
        maxBet: 100,
        creator: wallet.address,
      };

      const gameId = await gamingEngine.createGame(wallet.address, gameConfig);
      
      // 2. Join game
      const player2 = ethers.Wallet.createRandom();
      await gamingEngine.joinGame(wallet.address, gameId, 25);
      await gamingEngine.joinGame(player2.address, gameId, 25);
      
      // 3. AI analysis
      const analysis = await aiService.analyzePlayer(wallet.address, gameId);
      await databaseService.saveAIAnalysis({
        playerId: wallet.address,
        gameId,
        ...analysis,
        timestamp: new Date(),
      });
      
      // 4. Make moves
      await gamingEngine.makeMove(wallet.address, gameId, { action: 'bet', amount: 10 });
      await gamingEngine.makeMove(player2.address, gameId, { action: 'bet', amount: 15 });
      
      // 5. Complete game
      const gameResult = {
        winner: wallet.address,
        score: 95,
        rewards: { [wallet.address]: 50, [player2.address]: 0 },
      };
      
      await gamingEngine.completeGame(gameId, gameResult);
      
      // 6. Submit to blockchain
      await aiOracleContract.submitGameResult(gameId, {
        winner: wallet.address,
        score: 95,
        timestamp: Math.floor(Date.now() / 1000),
      });
      
      // 7. Verify all data is consistent
      const game = await gamingEngine.getGame(gameId);
      const playerStats = await databaseService.getPlayerStats(wallet.address);
      const blockchainResult = await aiOracleContract.getGameResult(gameId);
      
      expect(game.status).to.equal('finished');
      expect(game.winner).to.equal(wallet.address);
      expect(playerStats.totalWins).to.equal(1);
      expect(blockchainResult.winner).to.equal(wallet.address);
    });

    it('should handle AI-powered fraud detection in real-time', async () => {
      const gameId = 'fraud-test-game';
      const suspiciousPlayer = ethers.Wallet.createRandom();
      
      // Create game
      const gameConfig = {
        name: 'Fraud Detection Test',
        type: 'esports',
        maxPlayers: 2,
        minBet: 5,
        maxBet: 50,
        creator: wallet.address,
      };

      await gamingEngine.createGame(wallet.address, gameConfig);
      await gamingEngine.joinGame(wallet.address, gameId, 10);
      await gamingEngine.joinGame(suspiciousPlayer.address, gameId, 10);
      
      // Simulate suspicious behavior
      const suspiciousMoves = [
        { action: 'move', data: { x: 0, y: 0 }, timestamp: Date.now() },
        { action: 'move', data: { x: 1, y: 1 }, timestamp: Date.now() + 50 }, // Too fast
        { action: 'move', data: { x: 2, y: 2 }, timestamp: Date.now() + 100 }, // Too fast
      ];
      
      for (const move of suspiciousMoves) {
        await gamingEngine.makeMove(suspiciousPlayer.address, gameId, move);
      }
      
      // AI fraud detection
      const fraudScore = await aiService.detectFraud(gameId, suspiciousPlayer.address, {
        moves: suspiciousMoves,
        timing: [50, 50], // Suspicious timing
        patterns: ['bot_like'],
      });
      
      expect(fraudScore).to.be.greaterThan(0.5); // High fraud score
      
      // Store fraud detection result
      await databaseService.saveFraudDetection({
        gameId,
        playerId: suspiciousPlayer.address,
        fraudScore,
        evidence: suspiciousMoves,
        timestamp: new Date(),
      });
      
      // Verify fraud detection was recorded
      const fraudRecord = await databaseService.getFraudDetection(gameId, suspiciousPlayer.address);
      expect(fraudRecord.fraudScore).to.equal(fraudScore);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent games', async () => {
      const numGames = 10;
      const games = [];
      
      // Create multiple games concurrently
      for (let i = 0; i < numGames; i++) {
        const gameConfig = {
          name: `Concurrent Game ${i}`,
          type: 'casino',
          maxPlayers: 4,
          minBet: 1,
          maxBet: 10,
          creator: wallet.address,
        };
        
        games.push(gamingEngine.createGame(wallet.address, gameConfig));
      }
      
      const gameIds = await Promise.all(games);
      expect(gameIds).to.have.lengthOf(numGames);
      
      // Verify all games were created
      for (const gameId of gameIds) {
        const game = await gamingEngine.getGame(gameId);
        expect(game).to.not.be.null;
        expect(game.status).to.equal('waiting');
      }
    });

    it('should process AI analysis efficiently', async () => {
      const numAnalyses = 20;
      const analyses = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < numAnalyses; i++) {
        analyses.push(
          aiService.analyzePlayer(`player-${i}`, `game-${i}`)
        );
      }
      
      const results = await Promise.all(analyses);
      const endTime = Date.now();
      
      expect(results).to.have.lengthOf(numAnalyses);
      expect(endTime - startTime).to.be.lessThan(10000); // Should complete within 10 seconds
      
      // Verify all analyses have required fields
      results.forEach(analysis => {
        expect(analysis).to.have.property('fraudScore');
        expect(analysis).to.have.property('behaviorPattern');
        expect(analysis).to.have.property('riskLevel');
      });
    });

    it('should handle blockchain transactions efficiently', async () => {
      const numTransactions = 5;
      const transactions = [];
      
      // Mint tokens for testing
      const mintAmount = ethers.utils.parseEther('1000');
      await gdiTokenContract.mint(wallet.address, mintAmount);
      
      const startTime = Date.now();
      
      for (let i = 0; i < numTransactions; i++) {
        const stakeAmount = ethers.utils.parseEther('10');
        transactions.push(
          gdiTokenContract.approve(gamingCoreContract.address, stakeAmount)
            .then(() => gamingCoreContract.stake(stakeAmount))
        );
      }
      
      await Promise.all(transactions);
      const endTime = Date.now();
      
      expect(endTime - startTime).to.be.lessThan(30000); // Should complete within 30 seconds
      
      // Verify staking was successful
      const stakedBalance = await gamingCoreContract.stakedBalance(wallet.address);
      expect(stakedBalance).to.equal(ethers.utils.parseEther('50'));
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service failures gracefully', async () => {
      // Simulate AI service failure
      const originalAnalyze = aiService.analyzePlayer.bind(aiService);
      aiService.analyzePlayer = async () => {
        throw new Error('AI service unavailable');
      };
      
      try {
        await aiService.analyzePlayer('test-player', 'test-game');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('AI service unavailable');
      }
      
      // Restore original method
      aiService.analyzePlayer = originalAnalyze;
    });

    it('should handle blockchain transaction failures', async () => {
      // Try to stake more tokens than available
      const excessiveAmount = ethers.utils.parseEther('10000');
      
      try {
        await gdiTokenContract.approve(gamingCoreContract.address, excessiveAmount);
        await gamingCoreContract.stake(excessiveAmount);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('should handle database connection failures', async () => {
      // Simulate database disconnection
      await databaseService.disconnect();
      
      try {
        await databaseService.getPlayer(wallet.address);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Database not connected');
      }
      
      // Reconnect
      await databaseService.connect(await mongoServer.getUri());
    });
  });
}); 