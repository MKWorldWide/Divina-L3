/**
 * 🌌 Celestial Genesis Collective - API Gateway
 * 
 * This module implements the main API gateway for the GameDin L3 Gaming Blockchain
 * with TDD-compliant immutable framework and Celestial Genesis Collective principles:
 * - Immutable request/response handling
 * - Pure functions for data transformation
 * - Collective intelligence integration
 * - Type-safe operations
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { promisify } from 'util';
import { setTimeout } from 'timers';

import type {
  ImmutableObject,
  Result,
  ImmutableEvent,
  CollectiveDecision,
  EmergentBehavior,
} from '../types/immutable.js';

import {
  createImmutableObject,
  createSuccess,
  createFailure,
  createImmutableEvent,
  validateImmutable,
} from '../utils/immutable.js';

import gdiRouter from './routes/gdi.route';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Immutable API Request - represents an immutable API request
 */
export interface ImmutableAPIRequest {
  readonly id: string;
  readonly method: string;
  readonly path: string;
  readonly headers: ImmutableObject<Record<string, string>>;
  readonly body: ImmutableObject<Record<string, unknown>>;
  readonly timestamp: Date;
  readonly source: string;
}

/**
 * Immutable API Response - represents an immutable API response
 */
export interface ImmutableAPIResponse {
  readonly id: string;
  readonly statusCode: number;
  readonly headers: ImmutableObject<Record<string, string>>;
  readonly body: ImmutableObject<Record<string, unknown>>;
  readonly timestamp: Date;
  readonly duration: number;
}

/**
 * API Gateway Configuration - immutable configuration
 */
export interface APIGatewayConfig {
  readonly port: number;
  readonly host: string;
  readonly corsOrigins: readonly string[];
  readonly rateLimit: {
    readonly windowMs: number;
    readonly maxRequests: number;
  };
  readonly timeout: number;
  readonly enableWebSocket: boolean;
  readonly enableMetrics: boolean;
  readonly collectiveIntelligence: {
    readonly enabled: boolean;
    readonly decisionThreshold: number;
    readonly emergentBehaviorTracking: boolean;
  };
}

/**
 * Collective Intelligence State - represents the collective state
 */
