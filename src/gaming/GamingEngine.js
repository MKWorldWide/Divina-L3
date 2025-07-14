/**
 * 🎮 GAMING ENGINE (JavaScript Version)
 * 
 * 📋 PURPOSE: Core gaming functionality without TypeScript
 * 🎯 COVERAGE: Game creation, player management, real-time features
 */

class GamingEngine {
  constructor(config = {}) {
    this.config = {
      port: 9000,
      maxPlayersPerGame: 4,
      gameTimeout: 60,
      aiEnabled: true,
      blockchainEnabled: true,
      realTimeEnabled: true,
      ...config
    };
    
    this.games = new Map();
    this.players = new Map();
    this.isRunning = false;
  }

  async start() {
    console.log('🎮 Starting Gaming Engine...');
    this.isRunning = true;
    console.log(`✅ Gaming Engine started on port ${this.config.port}`);
    return true;
  }

  async stop() {
    console.log('🛑 Stopping Gaming Engine...');
    this.isRunning = false;
    console.log('✅ Gaming Engine stopped');
    return true;
  }

  async createGame(config = {}) {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const game = {
      id: gameId,
      type: config.type || 'battle_royale',
      maxPlayers: config.maxPlayers || this.config.maxPlayersPerGame,
      players: [],
      status: 'waiting',
      createdAt: new Date(),
      config: { ...this.config, ...config }
    };
    
    this.games.set(gameId, game);
    console.log(`🎮 Created game: ${gameId}`);
    return game;
  }

  async joinGame(gameId, player) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    if (game.players.length >= game.maxPlayers) {
      throw new Error(`Game ${gameId} is full`);
    }
    
    game.players.push(player);
    console.log(`👤 Player ${player.id} joined game ${gameId}`);
    return game;
  }

  async leaveGame(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    game.players = game.players.filter(p => p.id !== playerId);
    console.log(`👤 Player ${playerId} left game ${gameId}`);
    return game;
  }

  async startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    game.status = 'active';
    game.startedAt = new Date();
    console.log(`🚀 Game ${gameId} started`);
    return game;
  }

  async endGame(gameId, results) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    game.status = 'completed';
    game.endedAt = new Date();
    game.results = results;
    console.log(`🏁 Game ${gameId} ended`);
    return game;
  }

  async getGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    return game;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.config.port,
      activeGames: this.games.size,
      totalPlayers: this.players.size
    };
  }
}

module.exports = GamingEngine; 