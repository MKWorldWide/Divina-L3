import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface AIStatus {
  isOnline: boolean;
  lastPing: Date;
  responseTime: number;
  services: {
    novaSanctum: boolean;
    athenaMist: boolean;
  };
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  type: 'fraud-detection' | 'behavior-analysis' | 'prediction' | 'optimization' | 'assistant';
  isEnabled: boolean;
  confidence: number;
  lastUpdate: Date;
}

interface AIAnalysis {
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

interface AIRecommendation {
  id: string;
  type: 'strategy' | 'betting' | 'timing' | 'risk-management';
  title: string;
  description: string;
  confidence: number;
  action: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high';
}

interface AIContextType {
  // State
  aiStatus: AIStatus;
  aiFeatures: AIFeature[];
  currentAnalysis: AIAnalysis | null;
  recommendations: AIRecommendation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  analyzePlayer: (playerId: string, gameId: string) => Promise<AIAnalysis>;
  getRecommendations: (playerId: string, gameId: string) => Promise<AIRecommendation[]>;
  predictOutcome: (
    gameId: string,
    playerId: string
  ) => Promise<{
    success: boolean;
    predictedWinner: string;
    confidence: number;
    gameId: string;
    timestamp: Date;
  }>;
  detectFraud: (gameId: string, playerId: string) => Promise<number>;
  optimizeStrategy: (playerId: string, gameType: string) => Promise<string[]>;
  enableFeature: (featureId: string) => Promise<void>;
  disableFeature: (featureId: string) => Promise<void>;