export interface CollectiveIntelligenceState {
  readonly decisions: ImmutableObject<Record<string, CollectiveDecision>>;
  readonly emergentBehaviors: ImmutableObject<Record<string, EmergentBehavior>>;
  readonly activeNodes: ImmutableObject<Record<string, {
    readonly id: string;
    readonly lastSeen: Date;
    readonly weight: number;
  }>>;
  readonly metrics: ImmutableObject<{
    readonly totalRequests: number;
    readonly successfulRequests: number;
    readonly failedRequests: number;
    readonly averageResponseTime: number;
    readonly lastUpdated: Date;
  }>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: APIGatewayConfig = createImmutableObject({
  port: parseInt(process.env.API_PORT || '3000'),
  host: process.env.API_HOST || 'localhost',
  corsOrigins: createImmutableArray([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://gamedin.io',
    'https://app.gamedin.io'
  ]),
  rateLimit: createImmutableObject({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),
  timeout: 30000, // 30 seconds
  enableWebSocket: true,
  enableMetrics: true,
  collectiveIntelligence: createImmutableObject({
    enabled: true,
    decisionThreshold: 0.7,
    emergentBehaviorTracking: true
  })
});

// ============================================================================
// COLLECTIVE INTELLIGENCE STATE
// ============================================================================

let collectiveState: CollectiveIntelligenceState = createImmutableObject({
  decisions: createImmutableObject({}),
  emergentBehaviors: createImmutableObject({}),
  activeNodes: createImmutableObject({}),
  metrics: createImmutableObject({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastUpdated: new Date()
  })
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates an immutable API request
 */
const createImmutableRequest = (
  method: string,
  path: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  source: string
): ImmutableAPIRequest => {
  return createImmutableObject({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    method,
    path,
    headers: createImmutableObject(headers),
    body: createImmutableObject(body),
    timestamp: new Date(),
    source
  });
};

/**
 * Creates an immutable API response
 */
const createImmutableResponse = (
  id: string,
  statusCode: number,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  duration: number
): ImmutableAPIResponse => {
  return createImmutableObject({
    id,
    statusCode,
    headers: createImmutableObject(headers),
    body: createImmutableObject(body),
    timestamp: new Date(),
    duration
  });
};

/**
 * Updates collective intelligence metrics
 */
const updateCollectiveMetrics = (
  requestDuration: number,
  isSuccess: boolean
): void => {
  const currentMetrics = collectiveState.metrics;
  const totalRequests = currentMetrics.totalRequests + 1;
  const successfulRequests = currentMetrics.successfulRequests + (isSuccess ? 1 : 0);
  const failedRequests = currentMetrics.failedRequests + (isSuccess ? 0 : 1);
  
  // Calculate new average response time
  const totalTime = currentMetrics.averageResponseTime * currentMetrics.totalRequests + requestDuration;
  const averageResponseTime = totalTime / totalRequests;
  
  const newMetrics = createImmutableObject({
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
    lastUpdated: new Date()
  });
  
  collectiveState = createImmutableObject({
    ...collectiveState,
    metrics: newMetrics
  });
};

/**
 * Validates request using collective intelligence
 */
const validateRequestWithCollective = async (
  request: ImmutableAPIRequest
): Promise<Result<boolean, string>> => {
  if (!DEFAULT_CONFIG.collectiveIntelligence.enabled) {
    return createSuccess(true);
  }
  
  try {
    // Simulate collective decision making
    const decisionId = `decision-${request.id}`;
    const decision = createImmutableObject({
      id: decisionId,
      proposal: `Validate request ${request.method} ${request.path}`,
      votes: createImmutableArray([
        createImmutableObject({
          nodeId: 'gateway-node',
          vote: 'approve' as const,
          weight: 1.0,
          timestamp: new Date()
        })
      ]),
      outcome: 'approved' as const,
      threshold: DEFAULT_CONFIG.collectiveIntelligence.decisionThreshold,
      createdAt: new Date()
    });
    
    // Update collective state
    const newDecisions = createImmutableObject({
      ...collectiveState.decisions,
      [decisionId]: decision
    });
    
    collectiveState = createImmutableObject({
      ...collectiveState,
      decisions: newDecisions
    });
    
    return createSuccess(true);
  } catch (error) {
    return createFailure(error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Tracks emergent behavior patterns
 */
const trackEmergentBehavior = (
  request: ImmutableAPIRequest,
  response: ImmutableAPIResponse
): void => {
  if (!DEFAULT_CONFIG.collectiveIntelligence.emergentBehaviorTracking) {
    return;
  }
  
  try {
    const behaviorId = `behavior-${request.method}-${request.path}`;
    const existingBehavior = collectiveState.emergentBehaviors[behaviorId];
    
    if (existingBehavior) {
      // Update existing behavior
      const newBehavior = createImmutableObject({
        ...existingBehavior,
        strength: existingBehavior.strength + 0.1,
        lastObserved: new Date()
      });
      
      const newBehaviors = createImmutableObject({
        ...collectiveState.emergentBehaviors,
        [behaviorId]: newBehavior
      });
      
      collectiveState = createImmutableObject({
        ...collectiveState,
        emergentBehaviors: newBehaviors
      });
    } else {
      // Create new behavior
      const newBehavior = createImmutableObject({
        id: behaviorId,
        pattern: `${request.method} ${request.path}`,
        participants: createImmutableArray([request.source]),
        strength: 1.0,
        stability: 0.8,
        lastObserved: new Date(),
        metadata: createImmutableObject({
          averageResponseTime: response.duration,
          successRate: response.statusCode < 400 ? 1.0 : 0.0
        })
      });
      
      const newBehaviors = createImmutableObject({
        ...collectiveState.emergentBehaviors,
        [behaviorId]: newBehavior
      });
      
      collectiveState = createImmutableObject({
        ...collectiveState,
        emergentBehaviors: newBehaviors
      });
    }
  } catch (error) {
    console.error('Failed to track emergent behavior:', error);
  }
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Immutable request middleware
 */
const immutableRequestMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const startTime = Date.now();
  
  // Create immutable request
  const immutableRequest = createImmutableRequest(
    req.method,
    req.path,
    req.headers as Record<string, string>,
    req.body as Record<string, unknown>,
    req.ip || 'unknown'
  );
  
  // Store in request object for later use
  (req as any).immutableRequest = immutableRequest;
  (req as any).startTime = startTime;
  
  next();
};

/**
 * Collective intelligence middleware
 */
const collectiveIntelligenceMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const immutableRequest = (req as any).immutableRequest as ImmutableAPIRequest;
    
    // Validate request with collective intelligence
    const validationResult = await validateRequestWithCollective(immutableRequest);
    
    if (!validationResult.success) {
      res.status(403).json(createImmutableObject({
        error: 'Request rejected by collective intelligence',
        details: validationResult.error,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    next();
  } catch (error) {
    console.error('Collective intelligence middleware error:', error);
    next();
  }
};

/**
 * Response tracking middleware
 */
const responseTrackingMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const originalSend = res.send;
  const startTime = (req as any).startTime as number;
  const immutableRequest = (req as any).immutableRequest as ImmutableAPIRequest;
  
  res.send = function(body: any): express.Response {
    const duration = Date.now() - startTime;
    const isSuccess = res.statusCode < 400;
    
    // Create immutable response
    const immutableResponse = createImmutableResponse(
      immutableRequest.id,
      res.statusCode,
      res.getHeaders() as Record<string, string>,
      typeof body === 'string' ? { data: body } : body,
      duration
    );
    
    // Update collective metrics
    updateCollectiveMetrics(duration, isSuccess);
    
    // Track emergent behavior
    trackEmergentBehavior(immutableRequest, immutableResponse);
    
    // Create event for logging
    const event = createImmutableEvent(
      'api_request_completed',
      {
        request: immutableRequest,
        response: immutableResponse
      },
      'api-gateway'
    );
    
    console.log(`🌌 API Event: ${event.type} - ${event.id}`);
    
    return originalSend.call(this, body);
  };
  
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check endpoint
 */
const healthCheckHandler = (req: express.Request, res: express.Response): void => {
  const healthData = createImmutableObject({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    collectiveIntelligence: {
      enabled: DEFAULT_CONFIG.collectiveIntelligence.enabled,
      activeDecisions: Object.keys(collectiveState.decisions).length,
      emergentBehaviors: Object.keys(collectiveState.emergentBehaviors).length,
      activeNodes: Object.keys(collectiveState.activeNodes).length
    },
    metrics: collectiveState.metrics
  });
  
  res.json(healthData);
};

/**
 * Collective intelligence status endpoint
 */
const collectiveStatusHandler = (req: express.Request, res: express.Response): void => {
  const statusData = createImmutableObject({
    decisions: collectiveState.decisions,
    emergentBehaviors: collectiveState.emergentBehaviors,
    activeNodes: collectiveState.activeNodes,
    metrics: collectiveState.metrics,
    configuration: DEFAULT_CONFIG.collectiveIntelligence
  });
  
  res.json(statusData);
};

/**
 * Metrics endpoint
 */
const metricsHandler = (req: express.Request, res: express.Response): void => {
  const metricsData = createImmutableObject({
    ...collectiveState.metrics,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
  
  res.json(metricsData);
};

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

/**
 * WebSocket connection handler
 */
const handleWebSocketConnection = (ws: any, req: any): void => {
  console.log('🌌 WebSocket connection established');
  
  // Send initial collective state
  ws.send(JSON.stringify(createImmutableObject({
    type: 'collective_state',
    data: collectiveState,
    timestamp: new Date().toISOString()
  })));
  
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      const event = createImmutableEvent(
        'websocket_message',
        data,
        'websocket-client'
      );
      
      console.log(`🌌 WebSocket Event: ${event.type} - ${event.id}`);
      
      // Echo back with collective intelligence
      ws.send(JSON.stringify(createImmutableObject({
        type: 'echo',
        data: event,
        collectiveMetrics: collectiveState.metrics,
        timestamp: new Date().toISOString()
      })));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🌌 WebSocket connection closed');
  });
};

// ============================================================================
// MAIN APPLICATION
// ============================================================================

/**
 * Creates and configures the API gateway application
 */
export const createAPIGateway = (config: Partial<APIGatewayConfig> = {}): express.Application => {
  const finalConfig = createImmutableObject({
    ...DEFAULT_CONFIG,
    ...config
  });
  
  const app = express();
  
  // Security middleware
  app.use(helmet());
  app.use(compression());
  
  // CORS configuration
  app.use(cors({
    origin: finalConfig.corsOrigins,
    credentials: true
  }));
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Custom middleware
  app.use(immutableRequestMiddleware);
  app.use(collectiveIntelligenceMiddleware);
  app.use(responseTrackingMiddleware);
  
  // Routes
  app.get('/health', healthCheckHandler);
  app.get('/collective/status', collectiveStatusHandler);
  app.get('/metrics', metricsHandler);
  // GDIService API routes for wallet/tier/access
  app.use('/gdi', gdiRouter); // Quantum-detailed: Mounts GDIService endpoints at /gdi/*
  
  // Default route
  app.get('/', (req: express.Request, res: express.Response) => {
    res.json(createImmutableObject({
      message: '🌌 Celestial Genesis Collective - GameDin L3 API Gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      collectiveIntelligence: {
        enabled: finalConfig.collectiveIntelligence.enabled,
        status: 'active'
      }
    }));
  });
  
  // 404 handler
  app.use('*', (req: express.Request, res: express.Response) => {
    res.status(404).json(createImmutableObject({
      error: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }));
  });
  
  // Error handler
  app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Gateway Error:', error);
    
    res.status(500).json(createImmutableObject({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  });
  
  return app;
};

/**
 * Starts the API gateway server
 */
export const startAPIGateway = async (config: Partial<APIGatewayConfig> = {}): Promise<void> => {
  const finalConfig = createImmutableObject({
    ...DEFAULT_CONFIG,
    ...config
  });
  
  const app = createAPIGateway(finalConfig);
  const server = createServer(app);
  
  // WebSocket server
  if (finalConfig.enableWebSocket) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', handleWebSocketConnection);
    console.log('🌌 WebSocket server enabled');
  }
  
  // Start server
  const startServer = promisify(server.listen.bind(server));
  await startServer(finalConfig.port, finalConfig.host);
  
  console.log(`🌌 Celestial Genesis Collective API Gateway started`);
  console.log(`📍 Server: http://${finalConfig.host}:${finalConfig.port}`);
  console.log(`🔗 Health: http://${finalConfig.host}:${finalConfig.port}/health`);
  console.log(`📊 Metrics: http://${finalConfig.host}:${finalConfig.port}/metrics`);
  console.log(`🌌 Collective: http://${finalConfig.host}:${finalConfig.port}/collective/status`);
  
  if (finalConfig.enableWebSocket) {
    console.log(`🔌 WebSocket: ws://${finalConfig.host}:${finalConfig.port}`);
  }
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🌌 Shutting down API Gateway gracefully...');
    server.close(() => {
      console.log('🌌 API Gateway shutdown complete');
      process.exit(0);
    });
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createAPIGateway,
  startAPIGateway,
  DEFAULT_CONFIG,
  collectiveState
}; 