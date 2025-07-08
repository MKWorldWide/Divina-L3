/**
 * GameDin L3 Bridge Relayer Service
 * 
 * Handles cross-chain communication and asset bridging between:
 * - Ethereum Mainnet
 * - Base L2
 * - GameDin L3
 * - Solana (via Wormhole)
 * 
 * @author GameDin Team
 * @version 1.0.0
 */

import { ethers } from "ethers";
import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import winston from "winston";

// Load environment variables
config();

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "bridge-relayer" },
  transports: [
    new winston.transports.File({ filename: "logs/bridge-error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/bridge-combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

interface BridgeConfig {
  ethereum: {
    rpc: string;
    chainId: number;
    contracts: {
      bridge: string;
      token: string;
    };
  };
  base: {
    rpc: string;
    chainId: number;
    contracts: {
      bridge: string;
      token: string;
    };
  };
  gamedin: {
    rpc: string;
    chainId: number;
    contracts: {
      bridge: string;
      token: string;
    };
  };
}

interface BridgeRequest {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  recipient: string;
  timestamp: number;
}

interface BridgeStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  recipient: string;
  timestamp: number;
  error?: string;
}

class BridgeRelayer {
  private config: BridgeConfig;
  private providers: Map<string, ethers.Provider>;
  private signers: Map<string, ethers.Signer>;
  private bridgeRequests: Map<string, BridgeRequest>;
  private bridgeStatuses: Map<string, BridgeStatus>;
  private wss: WebSocketServer;
  private app: express.Application;
  private port: number;

  constructor() {
    this.config = this.loadConfig();
    this.providers = new Map();
    this.signers = new Map();
    this.bridgeRequests = new Map();
    this.bridgeStatuses = new Map();
    this.port = parseInt(process.env.BRIDGE_PORT || "3002");
    
    this.initializeProviders();
    this.setupExpress();
    this.setupWebSocket();
  }

  private loadConfig(): BridgeConfig {
    return {
      ethereum: {
        rpc: process.env.ETHEREUM_RPC || "https://mainnet.infura.io/v3/your-project-id",
        chainId: 1,
        contracts: {
          bridge: process.env.ETHEREUM_BRIDGE || "",
          token: process.env.ETHEREUM_TOKEN || ""
        }
      },
      base: {
        rpc: process.env.BASE_RPC || "https://mainnet.base.org",
        chainId: 8453,
        contracts: {
          bridge: process.env.BASE_BRIDGE || "",
          token: process.env.BASE_TOKEN || ""
        }
      },
      gamedin: {
        rpc: process.env.GAMEDIN_RPC || "http://localhost:8545",
        chainId: 31337,
        contracts: {
          bridge: process.env.GAMEDIN_BRIDGE || "",
          token: process.env.GAMEDIN_TOKEN || ""
        }
      }
    };
  }

  private initializeProviders(): void {
    try {
      // Initialize Ethereum provider
      this.providers.set("ethereum", new ethers.JsonRpcProvider(this.config.ethereum.rpc));
      
      // Initialize Base provider
      this.providers.set("base", new ethers.JsonRpcProvider(this.config.base.rpc));
      
      // Initialize GameDin provider
      this.providers.set("gamedin", new ethers.JsonRpcProvider(this.config.gamedin.rpc));
      
      logger.info("Providers initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize providers:", error);
      throw error;
    }
  }

  private setupExpress(): void {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "bridge-relayer"
      });
    });

    // Bridge request endpoint
    this.app.post("/bridge", async (req, res) => {
      try {
        const { fromChain, toChain, amount, token, recipient } = req.body;
        
        if (!fromChain || !toChain || !amount || !token || !recipient) {
          return res.status(400).json({
            error: "Missing required parameters"
          });
        }

        const requestId = this.generateRequestId();
        const request: BridgeRequest = {
          id: requestId,
          fromChain,
          toChain,
          amount,
          token,
          recipient,
          timestamp: Date.now()
        };

        this.bridgeRequests.set(requestId, request);
        
        // Initialize status
        const status: BridgeStatus = {
          ...request,
          status: "pending"
        };
        this.bridgeStatuses.set(requestId, status);

        // Process bridge request asynchronously
        this.processBridgeRequest(requestId);

        res.json({
          requestId,
          status: "pending",
          message: "Bridge request submitted successfully"
        });

      } catch (error) {
        logger.error("Bridge request error:", error);
        res.status(500).json({
          error: "Internal server error"
        });
      }
    });

    // Get bridge status endpoint
    this.app.get("/bridge/:requestId", (req, res) => {
      const { requestId } = req.params;
      const status = this.bridgeStatuses.get(requestId);
      
      if (!status) {
        return res.status(404).json({
          error: "Bridge request not found"
        });
      }

      res.json(status);
    });

    // Get all bridge requests endpoint
    this.app.get("/bridge", (req, res) => {
      const requests = Array.from(this.bridgeStatuses.values());
      res.json(requests);
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ port: this.port + 1 });
    
    this.wss.on("connection", (ws: WebSocket) => {
      logger.info("New WebSocket connection established");
      
      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error("WebSocket message error:", error);
          ws.send(JSON.stringify({
            error: "Invalid message format"
          }));
        }
      });

      ws.on("close", () => {
        logger.info("WebSocket connection closed");
      });
    });

    logger.info(`WebSocket server started on port ${this.port + 1}`);
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case "subscribe":
        // Subscribe to bridge updates
        ws.send(JSON.stringify({
          type: "subscribed",
          message: "Subscribed to bridge updates"
        }));
        break;
      
      case "get_status":
        // Get specific bridge status
        const status = this.bridgeStatuses.get(data.requestId);
        ws.send(JSON.stringify({
          type: "status",
          data: status || { error: "Request not found" }
        }));
        break;
      
      default:
        ws.send(JSON.stringify({
          error: "Unknown message type"
        }));
    }
  }

  private generateRequestId(): string {
    return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processBridgeRequest(requestId: string): Promise<void> {
    const request = this.bridgeRequests.get(requestId);
    if (!request) {
      logger.error(`Bridge request ${requestId} not found`);
      return;
    }

    try {
      // Update status to processing
      const status = this.bridgeStatuses.get(requestId);
      if (status) {
        status.status = "processing";
        this.bridgeStatuses.set(requestId, status);
      }

      logger.info(`Processing bridge request ${requestId}: ${request.fromChain} -> ${request.toChain}`);

      // Simulate bridge processing (replace with actual bridge logic)
      await this.simulateBridgeProcessing(request);

      // Update status to completed
      if (status) {
        status.status = "completed";
        this.bridgeStatuses.set(requestId, status);
      }

      logger.info(`Bridge request ${requestId} completed successfully`);

      // Broadcast update to WebSocket clients
      this.broadcastUpdate(requestId);

    } catch (error) {
      logger.error(`Bridge request ${requestId} failed:`, error);
      
      const status = this.bridgeStatuses.get(requestId);
      if (status) {
        status.status = "failed";
        status.error = error instanceof Error ? error.message : "Unknown error";
        this.bridgeStatuses.set(requestId, status);
      }

      this.broadcastUpdate(requestId);
    }
  }

  private async simulateBridgeProcessing(request: BridgeRequest): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Validate request
    if (!this.providers.has(request.fromChain) || !this.providers.has(request.toChain)) {
      throw new Error("Invalid chain configuration");
    }

    // Here you would implement actual bridge logic:
    // 1. Lock tokens on source chain
    // 2. Generate proof
    // 3. Submit proof to destination chain
    // 4. Mint tokens on destination chain
    
    logger.info(`Simulated bridge processing for ${request.amount} ${request.token} from ${request.fromChain} to ${request.toChain}`);
  }

  private broadcastUpdate(requestId: string): void {
    const status = this.bridgeStatuses.get(requestId);
    if (status) {
      const message = JSON.stringify({
        type: "bridge_update",
        data: status
      });

      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  public async start(): Promise<void> {
    try {
      // Start HTTP server
      this.app.listen(this.port, () => {
        logger.info(`Bridge relayer HTTP server started on port ${this.port}`);
      });

      logger.info("Bridge relayer service started successfully");
    } catch (error) {
      logger.error("Failed to start bridge relayer:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      this.wss.close();
      logger.info("Bridge relayer service stopped");
    } catch (error) {
      logger.error("Error stopping bridge relayer:", error);
    }
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  const relayer = new BridgeRelayer();
  
  relayer.start().catch(error => {
    logger.error("Failed to start bridge relayer:", error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down...");
    await relayer.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down...");
    await relayer.stop();
    process.exit(0);
  });
}

export default BridgeRelayer; 