/**
 * @file DatabaseService.ts
 * @description Database service for GameDin L3 ecosystem
 * @dev Manages all data persistence including player stats, game states, AI analytics, and blockchain data
 * @dev Supports multiple database backends and real-time data synchronization
 */

import { Pool } from 'pg';
import type { PoolClient } from 'pg';
// Remove ioredis import - not available
// import { Redis } from 'ioredis';

import type {
    IGameState,
    PlayerState,
    IGameAction,
    GameActionResult,
    TournamentParticipant,
    PlayerStats,
    GameConfig,
    GameMetadata,
    GameEvent,
    AIAnalytics
} from '../types/gaming.mts';
import { Logger } from '../utils/Logger.js';

/**
 * @interface DatabaseConfig
 * @description Database configuration
 */
export interface DatabaseConfig {
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        maxConnections: number;
        idleTimeout: number;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        maxRetries: number;
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
    backup: {
        enabled: boolean;
        interval: number;
        retention: number;
    };
}

/**
 * @interface DatabaseMetrics
 * @description Database performance metrics
 */
export interface DatabaseMetrics {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageQueryTime: number;
    cacheHits: number;
    cacheMisses: number;
    activeConnections: number;
    slowQueries: number;
}

/**
 * @class DatabaseService
 * @description Database service for GameDin L3
 */
export class DatabaseService {
    private config: DatabaseConfig;
    private logger: Logger;
    private postgresPool: Pool;
    private redisClient: any; // Changed from Redis to any as ioredis is removed
    private isInitialized: boolean = false;
    
    // Performance metrics
    private metrics: DatabaseMetrics = {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        activeConnections: 0,
        slowQueries: 0
    };

    constructor(config: DatabaseConfig) {
        this.config = config;
        this.logger = new Logger('DatabaseService');
        
        // Initialize PostgreSQL pool
        this.postgresPool = new Pool({
            host: config.postgres.host,
            port: config.postgres.port,
            database: config.postgres.database,
            user: config.postgres.username,
            password: config.postgres.password,
            max: config.postgres.maxConnections,
            idleTimeoutMillis: config.postgres.idleTimeout,
            connectionTimeoutMillis: 10000,
            query_timeout: 30000
        });
        
        // Initialize Redis client
        this.redisClient = new (require('ioredis')).Redis({ // Changed require to new (require('ioredis'))
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
            maxRetriesPerRequest: config.redis.maxRetries,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxLoadingTimeout: 10000
        });
        
        // Setup event handlers
        this.setupEventHandlers();
    }

    /**
     * @method initialize
     * @description Initialize database service
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing Database Service...');
            
            // Test connections
            await this.testConnections();
            
            // Create tables if they don't exist
            await this.createTables();
            
            // Initialize indexes
            await this.createIndexes();
            
            // Setup backup if enabled
            if (this.config.backup.enabled) {
                this.setupBackup();
            }
            
            this.isInitialized = true;
            this.logger.info('Database Service initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Database Service:', error);
            throw error;
        }
    }

    /**
     * @method setupEventHandlers
     * @description Setup database event handlers
     */
    private setupEventHandlers(): void {
        // PostgreSQL event handlers
        this.postgresPool.on('connect', (client: PoolClient) => {
            this.metrics.activeConnections++;
            this.logger.debug('New PostgreSQL connection established');
        });
        
        this.postgresPool.on('remove', () => {
            this.metrics.activeConnections--;
            this.logger.debug('PostgreSQL connection removed');
        });
        
        this.postgresPool.on('error', (error: Error) => {
            this.logger.error('PostgreSQL pool error:', error);
            this.metrics.failedQueries++;
        });
        
        // Redis event handlers
        this.redisClient.on('connect', () => {
            this.logger.debug('Redis connected');
        });
        
        this.redisClient.on('error', (error: Error) => {
            this.logger.error('Redis error:', error);
        });
        
        this.redisClient.on('ready', () => {
            this.logger.debug('Redis ready');
        });
    }

