/**
 * @file RealTimeGamingEngine.ts
 * @description Real-time gaming engine for GameDin L3 ecosystem
 * @dev Handles high-performance gaming with AI integration
 * @dev Supports WebSocket connections and real-time analytics
 * @dev Manages game state, player interactions, and AI-powered features
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import * as GamingTypes from '../types/gaming.mts';
import { NovaSanctumAI } from '../ai/NovaSanctumAI';
import { AthenaMistAI } from '../ai/AthenaMistAI';
import { UnifiedAIService } from '../ai/UnifiedAIService';
import { DatabaseService } from '../database/DatabaseService';
import { BlockchainService } from '../blockchain/BlockchainService';
import { Logger } from '../utils/Logger';
import { ethers } from 'ethers';
import Redis from 'redis';
import { promisify } from 'util';

/**
 * @class RealTimeGamingEngine
 * @description High-performance real-time gaming engine with AI integration
 */
export class RealTimeGamingEngine extends EventEmitter {
    private wss: WebSocket.Server;
    private games: Map<string, GamingTypes.GameState> = new Map();
    private players: Map<string, GamingTypes.PlayerState> = new Map();
    private connections: Map<string, WebSocket> = new Map();
    private gameQueue: string[] = [];
    private activeTournaments: Map<string, GamingTypes.TournamentConfig> = new Map();
    
    // AI Services
    private novaSanctumAI: NovaSanctumAI;
    private athenaMistAI: AthenaMistAI;
    private unifiedAI: UnifiedAIService;
    
    // Services
    private database: DatabaseService;
    private blockchain: BlockchainService;
    private logger: Logger;
    
    // Configuration
    private config: GamingTypes.GameConfig;
    private isRunning: boolean = false;
    private tickInterval: NodeJS.Timeout | null = null;
    private aiAnalysisInterval: NodeJS.Timeout | null = null;
    
    // Performance metrics
    private metrics = {
        totalGames: 0,
        activeGames: 0,
        totalPlayers: 0,
        activePlayers: 0,
        averageLatency: 0,
        tps: 0,
        aiRequests: 0,
        fraudDetections: 0,
        totalConnections: 0,
        totalActions: 0,
        peakTPS: 0
    };

    private provider: ethers.providers.JsonRpcProvider;
    private redis: Redis.RedisClient;
    private gameRooms: Map<string, GameRoom> = new Map();
    private playerConnections: Map<string, WebSocket> = new Map();
    private novaSanctumOracle: ethers.Contract;
    private gameDinToken: ethers.Contract;
    
    // Configuration
    private readonly MAX_CONNECTIONS = 10000;
    private readonly HEARTBEAT_INTERVAL = 30000;
    private readonly GAME_TIMEOUT = 300000; // 5 minutes
    private readonly MAX_PLAYERS_PER_ROOM = 100;

    constructor(config: GamingTypes.GameConfig) {
        super();
        this.config = config;
        this.logger = new Logger('RealTimeGamingEngine');
        
        // Initialize AI services
        this.novaSanctumAI = new NovaSanctumAI(config.novaSanctumConfig);
        this.athenaMistAI = new AthenaMistAI(config.athenaMistConfig);
        this.unifiedAI = new UnifiedAIService(this.novaSanctumAI, this.athenaMistAI);
        
        // Initialize services
        this.database = new DatabaseService(config.databaseConfig);
        this.blockchain = new BlockchainService(config.blockchainConfig);
        
        // Initialize WebSocket server
        this.wss = new WebSocket.Server({ 
            port: config.websocketPort,
            perMessageDeflate: false, // Disable compression for better performance
            maxPayload: 1024 * 1024 // 1MB max payload
        });
        
        // Initialize Ethereum provider
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        
        // Initialize Redis for caching
        this.redis = Redis.createClient(config.redisUrl);
        
        // Initialize smart contracts
        this.novaSanctumOracle = new ethers.Contract(
            config.novaSanctumAddress,
            require('../../abis/NovaSanctumOracle.json'),
            this.provider
        );
        
        this.gameDinToken = new ethers.Contract(
            config.gameDinTokenAddress,
            require('../../abis/GameDinToken.json'),
            this.provider
        );
        
        this.setupWebSocketHandlers();
        this.startHeartbeat();
        this.startMetricsCollection();
        
        this.logger.info('RealTimeGamingEngine initialized');
    }

    /**
     * @method start
     * @description Start the gaming engine
     */
    async start(): Promise<void> {
        try {
            this.logger.info('Starting RealTimeGamingEngine...');
            
            // Start WebSocket server
            this.setupWebSocketServer();
            
            // Start game loop
            this.startGameLoop();
            
            // Start AI analysis loop
            this.startAIAnalysisLoop();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            this.isRunning = true;
            this.logger.info('RealTimeGamingEngine started successfully');
            
            this.emit('engine:started');
        } catch (error) {
            this.logger.error('Failed to start RealTimeGamingEngine:', error);
            throw error;
        }
    }