  // Real-time
  subscribeToAIUpdates: (
    callback: (update: AIAnalysis | AIRecommendation | AIStatus) => void
  ) => void;
  unsubscribeFromAIUpdates: () => void;
}

interface AIProviderProps {
  children: ReactNode;
}

// Context
const AIContext = createContext<AIContextType | undefined>(undefined);

// Provider Component
export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    isOnline: false,
    lastPing: new Date(),
    responseTime: 0,
    services: {
      novaSanctum: false,
      athenaMist: false,
    },
  });

  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([
    {
      id: 'fraud-detection',
      name: 'Fraud Detection',
      description: 'Real-time fraud detection using NovaSanctum AI',
      type: 'fraud-detection',
      isEnabled: true,
      confidence: 0.95,
      lastUpdate: new Date(),
    },
    {
      id: 'behavior-analysis',
      name: 'Behavior Analysis',
      description: 'Player behavior pattern analysis',
      type: 'behavior-analysis',
      isEnabled: true,
      confidence: 0.88,
      lastUpdate: new Date(),
    },
    {
      id: 'outcome-prediction',
      name: 'Outcome Prediction',
      description: 'AI-powered game outcome prediction',
      type: 'prediction',
      isEnabled: true,
      confidence: 0.82,
      lastUpdate: new Date(),
    },
    {
      id: 'strategy-optimization',
      name: 'Strategy Optimization',
      description: 'AthenaMist AI strategy recommendations',
      type: 'optimization',
      isEnabled: true,
      confidence: 0.9,
      lastUpdate: new Date(),
    },
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      description: 'Intelligent gaming assistant',
      type: 'assistant',
      isEnabled: true,
      confidence: 0.85,
      lastUpdate: new Date(),
    },
  ]);

  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateCallback, setUpdateCallback] = useState<
    ((update: AIAnalysis | AIRecommendation | AIStatus) => void) | null
  >(null);

  // Initialize AI services
  useEffect(() => {
    initializeAIServices();
    startHealthCheck();
  }, []);

  const initializeAIServices = async () => {
    try {
      setIsLoading(true);

      // Check NovaSanctum AI service
      const novaSanctumResponse = await fetch(`${process.env.REACT_APP_NOVASANCTUM_URL}/health`);
      const novaSanctumOnline = novaSanctumResponse.ok;

      // Check AthenaMist AI service
      const athenaMistResponse = await fetch(`${process.env.REACT_APP_ATHENAMIST_URL}/health`);
      const athenaMistOnline = athenaMistResponse.ok;

      setAiStatus(prev => ({
        ...prev,
        isOnline: novaSanctumOnline || athenaMistOnline,
        services: {
          novaSanctum: novaSanctumOnline,
          athenaMist: athenaMistOnline,
        },
        lastPing: new Date(),
      }));
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
      setError('Failed to connect to AI services');
    } finally {
      setIsLoading(false);
    }
  };

  const startHealthCheck = () => {
    const interval = setInterval(async () => {
      try {
        const startTime = Date.now();

        // Check both AI services
        const [novaSanctumResponse, athenaMistResponse] = await Promise.allSettled([
          fetch(`${process.env.REACT_APP_NOVASANCTUM_URL}/health`),
          fetch(`${process.env.REACT_APP_ATHENAMIST_URL}/health`),
        ]);

        const responseTime = Date.now() - startTime;

        setAiStatus(prev => ({
          ...prev,
          isOnline:
            (novaSanctumResponse.status === 'fulfilled' && novaSanctumResponse.value.ok) ||
            (athenaMistResponse.status === 'fulfilled' && athenaMistResponse.value.ok),
          services: {
            novaSanctum: novaSanctumResponse.status === 'fulfilled' && novaSanctumResponse.value.ok,
            athenaMist: athenaMistResponse.status === 'fulfilled' && athenaMistResponse.value.ok,
          },
          lastPing: new Date(),
          responseTime,
        }));
      } catch (error) {
        console.error('AI health check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  };

  const analyzePlayer = async (playerId: string, gameId: string): Promise<AIAnalysis> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${process.env.REACT_APP_AI_SERVICE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, gameId }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze player');
      }

      const analysis: AIAnalysis = await response.json();
      setCurrentAnalysis(analysis);

      // Notify subscribers
      if (updateCallback) {
        updateCallback(analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze player:', error);
      setError('Failed to analyze player');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendations = async (
    playerId: string,
    gameId: string
  ): Promise<AIRecommendation[]> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_AI_SERVICE_URL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, gameId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const recommendations: AIRecommendation[] = await response.json();
      setRecommendations(recommendations);

      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  };

  const predictOutcome = async (gameId: string, playerId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_AI_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, playerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to predict outcome');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to predict outcome:', error);
      throw error;
    }
  };

  const detectFraud = async (gameId: string, playerId: string): Promise<number> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_AI_SERVICE_URL}/fraud-detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, playerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect fraud');
      }

      const result = await response.json();
      return result.fraudScore;
    } catch (error) {
      console.error('Failed to detect fraud:', error);
      throw error;
    }
  };

  const optimizeStrategy = async (playerId: string, gameType: string): Promise<string[]> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_AI_SERVICE_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, gameType }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize strategy');
      }

      const result = await response.json();
      return result.strategies;
    } catch (error) {
      console.error('Failed to optimize strategy:', error);
      throw error;
    }
  };

  const enableFeature = async (featureId: string): Promise<void> => {
    setAiFeatures(prev =>
      prev.map(feature => (feature.id === featureId ? { ...feature, isEnabled: true } : feature))
    );
  };

  const disableFeature = async (featureId: string): Promise<void> => {
    setAiFeatures(prev =>
      prev.map(feature => (feature.id === featureId ? { ...feature, isEnabled: false } : feature))
    );
  };

  const subscribeToAIUpdates = (
    callback: (update: AIAnalysis | AIRecommendation | AIStatus) => void
  ) => {
    setUpdateCallback(() => callback);
  };

  const unsubscribeFromAIUpdates = () => {
    setUpdateCallback(null);
  };

  const value: AIContextType = {
    // State
    aiStatus,
    aiFeatures,
    currentAnalysis,
    recommendations,
    isLoading,
    error,

    // Actions
    analyzePlayer,
    getRecommendations,
    predictOutcome,
    detectFraud,
    optimizeStrategy,
    enableFeature,
    disableFeature,

    // Real-time
    subscribeToAIUpdates,
    unsubscribeFromAIUpdates,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

// Hook
export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
