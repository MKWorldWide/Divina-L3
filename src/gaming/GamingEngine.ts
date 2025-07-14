/**
 * @file GamingEngine.ts
 * @description Main gaming engine for GameDin L3 ecosystem
 * @dev Orchestrates gaming operations, AI integration, and real-time gameplay
 * @dev Manages game state, player interactions, and blockchain integration
 */

import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import type * as GamingTypes from '../types/gaming.mts';
import { UnifiedAIService } from '../ai/UnifiedAIService';
import { BlockchainService } from '../blockchain/BlockchainService';
import { DatabaseService } from '../database/DatabaseService';
import { RealTimeGamingEngine } from './RealTimeGamingEngine';
import { Logger } from '../utils/Logger.js';

/**
 * @interface GamingEngineConfig
 * @description Gaming engine configuration
 */
export interface GamingEngineConfig {
    port: number;
    maxPlayersPerGame: number;
    gameTimeout: number;
    aiEnabled: boolean;
    blockchainEnabled: boolean;
    realTimeEnabled: boolean;
    databaseConfig: any;
    blockchainConfig: any;
    aiConfig: any;
    gameTypes: GamingTypes.GameType[];
    defaultGameConfig: GamingTypes.GameConfig;
}

/**
 * @interface GameInstance
 * @description Game instance information
 */
export interface GameInstance {
    gameId: string;
    gameType: GamingTypes.GameType;
    config: GamingTypes.GameConfig;
    state: GamingTypes.IGameState;
    players: Map<string, GamingTypes.PlayerState>;
    startTime: number;
    endTime?: number;
    result?: GamingTypes.GameActionResult;
    aiAnalysis?: GamingTypes.AIAnalytics;
    blockchainTx?: string;
    events: GamingTypes.GameEvent[];
}

/**
 * @interface PlayerSession
 * @description Player session information
 */
export interface PlayerSession {
    playerId: string;
    connection: WebSocket;
    currentGame?: string;
    lastActivity: number;
    stats: GamingTypes.PlayerStats;
    isAuthenticated: boolean;
}

/**
 * @class GamingEngine
 * @description Main gaming engine for GameDin L3
 */
export class GamingEngine extends EventEmitter {
    private config: GamingEngineConfig;
    private wss: WebSocketServer;
    private database: DatabaseService;
    private blockchain: BlockchainService;
    private aiService: UnifiedAIService;
    private realTimeEngine: RealTimeGamingEngine;
    private logger: Logger;
    
    // Game management
    private activeGames: Map<string, GameInstance> = new Map();
    private playerSessions: Map<string, PlayerSession> = new Map();
    private gameQueue: string[] = [];
    private gameCounter: number = 0;
    
    // Performance metrics
    private metrics = {
        totalGames: 0,
        activeGames: 0,
        totalPlayers: 0,
        connectedPlayers: 0,
        averageGameDuration: 0,
        gamesCompleted: 0,
        aiAnalyses: 0,
        blockchainTransactions: 0,
        errors: 0
    };

    constructor(config: GamingEngineConfig) {
        super();
        this.config = config;
        this.logger = new Logger('GamingEngine');
        
        // Initialize services
        this.database = new DatabaseService(config.databaseConfig);
        this.blockchain = new BlockchainService(config.blockchainConfig);
        this.aiService = new UnifiedAIService(config.aiConfig);
        this.realTimeEngine = new RealTimeGamingEngine(config.defaultGameConfig);
        
        // Initialize WebSocket server
        this.wss = new WebSocketServer({ port: config.port });
        this.setupWebSocketHandlers();
    }

