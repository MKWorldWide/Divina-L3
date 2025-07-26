// Common types used across the application

export interface Player {
  id: string;
  address: string;
  username: string;
  avatar?: string;
  score?: number;
  betAmount?: number;
}

// Base Player interface for Game participants
export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;
  betAmount?: number;
}

// Extended Player interface for other contexts
export interface Player extends GamePlayer {
  address: string;
  username: string;
  score?: number;
}

export interface GameWinner {
  id: string;
  name: string;
  prize?: number;
}

export interface GameAIAnalysis {
  confidence: number;
  prediction?: string;
  recommendations?: string[];
  // Additional AI analysis fields from AIContext
  playerId?: string;
  gameId?: string;
  fraudScore?: number;
  behaviorPattern?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  timestamp?: Date;
}

export interface Game {
  id: string;
  name: string;
  type: 'casino' | 'esports' | 'puzzle' | 'tournament';
  status: 'waiting' | 'active' | 'finished' | 'cancelled' | 'completed';
  players: GamePlayer[];
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  currentBet: number;
  startTime: Date | string;
  endTime?: Date | string;
  winner?: GameWinner;
  aiAnalysis?: GameAIAnalysis | AIAnalysis; // Support both formats
  result?: string;
  earnings?: number;
  // Additional fields for different contexts
  title?: string; // For backward compatibility
  playersCount?: number; // For backward compatibility
}

export interface AIAnalysis {
  playerId: string;
  gameId: string;
  fraudScore: number;
  behaviorPattern: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  prediction: {
    winProbability: number;
    expectedScore: number;
    confidence: number;
    factors: string[];
  };
  timestamp: Date;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'strategy' | 'performance' | 'opportunity' | 'warning' | 'fraud-detection' | 'behavior-analysis' | 'prediction' | 'optimization' | 'recommendation';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  relatedGames?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TopPlayer {
  id: string;
  username: string;
  avatar: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  totalWins: number;
  totalEarnings: number;
  rank: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}
