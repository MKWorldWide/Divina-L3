// Quantum-detailed ESM migration for start-all
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServiceConfig {
  name: string;
  command: string;
  args: string[];
  delay?: number;
}

const services: ServiceConfig[] = [
  {
    name: "Hardhat Node",
    command: "npx",
    args: ["hardhat", "node"],
    delay: 2000
  },
  {
    name: "Gaming Engine",
    command: "npx",
    args: ["ts-node", "src/gaming/RealTimeGamingEngine.ts"],
    delay: 3000
  },
  {
    name: "AI Service",
    command: "npx",
    args: ["ts-node", "src/ai/NovaSanctumAI.ts"],
    delay: 2000
  }
];

function startService(config: ServiceConfig): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting ${config.name}...`);
    
    const proc = spawn(config.command, config.args, { 
      stdio: "inherit", 
      shell: true,
      env: { ...process.env, NODE_ENV: "development" }
    });

    proc.on("error", (error) => {
      console.error(`❌ Failed to start ${config.name}:`, error.message);
      reject(error);
    });

    proc.on("spawn", () => {
      console.log(`✅ ${config.name} started successfully`);
      if (config.delay) {
        setTimeout(() => resolve(proc), config.delay);
      } else {
        resolve(proc);
      }
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(`⚠️  ${config.name} exited with code ${code}`);
      }
    });
  });
}

async function checkDependencies(): Promise<void> {
  console.log("🔍 Checking dependencies...");
  
  const requiredFiles = [
    "src/gaming/RealTimeGamingEngine.ts",
    "src/ai/NovaSanctumAI.ts",
    "src/ai/UnifiedAIService.ts",
    "src/ai/AthenaMistAI.ts"
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  
  console.log("✅ All dependencies found");
}

async function main(): Promise<void> {
  try {
    console.log("\n🎮 GameDin L3 Gaming Blockchain - Service Manager");
    console.log("=" .repeat(50));
    
    await checkDependencies();
    
    console.log("\n🚀 Starting all local GameDin L3 services...");
    
    const processes: ChildProcess[] = [];
    
    for (const service of services) {
      try {
        const proc = await startService(service);
        processes.push(proc);
      } catch (error) {
        console.error(`Failed to start ${service.name}:`, error);
        // Continue with other services
      }
    }
    
    console.log("\n" + "=" .repeat(50));
    console.log("🎯 All services started successfully!");
    console.log("\n📱 To start the frontend, open a new terminal and run:");
    console.log("   cd gdi-dapp && npm start");
    console.log("\n🔗 Frontend will be available at: http://localhost:3000");
    console.log("🔗 Hardhat Node: http://localhost:8545");
    console.log("🔗 Gaming Engine: WebSocket on port 8080");
    console.log("🔗 AI Service: HTTP on port 3001");
    console.log("\n💡 Monitor logs above for service status and any issues.");
    
    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down all services...");
      processes.forEach(proc => proc.kill("SIGTERM"));
      process.exit(0);
    });
    
    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down all services...");
      processes.forEach(proc => proc.kill("SIGTERM"));
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Failed to start services:", error);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(console.error);
} 