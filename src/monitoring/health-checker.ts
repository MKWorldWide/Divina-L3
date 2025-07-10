/**
 * GameDin L3 Health Checker Service
 * 
 * Monitors the health and status of all GameDin L3 system components:
 * - Smart Contracts
 * - AI Services (NovaSanctum & AthenaMist)
 * - Gaming Engine
 * - Bridge Relayer
 * - Database Connections
 * - Blockchain Nodes
 * 
 * @author GameDin Team
 * @version 1.0.0
 */

import { ethers } from "ethers";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import winston from "winston";
import axios from "axios";
import { WebSocket } from "ws";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  defaultMeta: { service: "health-checker" },
  transports: [
    new winston.transports.File({ filename: "logs/health-error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/health-combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  responseTime: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  services: HealthStatus[];
  timestamp: string;
  uptime: number;
  version: string;
}

interface ServiceConfig {
  name: string;
  url: string;
  type: "http" | "websocket" | "blockchain";
  timeout: number;
  expectedResponse?: any;
}

class HealthChecker {
  private services: ServiceConfig[];
  private app: express.Application;
  private port: number;
  private startTime: number;
  private healthCache: Map<string, HealthStatus>;
  private cacheTimeout: number;

  constructor() {
    this.services = this.loadServiceConfigs();
    this.app = express();
    this.port = parseInt(process.env['HEALTH_PORT'] || "3003");
    this.startTime = Date.now();
    this.healthCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds

    this.setupExpress();
    this.startHealthChecks();
  }

  private loadServiceConfigs(): ServiceConfig[] {
    return [
      {
        name: "Hardhat Node",
        url: process.env['HARDHAT_RPC'] || "http://localhost:8545",
        type: "blockchain",
        timeout: 5000
      },
      {
        name: "Gaming Engine",
        url: process.env['GAMING_ENGINE_URL'] || "ws://localhost:8080",
        type: "websocket",
        timeout: 5000
      },
      {
        name: "AI Service (NovaSanctum)",
        url: process.env['AI_SERVICE_URL'] || "http://localhost:3001",
        type: "http",
        timeout: 5000,
        expectedResponse: { status: "healthy" }
      },
      {
        name: "Bridge Relayer",
        url: process.env['BRIDGE_RELAYER_URL'] || "http://localhost:3002",
        type: "http",
        timeout: 5000,
        expectedResponse: { status: "healthy" }
      },
      {
        name: "Frontend",
        url: process.env['FRONTEND_URL'] || "http://localhost:3000",
        type: "http",
        timeout: 5000
      }
    ];
  }

  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get("/health", async (req, res) => {
      try {
        const health = await this.getSystemHealth();
        const statusCode = health.overall === "healthy" ? 200 : 
                          health.overall === "degraded" ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        logger.error("Health check error:", error);
        res.status(500).json({
          error: "Health check failed",
          timestamp: new Date().toISOString()
        });
      }
    });

    // Individual service health endpoint
    this.app.get("/health/:service", async (req, res) => {
      try {
        const { service } = req.params;
        const health = await this.checkServiceHealth(service);
        res.json(health);
      } catch (error) {
        logger.error(`Service health check error for ${req.params.service}:`, error);
        res.status(404).json({
          error: "Service not found",
          service: req.params.service
        });
      }
    });

    // Metrics endpoint
    this.app.get("/metrics", async (req, res) => {
      try {
        const metrics = await this.getMetrics();
        res.json(metrics);
      } catch (error) {
        logger.error("Metrics error:", error);
        res.status(500).json({
          error: "Failed to get metrics"
        });
      }
    });

    // Status endpoint
    this.app.get("/status", (req, res) => {
      res.json({
        service: "health-checker",
        status: "running",
        uptime: Date.now() - this.startTime,
        version: "1.0.0",
        timestamp: new Date().toISOString()
      });
    });
  }

  private async checkServiceHealth(serviceName: string): Promise<HealthStatus> {
    const service = this.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const startTime = Date.now();
    let status: "healthy" | "degraded" | "unhealthy" = "unhealthy";
    let details: any = {};
    let error: string | undefined;

    try {
      switch (service.type) {
        case "http":
          details = await this.checkHttpService(service);
          status = "healthy";
          break;
        
        case "websocket":
          details = await this.checkWebSocketService(service);
          status = "healthy";
          break;
        
        case "blockchain":
          details = await this.checkBlockchainService(service);
          status = "healthy";
          break;
        
        default:
          throw new Error(`Unknown service type: ${service.type}`);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      status = "unhealthy";
    }

    const responseTime = Date.now() - startTime;
    
    const healthStatus: HealthStatus = {
      service: this.services[index]?.name || 'unknown',
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime,
      details: response.data || {},
      error: error?.message || undefined
    };

    // Cache the result
    this.healthCache.set(service.name, healthStatus);
    
    return healthStatus;
  }

  private async checkHttpService(service: ServiceConfig): Promise<any> {
    const response = await axios.get(service.url + "/health", {
      timeout: service.timeout,
      validateStatus: () => true // Don't throw on non-2xx status codes
    });

    return {
      statusCode: response.status,
      responseTime: response.headers["x-response-time"] || "unknown",
      body: response.data
    };
  }

  private async checkWebSocketService(service: ServiceConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(service.url);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }, service.timeout);

      ws.on("open", () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          connected: true,
          url: service.url
        });
      });

      ws.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private async checkBlockchainService(service: ServiceConfig): Promise<any> {
    const provider = new ethers.JsonRpcProvider(service.url);
    
    const [blockNumber, chainId] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork().then(net => net.chainId)
    ]);

    return {
      blockNumber: blockNumber.toString(),
      chainId: chainId.toString(),
      url: service.url
    };
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    const healthPromises = this.services.map(service => 
      this.checkServiceHealth(service.name)
    );

    const healthResults = await Promise.allSettled(healthPromises);
    const services: HealthStatus[] = [];

    healthResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        services.push(result.value);
      } else {
        services.push({
          service: this.services[index]?.name || 'unknown',
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          responseTime: 0,
          error: result.reason?.message || "Unknown error"
        });
      }
    });

    // Determine overall health
    const unhealthyCount = services.filter(s => s.status === "unhealthy").length;
    const degradedCount = services.filter(s => s.status === "degraded").length;
    
    let overall: "healthy" | "degraded" | "unhealthy";
    if (unhealthyCount > 0) {
      overall = "unhealthy";
    } else if (degradedCount > 0) {
      overall = "degraded";
    } else {
      overall = "healthy";
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: "1.0.0"
    };
  }

  private async getMetrics(): Promise<any> {
    const health = await this.getSystemHealth();
    
    const metrics = {
      uptime: health.uptime,
      totalServices: health.services.length,
      healthyServices: health.services.filter(s => s.status === "healthy").length,
      degradedServices: health.services.filter(s => s.status === "degraded").length,
      unhealthyServices: health.services.filter(s => s.status === "unhealthy").length,
      averageResponseTime: health.services.reduce((sum, s) => sum + s.responseTime, 0) / health.services.length,
      services: health.services.map(s => ({
        name: s.service,
        status: s.status,
        responseTime: s.responseTime
      }))
    };

    return metrics;
  }

  private startHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        await this.getSystemHealth();
        logger.debug("Periodic health check completed");
      } catch (error) {
        logger.error("Periodic health check failed:", error);
      }
    }, this.cacheTimeout);
  }

  public async start(): Promise<void> {
    try {
      this.app.listen(this.port, () => {
        logger.info(`Health checker service started on port ${this.port}`);
        logger.info(`Health endpoint: http://localhost:${this.port}/health`);
        logger.info(`Metrics endpoint: http://localhost:${this.port}/metrics`);
      });
    } catch (error) {
      logger.error("Failed to start health checker:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info("Health checker service stopped");
    } catch (error) {
      logger.error("Error stopping health checker:", error);
    }
  }
}

// Start the service if this file is run directly
if (import.meta.url === path.toFileURL(process.argv[1]).href) {
  const healthChecker = new HealthChecker();
  
  healthChecker.start().catch(error => {
    logger.error("Failed to start health checker:", error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down...");
    await healthChecker.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down...");
    await healthChecker.stop();
    process.exit(0);
  });
}

export default HealthChecker; 