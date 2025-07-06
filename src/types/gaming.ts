/**
 * @file gaming.ts
 * @description TypeScript types and interfaces for GameDin L3 gaming system
 * @dev Comprehensive type definitions for gaming, AI, and blockchain integration
 */

// ============ GAME TYPES ============

export type GameType = 'battle_royale' | 'tournament' | 'challenge' | 'custom' | 'pvp' | 'cooperative';
export type GameState = 'waiting' | 'active' | 'finished' | 'cancelled' | 'paused';
export type GameAction = 'move' | 'attack' | 'defend' | 'collect' | 'use_item' | 'special_ability';

// ============ PLAYER TYPES ============

export type PlayerStatus = 'online' | 'offline' | 'in_game' | 'spectating' | 'banned';
export type PlayerRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

// ============ AI TYPES ============

export type AIServiceType = 'novaSanctum' | 'athenaMist' | 'unified';
export type AnalysisType = 'fraud_detection' | 'skill_assessment' | 'risk_analysis' | 'behavior_analysis' | 'comprehensive';

// ============ BLOCKCHAIN TYPES ============

export type NetworkType = 'mainnet' | 'testnet' | 'devnet';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

// ============ CORE INTERFACES ============

/**
 * @interface GameState
 * @description Complete game state information
 */
export interface GameState {
    id: string;
    type: GameType;
    state: GameState;
    players: PlayerState[];
    maxPlayers: number;
    minStake: number;
    maxStake: number;
    totalPot: number;
    startTime: number | null;
    endTime: number | null;
    winner: PlayerState | null;
    events: GameEvent[];
    aiAnalytics: AIAnalytics[];
    config: GameConfig;
    metadata: GameMetadata;
}

/**
 * @interface PlayerState
 * @description Player state during a game
 */
export interface PlayerState {
    id: string;
    currentGameId: string | null;
    stake: number;
    score: number;
    rank: number;
    joinTime: number;
    lastActionTime: number;
    isActive: boolean;
    stats: PlayerStats;
    aiAnalytics: AIAnalytics | null;
    inventory: GameItem[];
    abilities: PlayerAbility[];
    position: GamePosition;
    health: number;
    energy: number;
    status: PlayerStatus;
}

/**
 * @interface PlayerStats
 * @description Player statistics and history
 */
export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalEarnings: number;
    totalStaked: number;
    winRate: number;
    averageScore: number;
    lastGameTime: number;
    rank: PlayerRank;
    experience: number;
    level: number;
    achievements: Achievement[];
    badges: Badge[];
    reputation: number;
    totalPlayTime: number;
    favoriteGameType: GameType;
    bestScore: number;
    longestWinStreak: number;
    currentWinStreak: number;
}

/**
 * @interface AIAnalytics
 * @description AI analysis results
 */
export interface AIAnalytics {
    playerId: string;
    gameId: string;
    timestamp: number;
    fraudScore: number; // 0-100
    skillLevel: number; // 0-100
    riskAssessment: number; // 0-100
    predictedOutcome: number; // 0-100
    confidence: number; // 0-100
    behaviorPatterns: number[];
    analysisHash: string;
    serviceType: AIServiceType;
    analysisType: AnalysisType;
    recommendations: AIRecommendation[];
    flags: AIFlag[];
    metadata: AIAnalyticsMetadata;
}

/**
 * @interface AIRecommendation
 * @description AI-generated recommendations
 */
export interface AIRecommendation {
    type: 'fraud_prevention' | 'skill_improvement' | 'risk_mitigation' | 'game_optimization';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    action: string;
    confidence: number;
    timestamp: number;
}

/**
 * @interface AIFlag
 * @description AI-detected flags and warnings
 */
export interface AIFlag {
    type: 'suspicious_behavior' | 'potential_fraud' | 'skill_discrepancy' | 'risk_warning';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: string[];
    timestamp: number;
    resolved: boolean;
}

/**
 * @interface AIAnalyticsMetadata
 * @description Additional AI analytics metadata
 */
export interface AIAnalyticsMetadata {
    modelVersion: string;
    processingTime: number;
    dataPoints: number;
    accuracy: number;
    lastTraining: number;
    features: string[];
}

/**
 * @interface GameEvent
 * @description Game events and actions
 */
export interface GameEvent {
    id: string;
    type: string;
    playerId: string;
    timestamp: number;
    data: any;
    metadata: GameEventMetadata;
}

/**
 * @interface GameEventMetadata
 * @description Game event metadata
 */
export interface GameEventMetadata {
    gameId: string;
    round: number;
    phase: string;
    coordinates?: GamePosition;
    targetId?: string;
    success: boolean;
    impact: number;
}

/**
 * @interface GameConfig
 * @description Game configuration
 */
