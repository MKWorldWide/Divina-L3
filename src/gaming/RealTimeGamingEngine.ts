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
import { 
    GameState, 
    PlayerState, 
    GameAction, 
    AIAnalysis, 
    GameEvent,
    GameConfig,
    PlayerStats,
    TournamentConfig
} from '../types/gaming';
import { NovaSanctumAI } from '../ai/NovaSanctumAI';
import { AthenaMistAI } from '../ai/AthenaMistAI';
import { UnifiedAIService } from '../ai/UnifiedAIService';
import { DatabaseService } from '../database/DatabaseService';
import { BlockchainService } from '../blockchain/BlockchainService';
import { Logger } from '../utils/Logger';

/**
 * @class RealTimeGamingEngine
 * @description High-performance real-time gaming engine with AI integration
 */
export class RealTimeGamingEngine extends EventEmitter {
    private wss: WebSocket.Server;
    private games: Map<string, GameState> = new Map();
    private players: Map<string, PlayerState> = new Map();
    private connections: Map<string, WebSocket> = new Map();
    private gameQueue: string[] = [];
    private activeTournaments: Map<string, TournamentConfig> = new Map();
    
    // AI Services
    private novaSanctumAI: NovaSanctumAI;
    private athenaMistAI: AthenaMistAI;
    private unifiedAI: UnifiedAIService;
    
    // Services
    private database: DatabaseService;
    private blockchain: BlockchainService;
    private logger: Logger;
    
    // Configuration
    private config: GameConfig;
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
        fraudDetections: 0
    };

    constructor(config: GameConfig) {
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
            perMessageDeflate: false // Disable compression for better performance
        });
        
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
            const playerState: PlayerState = {
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
    private async createGame(gameId: string, gameType: string, stake: number): Promise<GameState> {
        const game: GameState = {
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
    ): Promise<AIAnalysis> {
        try {
            let analysis: AIAnalysis;
            
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
    
    private async getPlayerStats(playerId: string): Promise<PlayerStats> {
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
    getActiveGames(): GameState[] {
        return Array.from(this.games.values()).filter(game => game.state === 'active');
    }
    
    /**
     * @method getActivePlayers
     * @description Get list of active players
     */
    getActivePlayers(): PlayerState[] {
        return Array.from(this.players.values()).filter(player => player.isActive);
    }
    
    /**
     * @method isRunning
     * @description Check if engine is running
     */
    isEngineRunning(): boolean {
        return this.isRunning;
    }
} 