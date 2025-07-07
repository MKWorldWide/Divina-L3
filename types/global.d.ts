// Global type definitions for GameDin L3 Gaming Blockchain

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DEPLOYER_PRIVATE_KEY?: string;
      VALIDATOR_PRIVATE_KEY?: string;
      TESTNET_VALIDATOR_PRIVATE_KEY?: string;
      BASE_RPC_URL?: string;
      L3_RPC_URL?: string;
      L3_TESTNET_RPC_URL?: string;
      BASESCAN_API_KEY?: string;
      CHAIN_ID?: string;
      TESTNET_CHAIN_ID?: string;
      REPORT_GAS?: string;
      TEST_RPC_URL?: string;
      TEST_PRIVATE_KEY?: string;
      MONGODB_URI?: string;
      REDIS_URL?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_REGION?: string;
    }
  }
}

// Contract artifact types
declare module "*.json" {
  const value: any;
  export default value;
}

// Hardhat environment types
declare module "@nomicfoundation/hardhat-toolbox" {
  export interface HardhatUserConfig {
    solidity?: any;
    networks?: any;
    namedAccounts?: any;
    etherscan?: any;
    gasReporter?: any;
    mocha?: any;
    paths?: any;
    compilers?: any;
    deploy?: any;
    typescript?: any;
  }
}

// Gaming types
export interface GameState {
  gameId: string;
  players: string[];
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  winner?: string;
  score: Record<string, number>;
  metadata: Record<string, any>;
}

export interface PlayerProfile {
  playerId: string;
  address: string;
  xp: number;
  level: number;
  achievements: string[];
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  joinDate: number;
  lastActive: number;
}

export interface Tournament {
  tournamentId: string;
  name: string;
  description: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'battle_royale';
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  players: string[];
  matches: Match[];
  winners: string[];
}

export interface Match {
  matchId: string;
  tournamentId: string;
  player1: string;
  player2: string;
  winner?: string;
  score1: number;
  score2: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
}

export interface AIAnalysis {
  fraudScore: number;
  behaviorPattern: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  prediction: {
    winProbability: number;
    expectedScore: number;
    confidence: number;
    factors: string[];
  };
}

export interface BridgeTransaction {
  txId: string;
  fromChain: string;
  toChain: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  blockNumber: number;
  merkleProof?: string;
}

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

// Database types
export interface DatabaseConfig {
  url: string;
  name: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
  };
}

// Blockchain types
export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  gasPrice: number;
  blockGasLimit: number;
  allowUnlimitedContractSize?: boolean;
}

// AI Service types
export interface AIServiceConfig {
  novaSanctumUrl?: string;
  athenaMistUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

// Gaming Engine types
export interface GamingEngineConfig {
  port: number;
  maxConnections: number;
  heartbeatInterval: number;
  gameTimeout: number;
  tournamentTimeout: number;
}

// Monitoring types
export interface MonitoringConfig {
  port: number;
  metricsPath: string;
  healthCheckPath: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// Event types
export interface GameEvent {
  type: 'game_start' | 'game_end' | 'player_join' | 'player_leave' | 'score_update';
  gameId: string;
  playerId?: string;
  data: any;
  timestamp: number;
}

export interface TournamentEvent {
  type: 'tournament_start' | 'tournament_end' | 'player_register' | 'match_start' | 'match_end';
  tournamentId: string;
  playerId?: string;
  matchId?: string;
  data: any;
  timestamp: number;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  sessionId?: string;
}

export interface WebSocketConnection {
  id: string;
  playerId?: string;
  gameId?: string;
  tournamentId?: string;
  connectedAt: number;
  lastActivity: number;
}

// Error types
export interface GameError extends Error {
  code: string;
  gameId?: string;
  playerId?: string;
  recoverable: boolean;
}

export interface ValidationError extends Error {
  field: string;
  value: any;
  expected: any;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Export for use in other files
export {}; 