    /**
     * @method initialize
     * @description Initialize gaming engine
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing Gaming Engine...');
            
            // Initialize services
            await this.database.initialize();
            if (this.config.blockchainEnabled) {
                await this.blockchain.initialize();
            }
            if (this.config.aiEnabled) {
                await this.aiService.initialize();
            }
            if (this.config.realTimeEnabled) {
                await this.realTimeEngine.initialize();
            }
            
            // Load game configurations
            await this.loadGameConfigurations();
            
            // Start game loop
            this.startGameLoop();
            
            this.logger.info(`Gaming Engine initialized on port ${this.config.port}`);
            
        } catch (error) {
            this.logger.error('Failed to initialize Gaming Engine:', error);
            throw error;
        }
    }

    /**
     * @method setupWebSocketHandlers
     * @description Setup WebSocket event handlers
     */
    private setupWebSocketHandlers(): void {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            this.handlePlayerConnection(ws, req);
        });
        
        this.wss.on('error', (error: Error) => {
            this.logger.error('WebSocket server error:', error);
            this.metrics.errors++;
        });
    }

    /**
     * @method handlePlayerConnection
     * @description Handle new player connection
     * @param ws WebSocket connection
     * @param req Request object
     */
    private handlePlayerConnection(ws: WebSocket, req: any): void {
        const playerId = this.extractPlayerId(req);
        if (!playerId) {
            ws.close(1008, 'Invalid player ID');
            return;
        }
        
        // Create player session
        const session: PlayerSession = {
            playerId,
            connection: ws,
            lastActivity: Date.now(),
            stats: this.getDefaultPlayerStats(),
            isAuthenticated: false
        };
        
        this.playerSessions.set(playerId, session);
        this.metrics.connectedPlayers++;
        
        // Setup WebSocket event handlers
        ws.on('message', (data: Buffer) => {
            this.handlePlayerMessage(playerId, data);
        });
        
        ws.on('close', () => {
            this.handlePlayerDisconnection(playerId);
        });
        
        ws.on('error', (error: Error) => {
            this.logger.error(`WebSocket error for player ${playerId}:`, error);
            this.handlePlayerDisconnection(playerId);
        });
        
        // Send welcome message
        this.sendToPlayer(playerId, {
            type: 'connection_established',
            playerId,
            timestamp: Date.now()
        });
        
        this.logger.info(`Player ${playerId} connected`);
    }

    /**
     * @method handlePlayerMessage
     * @description Handle player message
     * @param playerId Player ID
     * @param data Message data
     */
    private handlePlayerMessage(playerId: string, data: Buffer): void {
        try {
            const message = JSON.parse(data.toString());
            const session = this.playerSessions.get(playerId);
            
            if (!session) {
                this.logger.warn(`No session found for player ${playerId}`);
                return;
            }
            
            session.lastActivity = Date.now();
            
            switch (message.type) {
                case 'authenticate':
                    this.handleAuthentication(playerId, message);
                    break;
                case 'join_game':
                    this.handleJoinGame(playerId, message);
                    break;
                case 'player_action':
                    this.handlePlayerAction(playerId, message);
                    break;
                case 'leave_game':
                    this.handleLeaveGame(playerId, message);
                    break;
                case 'get_stats':
                    this.handleGetStats(playerId, message);
                    break;
                default:
                    this.logger.warn(`Unknown message type: ${message.type}`);
            }
            
        } catch (error) {
            this.logger.error(`Error handling message from player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handleAuthentication
     * @description Handle player authentication
     * @param playerId Player ID
     * @param message Authentication message
     */
    private async handleAuthentication(playerId: string, message: any): Promise<void> {
        try {
            const session = this.playerSessions.get(playerId);
            if (!session) return;
            
            // Verify authentication token
            const isValid = await this.verifyAuthenticationToken(message.token);
            
            if (isValid) {
                session.isAuthenticated = true;
                
                // Load player stats
                const stats = await this.database.getPlayerStats(playerId);
                session.stats = stats;
                
                this.sendToPlayer(playerId, {
                    type: 'authentication_success',
                    playerId,
                    stats,
                    timestamp: Date.now()
                });
                
                this.logger.info(`Player ${playerId} authenticated successfully`);
            } else {
                this.sendToPlayer(playerId, {
                    type: 'authentication_failed',
                    message: 'Invalid authentication token',
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            this.logger.error(`Authentication error for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Authentication failed',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handleJoinGame
     * @description Handle player joining game
     * @param playerId Player ID
     * @param message Join game message
     */
    private async handleJoinGame(playerId: string, message: any): Promise<void> {
        try {
            const session = this.playerSessions.get(playerId);
            if (!session || !session.isAuthenticated) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Not authenticated',
                    timestamp: Date.now()
                });
                return;
            }
            
            const gameType = message.gameType || 'default';
            const gameConfig = message.config || this.config.defaultGameConfig;
            
            // Find or create game
            let game = this.findAvailableGame(gameType, gameConfig);
            
            if (!game) {
                game = await this.createNewGame(gameType, gameConfig);
            }
            
            // Add player to game
            const success = await this.addPlayerToGame(playerId, game.gameId);
            
            if (success) {
                session.currentGame = game.gameId;
                
                this.sendToPlayer(playerId, {
                    type: 'game_joined',
                    gameId: game.gameId,
                    gameState: game.state,
                    timestamp: Date.now()
                });
                
                // Notify other players
                this.broadcastToGame(game.gameId, {
                    type: 'player_joined',
                    playerId,
                    playerCount: game.players.size,
                    timestamp: Date.now()
                }, [playerId]);
                
                this.logger.info(`Player ${playerId} joined game ${game.gameId}`);
            } else {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Failed to join game',
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            this.logger.error(`Join game error for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Failed to join game',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handlePlayerAction
     * @description Handle player action
     * @param playerId Player ID
     * @param message Player action message
     */
    private async handlePlayerAction(playerId: string, message: any): Promise<void> {
        try {
            const session = this.playerSessions.get(playerId);
            if (!session || !session.currentGame) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Not in a game',
                    timestamp: Date.now()
                });
                return;
            }
            
            const game = this.activeGames.get(session.currentGame);
            if (!game) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Game not found',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Process player action
            const action: GamingTypes.IGameAction = {
                playerId,
                gameId: session.currentGame || '',
                type: message.type,
                data: message.data,
                timestamp: Date.now(),
                success: true,
                result: {
                    winner: null,
                    score: 0,
                    duration: 0,
                    completedAt: Date.now()
                }
            };
            
            const result = await this.processPlayerAction(game, action);
            
            if (result.success) {
                // Update game state
                game.state = result.newState;
                game.events.push({
                    id: `event_${Date.now()}_${Math.random()}`,
                    type: 'player_action',
                    playerId,
                    timestamp: Date.now(),
                    data: action,
                    metadata: {
                        gameId: session.currentGame || '',
                        actionType: action.type,
                        playerId: playerId,
                        timestamp: Date.now()
                    }
                });
                
                // Broadcast to all players in game
                this.broadcastToGame(game.gameId, {
                    type: 'game_update',
                    gameState: game.state,
                    lastAction: action,
                    timestamp: Date.now()
                });
                
                // Check for game end conditions
                if (result.gameEnded) {
                    await this.endGame(game.gameId, result.gameResult);
                }
            } else {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: result.error || 'Invalid action',
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            this.logger.error(`Player action error for ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Action processing failed',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handleLeaveGame
     * @description Handle player leaving game
     * @param playerId Player ID
     * @param message Leave game message
     */
    private async handleLeaveGame(playerId: string, message: any): Promise<void> {
        try {
            const session = this.playerSessions.get(playerId);
            if (!session || !session.currentGame) {
                return;
            }
            
            const gameId = session.currentGame;
            const game = this.activeGames.get(gameId);
            
            if (game) {
                // Remove player from game
                game.players.delete(playerId);
                
                // Notify other players
                this.broadcastToGame(gameId, {
                    type: 'player_left',
                    playerId,
                    playerCount: game.players.size,
                    timestamp: Date.now()
                }, [playerId]);
                
                // Check if game should end
                if (game.players.size < 2) {
                    await this.endGame(gameId, { 
                        score: 0,
                        duration: 0,
                        completedAt: Date.now(),
                        reason: 'insufficient_players'
                    });
                }
            }
            
            session.currentGame = undefined;
            
            this.sendToPlayer(playerId, {
                type: 'game_left',
                gameId,
                timestamp: Date.now()
            });
            
            this.logger.info(`Player ${playerId} left game ${gameId}`);
            
        } catch (error) {
            this.logger.error(`Leave game error for player ${playerId}:`, error);
        }
    }

    /**
     * @method handleGetStats
     * @description Handle get stats request
     * @param playerId Player ID
     * @param message Get stats message
     */
    private async handleGetStats(playerId: string, message: any): Promise<void> {
        try {
            const session = this.playerSessions.get(playerId);
            if (!session) return;
            
            const stats = await this.database.getPlayerStats(playerId);
            
            this.sendToPlayer(playerId, {
                type: 'player_stats',
                stats,
                timestamp: Date.now()
            });
            
        } catch (error) {
            this.logger.error(`Get stats error for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Failed to get stats',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handlePlayerDisconnection
     * @description Handle player disconnection
     * @param playerId Player ID
     */
    private async handlePlayerDisconnection(playerId: string): Promise<void> {
        try {
            const session = this.playerSessions.get(playerId);
            if (!session) return;
            
            // Remove from current game
            if (session.currentGame) {
                await this.handleLeaveGame(playerId, { type: 'leave_game' });
            }
            
            // Remove session
            this.playerSessions.delete(playerId);
            this.metrics.connectedPlayers--;
            
            this.logger.info(`Player ${playerId} disconnected`);
            
        } catch (error) {
            this.logger.error(`Player disconnection error for ${playerId}:`, error);
        }
    }

    // ============ GAME MANAGEMENT METHODS ============
    
    /**
     * @method findAvailableGame
     * @description Find available game of specified type
     * @param gameType Game type
     * @param config Game configuration
     * @returns Available game or null
     */
    private findAvailableGame(gameType: GamingTypes.GameType, config: GamingTypes.GameConfig): GameInstance | null {
        // TODO: Check type of game.state.status, should match IGameState
        for (const game of this.activeGames.values()) {
            if (game.gameType === gameType && 
                game.players.size < this.config.maxPlayersPerGame &&
                game.state.status === 'waiting') {
                return game;
            }
        }
        return null;
    }
    
    /**
     * @method createNewGame
     * @description Create new game
     * @param gameType Game type
     * @param config Game configuration
     * @returns New game instance
     */
    private async createNewGame(gameType: GamingTypes.GameType, config: GamingTypes.GameConfig): Promise<GameInstance> {
        this.gameCounter++;
        const gameId = `game_${this.gameCounter}_${Date.now()}`;
        
        const game: GameInstance = {
            gameId,
            gameType,
            config,
            state: this.createInitialGameState(gameType, config),
            players: new Map(),
            startTime: Date.now(),
            events: []
        };
        
        this.activeGames.set(gameId, game);
        this.metrics.totalGames++;
        this.metrics.activeGames++;
        
        this.logger.info(`Created new game ${gameId} of type ${gameType}`);
        
        return game;
    }
    
    /**
     * @method addPlayerToGame
     * @description Add player to game
     * @param playerId Player ID
     * @param gameId Game ID
     * @returns Success status
     */
    private async addPlayerToGame(playerId: string, gameId: string): Promise<boolean> {
        try {
            const game = this.activeGames.get(gameId);
            const session = this.playerSessions.get(playerId);
            
            if (!game || !session) {
                return false;
            }
            
            if (game.players.size >= this.config.maxPlayersPerGame) {
                return false;
            }
            
            // TODO: Check type of player object, should match PlayerState
            game.players.set(playerId, {
                id: playerId,
                currentGameId: gameId,
                stake: 0,
                score: 0,
                rank: 1,
                joinTime: Date.now(),
                lastActionTime: Date.now(),
                isActive: true,
                stats: session.stats,
                aiAnalytics: null,
                inventory: [],
                abilities: [],
                position: { x: 0, y: 0 },
                health: 100,
                energy: 100,
                status: 'active'
            });
            
            // TODO: Check type of game.state.players, should match PlayerState[]
            game.state.players.push({
                id: playerId,
                currentGameId: gameId,
                stake: 0,
                score: 0,
                rank: 1,
                joinTime: Date.now(),
                lastActionTime: Date.now(),
                isActive: true,
                stats: session.stats,
                aiAnalytics: null,
                inventory: [],
                abilities: [],
                position: { x: 0, y: 0 },
                health: 100,
                energy: 100,
                status: 'active'
            });
            
            // Check if game should start
            if (game.players.size >= game.config.maxPlayers) {
                await this.startGame(gameId);
            }
            
            return true;
            
        } catch (error) {
            this.logger.error(`Error adding player ${playerId} to game ${gameId}:`, error);
            return false;
        }
    }
    
    /**
     * @method startGame
     * @description Start game
     * @param gameId Game ID
     */
    private async startGame(gameId: string): Promise<void> {
        try {
            const game = this.activeGames.get(gameId);
            if (!game) return;
            
            // TODO: Check type of game.state.status, should match IGameState
            game.state.status = 'active';
            game.state.startTime = Date.now();
            
            // Initialize game logic
            await this.initializeGameLogic(game);
            
            // Notify all players
            this.broadcastToGame(gameId, {
                type: 'game_started',
                gameState: game.state,
                timestamp: Date.now()
            });
            
            this.logger.info(`Game ${gameId} started`);
            
        } catch (error) {
            this.logger.error(`Error starting game ${gameId}:`, error);
        }
    }
    
    /**
     * @method endGame
     * @description End game
     * @param gameId Game ID
     * @param result Game result
     */
    private async endGame(gameId: string, result: GamingTypes.GameActionResult): Promise<void> {
        try {
            const game = this.activeGames.get(gameId);
            if (!game) return;
            
            // TODO: Check type of game.state.status, should match IGameState
            game.state.status = 'completed';
            game.endTime = Date.now();
            game.result = result;
            
            // Perform AI analysis if enabled
            if (this.config.aiEnabled) {
                await this.performGameAnalysis(game);
            }
            
            // Process blockchain transactions if enabled
            if (this.config.blockchainEnabled) {
                await this.processGameTransactions(game);
            }
            
            // Update player stats
            await this.updatePlayerStats(game);
            
            // Notify all players
            this.broadcastToGame(gameId, {
                type: 'game_ended',
                result,
                gameState: game.state,
                timestamp: Date.now()
            });
            
            // Clean up game
            this.activeGames.delete(gameId);
            this.metrics.activeGames--;
            this.metrics.gamesCompleted++;
            
            // Update player sessions
            for (const playerId of game.players.keys()) {
                const session = this.playerSessions.get(playerId);
                if (session) {
                    // TODO: Check type of session.currentGame, should match PlayerSession
                    session.currentGame = undefined;
                }
            }
            
            this.logger.info(`Game ${gameId} ended`);
            
        } catch (error) {
            this.logger.error(`Error ending game ${gameId}:`, error);
        }
    }
    
    /**
     * @method processPlayerAction
     * @description Process player action
     * @param game Game instance
     * @param action Player action
     * @returns Processing result
     */
    private async processPlayerAction(game: GameInstance, action: GamingTypes.IGameAction): Promise<any> {
        try {
            // Validate action
            const validation = this.validatePlayerAction(game, action);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            
            // Process action based on game type
            const result = await this.realTimeEngine.processAction(game, action);
            
            return {
                success: true,
                newState: result.newState,
                gameEnded: result.gameEnded,
                gameResult: result.gameResult
            };
            
        } catch (error) {
            this.logger.error(`Error processing player action:`, error);
            return { success: false, error: 'Action processing failed' };
        }
    }

    // ============ UTILITY METHODS ============
    
    /**
     * @method extractPlayerId
     * @description Extract player ID from request
     * @param req Request object
     * @returns Player ID or null
     */
    private extractPlayerId(req: any): string | null {
        // Extract from query parameters or headers
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('playerId') || req.headers['x-player-id'] || null;
    }
    
    /**
     * @method getDefaultPlayerStats
     * @description Get default player stats
     * @returns Default player stats
     */
    private getDefaultPlayerStats(): GamingTypes.PlayerStats {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            averageScore: 0,
            totalPlayTime: 0,
            lastGameTime: 0,
            totalEarnings: 0,
            totalStaked: 0,
            rank: 1,
            experience: 0,
            level: 1,
            achievements: [],
            abilities: [],
            position: { x: 0, y: 0 },
            health: 100,
            isConnected: true
        };
    }
    
    /**
     * @method verifyAuthenticationToken
     * @description Verify authentication token
     * @param token Authentication token
     * @returns True if valid
     */
    private async verifyAuthenticationToken(token: string): Promise<boolean> {
        // Implement token verification logic
        return token && token.length > 0;
    }
    
    /**
     * @method createInitialGameState
     * @description Create initial game state
     * @param gameType Game type
     * @param config Game configuration
     * @returns Initial game state
     */
    private createInitialGameState(gameType: GamingTypes.GameType, config: GamingTypes.GameConfig): GamingTypes.IGameState {
        return {
            gameId: '',
            status: 'waiting',
            type: gameType,
            players: [],
            startTime: 0,
            endTime: 0,
            totalPot: 0,
            currentRound: 0,
            metadata: {
                name: 'Default Game',
                description: 'A default game instance',
                version: '1.0.0',
                creator: 'GameDin',
                tags: ['default'],
                thumbnail: '',
                banner: ''
            }
        };
    }
    
    /**
     * @method initializeGameLogic
     * @description Initialize game logic
     * @param game Game instance
     */
    private async initializeGameLogic(game: GameInstance): Promise<void> {
        // Initialize game-specific logic
        await this.realTimeEngine.initializeGame(game);
    }
    
    /**
     * @method validatePlayerAction
     * @description Validate player action
     * @param game Game instance
     * @param action Player action
     * @returns Validation result
     */
    private validatePlayerAction(game: GameInstance, action: GamingTypes.IGameAction): { valid: boolean; error?: string } {
        // Check if player is in game
        if (!game.players.has(action.playerId)) {
            return { valid: false, error: 'Player not in game' };
        }
        
        // TODO: Check type of game.state.status, should match IGameState
        if (game.state.status !== 'active') {
            return { valid: false, error: 'Game not active' };
        }
        
        // Validate action type
        const validActions = ['move', 'attack', 'defend', 'use_item', 'skip'];
        if (!validActions.includes(action.type)) {
            return { valid: false, error: 'Invalid action type' };
        }
        
        return { valid: true };
    }
    
    /**
     * @method performGameAnalysis
     * @description Perform AI analysis on game
     * @param game Game instance
     */
    private async performGameAnalysis(game: GameInstance): Promise<void> {
        try {
            // TODO: Check type of analysis, should match AIAnalytics
            for (const playerId of game.players.keys()) {
                const analysis = await this.aiService.analyzePlayer(playerId, game.gameId);
                game.aiAnalysis = analysis;
                this.metrics.aiAnalyses++;
            }
        } catch (error) {
            this.logger.error(`AI analysis error for game ${game.gameId}:`, error);
        }
    }
    
    /**
     * @method processGameTransactions
     * @description Process blockchain transactions for game
     * @param game Game instance
     */
    private async processGameTransactions(game: GameInstance): Promise<void> {
        try {
            // Process rewards and fees
            // TODO: Check type of txHash, should match string
            const txHash = await this.blockchain.processGameResult(game);
            game.blockchainTx = txHash;
            this.metrics.blockchainTransactions++;
        } catch (error) {
            this.logger.error(`Blockchain transaction error for game ${game.gameId}:`, error);
        }
    }
    
    /**
     * @method updatePlayerStats
     * @description Update player statistics
     * @param game Game instance
     */
    private async updatePlayerStats(game: GameInstance): Promise<void> {
        try {
            // TODO: Check type of result, should match GameActionResult
            for (const playerId of game.players.keys()) {
                await this.database.updatePlayerStats(playerId, game.result!);
            }
        } catch (error) {
            this.logger.error(`Player stats update error for game ${game.gameId}:`, error);
        }
    }
    
    /**
     * @method loadGameConfigurations
     * @description Load game configurations
     */
    private async loadGameConfigurations(): Promise<void> {
        // Load game configurations from database
        // TODO: Check type of configs, should match GameConfig[]
        const configs = await this.database.getGameConfigurations();
        // Apply configurations
    }
    
    /**
     * @method startGameLoop
     * @description Start game loop
     */
    private startGameLoop(): void {
        setInterval(() => {
            this.gameLoop();
        }, 1000); // 1 second intervals
    }
    
    /**
     * @method gameLoop
     * @description Main game loop
     */
    private gameLoop(): void {
        try {
            // Process active games
            for (const game of this.activeGames.values()) {
                this.processGame(game);
            }
            
            // Clean up inactive sessions
            this.cleanupInactiveSessions();
            
            // Update metrics
            this.updateMetrics();
            
        } catch (error) {
            this.logger.error('Game loop error:', error);
            this.metrics.errors++;
        }
    }
    
    /**
     * @method processGame
     * @description Process single game
     * @param game Game instance
     */
    private processGame(game: GameInstance): void {
        // Process game logic
        // TODO: Check type of game.state.status, should match IGameState
        if (game.state.status === 'active') {
            this.realTimeEngine.updateGame(game);
        }
        
        // Check for timeouts
        // TODO: Check type of result object, should match GameActionResult
        if (Date.now() - game.startTime > this.config.gameTimeout) {
            this.endGame(game.gameId, { 
                score: 0,
                duration: 0,
                completedAt: Date.now(),
                reason: 'timeout'
            });
        }
    }
    
    /**
     * @method cleanupInactiveSessions
     * @description Clean up inactive player sessions
     */
    private cleanupInactiveSessions(): void {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes
        
        for (const [playerId, session] of this.playerSessions.entries()) {
            if (now - session.lastActivity > timeout) {
                this.handlePlayerDisconnection(playerId);
            }
        }
    }
    
    /**
     * @method updateMetrics
     * @description Update performance metrics
     */
    private updateMetrics(): void {
        this.metrics.totalPlayers = this.playerSessions.size;
        this.metrics.activeGames = this.activeGames.size;
    }
    
    /**
     * @method sendToPlayer
     * @description Send message to player
     * @param playerId Player ID
     * @param message Message to send
     */
    private sendToPlayer(playerId: string, message: any): void {
        const session = this.playerSessions.get(playerId);
        if (session && session.connection.readyState === WebSocket.OPEN) {
            session.connection.send(JSON.stringify(message));
        }
    }
    
    /**
     * @method broadcastToGame
     * @description Broadcast message to all players in game
     * @param gameId Game ID
     * @param message Message to broadcast
     * @param excludePlayers Players to exclude
     */
    private broadcastToGame(gameId: string, message: any, excludePlayers: string[] = []): void {
        const game = this.activeGames.get(gameId);
        if (!game) return;
        
        for (const [playerId, player] of game.players.entries()) {
            if (!excludePlayers.includes(playerId)) {
                this.sendToPlayer(playerId, message);
            }
        }
    }
    
    /**
     * @method getMetrics
     * @description Get performance metrics
     * @returns Performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * @method getActiveGames
     * @description Get active games
     * @returns Active games
     */
    getActiveGames(): GameInstance[] {
        return Array.from(this.activeGames.values());
    }
    
    /**
     * @method getConnectedPlayers
     * @description Get connected players
     * @returns Connected players
     */
    getConnectedPlayers(): PlayerSession[] {
        return Array.from(this.playerSessions.values());
    }
    
    /**
     * @method shutdown
     * @description Shutdown gaming engine
     */
    async shutdown(): Promise<void> {
        try {
            this.logger.info('Shutting down Gaming Engine...');
            
            // Close all games
            for (const gameId of this.activeGames.keys()) {
                await this.endGame(gameId, { 
                    score: 0,
                    duration: 0,
                    completedAt: Date.now(),
                    reason: 'shutdown'
                });
            }
            
            // Close WebSocket server
            this.wss.close();
            
            // Close services
            await this.database.close();
            if (this.config.blockchainEnabled) {
                await this.blockchain.close();
            }
            
            this.logger.info('Gaming Engine shutdown complete');
            
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }
} 