    /**
     * @method stop
     * @description Stop the gaming engine
     */
    async stop(): Promise<void> {
        try {
            this.logger.info('Stopping RealTimeGamingEngine...');
            
            this.isRunning = false;
            
            // Stop intervals
            if (this.tickInterval) {
                clearInterval(this.tickInterval);
                this.tickInterval = null;
            }
            
            if (this.aiAnalysisInterval) {
                clearInterval(this.aiAnalysisInterval);
                this.aiAnalysisInterval = null;
            }
            
            // Close WebSocket server
            this.wss.close();
            
            // Save game states
            await this.saveAllGameStates();
            
            this.logger.info('RealTimeGamingEngine stopped successfully');
            this.emit('engine:stopped');
        } catch (error) {
            this.logger.error('Failed to stop RealTimeGamingEngine:', error);
            throw error;
        }
    }

    /**
     * @method setupWebSocketServer
     * @description Setup WebSocket server and event handlers
     */
    private setupWebSocketServer(): void {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            const playerId = this.generatePlayerId();
            const clientIp = req.socket.remoteAddress;
            
            this.logger.info(`New player connected: ${playerId} from ${clientIp}`);
            
            // Store connection
            this.connections.set(playerId, ws);
            
            // Send welcome message
            this.sendToPlayer(playerId, {
                type: 'welcome',
                playerId,
                timestamp: Date.now(),
                serverInfo: {
                    version: this.config.version,
                    maxPlayers: this.config.maxPlayers,
                    supportedGames: this.config.supportedGames
                }
            });
            
            // Setup player event handlers
            ws.on('message', (data: WebSocket.Data) => {
                this.handlePlayerMessage(playerId, data);
            });
            
            ws.on('close', () => {
                this.handlePlayerDisconnect(playerId);
            });
            
            ws.on('error', (error) => {
                this.logger.error(`WebSocket error for player ${playerId}:`, error);
                this.handlePlayerDisconnect(playerId);
            });
        });
        
        this.logger.info(`WebSocket server started on port ${this.config.websocketPort}`);
    }

    /**
     * @method handlePlayerMessage
     * @description Handle incoming player messages
     */
    private async handlePlayerMessage(playerId: string, data: WebSocket.Data): Promise<void> {
        try {
            const message = JSON.parse(data.toString());
            const { type, payload } = message;
            
            switch (type) {
                case 'join_game':
                    await this.handleJoinGame(playerId, payload);
                    break;
                    
                case 'game_action':
                    await this.handleGameAction(playerId, payload);
                    break;
                    
                case 'leave_game':
                    await this.handleLeaveGame(playerId, payload);
                    break;
                    
                case 'chat_message':
                    await this.handleChatMessage(playerId, payload);
                    break;
                    
                case 'tournament_join':
                    await this.handleTournamentJoin(playerId, payload);
                    break;
                    
                case 'ai_analysis_request':
                    await this.handleAIAnalysisRequest(playerId, payload);
                    break;
                    
                default:
                    this.logger.warn(`Unknown message type: ${type} from player ${playerId}`);
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
     * @method handleJoinGame
     * @description Handle player joining a game
     */
    private async handleJoinGame(playerId: string, payload: any): Promise<void> {
        const { gameId, stake, gameType } = payload;
        
        try {
            // Check if player is already in a game
            if (this.players.has(playerId) && this.players.get(playerId)!.currentGameId) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Already in a game',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Validate stake
            if (stake < this.config.minStake || stake > this.config.maxStake) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Invalid stake amount',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Get or create game
            let game = this.games.get(gameId);
            if (!game) {
                game = await this.createGame(gameId, gameType, stake);
                this.games.set(gameId, game);
            }
            
            // Check if game is full
            if (game.players.length >= game.maxPlayers) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Game is full',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Create player state
            const playerState: GamingTypes.PlayerState = {
                id: playerId,
                currentGameId: gameId,
                stake,
                score: 0,
                rank: 0,
                joinTime: Date.now(),
                lastActionTime: Date.now(),
                isActive: true,
                stats: await this.getPlayerStats(playerId),
                aiAnalytics: null
            };
            
            // Add player to game
            game.players.push(playerState);
            this.players.set(playerId, playerState);
            
            // Update metrics
            this.metrics.activePlayers++;
            
            // Send confirmation
            this.sendToPlayer(playerId, {
                type: 'game_joined',
                gameId,
                playerId,
                stake,
                timestamp: Date.now()
            });
            
            // Notify other players
            this.broadcastToGame(gameId, {
                type: 'player_joined',
                playerId,
                stake,
                playerCount: game.players.length,
                timestamp: Date.now()
            }, playerId);
            
            // Start game if full
            if (game.players.length >= game.maxPlayers) {
                await this.startGame(gameId);
            }
            
            this.logger.info(`Player ${playerId} joined game ${gameId}`);
            
        } catch (error) {
            this.logger.error(`Error joining game for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Failed to join game',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handleGameAction
     * @description Handle player game action
     */
    private async handleGameAction(playerId: string, payload: any): Promise<void> {
        const { gameId, action, data } = payload;
        
        try {
            const game = this.games.get(gameId);
            if (!game) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Game not found',
                    timestamp: Date.now()
                });
                return;
            }
            
            const player = game.players.find(p => p.id === playerId);
            if (!player || !player.isActive) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Player not in game',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Validate action
            if (!this.isValidAction(action, data)) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Invalid action',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Process action
            const result = await this.processGameAction(gameId, playerId, action, data);
            
            // Update player state
            player.lastActionTime = Date.now();
            player.score += result.score;
            
            // Broadcast action to all players
            this.broadcastToGame(gameId, {
                type: 'game_action',
                playerId,
                action,
                score: result.score,
                totalScore: player.score,
                timestamp: Date.now()
            });
            
            // Check for game end conditions
            if (this.checkGameEndConditions(gameId)) {
                await this.endGame(gameId);
            }
            
        } catch (error) {
            this.logger.error(`Error processing game action for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Failed to process action',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handleLeaveGame
     * @description Handle player leaving a game
     */
    private async handleLeaveGame(playerId: string, payload: any): Promise<void> {
        const { gameId } = payload;
        
        try {
            const game = this.games.get(gameId);
            if (!game) {
                return;
            }
            
            const playerIndex = game.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                return;
            }
            
            // Remove player from game
            game.players.splice(playerIndex, 1);
            
            // Update player state
            const player = this.players.get(playerId);
            if (player) {
                player.currentGameId = null;
                player.isActive = false;
            }
            
            // Update metrics
            this.metrics.activePlayers--;
            
            // Notify other players
            this.broadcastToGame(gameId, {
                type: 'player_left',
                playerId,
                playerCount: game.players.length,
                timestamp: Date.now()
            }, playerId);
            
            this.logger.info(`Player ${playerId} left game ${gameId}`);
            
        } catch (error) {
            this.logger.error(`Error leaving game for player ${playerId}:`, error);
        }
    }

    /**
     * @method handleChatMessage
     * @description Handle player chat message
     */
    private async handleChatMessage(playerId: string, payload: any): Promise<void> {
        const { gameId, message } = payload;
        
        try {
            // Validate message
            if (!message || message.length > 200) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Invalid message',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Check for inappropriate content (basic filter)
            if (this.containsInappropriateContent(message)) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Message contains inappropriate content',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Broadcast message to game
            this.broadcastToGame(gameId, {
                type: 'chat_message',
                playerId,
                message,
                timestamp: Date.now()
            });
            
        } catch (error) {
            this.logger.error(`Error handling chat message for player ${playerId}:`, error);
        }
    }

    /**
     * @method handleTournamentJoin
     * @description Handle player joining a tournament
     */
    private async handleTournamentJoin(playerId: string, payload: any): Promise<void> {
        const { tournamentId, stake } = payload;
        
        try {
            const tournament = this.activeTournaments.get(tournamentId);
            if (!tournament) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Tournament not found',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Validate tournament requirements
            if (stake < tournament.minStake || stake > tournament.maxStake) {
                this.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Invalid tournament stake',
                    timestamp: Date.now()
                });
                return;
            }
            
            // Add player to tournament
            tournament.participants.push({
                id: playerId,
                stake,
                joinTime: Date.now(),
                isActive: true
            });
            
            this.sendToPlayer(playerId, {
                type: 'tournament_joined',
                tournamentId,
                stake,
                participantCount: tournament.participants.length,
                timestamp: Date.now()
            });
            
            this.logger.info(`Player ${playerId} joined tournament ${tournamentId}`);
            
        } catch (error) {
            this.logger.error(`Error joining tournament for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Failed to join tournament',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handleAIAnalysisRequest
     * @description Handle AI analysis request
     */
    private async handleAIAnalysisRequest(playerId: string, payload: any): Promise<void> {
        const { gameId, analysisType } = payload;
        
        try {
            // Perform AI analysis
            const analysis = await this.performAIAnalysis(playerId, gameId, analysisType);
            
            // Send analysis results
            this.sendToPlayer(playerId, {
                type: 'ai_analysis_result',
                analysis,
                timestamp: Date.now()
            });
            
            // Update player analytics
            const player = this.players.get(playerId);
            if (player) {
                player.aiAnalytics = analysis;
            }
            
            this.metrics.aiRequests++;
            
        } catch (error) {
            this.logger.error(`Error performing AI analysis for player ${playerId}:`, error);
            this.sendToPlayer(playerId, {
                type: 'error',
                message: 'Failed to perform AI analysis',
                timestamp: Date.now()
            });
        }
    }

    /**
     * @method handlePlayerDisconnect
     * @description Handle player disconnection
     */
    private async handlePlayerDisconnect(playerId: string): Promise<void> {
        try {
            this.logger.info(`Player ${playerId} disconnected`);
            
            // Remove connection
            this.connections.delete(playerId);
            
            // Handle player leaving current game
            const player = this.players.get(playerId);
            if (player && player.currentGameId) {
                await this.handleLeaveGame(playerId, { gameId: player.currentGameId });
            }
            
            // Remove player state
            this.players.delete(playerId);
            
            // Update metrics
            this.metrics.activePlayers--;
            
        } catch (error) {
            this.logger.error(`Error handling disconnect for player ${playerId}:`, error);
        }
    }

    /**
     * @method createGame
     * @description Create a new game
     */
    private async createGame(gameId: string, gameType: string, stake: number): Promise<GamingTypes.GameState> {
        const game: GamingTypes.GameState = {
            id: gameId,
            type: gameType,
            state: 'waiting',
            players: [],
            maxPlayers: this.config.maxPlayersPerGame,
            minStake: this.config.minStake,
            maxStake: this.config.maxStake,
            totalPot: 0,
            startTime: null,
            endTime: null,
            winner: null,
            events: [],
            aiAnalytics: []
        };
        
        this.metrics.totalGames++;
        this.metrics.activeGames++;
        
        return game;
    }

    /**
     * @method startGame
     * @description Start a game
     */
    private async startGame(gameId: string): Promise<void> {
        const game = this.games.get(gameId);
        if (!game) return;
        
        game.state = 'active';
        game.startTime = Date.now();
        game.totalPot = game.players.reduce((sum, player) => sum + player.stake, 0);
        
        // Broadcast game start
        this.broadcastToGame(gameId, {
            type: 'game_started',
            gameId,
            startTime: game.startTime,
            totalPot: game.totalPot,
            timestamp: Date.now()
        });
        
        this.logger.info(`Game ${gameId} started with ${game.players.length} players`);
    }

    /**
     * @method endGame
     * @description End a game and determine winner
     */
    private async endGame(gameId: string): Promise<void> {
        const game = this.games.get(gameId);
        if (!game) return;
        
        game.state = 'finished';
        game.endTime = Date.now();
        
        // Determine winner (highest score)
        let winner = game.players[0];
        for (const player of game.players) {
            if (player.score > winner.score) {
                winner = player;
            }
        }
        
        game.winner = winner;
        
        // Calculate prize distribution
        const prize = game.totalPot;
        
        // Update winner balance
        winner.stats.totalEarnings += prize;
        winner.stats.gamesWon++;
        
        // Broadcast game end
        this.broadcastToGame(gameId, {
            type: 'game_ended',
            gameId,
            winner: winner.id,
            prize,
            finalScores: game.players.map(p => ({
                playerId: p.id,
                score: p.score,
                stake: p.stake
            })),
            timestamp: Date.now()
        });
        
        // Save game results
        await this.saveGameResults(gameId);
        
        // Update metrics
        this.metrics.activeGames--;
        
        this.logger.info(`Game ${gameId} ended. Winner: ${winner.id} with score ${winner.score}`);
    }

    /**
     * @method processGameAction
     * @description Process a game action and return results
     */
    private async processGameAction(
        gameId: string, 
        playerId: string, 
        action: string, 
        data: any
    ): Promise<{ score: number; success: boolean }> {
        // Basic action processing - can be extended for specific game types
        let score = 0;
        let success = true;
        
        switch (action) {
            case 'move':
                score = this.calculateMoveScore(data);
                break;
                
            case 'attack':
                score = this.calculateAttackScore(data);
                break;
                
            case 'defend':
                score = this.calculateDefendScore(data);
                break;
                
            case 'collect':
                score = this.calculateCollectScore(data);
                break;
                
            default:
                success = false;
                score = 0;
        }
        
        // Add randomness to prevent predictable patterns
        score += Math.floor(Math.random() * 10);
        
        return { score, success };
    }

    /**
     * @method performAIAnalysis
     * @description Perform AI analysis on player
     */
    private async performAIAnalysis(
        playerId: string, 
        gameId: string, 
        analysisType: string
    ): Promise<GamingTypes.AIAnalysis> {
        try {
            let analysis: GamingTypes.AIAnalysis;
            
            switch (analysisType) {
                case 'novaSanctum':
                    analysis = await this.novaSanctumAI.analyzePlayer(playerId, gameId);
                    break;
                    
                case 'athenaMist':
                    analysis = await this.athenaMistAI.analyzePlayer(playerId, gameId);
                    break;
                    
                case 'unified':
                    analysis = await this.unifiedAI.analyzePlayer(playerId, gameId);
                    break;
                    
                default:
                    analysis = await this.unifiedAI.analyzePlayer(playerId, gameId);
            }
            
            // Check for fraud detection
            if (analysis.fraudScore > 80) {
                this.metrics.fraudDetections++;
                this.logger.warn(`High fraud score detected for player ${playerId}: ${analysis.fraudScore}`);
            }
            
            return analysis;
            
        } catch (error) {
            this.logger.error(`Error performing AI analysis:`, error);
            throw error;
        }
    }

    /**
     * @method startGameLoop
     * @description Start the main game loop
     */
    private startGameLoop(): void {
        this.tickInterval = setInterval(() => {
            this.gameTick();
        }, this.config.tickRate);
        
        this.logger.info(`Game loop started with ${this.config.tickRate}ms tick rate`);
    }

    /**
     * @method gameTick
     * @description Main game tick function
     */
    private gameTick(): void {
        const startTime = Date.now();
        
        // Process all active games
        for (const [gameId, game] of this.games) {
            if (game.state === 'active') {
                this.processGameTick(gameId);
            }
        }
        
        // Update performance metrics
        const tickTime = Date.now() - startTime;
        this.metrics.averageLatency = (this.metrics.averageLatency + tickTime) / 2;
        this.metrics.tps = 1000 / this.config.tickRate;
        
        // Emit tick event
        this.emit('game:tick', {
            timestamp: Date.now(),
            activeGames: this.metrics.activeGames,
            activePlayers: this.metrics.activePlayers,
            tickTime
        });
    }

    /**
     * @method startAIAnalysisLoop
     * @description Start AI analysis loop
     */
    private startAIAnalysisLoop(): void {
        this.aiAnalysisInterval = setInterval(() => {
            this.performPeriodicAIAnalysis();
        }, this.config.aiAnalysisInterval);
        
        this.logger.info(`AI analysis loop started with ${this.config.aiAnalysisInterval}ms interval`);
    }

    /**
     * @method performPeriodicAIAnalysis
     * @description Perform periodic AI analysis on active players
     */
    private async performPeriodicAIAnalysis(): Promise<void> {
        try {
            for (const [playerId, player] of this.players) {
                if (player.isActive && player.currentGameId) {
                    // Perform unified AI analysis
                    const analysis = await this.unifiedAI.analyzePlayer(playerId, player.currentGameId);
                    player.aiAnalytics = analysis;
                    
                    // Check for suspicious behavior
                    if (analysis.fraudScore > 70) {
                        this.logger.warn(`Suspicious behavior detected for player ${playerId}`);
                        this.emit('player:suspicious', { playerId, analysis });
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error in periodic AI analysis:', error);
        }
    }

    /**
     * @method startPerformanceMonitoring
     * @description Start performance monitoring
     */
    private startPerformanceMonitoring(): void {
        setInterval(() => {
            this.logger.info('Performance metrics:', this.metrics);
            this.emit('metrics:update', this.metrics);
        }, 60000); // Log every minute
    }

    // ============ UTILITY METHODS ============
    
    private generatePlayerId(): string {
        return uuidv4();
    }
    
    private sendToPlayer(playerId: string, message: any): void {
        const ws = this.connections.get(playerId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    private broadcastToGame(gameId: string, message: any, excludePlayerId?: string): void {
        const game = this.games.get(gameId);
        if (!game) return;
        
        for (const player of game.players) {
            if (player.id !== excludePlayerId) {
                this.sendToPlayer(player.id, message);
            }
        }
    }
    
    private isValidAction(action: string, data: any): boolean {
        // Basic validation - can be extended
        const validActions = ['move', 'attack', 'defend', 'collect'];
        return validActions.includes(action) && data !== null;
    }
    
    private checkGameEndConditions(gameId: string): boolean {
        const game = this.games.get(gameId);
        if (!game) return false;
        
        // Check if game duration exceeded
        if (game.startTime && Date.now() - game.startTime > this.config.maxGameDuration) {
            return true;
        }
        
        // Check if only one player remains
        const activePlayers = game.players.filter(p => p.isActive);
        if (activePlayers.length <= 1) {
            return true;
        }
        
        return false;
    }
    
    private calculateMoveScore(data: any): number {
        return Math.floor(Math.random() * 20) + 10;
    }
    
    private calculateAttackScore(data: any): number {
        return Math.floor(Math.random() * 30) + 20;
    }
    
    private calculateDefendScore(data: any): number {
        return Math.floor(Math.random() * 15) + 5;
    }
    
    private calculateCollectScore(data: any): number {
        return Math.floor(Math.random() * 25) + 15;
    }
    
    private containsInappropriateContent(message: string): boolean {
        const inappropriateWords = ['spam', 'inappropriate', 'banned'];
        return inappropriateWords.some(word => 
            message.toLowerCase().includes(word)
        );
    }
    
    private async getPlayerStats(playerId: string): Promise<GamingTypes.PlayerStats> {
        // Get from database or return default
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            totalEarnings: 0,
            totalStaked: 0,
            winRate: 0,
            averageScore: 0,
            lastGameTime: 0
        };
    }
    
    private async saveGameResults(gameId: string): Promise<void> {
        // Save game results to database
        const game = this.games.get(gameId);
        if (game) {
            await this.database.saveGameResults(game);
        }
    }
    
    private async saveAllGameStates(): Promise<void> {
        // Save all active game states
        for (const [gameId, game] of this.games) {
            await this.database.saveGameState(game);
        }
    }
    
    private processGameTick(gameId: string): void {
        // Process game-specific logic for each tick
        const game = this.games.get(gameId);
        if (!game) return;
        
        // Add game-specific tick processing here
        // This could include AI updates, environment changes, etc.
    }

    // ============ PUBLIC METHODS ============
    
    /**
     * @method getMetrics
     * @description Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * @method getActiveGames
     * @description Get list of active games
     */
    getActiveGames(): GamingTypes.GameState[] {
        return Array.from(this.games.values()).filter(game => game.state === 'active');
    }
    
    /**
     * @method getActivePlayers
     * @description Get list of active players
     */
    getActivePlayers(): GamingTypes.PlayerState[] {
        return Array.from(this.players.values()).filter(player => player.isActive);
    }
    
    /**
     * @method isRunning
     * @description Check if engine is running
     */
    isEngineRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Setup WebSocket event handlers
     */
    private setupWebSocketHandlers(): void {
        this.wss.on('connection', (ws: WebSocket, req) => {
            this.handleConnection(ws, req);
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
            this.emit('error', error);
        });
    }

    /**
     * Handle new WebSocket connection
     */
    private handleConnection(ws: WebSocket, req: any): void {
        if (this.playerConnections.size >= this.MAX_CONNECTIONS) {
            ws.close(1013, 'Maximum connections reached');
            return;
        }

        const playerId = this.extractPlayerId(req);
        if (!playerId) {
            ws.close(1008, 'Invalid player ID');
            return;
        }

        // Store connection
        this.playerConnections.set(playerId, ws);
        this.metrics.totalConnections++;

        // Setup connection handlers
        ws.on('message', async (data: WebSocket.Data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleGameMessage(playerId, message);
            } catch (error) {
                console.error('Error handling game message:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            this.handlePlayerDisconnect(playerId);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for player ${playerId}:`, error);
            this.handlePlayerDisconnect(playerId);
        });

        // Send welcome message
        this.sendMessage(ws, {
            type: 'welcome',
            playerId: playerId,
            timestamp: Date.now(),
            serverInfo: {
                version: '1.0.0',
                maxPlayers: this.MAX_PLAYERS_PER_ROOM,
                heartbeatInterval: this.HEARTBEAT_INTERVAL
            }
        });

        console.log(`🎮 Player ${playerId} connected`);
    }

    /**
     * Handle game messages from players
     */
    private async handleGameMessage(playerId: string, message: any): Promise<void> {
        const startTime = Date.now();
        
        try {
            switch (message.type) {
                case 'joinGame':
                    await this.handleJoinGame(playerId, message.gameId, message.gameType);
                    break;
                    
                case 'gameAction':
                    await this.handleGameAction(playerId, message);
                    break;
                    
                case 'leaveGame':
                    await this.handleLeaveGame(playerId, message.gameId);
                    break;
                    
                case 'heartbeat':
                    this.handleHeartbeat(playerId);
                    break;
                    
                case 'getGameState':
                    await this.handleGetGameState(playerId, message.gameId);
                    break;
                    
                default:
                    this.sendError(this.playerConnections.get(playerId), 'Unknown message type');
            }
            
            // Update latency metrics
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);
            
        } catch (error) {
            console.error(`Error processing message from ${playerId}:`, error);
            this.sendError(this.playerConnections.get(playerId), 'Internal server error');
        }
    }

    /**
     * Handle player joining a game
     */
    private async handleJoinGame(playerId: string, gameId: string, gameType: string): Promise<void> {
        let room = this.gameRooms.get(gameId);
        
        if (!room) {
            // Create new game room
            room = {
                gameId: gameId,
                players: new Set(),
                gameState: {
                    gameId: gameId,
                    players: new Map(),
                    gameData: {},
                    lastUpdate: Date.now(),
                    status: 'waiting'
                },
                lastActivity: Date.now(),
                maxPlayers: this.MAX_PLAYERS_PER_ROOM,
                gameType: gameType
            };
            
            this.gameRooms.set(gameId, room);
            this.metrics.activeGames++;
        }
        
        // Check if room is full
        if (room.players.size >= room.maxPlayers) {
            this.sendError(this.playerConnections.get(playerId), 'Game room is full');
            return;
        }
        
        // Add player to room
        room.players.add(playerId);
        room.lastActivity = Date.now();
        
        // Initialize player state
        const playerState: GamingTypes.PlayerState = {
            address: playerId,
            position: { x: 0, y: 0 },
            health: 100,
            score: 0,
            lastAction: Date.now(),
            isConnected: true
        };
        
        room.gameState.players.set(playerId, playerState);
        
        // Notify all players in the room
        this.broadcastToRoom(gameId, {
            type: 'playerJoined',
            playerId: playerId,
            gameState: this.sanitizeGameState(room.gameState),
            timestamp: Date.now()
        });
        
        // Send confirmation to joining player
        this.sendMessage(this.playerConnections.get(playerId), {
            type: 'gameJoined',
            gameId: gameId,
            gameState: this.sanitizeGameState(room.gameState),
            timestamp: Date.now()
        });
        
        console.log(`🎮 Player ${playerId} joined game ${gameId}`);
    }

    /**
     * Handle game actions from players
     */
    private async handleGameAction(playerId: string, message: any): Promise<void> {
        const { gameId, actionType, data } = message;
        const room = this.gameRooms.get(gameId);
        
        if (!room || !room.players.has(playerId)) {
            this.sendError(this.playerConnections.get(playerId), 'Not in game');
            return;
        }
        
        // Validate action with NovaSanctum AI
        const aiValidation = await this.validateActionWithAI(playerId, gameId, actionType, data);
        
        if (!aiValidation.isValid) {
            this.sendError(this.playerConnections.get(playerId), `Action rejected: ${aiValidation.reason}`);
            return;
        }
        
        // Process game action
        const gameAction: GamingTypes.GameAction = {
            type: actionType,
            player: playerId,
            gameId: gameId,
            data: data,
            timestamp: Date.now()
        };
        
        // Update game state based on action
        await this.processGameAction(room, gameAction);
        
        // Broadcast updated state to all players
        this.broadcastToRoom(gameId, {
            type: 'gameStateUpdate',
            gameState: this.sanitizeGameState(room.gameState),
            lastAction: gameAction,
            timestamp: Date.now()
        });
        
        // Submit action to blockchain for rewards
        await this.submitActionToBlockchain(gameAction, aiValidation);
        
        this.metrics.totalActions++;
        console.log(`🎮 Action processed: ${actionType} by ${playerId} in ${gameId}`);
    }

    /**
     * Validate action with NovaSanctum AI
     */
    private async validateActionWithAI(
        playerId: string,
        gameId: string,
        actionType: string,
        data: any
    ): Promise<NovaSanctumResponse> {
        try {
            // Call NovaSanctum Oracle contract
            const isValid = await this.novaSanctumOracle.validatePlayerAction(
                playerId,
                gameId,
                actionType,
                0, // XP amount (calculated later)
                0, // Token amount (calculated later)
                ethers.utils.toUtf8Bytes(JSON.stringify(data))
            );
            
            // In a real implementation, you would get more detailed analysis
            return {
                isValid: isValid,
                fraudScore: isValid ? 10 : 80,
                trustScore: isValid ? 90 : 20,
                confidence: 85,
                reason: isValid ? 'Action validated' : 'Suspicious activity detected'
            };
        } catch (error) {
            console.error('AI validation error:', error);
            // Fallback to basic validation
            return {
                isValid: true,
                fraudScore: 5,
                trustScore: 95,
                confidence: 70,
                reason: 'AI validation failed, using fallback'
            };
        }
    }

    /**
     * Process game action and update state
     */
    private async processGameAction(room: GameRoom, action: GamingTypes.GameAction): Promise<void> {
        const playerState = room.gameState.players.get(action.player);
        if (!playerState) return;
        
        // Update player state based on action type
        switch (action.type) {
            case 'move':
                playerState.position = action.data.position;
                break;
                
            case 'attack':
                const target = room.gameState.players.get(action.data.target);
                if (target) {
                    target.health -= action.data.damage;
                    if (target.health <= 0) {
                        playerState.score += 100;
                    }
                }
                break;
                
            case 'collect':
                playerState.score += action.data.value;
                break;
                
            case 'heal':
                playerState.health = Math.min(100, playerState.health + action.data.amount);
                break;
        }
        
        playerState.lastAction = Date.now();
        room.gameState.lastUpdate = Date.now();
        room.lastActivity = Date.now();
    }

    /**
     * Submit action to blockchain for rewards
     */
    private async submitActionToBlockchain(
        action: GamingTypes.GameAction,
        aiValidation: NovaSanctumResponse
    ): Promise<void> {
        try {
            // Calculate rewards based on action and AI validation
            const xpReward = this.calculateXPReward(action, aiValidation);
            const tokenReward = this.calculateTokenReward(action, aiValidation);
            
            // Submit to GameDin Token contract
            // Note: In production, this would be done by a relayer or the game contract
            console.log(`💰 Rewards calculated: ${xpReward} XP, ${tokenReward} tokens for ${action.player}`);
            
        } catch (error) {
            console.error('Error submitting to blockchain:', error);
        }
    }

    /**
     * Calculate XP reward for an action
     */
    private calculateXPReward(action: GamingTypes.GameAction, aiValidation: NovaSanctumResponse): number {
        let baseXP = 10;
        
        switch (action.type) {
            case 'attack':
                baseXP = 20;
                break;
            case 'collect':
                baseXP = 15;
                break;
            case 'heal':
                baseXP = 5;
                break;
        }
        
        // Adjust based on AI trust score
        const trustMultiplier = aiValidation.trustScore / 100;
        return Math.floor(baseXP * trustMultiplier);
    }

    /**
     * Calculate token reward for an action
     */
    private calculateTokenReward(action: GamingTypes.GameAction, aiValidation: NovaSanctumResponse): number {
        let baseTokens = 1;
        
        switch (action.type) {
            case 'attack':
                baseTokens = 2;
                break;
            case 'collect':
                baseTokens = 3;
                break;
            case 'heal':
                baseTokens = 1;
                break;
        }
        
        // Adjust based on AI fraud score (lower fraud = higher reward)
        const fraudMultiplier = (100 - aiValidation.fraudScore) / 100;
        return Math.floor(baseTokens * fraudMultiplier);
    }

    /**
     * Handle player leaving a game
     */
    private async handleLeaveGame(playerId: string, gameId: string): Promise<void> {
        const room = this.gameRooms.get(gameId);
        if (!room) return;
        
        room.players.delete(playerId);
        room.gameState.players.delete(playerId);
        room.lastActivity = Date.now();
        
        // Notify other players
        this.broadcastToRoom(gameId, {
            type: 'playerLeft',
            playerId: playerId,
            gameState: this.sanitizeGameState(room.gameState),
            timestamp: Date.now()
        });
        
        // Clean up empty rooms
        if (room.players.size === 0) {
            this.gameRooms.delete(gameId);
            this.metrics.activeGames--;
        }
        
        console.log(`🎮 Player ${playerId} left game ${gameId}`);
    }

    /**
     * Handle player disconnection
     */
    private handlePlayerDisconnect(playerId: string): void {
        this.playerConnections.delete(playerId);
        
        // Remove player from all games
        for (const [gameId, room] of this.gameRooms) {
            if (room.players.has(playerId)) {
                const playerState = room.gameState.players.get(playerId);
                if (playerState) {
                    playerState.isConnected = false;
                }
            }
        }
        
        console.log(`🎮 Player ${playerId} disconnected`);
    }

    /**
     * Handle heartbeat from players
     */
    private handleHeartbeat(playerId: string): void {
        const ws = this.playerConnections.get(playerId);
        if (ws) {
            this.sendMessage(ws, {
                type: 'heartbeat',
                timestamp: Date.now()
            });
        }
    }

    /**
     * Handle get game state request
     */
    private async handleGetGameState(playerId: string, gameId: string): Promise<void> {
        const room = this.gameRooms.get(gameId);
        if (!room) {
            this.sendError(this.playerConnections.get(playerId), 'Game not found');
            return;
        }
        
        this.sendMessage(this.playerConnections.get(playerId), {
            type: 'gameState',
            gameId: gameId,
            gameState: this.sanitizeGameState(room.gameState),
            timestamp: Date.now()
        });
    }

    /**
     * Broadcast message to all players in a room
     */
    private broadcastToRoom(gameId: string, message: any): void {
        const room = this.gameRooms.get(gameId);
        if (!room) return;
        
        const messageStr = JSON.stringify(message);
        
        for (const playerId of room.players) {
            const ws = this.playerConnections.get(playerId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        }
    }

    /**
     * Send message to a specific WebSocket
     */
    private sendMessage(ws: WebSocket, message: any): void {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Send error message to a WebSocket
     */
    private sendError(ws: WebSocket, error: string): void {
        this.sendMessage(ws, {
            type: 'error',
            error: error,
            timestamp: Date.now()
        });
    }

    /**
     * Sanitize game state for transmission
     */
    private sanitizeGameState(gameState: GamingTypes.GameState): any {
        const sanitized: any = {
            gameId: gameState.gameId,
            status: gameState.status,
            lastUpdate: gameState.lastUpdate,
            players: {}
        };
        
        for (const [playerId, playerState] of gameState.players) {
            sanitized.players[playerId] = {
                position: playerState.position,
                health: playerState.health,
                score: playerState.score,
                isConnected: playerState.isConnected
            };
        }
        
        return sanitized;
    }

    /**
     * Extract player ID from request
     */
    private extractPlayerId(req: any): string | null {
        // In production, this would validate JWT tokens or other auth
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('playerId');
    }

    /**
     * Start heartbeat mechanism
     */
    private startHeartbeat(): void {
        setInterval(() => {
            const heartbeat = {
                type: 'heartbeat',
                timestamp: Date.now(),
                metrics: this.metrics
            };
            
            // Broadcast heartbeat to all connected players
            for (const [playerId, ws] of this.playerConnections) {
                this.sendMessage(ws, heartbeat);
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    /**
     * Start metrics collection
     */
    private startMetricsCollection(): void {
        setInterval(() => {
            // Calculate current TPS
            const currentTPS = this.metrics.totalActions / 60; // Actions per minute
            this.metrics.peakTPS = Math.max(this.metrics.peakTPS, currentTPS);
            
            // Reset action counter
            this.metrics.totalActions = 0;
            
            // Emit metrics
            this.emit('metrics', this.metrics);
            
            console.log(`📊 Gaming Metrics: ${this.metrics.activeGames} active games, ${this.playerConnections.size} connected players, ${this.metrics.averageLatency}ms avg latency`);
        }, 60000); // Every minute
    }

    /**
     * Update latency metrics
     */
    private updateLatencyMetrics(latency: number): void {
        this.metrics.averageLatency = 
            (this.metrics.averageLatency + latency) / 2;
    }

    /**
     * Get current metrics
     */
    public getMetrics(): any {
        return { ...this.metrics };
    }

    /**
     * Get active games count
     */
    public getActiveGamesCount(): number {
        return this.gameRooms.size;
    }

    /**
     * Get connected players count
     */
    public getConnectedPlayersCount(): number {
        return this.playerConnections.size;
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        console.log('🔄 Shutting down GameDin Real-Time Gaming Engine...');
        
        // Close all WebSocket connections
        for (const [playerId, ws] of this.playerConnections) {
            ws.close(1000, 'Server shutdown');
        }
        
        // Close WebSocket server
        this.wss.close();
        
        // Close Redis connection
        this.redis.quit();
        
        console.log('✅ GameDin Real-Time Gaming Engine shutdown complete');
    }
} 

// Helper function for dynamic import of JSON ABIs
async function loadABI(path: string): Promise<any> {
    return (await import(path, { assert: { type: "json" } })).default;
} 