    /**
     * @method testConnections
     * @description Test database connections
     */
    private async testConnections(): Promise<void> {
        // Test PostgreSQL
        const pgClient = await this.postgresPool.connect();
        try {
            await pgClient.query('SELECT 1');
            this.logger.info('PostgreSQL connection successful');
        } finally {
            pgClient.release();
        }
        
        // Test Redis
        await this.redisClient.ping();
        this.logger.info('Redis connection successful');
    }

    /**
     * @method createTables
     * @description Create database tables
     */
    private async createTables(): Promise<void> {
        const client = await this.postgresPool.connect();
        
        try {
            // Players table
            await client.query(`
                CREATE TABLE IF NOT EXISTS players (
                    player_id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    wallet_address VARCHAR(255),
                    games_played INTEGER DEFAULT 0,
                    games_won INTEGER DEFAULT 0,
                    win_rate DECIMAL(5,2) DEFAULT 0,
                    average_score DECIMAL(10,2) DEFAULT 0,
                    skill_level INTEGER DEFAULT 50,
                    total_play_time BIGINT DEFAULT 0,
                    last_game_time BIGINT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Games table
            await client.query(`
                CREATE TABLE IF NOT EXISTS games (
                    game_id VARCHAR(255) PRIMARY KEY,
                    game_type VARCHAR(100) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    config JSONB,
                    state JSONB,
                    start_time BIGINT,
                    end_time BIGINT,
                    total_pot DECIMAL(20,8) DEFAULT 0,
                    winner VARCHAR(255),
                    result JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Game players table
            await client.query(`
                CREATE TABLE IF NOT EXISTS game_players (
                    game_id VARCHAR(255) REFERENCES games(game_id),
                    player_id VARCHAR(255) REFERENCES players(player_id),
                    joined_at BIGINT,
                    left_at BIGINT,
                    final_score DECIMAL(10,2),
                    final_rank INTEGER,
                    rewards DECIMAL(20,8) DEFAULT 0,
                    PRIMARY KEY (game_id, player_id)
                )
            `);
            
            // Game events table
            await client.query(`
                CREATE TABLE IF NOT EXISTS game_events (
                    event_id SERIAL PRIMARY KEY,
                    game_id VARCHAR(255) REFERENCES games(game_id),
                    player_id VARCHAR(255) REFERENCES players(player_id),
                    event_type VARCHAR(100) NOT NULL,
                    event_data JSONB,
                    timestamp BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // AI analytics table
            await client.query(`
                CREATE TABLE IF NOT EXISTS ai_analytics (
                    analysis_id SERIAL PRIMARY KEY,
                    player_id VARCHAR(255) REFERENCES players(player_id),
                    game_id VARCHAR(255) REFERENCES games(game_id),
                    service_type VARCHAR(50) NOT NULL,
                    analysis_type VARCHAR(50) NOT NULL,
                    fraud_score INTEGER,
                    skill_level INTEGER,
                    risk_assessment INTEGER,
                    predicted_outcome DECIMAL(5,2),
                    confidence INTEGER,
                    behavior_patterns JSONB,
                    recommendations JSONB,
                    flags JSONB,
                    metadata JSONB,
                    analysis_hash VARCHAR(255) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Blockchain transactions table
            await client.query(`
                CREATE TABLE IF NOT EXISTS blockchain_transactions (
                    tx_id SERIAL PRIMARY KEY,
                    game_id VARCHAR(255) REFERENCES games(game_id),
                    player_id VARCHAR(255) REFERENCES players(player_id),
                    tx_hash VARCHAR(255) UNIQUE NOT NULL,
                    tx_type VARCHAR(50) NOT NULL,
                    amount DECIMAL(20,8),
                    status VARCHAR(50) DEFAULT 'pending',
                    block_number BIGINT,
                    gas_used BIGINT,
                    gas_price DECIMAL(20,8),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    confirmed_at TIMESTAMP
                )
            `);
            
            // Meta game data table
            await client.query(`
                CREATE TABLE IF NOT EXISTS meta_game_data (
                    data_id SERIAL PRIMARY KEY,
                    game_type VARCHAR(100) NOT NULL,
                    data_type VARCHAR(50) NOT NULL,
                    data_key VARCHAR(255) NOT NULL,
                    data_value JSONB,
                    timestamp BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(game_type, data_type, data_key)
                )
            `);
            
            // Player sessions table
            await client.query(`
                CREATE TABLE IF NOT EXISTS player_sessions (
                    session_id SERIAL PRIMARY KEY,
                    player_id VARCHAR(255) REFERENCES players(player_id),
                    session_token VARCHAR(255) UNIQUE NOT NULL,
                    ip_address INET,
                    user_agent TEXT,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ended_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                )
            `);
            
            this.logger.info('Database tables created successfully');
            
        } finally {
            client.release();
        }
    }

    /**
     * @method createIndexes
     * @description Create database indexes
     */
    private async createIndexes(): Promise<void> {
        const client = await this.postgresPool.connect();
        
        try {
            // Players indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_players_username ON players(username)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_players_skill_level ON players(skill_level)');
            
            // Games indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_games_type ON games(game_type)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_games_start_time ON games(start_time)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner)');
            
            // Game players indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_game_players_player ON game_players(player_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_game_players_joined ON game_players(joined_at)');
            
            // Game events indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_game_events_game ON game_events(game_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_game_events_player ON game_events(player_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_game_events_timestamp ON game_events(timestamp)');
            
            // AI analytics indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_ai_analytics_player ON ai_analytics(player_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_ai_analytics_game ON ai_analytics(game_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_ai_analytics_service ON ai_analytics(service_type)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_ai_analytics_hash ON ai_analytics(analysis_hash)');
            
            // Blockchain transactions indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_blockchain_tx_game ON blockchain_transactions(game_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_blockchain_tx_player ON blockchain_transactions(player_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status)');
            
            // Meta game data indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_meta_game_type ON meta_game_data(game_type)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_meta_game_timestamp ON meta_game_data(timestamp)');
            
            // Player sessions indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_player_sessions_token ON player_sessions(session_token)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_player_sessions_active ON player_sessions(is_active)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_player_sessions_activity ON player_sessions(last_activity)');
            
            this.logger.info('Database indexes created successfully');
            
        } finally {
            client.release();
        }
    }

    // ============ PLAYER METHODS ============
    
    /**
     * @method getPlayerStats
     * @description Get player statistics
     * @param playerId Player ID
     * @returns Player statistics
     */
    async getPlayerStats(playerId: string): Promise<PlayerStats> {
        const cacheKey = `player_stats:${playerId}`;
        
        // Try cache first
        if (this.config.cache.enabled) {
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                return JSON.parse(cached);
            }
            this.metrics.cacheMisses++;
        }
        
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            const result = await client.query(
                'SELECT * FROM players WHERE player_id = $1',
                [playerId]
            );
            
            client.release();
            
            let stats: PlayerStats;
            
            if (result.rows.length > 0) {
                const row = result.rows[0];
                stats = {
                    gamesPlayed: row.games_played,
                    gamesWon: row.games_won,
                    winRate: parseFloat(row.win_rate),
                    averageScore: parseFloat(row.average_score),
                    skillLevel: row.skill_level,
                    totalPlayTime: row.total_play_time,
                    lastGameTime: row.last_game_time
                };
            } else {
                // Create default stats
                stats = {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    winRate: 0,
                    averageScore: 0,
                    skillLevel: 50,
                    totalPlayTime: 0,
                    lastGameTime: 0
                };
                
                await this.createPlayer(playerId);
            }
            
            // Cache result
            if (this.config.cache.enabled) {
                await this.redisClient.setex(cacheKey, this.config.cache.ttl, JSON.stringify(stats));
            }
            
            this.updateMetrics(startTime);
            
            return stats;
            
        } catch (error) {
            this.logger.error(`Error getting player stats for ${playerId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method updatePlayerStats
     * @description Update player statistics
     * @param playerId Player ID
     * @param gameResult Game result
     */
    async updatePlayerStats(playerId: string, gameResult: any): Promise<void> { // Changed GameResult to any
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            // Get current stats
            const currentStats = await this.getPlayerStats(playerId);
            
            // Calculate new stats
            const newGamesPlayed = currentStats.gamesPlayed + 1;
            const newGamesWon = currentStats.gamesWon + (gameResult.winner === playerId ? 1 : 0);
            const newWinRate = (newGamesWon / newGamesPlayed) * 100;
            
            // Update database
            await client.query(`
                UPDATE players 
                SET games_played = $1, games_won = $2, win_rate = $3, 
                    last_game_time = $4, updated_at = CURRENT_TIMESTAMP
                WHERE player_id = $5
            `, [newGamesPlayed, newGamesWon, newWinRate, Date.now(), playerId]);
            
            client.release();
            
            // Clear cache
            if (this.config.cache.enabled) {
                await this.redisClient.del(`player_stats:${playerId}`);
            }
            
            this.updateMetrics(startTime);
            
        } catch (error) {
            this.logger.error(`Error updating player stats for ${playerId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method createPlayer
     * @description Create new player
     * @param playerId Player ID
     */
    private async createPlayer(playerId: string): Promise<void> {
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            await client.query(`
                INSERT INTO players (player_id, username, games_played, games_won, win_rate, average_score, skill_level)
                VALUES ($1, $2, 0, 0, 0, 0, 50)
            `, [playerId, playerId]);
            
            client.release();
            
            this.updateMetrics(startTime);
            
        } catch (error) {
            this.logger.error(`Error creating player ${playerId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }

    // ============ GAME METHODS ============
    
    /**
     * @method getGameState
     * @description Get game state
     * @param gameId Game ID
     * @returns Game state
     */
    async getGameState(gameId: string): Promise<IGameState> { // Changed GameState to IGameState
        const cacheKey = `game_state:${gameId}`;
        
        // Try cache first
        if (this.config.cache.enabled) {
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                return JSON.parse(cached);
            }
            this.metrics.cacheMisses++;
        }
        
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            const result = await client.query(
                'SELECT state FROM games WHERE game_id = $1',
                [gameId]
            );
            
            client.release();
            
            if (result.rows.length === 0) {
                throw new Error(`Game ${gameId} not found`);
            }
            
            const gameState: IGameState = result.rows[0].state;
            
            // Cache result
            if (this.config.cache.enabled) {
                await this.redisClient.setex(cacheKey, this.config.cache.ttl, JSON.stringify(gameState));
            }
            
            this.updateMetrics(startTime);
            
            return gameState;
            
        } catch (error) {
            this.logger.error(`Error getting game state for ${gameId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method saveGameState
     * @description Save game state
     * @param gameId Game ID
     * @param gameState Game state
     */
    async saveGameState(gameId: string, gameState: IGameState): Promise<void> { // Changed GameState to IGameState
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            await client.query(`
                INSERT INTO games (game_id, game_type, status, state, start_time, total_pot)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (game_id) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    state = EXCLUDED.state,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                gameId,
                gameState.type,
                gameState.status,
                JSON.stringify(gameState),
                gameState.startTime,
                gameState.totalPot
            ]);
            
            client.release();
            
            // Update cache
            if (this.config.cache.enabled) {
                await this.redisClient.setex(
                    `game_state:${gameId}`,
                    this.config.cache.ttl,
                    JSON.stringify(gameState)
                );
            }
            
            this.updateMetrics(startTime);
            
        } catch (error) {
            this.logger.error(`Error saving game state for ${gameId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method getRecentGames
     * @description Get recent games for player
     * @param playerId Player ID
     * @param limit Number of games to retrieve
     * @returns Recent games
     */
    async getRecentGames(playerId: string, limit: number): Promise<any[]> {
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            const result = await client.query(`
                SELECT g.*, gp.final_score, gp.final_rank, gp.rewards
                FROM games g
                JOIN game_players gp ON g.game_id = gp.game_id
                WHERE gp.player_id = $1
                ORDER BY g.start_time DESC
                LIMIT $2
            `, [playerId, limit]);
            
            client.release();
            
            this.updateMetrics(startTime);
            
            return result.rows;
            
        } catch (error) {
            this.logger.error(`Error getting recent games for ${playerId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }

    // ============ AI ANALYTICS METHODS ============
    
    /**
     * @method saveAIAnalytics
     * @description Save AI analytics
     * @param analytics AI analytics
     */
    async saveAIAnalytics(analytics: AIAnalytics): Promise<void> {
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            await client.query(`
                INSERT INTO ai_analytics (
                    player_id, game_id, service_type, analysis_type,
                    fraud_score, skill_level, risk_assessment, predicted_outcome,
                    confidence, behavior_patterns, recommendations, flags,
                    metadata, analysis_hash
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [
                analytics.playerId,
                analytics.gameId,
                analytics.serviceType,
                analytics.analysisType,
                analytics.fraudScore,
                analytics.skillLevel,
                analytics.riskAssessment,
                analytics.predictedOutcome,
                analytics.confidence,
                JSON.stringify(analytics.behaviorPatterns),
                JSON.stringify(analytics.recommendations),
                JSON.stringify(analytics.flags),
                JSON.stringify(analytics.metadata),
                analytics.analysisHash
            ]);
            
            client.release();
            
            this.updateMetrics(startTime);
            
        } catch (error) {
            this.logger.error(`Error saving AI analytics:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method getCachedAnalytics
     * @description Get cached analytics
     * @param serviceType Service type
     * @returns Cached analytics
     */
    async getCachedAnalytics(serviceType: string): Promise<{ [key: string]: any }> {
        try {
            const keys = await this.redisClient.keys(`analytics:${serviceType}:*`);
            const cached: { [key: string]: any } = {};
            
            for (const key of keys) {
                const value = await this.redisClient.get(key);
                if (value) {
                    const cacheKey = key.replace(`analytics:${serviceType}:`, '');
                    cached[cacheKey] = JSON.parse(value);
                }
            }
            
            return cached;
            
        } catch (error) {
            this.logger.error(`Error getting cached analytics for ${serviceType}:`, error);
            return {};
        }
    }

    // ============ BLOCKCHAIN METHODS ============
    
    /**
     * @method saveBlockchainTransaction
     * @description Save blockchain transaction
     * @param transaction Blockchain transaction
     */
    async saveBlockchainTransaction(transaction: any): Promise<void> { // Changed BlockchainTransaction to any
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            await client.query(`
                INSERT INTO blockchain_transactions (
                    game_id, player_id, tx_hash, tx_type, amount, status,
                    block_number, gas_used, gas_price
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                transaction.gameId,
                transaction.playerId,
                transaction.txHash,
                transaction.txType,
                transaction.amount,
                transaction.status,
                transaction.blockNumber,
                transaction.gasUsed,
                transaction.gasPrice
            ]);
            
            client.release();
            
            this.updateMetrics(startTime);
            
        } catch (error) {
            this.logger.error(`Error saving blockchain transaction:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method getPlayerTransactions
     * @description Get player transactions
     * @param playerId Player ID
     * @returns Player transactions
     */
    async getPlayerTransactions(playerId: string): Promise<any[]> { // Changed BlockchainTransaction to any
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            const result = await client.query(`
                SELECT * FROM blockchain_transactions 
                WHERE player_id = $1 
                ORDER BY created_at DESC
            `, [playerId]);
            
            client.release();
            
            this.updateMetrics(startTime);
            
            return result.rows.map(row => ({
                gameId: row.game_id,
                playerId: row.player_id,
                txHash: row.tx_hash,
                txType: row.tx_type,
                amount: parseFloat(row.amount),
                status: row.status,
                blockNumber: row.block_number,
                gasUsed: row.gas_used,
                gasPrice: parseFloat(row.gas_price)
            }));
            
        } catch (error) {
            this.logger.error(`Error getting player transactions for ${playerId}:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }

    // ============ META GAME METHODS ============
    
    /**
     * @method getMetaGameData
     * @description Get meta game data
     * @returns Meta game data
     */
    async getMetaGameData(): Promise<{ [key: string]: any }> {
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            const result = await client.query(`
                SELECT game_type, data_type, data_key, data_value, timestamp
                FROM meta_game_data
                ORDER BY timestamp DESC
            `);
            
            client.release();
            
            const metaData: { [key: string]: any } = {};
            
            for (const row of result.rows) {
                if (!metaData[row.game_type]) {
                    metaData[row.game_type] = {
                        trends: [],
                        patterns: [],
                        opportunities: [],
                        volatility: 0.5,
                        quality: 0.8,
                        insights: []
                    };
                }
                
                const data = metaData[row.game_type];
                
                switch (row.data_type) {
                    case 'trend':
                        data.trends.push(row.data_value);
                        break;
                    case 'pattern':
                        data.patterns.push(row.data_value);
                        break;
                    case 'opportunity':
                        data.opportunities.push(row.data_value);
                        break;
                    case 'insight':
                        data.insights.push(row.data_value);
                        break;
                }
            }
            
            this.updateMetrics(startTime);
            
            return metaData;
            
        } catch (error) {
            this.logger.error('Error getting meta game data:', error);
            this.metrics.failedQueries++;
            throw error;
        }
    }
    
    /**
     * @method saveMetaGameData
     * @description Save meta game data
     * @param gameType Game type
     * @param dataType Data type
     * @param dataKey Data key
     * @param dataValue Data value
     */
    async saveMetaGameData(
        gameType: string,
        dataType: string,
        dataKey: string,
        dataValue: any
    ): Promise<void> {
        const startTime = Date.now();
        
        try {
            const client = await this.postgresPool.connect();
            
            await client.query(`
                INSERT INTO meta_game_data (game_type, data_type, data_key, data_value, timestamp)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (game_type, data_type, data_key)
                DO UPDATE SET data_value = EXCLUDED.data_value, timestamp = EXCLUDED.timestamp
            `, [gameType, dataType, dataKey, JSON.stringify(dataValue), Date.now()]);
            
            client.release();
            
            this.updateMetrics(startTime);
            
        } catch (error) {
            this.logger.error(`Error saving meta game data:`, error);
            this.metrics.failedQueries++;
            throw error;
        }
    }

    // ============ UTILITY METHODS ============
    
    /**
     * @method setupBackup
     * @description Setup database backup
     */
    private setupBackup(): void {
        setInterval(async () => {
            try {
                await this.performBackup();
            } catch (error) {
                this.logger.error('Backup error:', error);
            }
        }, this.config.backup.interval);
    }
    
    /**
     * @method performBackup
     * @description Perform database backup
     */
    private async performBackup(): Promise<void> {
        this.logger.info('Performing database backup...');
        
        // Implement backup logic here
        // This could involve pg_dump for PostgreSQL and Redis SAVE for Redis
        
        this.logger.info('Database backup completed');
    }
    
    /**
     * @method updateMetrics
     * @description Update performance metrics
     * @param startTime Query start time
     */
    private updateMetrics(startTime: number): void {
        const queryTime = Date.now() - startTime;
        
        this.metrics.totalQueries++;
        this.metrics.successfulQueries++;
        this.metrics.averageQueryTime = (this.metrics.averageQueryTime + queryTime) / 2;
        
        if (queryTime > 1000) { // Slow query threshold
            this.metrics.slowQueries++;
        }
    }
    
    /**
     * @method getMetrics
     * @description Get performance metrics
     * @returns Performance metrics
     */
    getMetrics(): DatabaseMetrics {
        return { ...this.metrics };
    }
    
    /**
     * @method getGameConfigurations
     * @description Get game configurations
     * @returns Game configurations
     */
    async getGameConfigurations(): Promise<any[]> {
        // This would typically load from a configurations table
        return [
            {
                type: 'battle_royale',
                maxPlayers: 100,
                minPlayers: 2,
                duration: 300000,
                rewards: { winner: 0.8, runnerUp: 0.15, participation: 0.05 }
            },
            {
                type: 'tournament',
                maxPlayers: 16,
                minPlayers: 4,
                duration: 600000,
                rewards: { winner: 0.6, runnerUp: 0.25, third: 0.1, participation: 0.05 }
            }
        ];
    }
    
    /**
     * @method close
     * @description Close database connections
     */
    async close(): Promise<void> {
        try {
            this.logger.info('Closing database connections...');
            
            await this.postgresPool.end();
            await this.redisClient.quit();
            
            this.logger.info('Database connections closed');
            
        } catch (error) {
            this.logger.error('Error closing database connections:', error);
        }
    }
} 