import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';

// Import services
import { DatabaseService } from '../database/DatabaseService';
import { BlockchainService } from '../blockchain/BlockchainService';
import { UnifiedAIService } from '../ai/UnifiedAIService';
import { GamingEngine } from '../gaming/GamingEngine';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { validationMiddleware } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import gameRoutes from './routes/games';
import playerRoutes from './routes/players';
import aiRoutes from './routes/ai';
import blockchainRoutes from './routes/blockchain';
import marketplaceRoutes from './routes/marketplace';
import bridgeRoutes from './routes/bridge';
import analyticsRoutes from './routes/analytics';

// Import types
import { GameRequest, PlayerRequest, AIRequest } from '../types/api';

// Load environment variables
config();

class APIGateway {
  private app: express.Application;
  private server: any;
  private io: Server;
  private port: number;
  private databaseService: DatabaseService;
  private blockchainService: BlockchainService;
  private aiService: UnifiedAIService;
  private gamingEngine: GamingEngine;

  constructor() {
    this.port = parseInt(process.env.API_GATEWAY_PORT || '3000');
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Initialize services
    this.databaseService = new DatabaseService();
    this.blockchainService = new BlockchainService();
    this.aiService = new UnifiedAIService();
    this.gamingEngine = new GamingEngine(this.io, this.databaseService, this.aiService);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(authMiddleware);
    this.app.use(rateLimitMiddleware);
    this.app.use(validationMiddleware);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: this.databaseService.isConnected(),
          blockchain: this.blockchainService.isConnected(),
          ai: this.aiService.isOnline(),
          gaming: this.gamingEngine.isRunning(),
        },
        version: process.env.APP_VERSION || '1.0.0',
      });
    });

    // API versioning
    this.app.use('/api/v1', (req, res, next) => {
      req.apiVersion = 'v1';
      next();
    });

    // Route handlers
    this.app.use('/api/v1/games', gameRoutes);
    this.app.use('/api/v1/players', playerRoutes);
    this.app.use('/api/v1/ai', aiRoutes);
    this.app.use('/api/v1/blockchain', blockchainRoutes);
    this.app.use('/api/v1/marketplace', marketplaceRoutes);
    this.app.use('/api/v1/bridge', bridgeRoutes);
    this.app.use('/api/v1/analytics', analyticsRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  private setupWebSocket(): void {
    // WebSocket authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify token and attach user data
        const user = await this.verifyToken(token);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // WebSocket connection handler
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user?.address} connected`);

      // Join user to their personal room
      socket.join(`user:${socket.user?.address}`);

      // Handle game-related events
      socket.on('game:join', async (data: { gameId: string; bet: number }) => {
        try {
          const result = await this.gamingEngine.joinGame(socket.user?.address!, data.gameId, data.bet);
          socket.emit('game:join:response', { success: true, game: result });
        } catch (error) {
          socket.emit('game:join:response', { success: false, error: error.message });
        }
      });

      socket.on('game:leave', async (data: { gameId: string }) => {
        try {
          await this.gamingEngine.leaveGame(socket.user?.address!, data.gameId);
          socket.emit('game:leave:response', { success: true });
        } catch (error) {
          socket.emit('game:leave:response', { success: false, error: error.message });
        }
      });

      socket.on('game:move', async (data: { gameId: string; move: any }) => {
        try {
          await this.gamingEngine.makeMove(socket.user?.address!, data.gameId, data.move);
          socket.emit('game:move:response', { success: true });
        } catch (error) {
          socket.emit('game:move:response', { success: false, error: error.message });
        }
      });

      socket.on('game:bet', async (data: { gameId: string; amount: number }) => {
        try {
          await this.gamingEngine.placeBet(socket.user?.address!, data.gameId, data.amount);
          socket.emit('game:bet:response', { success: true });
        } catch (error) {
          socket.emit('game:bet:response', { success: false, error: error.message });
        }
      });

      socket.on('game:create', async (data: any) => {
        try {
          const gameId = await this.gamingEngine.createGame(socket.user?.address!, data);
          socket.emit('game:create:response', { success: true, gameId });
        } catch (error) {
          socket.emit('game:create:response', { success: false, error: error.message });
        }
      });

      // Handle AI requests
      socket.on('ai:analyze', async (data: { playerId: string; gameId: string }) => {
        try {
          const analysis = await this.aiService.analyzePlayer(data.playerId, data.gameId);
          socket.emit('ai:analysis:response', { success: true, analysis });
        } catch (error) {
          socket.emit('ai:analysis:response', { success: false, error: error.message });
        }
      });

      socket.on('ai:recommendations', async (data: { playerId: string; gameId: string }) => {
        try {
          const recommendations = await this.aiService.getRecommendations(data.playerId, data.gameId);
          socket.emit('ai:recommendations:response', { success: true, recommendations });
        } catch (error) {
          socket.emit('ai:recommendations:response', { success: false, error: error.message });
        }
      });

      // Handle blockchain requests
      socket.on('blockchain:balance', async () => {
        try {
          const balance = await this.blockchainService.getBalance(socket.user?.address!);
          socket.emit('blockchain:balance:response', { success: true, balance });
        } catch (error) {
          socket.emit('blockchain:balance:response', { success: false, error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.user?.address} disconnected`);
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  private async verifyToken(token: string): Promise<any> {
    // Implement JWT token verification
    // This is a placeholder - implement actual JWT verification
    try {
      // Verify JWT token and return user data
      return { address: '0x123...', id: 'user123' };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  public async start(): Promise<void> {
    try {
      // Initialize services
      await this.databaseService.connect();
      await this.blockchainService.initialize();
      await this.aiService.initialize();
      await this.gamingEngine.start();

      // Start server
      this.server.listen(this.port, () => {
        console.log(`🚀 API Gateway running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
      });
    } catch (error) {
      console.error('Failed to start API Gateway:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      // Stop services
      await this.gamingEngine.stop();
      await this.aiService.shutdown();
      await this.blockchainService.disconnect();
      await this.databaseService.disconnect();

      // Stop server
      this.server.close(() => {
        console.log('API Gateway stopped');
      });
    } catch (error) {
      console.error('Error stopping API Gateway:', error);
    }
  }

  public getIO(): Server {
    return this.io;
  }

  public getGamingEngine(): GamingEngine {
    return this.gamingEngine;
  }

  public getAIService(): UnifiedAIService {
    return this.aiService;
  }

  public getBlockchainService(): BlockchainService {
    return this.blockchainService;
  }

  public getDatabaseService(): DatabaseService {
    return this.databaseService;
  }
}

export default APIGateway; 