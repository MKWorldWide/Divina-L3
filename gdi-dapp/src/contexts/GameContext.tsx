import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
interface Game {
  id: string;
  name: string;
  type: 'casino' | 'esports' | 'puzzle' | 'tournament';
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  players: Player[];
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  currentBet: number;
  startTime: Date;
  endTime?: Date;
  winner?: Player;
  aiAnalysis?: AIAnalysis;
}

interface Player {
  id: string;
  address: string;
  username: string;
  avatar: string;
  balance: number;
  bet: number;
  score: number;
  isOnline: boolean;
  lastSeen: Date;
}

interface AIAnalysis {
  fraudScore: number;
  behaviorPattern: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  prediction: {
    winProbability: number;
    expectedScore: number;
    confidence: number;
  };
}

interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalEarnings: number;
  averageBet: number;
  bestWin: number;
  longestStreak: number;
  currentStreak: number;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    path: string;
  };
}

interface GameContextType {
  // State
  activeGames: Game[];
  availableGames: Game[];
  gameStats: GameStats;
  notifications: Notification[];
  currentGame: Game | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  joinGame: (gameId: string, bet: number) => Promise<void>;
  leaveGame: (gameId: string) => Promise<void>;
  makeMove: (gameId: string, move: any) => Promise<void>;
  placeBet: (gameId: string, amount: number) => Promise<void>;
  createGame: (gameConfig: Partial<Game>) => Promise<string>;
  getGameHistory: (playerId: string) => Promise<Game[]>;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // Real-time
  socket: Socket | null;
  isConnected: boolean;
}

interface GameProviderProps {
  children: ReactNode;
}

// Context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider Component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalEarnings: 0,
    averageBet: 0,
    bestWin: 0,
    longestStreak: 0,
    currentStreak: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_GAMING_ENGINE_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to gaming engine');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from gaming engine');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Connection error. Please refresh the page.');
    });

    // Game events
    newSocket.on('game:update', (game: Game) => {
      setActiveGames(prev => 
        prev.map(g => g.id === game.id ? game : g)
      );
      if (currentGame?.id === game.id) {
        setCurrentGame(game);
      }
    });

    newSocket.on('game:start', (game: Game) => {
      setActiveGames(prev => [...prev, game]);
      addNotification({
        type: 'info',
        title: 'Game Started',
        message: `Game "${game.name}" has started!`,
      });
    });

    newSocket.on('game:end', (game: Game) => {
      setActiveGames(prev => prev.filter(g => g.id !== game.id));
      if (currentGame?.id === game.id) {
        setCurrentGame(null);
      }
      addNotification({
        type: 'success',
        title: 'Game Ended',
        message: `Game "${game.name}" has ended. ${game.winner ? `Winner: ${game.winner.username}` : 'No winner'}`,
      });
    });

    // Player events
    newSocket.on('player:joined', (data: { gameId: string; player: Player }) => {
      setActiveGames(prev => 
        prev.map(game => 
          game.id === data.gameId 
            ? { ...game, players: [...game.players, data.player] }
            : game
        )
      );
    });

    newSocket.on('player:left', (data: { gameId: string; playerId: string }) => {
      setActiveGames(prev => 
        prev.map(game => 
          game.id === data.gameId 
            ? { ...game, players: game.players.filter(p => p.id !== data.playerId) }
            : game
        )
      );
    });

    // AI events
    newSocket.on('ai:analysis', (data: { gameId: string; analysis: AIAnalysis }) => {
      setActiveGames(prev => 
        prev.map(game => 
          game.id === data.gameId 
            ? { ...game, aiAnalysis: data.analysis }
            : game
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [isConnected]);

  const loadInitialData = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      // Load available games
      const response = await fetch(`${process.env.REACT_APP_API_URL}/games/available`);
      const games = await response.json();
      setAvailableGames(games);

      // Load game stats
      const statsResponse = await fetch(`${process.env.REACT_APP_API_URL}/games/stats`);
      const stats = await statsResponse.json();
      setGameStats(stats);

      // Load notifications
      const notificationsResponse = await fetch(`${process.env.REACT_APP_API_URL}/notifications`);
      const notificationsData = await notificationsResponse.json();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const joinGame = async (gameId: string, bet: number): Promise<void> => {
    if (!socket) throw new Error('Not connected to gaming engine');

    try {
      setIsLoading(true);
      socket.emit('game:join', { gameId, bet });
      
      // Wait for confirmation
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Join timeout')), 10000);
        
        const handleJoinResponse = (response: { success: boolean; game?: Game; error?: string }) => {
          clearTimeout(timeout);
          socket.off('game:join:response', handleJoinResponse);
          
          if (response.success && response.game) {
            setCurrentGame(response.game);
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to join game'));
          }
        };
        
        socket.on('game:join:response', handleJoinResponse);
      });
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGame = async (gameId: string): Promise<void> => {
    if (!socket) throw new Error('Not connected to gaming engine');

    try {
      socket.emit('game:leave', { gameId });
      setCurrentGame(null);
    } catch (error) {
      console.error('Failed to leave game:', error);
      throw error;
    }
  };

  const makeMove = async (gameId: string, move: any): Promise<void> => {
    if (!socket) throw new Error('Not connected to gaming engine');

    try {
      socket.emit('game:move', { gameId, move });
    } catch (error) {
      console.error('Failed to make move:', error);
      throw error;
    }
  };

  const placeBet = async (gameId: string, amount: number): Promise<void> => {
    if (!socket) throw new Error('Not connected to gaming engine');

    try {
      socket.emit('game:bet', { gameId, amount });
    } catch (error) {
      console.error('Failed to place bet:', error);
      throw error;
    }
  };

  const createGame = async (gameConfig: Partial<Game>): Promise<string> => {
    if (!socket) throw new Error('Not connected to gaming engine');

    try {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Create game timeout')), 10000);
        
        const handleCreateResponse = (response: { success: boolean; gameId?: string; error?: string }) => {
          clearTimeout(timeout);
          socket.off('game:create:response', handleCreateResponse);
          
          if (response.success && response.gameId) {
            resolve(response.gameId);
          } else {
            reject(new Error(response.error || 'Failed to create game'));
          }
        };
        
        socket.emit('game:create', gameConfig);
        socket.on('game:create:response', handleCreateResponse);
      });
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  const getGameHistory = async (playerId: string): Promise<Game[]> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/games/history/${playerId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get game history:', error);
      throw error;
    }
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: GameContextType = {
    // State
    activeGames,
    availableGames,
    gameStats,
    notifications,
    currentGame,
    isLoading,
    error,
    
    // Actions
    joinGame,
    leaveGame,
    makeMove,
    placeBet,
    createGame,
    getGameHistory,
    markNotificationRead,
    clearNotifications,
    
    // Real-time
    socket,
    isConnected,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Hook
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 