export interface GameConfig {
    version: string;
    websocketPort: number;
    tickRate: number;
    maxPlayers: number;
    maxPlayersPerGame: number;
    minStake: number;
    maxStake: number;
    maxGameDuration: number;
    aiAnalysisInterval: number;
    supportedGames: GameType[];
    novaSanctumConfig: NovaSanctumConfig;
    athenaMistConfig: AthenaMistConfig;
    databaseConfig: DatabaseConfig;
    blockchainConfig: BlockchainConfig;
    securityConfig: SecurityConfig;
    performanceConfig: PerformanceConfig;
}

/**
 * @interface NovaSanctumConfig
 * @description NovaSanctum AI service configuration
 */
export interface NovaSanctumConfig {
    endpoint: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    batchSize: number;
    modelVersion: string;
    features: string[];
}

/**
 * @interface AthenaMistConfig
 * @description AthenaMist AI service configuration
 */
export interface AthenaMistConfig {
    endpoint: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    batchSize: number;
    modelVersion: string;
    features: string[];
    advancedAnalytics: boolean;
}

/**
 * @interface DatabaseConfig
 * @description Database configuration
 */
export interface DatabaseConfig {
    type: 'postgresql' | 'mongodb' | 'redis';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    connectionPool: number;
    timeout: number;
}

/**
 * @interface BlockchainConfig
 * @description Blockchain configuration
 */
export interface BlockchainConfig {
    network: NetworkType;
    rpcUrl: string;
    wsUrl: string;
    chainId: number;
    gasLimit: number;
    gasPrice: number;
    privateKey: string;
    contractAddresses: ContractAddresses;
}

/**
 * @interface ContractAddresses
 * @description Smart contract addresses
 */
export interface ContractAddresses {
    gamingCore: string;
    aiOracle: string;
    gdiToken: string;
    treasury: string;
    bridge: string;
    nftMarketplace: string;
}

/**
 * @interface SecurityConfig
 * @description Security configuration
 */
export interface SecurityConfig {
    jwtSecret: string;
    jwtExpiry: number;
    rateLimit: RateLimitConfig;
    encryptionKey: string;
    fraudThreshold: number;
    banThreshold: number;
    whitelist: string[];
    blacklist: string[];
}

/**
 * @interface RateLimitConfig
 * @description Rate limiting configuration
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}

/**
 * @interface PerformanceConfig
 * @description Performance configuration
 */
export interface PerformanceConfig {
    maxConcurrentGames: number;
    maxConcurrentPlayers: number;
    memoryLimit: number;
    cpuLimit: number;
    enableCaching: boolean;
    cacheSize: number;
    enableCompression: boolean;
    enableMetrics: boolean;
}

/**
 * @interface GameMetadata
 * @description Game metadata
 */
export interface GameMetadata {
    name: string;
    description: string;
    version: string;
    creator: string;
    tags: string[];
    thumbnail: string;
    rules: string[];
    rewards: Reward[];
    requirements: GameRequirement[];
}

/**
 * @interface Reward
 * @description Game rewards
 */
export interface Reward {
    type: 'token' | 'nft' | 'experience' | 'badge' | 'title';
    amount: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    description: string;
    icon: string;
}

/**
 * @interface GameRequirement
 * @description Game requirements
 */
export interface GameRequirement {
    type: 'level' | 'rank' | 'item' | 'achievement' | 'token';
    value: number | string;
    description: string;
}

/**
 * @interface GameItem
 * @description Game items
 */
export interface GameItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'consumable' | 'special' | 'currency';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    power: number;
    durability: number;
    maxDurability: number;
    description: string;
    icon: string;
    effects: ItemEffect[];
    requirements: ItemRequirement[];
}

/**
 * @interface ItemEffect
 * @description Item effects
 */
export interface ItemEffect {
    type: 'damage' | 'healing' | 'buff' | 'debuff' | 'utility';
    value: number;
    duration: number;
    target: 'self' | 'enemy' | 'ally' | 'all';
    description: string;
}

/**
 * @interface ItemRequirement
 * @description Item requirements
 */
export interface ItemRequirement {
    type: 'level' | 'strength' | 'intelligence' | 'skill';
    value: number;
    description: string;
}

/**
 * @interface PlayerAbility
 * @description Player abilities
 */
export interface PlayerAbility {
    id: string;
    name: string;
    type: 'active' | 'passive' | 'ultimate';
    cooldown: number;
    currentCooldown: number;
    cost: number;
    power: number;
    range: number;
    description: string;
    icon: string;
    effects: AbilityEffect[];
}

/**
 * @interface AbilityEffect
 * @description Ability effects
 */
export interface AbilityEffect {
    type: 'damage' | 'healing' | 'buff' | 'debuff' | 'movement' | 'utility';
    value: number;
    duration: number;
    target: 'self' | 'enemy' | 'ally' | 'area';
    radius: number;
    description: string;
}

/**
 * @interface GamePosition
 * @description Game position coordinates
 */
export interface GamePosition {
    x: number;
    y: number;
    z?: number;
    direction?: number;
    velocity?: number;
}

/**
 * @interface Achievement
 * @description Player achievements
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: number | null;
    progress: number;
    maxProgress: number;
    rewards: Reward[];
}

/**
 * @interface Badge
 * @description Player badges
 */
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'combat' | 'exploration' | 'social' | 'collection' | 'special';
    earnedAt: number | null;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * @interface TournamentConfig
 * @description Tournament configuration
 */
export interface TournamentConfig {
    id: string;
    name: string;
    description: string;
    type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
    startTime: number;
    endTime: number;
    minStake: number;
    maxStake: number;
    maxParticipants: number;
    participants: TournamentParticipant[];
    rounds: TournamentRound[];
    prizes: TournamentPrize[];
    rules: string[];
    status: 'upcoming' | 'active' | 'finished' | 'cancelled';
}

/**
 * @interface TournamentParticipant
 * @description Tournament participant
 */
export interface TournamentParticipant {
    id: string;
    stake: number;
    joinTime: number;
    isActive: boolean;
    wins: number;
    losses: number;
    rank: number;
    eliminated: boolean;
    eliminatedAt: number | null;
}

/**
 * @interface TournamentRound
 * @description Tournament round
 */
export interface TournamentRound {
    id: string;
    number: number;
    startTime: number;
    endTime: number;
    matches: TournamentMatch[];
    status: 'pending' | 'active' | 'finished';
}

/**
 * @interface TournamentMatch
 * @description Tournament match
 */
export interface TournamentMatch {
    id: string;
    player1Id: string;
    player2Id: string;
    winnerId: string | null;
    startTime: number;
    endTime: number;
    status: 'pending' | 'active' | 'finished';
    score: {
        player1: number;
        player2: number;
    };
}

/**
 * @interface TournamentPrize
 * @description Tournament prize
 */
export interface TournamentPrize {
    rank: number;
    type: 'token' | 'nft' | 'experience' | 'badge';
    amount: number;
    description: string;
    icon: string;
}

/**
 * @interface GameAction
 * @description Game action data
 */
export interface GameAction {
    type: GameAction;
    playerId: string;
    gameId: string;
    timestamp: number;
    data: any;
    targetId?: string;
    coordinates?: GamePosition;
    success: boolean;
    result: GameActionResult;
}

/**
 * @interface GameActionResult
 * @description Game action result
 */
export interface GameActionResult {
    success: boolean;
    score: number;
    damage?: number;
    healing?: number;
    effects: ActionEffect[];
    message: string;
    metadata: any;
}

/**
 * @interface ActionEffect
 * @description Action effects
 */
export interface ActionEffect {
    type: 'damage' | 'healing' | 'buff' | 'debuff' | 'movement' | 'utility';
    target: string;
    value: number;
    duration: number;
    description: string;
}

/**
 * @interface WebSocketMessage
 * @description WebSocket message format
 */
export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: number;
    id?: string;
}

/**
 * @interface ErrorResponse
 * @description Error response format
 */
export interface ErrorResponse {
    error: string;
    message: string;
    code: number;
    timestamp: number;
    details?: any;
}

/**
 * @interface SuccessResponse
 * @description Success response format
 */
export interface SuccessResponse {
    success: boolean;
    data: any;
    message: string;
    timestamp: number;
}

/**
 * @interface Metrics
 * @description Performance metrics
 */
export interface Metrics {
    totalGames: number;
    activeGames: number;
    totalPlayers: number;
    activePlayers: number;
    averageLatency: number;
    tps: number;
    aiRequests: number;
    fraudDetections: number;
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    errorRate: number;
}

// ============ ENUM TYPES ============

export enum GamePhase {
    LOBBY = 'lobby',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    PAUSED = 'paused',
    FINISHED = 'finished'
}

export enum PlayerRole {
    PLAYER = 'player',
    SPECTATOR = 'spectator',
    MODERATOR = 'moderator',
    ADMIN = 'admin'
}

export enum AIConfidence {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    VERY_HIGH = 'very_high'
}

export enum FraudLevel {
    NONE = 'none',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

// ============ UTILITY TYPES ============

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============ CONSTANTS ============

export const GAME_CONSTANTS = {
    MAX_PLAYERS_PER_GAME: 100,
    MIN_STAKE: 0.001,
    MAX_STAKE: 1000,
    MAX_GAME_DURATION: 3600000, // 1 hour
    TICK_RATE: 50, // 50ms
    AI_ANALYSIS_INTERVAL: 5000, // 5 seconds
    FRAUD_THRESHOLD: 80,
    BAN_THRESHOLD: 90,
    MAX_CHAT_LENGTH: 200,
    MAX_INVENTORY_SIZE: 50,
    MAX_ABILITIES: 10
} as const;

export const AI_CONSTANTS = {
    MIN_CONFIDENCE: 70,
    MAX_RETRY_ATTEMPTS: 3,
    TIMEOUT: 10000,
    BATCH_SIZE: 100,
    MODEL_VERSION: '1.0.0'
} as const;

export const BLOCKCHAIN_CONSTANTS = {
    GAS_LIMIT: 3000000,
    GAS_PRICE: 20000000000, // 20 gwei
    CONFIRMATION_BLOCKS: 12,
    MAX_RETRIES: 5
} as const; 