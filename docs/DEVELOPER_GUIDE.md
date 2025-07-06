# GameDin L3 + AthenaMist AI Developer Guide

## 🚀 Getting Started

Welcome to the GameDin L3 + AthenaMist AI development team! This guide will help you set up your development environment and contribute to the project.

## 📋 Prerequisites

### Required Software
- **Node.js** v18.0+ and npm
- **Python** v3.9+ and pip
- **Docker** v20.0+ and Docker Compose
- **Git** v2.30+
- **VS Code** (recommended) or your preferred IDE
- **PostgreSQL** v14+ (for local development)
- **Redis** v6.0+ (for local development)

### Required Accounts
- **GitHub** account for repository access
- **AWS** account for cloud services
- **Docker Hub** account for container registry
- **Etherscan** account for blockchain verification

## 🛠️ Development Environment Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/M-K-World-Wide/Divina-L3.git
cd Divina-L3

# Set up git hooks
cp .git-hooks/* .git/hooks/
chmod +x .git/hooks/*
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd src/ai
pip install -r requirements.txt
cd ../..

# Install development dependencies
npm install -D @types/node typescript eslint prettier
```

### Step 3: Environment Configuration

```bash
# Copy environment files
cp .env.example .env
cp .env.example .env.local
cp .env.example .env.test

# Edit environment files with your local settings
nano .env.local
```

**Example .env.local:**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gamedin_l3_dev
REDIS_URL=redis://localhost:6379

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_private_key_here

# AI Services
NOVA_SANCTUM_API_KEY=your_api_key
ATHENA_MIST_API_KEY=your_api_key

# JWT
JWT_SECRET=your_jwt_secret_here

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### Step 4: Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### Step 5: Start Development Servers

```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:frontend    # React DApp
npm run dev:api         # Express API
npm run dev:ai          # AI Services
npm run dev:blockchain  # Blockchain Service
```

## 🏗️ Project Structure

```
GameDin-L3/
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── API_REFERENCE.md    # API documentation
│   ├── DEPLOYMENT_GUIDE.md # Deployment instructions
│   └── DEVELOPER_GUIDE.md  # This file
├── src/                    # Source code
│   ├── ai/                 # AI services
│   │   ├── NovaSanctumAI.ts
│   │   ├── AthenaMistAI.ts
│   │   └── UnifiedAIService.ts
│   ├── api/                # API gateway
│   │   ├── gateway.ts
│   │   └── routes/
│   ├── blockchain/         # Blockchain services
│   │   └── BlockchainService.ts
│   ├── database/           # Database layer
│   │   └── DatabaseService.ts
│   ├── gaming/             # Gaming engine
│   │   ├── GamingEngine.ts
│   │   └── RealTimeGamingEngine.ts
│   ├── types/              # TypeScript types
│   │   └── gaming.ts
│   └── utils/              # Utility functions
│       └── gdi-token-utils.ts
├── contracts/              # Smart contracts
│   ├── GamingCore.sol
│   ├── GDIToken.sol
│   ├── Bridge.sol
│   ├── NFTMarketplace.sol
│   └── AIOracle.sol
├── gdi-dapp/               # Frontend DApp
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
├── terraform/              # Infrastructure as Code
│   ├── modules/
│   ├── main.tf
│   └── variables.tf
├── scripts/                # Deployment scripts
├── tests/                  # Test suites
└── monitoring/             # Monitoring configuration
```

## 🔧 Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### 2. Code Quality Standards

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 3. Testing

#### Unit Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:ai
npm run test:blockchain

# Run tests with coverage
npm run test:coverage
```

#### Example Test Structure
```typescript
// tests/ai/NovaSanctumAI.test.ts
import { NovaSanctumAI } from '../../src/ai/NovaSanctumAI';

describe('NovaSanctumAI', () => {
  let aiService: NovaSanctumAI;

  beforeEach(() => {
    aiService = new NovaSanctumAI();
  });

  describe('analyzePlayerBehavior', () => {
    it('should detect fraudulent behavior', async () => {
      const result = await aiService.analyzePlayerBehavior({
        playerId: 'test-player',
        gameData: { /* test data */ }
      });

      expect(result.fraudScore).toBeGreaterThan(0);
      expect(result.riskLevel).toBeDefined();
    });
  });
});
```

#### Integration Tests
```typescript
// tests/integration/game-flow.test.ts
import request from 'supertest';
import { app } from '../../src/api/gateway';

describe('Game Flow Integration', () => {
  it('should complete full game flow', async () => {
    // Create game
    const gameResponse = await request(app)
      .post('/games')
      .send({ name: 'Test Game', category: 'strategy' });

    expect(gameResponse.status).toBe(201);
    const gameId = gameResponse.body.data.game_id;

    // Join game
    const joinResponse = await request(app)
      .post(`/games/${gameId}/join`)
      .send({ wallet_address: '0x123...' });

    expect(joinResponse.status).toBe(200);
  });
});
```

### 4. Code Review Process

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
```

## 🎮 Gaming Development

### Creating New Games

```typescript
// src/gaming/games/StrategyGame.ts
import { BaseGame } from './BaseGame';
import { GameState, Player, GameResult } from '../../types/gaming';

export class StrategyGame extends BaseGame {
  constructor(gameId: string, players: Player[]) {
    super(gameId, 'strategy', players);
  }

  async initializeGame(): Promise<GameState> {
    // Initialize game state
    return {
      gameId: this.gameId,
      status: 'active',
      players: this.players,
      currentTurn: 0,
      gameData: {
        board: this.createBoard(),
        resources: this.initializeResources()
      }
    };
  }

  async processPlayerAction(playerId: string, action: any): Promise<GameState> {
    // Process player action
    const updatedState = this.validateAndApplyAction(action);
    
    // Check for game end conditions
    if (this.isGameComplete(updatedState)) {
      return this.endGame(updatedState);
    }

    return updatedState;
  }

  private createBoard(): any {
    // Create game board
    return {};
  }

  private initializeResources(): any {
    // Initialize player resources
    return {};
  }
}
```

### AI Integration

```typescript
// src/gaming/ai/GameAI.ts
import { NovaSanctumAI } from '../../ai/NovaSanctumAI';
import { AthenaMistAI } from '../../ai/AthenaMistAI';

export class GameAI {
  private novaSanctum: NovaSanctumAI;
  private athenaMist: AthenaMistAI;

  constructor() {
    this.novaSanctum = new NovaSanctumAI();
    this.athenaMist = new AthenaMistAI();
  }

  async analyzeGameState(gameState: any): Promise<any> {
    // Get fraud analysis
    const fraudAnalysis = await this.novaSanctum.analyzePlayerBehavior({
      gameData: gameState
    });

    // Get strategic recommendations
    const strategyAnalysis = await this.athenaMist.getStrategicRecommendations({
      gameContext: gameState
    });

    return {
      fraud: fraudAnalysis,
      strategy: strategyAnalysis
    };
  }
}
```

## ⛓️ Blockchain Development

### Smart Contract Development

```solidity
// contracts/GamingCore.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GamingCore is Ownable, ReentrancyGuard {
    struct Game {
        uint256 gameId;
        string name;
        address creator;
        uint256 entryFee;
        uint256 prizePool;
        GameStatus status;
        uint256 maxPlayers;
        uint256 currentPlayers;
    }

    enum GameStatus { Created, Active, Completed, Cancelled }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => bool)) public playerInGame;
    mapping(uint256 => address[]) public gamePlayers;

    event GameCreated(uint256 indexed gameId, string name, address creator);
    event PlayerJoined(uint256 indexed gameId, address player);
    event GameCompleted(uint256 indexed gameId, address winner, uint256 prize);

    function createGame(
        string memory name,
        uint256 entryFee,
        uint256 maxPlayers
    ) external payable returns (uint256) {
        require(msg.value == entryFee, "Incorrect entry fee");
        require(maxPlayers > 1, "Invalid max players");

        uint256 gameId = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            name
        )));

        games[gameId] = Game({
            gameId: gameId,
            name: name,
            creator: msg.sender,
            entryFee: entryFee,
            prizePool: entryFee,
            status: GameStatus.Created,
            maxPlayers: maxPlayers,
            currentPlayers: 1
        });

        playerInGame[gameId][msg.sender] = true;
        gamePlayers[gameId].push(msg.sender);

        emit GameCreated(gameId, name, msg.sender);
        return gameId;
    }

    function joinGame(uint256 gameId) external payable nonReentrant {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Created, "Game not available");
        require(!playerInGame[gameId][msg.sender], "Already in game");
        require(msg.value == game.entryFee, "Incorrect entry fee");
        require(game.currentPlayers < game.maxPlayers, "Game full");

        playerInGame[gameId][msg.sender] = true;
        gamePlayers[gameId].push(msg.sender);
        game.currentPlayers++;
        game.prizePool += game.entryFee;

        if (game.currentPlayers == game.maxPlayers) {
            game.status = GameStatus.Active;
        }

        emit PlayerJoined(gameId, msg.sender);
    }

    function completeGame(uint256 gameId, address winner) external onlyOwner {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(playerInGame[gameId][winner], "Winner not in game");

        game.status = GameStatus.Completed;
        
        payable(winner).transfer(game.prizePool);
        
        emit GameCompleted(gameId, winner, game.prizePool);
    }
}
```

### Contract Testing

```typescript
// tests/contracts/GamingCore.test.ts
import { ethers } from "hardhat";
import { expect } from "chai";
import { GamingCore } from "../../typechain-types";

describe("GamingCore", function () {
  let gamingCore: GamingCore;
  let owner: any;
  let player1: any;
  let player2: any;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    
    const GamingCoreFactory = await ethers.getContractFactory("GamingCore");
    gamingCore = await GamingCoreFactory.deploy();
    await gamingCore.deployed();
  });

  describe("Game Creation", function () {
    it("Should create a game with correct parameters", async function () {
      const entryFee = ethers.utils.parseEther("0.1");
      const maxPlayers = 4;

      await expect(
        gamingCore.createGame("Test Game", entryFee, maxPlayers, {
          value: entryFee
        })
      ).to.emit(gamingCore, "GameCreated");

      const game = await gamingCore.games(0);
      expect(game.name).to.equal("Test Game");
      expect(game.entryFee).to.equal(entryFee);
      expect(game.maxPlayers).to.equal(maxPlayers);
    });
  });
});
```

## 🤖 AI Development

### Creating AI Models

```python
# src/ai/models/fraud_detection.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

class FraudDetectionModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.feature_names = [
            'action_frequency',
            'response_time_variance',
            'pattern_consistency',
            'transaction_amount',
            'time_of_day'
        ]
    
    def preprocess_data(self, game_data):
        """Preprocess game data for fraud detection"""
        features = []
        for action in game_data['actions']:
            feature_vector = [
                action.get('frequency', 0),
                action.get('response_time_variance', 0),
                action.get('pattern_consistency', 1),
                action.get('transaction_amount', 0),
                action.get('time_of_day', 12)
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def train(self, training_data, labels):
        """Train the fraud detection model"""
        X = self.preprocess_data(training_data)
        y = np.array(labels)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        accuracy = self.model.score(X_test, y_test)
        print(f"Model accuracy: {accuracy:.2f}")
        
        return accuracy
    
    def predict(self, game_data):
        """Predict fraud probability"""
        features = self.preprocess_data(game_data)
        predictions = self.model.predict_proba(features)
        
        return {
            'fraud_probability': float(predictions[0][1]),
            'confidence': float(max(predictions[0])),
            'risk_level': self._get_risk_level(predictions[0][1])
        }
    
    def _get_risk_level(self, fraud_probability):
        if fraud_probability < 0.3:
            return 'low'
        elif fraud_probability < 0.7:
            return 'medium'
        else:
            return 'high'
    
    def save_model(self, filepath):
        """Save the trained model"""
        joblib.dump(self.model, filepath)
    
    def load_model(self, filepath):
        """Load a trained model"""
        self.model = joblib.load(filepath)
```

### AI Service Integration

```typescript
// src/ai/services/AIServiceManager.ts
import { NovaSanctumAI } from '../NovaSanctumAI';
import { AthenaMistAI } from '../AthenaMistAI';
import { AIResult, GameData, PlayerData } from '../../types/ai';

export class AIServiceManager {
  private novaSanctum: NovaSanctumAI;
  private athenaMist: AthenaMistAI;
  private cache: Map<string, AIResult>;

  constructor() {
    this.novaSanctum = new NovaSanctumAI();
    this.athenaMist = new AthenaMistAI();
    this.cache = new Map();
  }

  async analyzeGameData(
    gameData: GameData,
    playerData: PlayerData
  ): Promise<AIResult> {
    const cacheKey = this.generateCacheKey(gameData, playerData);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Run parallel AI analysis
    const [fraudAnalysis, strategyAnalysis] = await Promise.all([
      this.novaSanctum.analyzePlayerBehavior({
        playerId: playerData.id,
        gameData: gameData
      }),
      this.athenaMist.getStrategicRecommendations({
        playerId: playerData.id,
        gameContext: gameData
      })
    ]);

    const result: AIResult = {
      fraud: fraudAnalysis,
      strategy: strategyAnalysis,
      consensus: this.calculateConsensus(fraudAnalysis, strategyAnalysis),
      timestamp: new Date().toISOString()
    };

    // Cache result
    this.cache.set(cacheKey, result);
    
    return result;
  }

  private generateCacheKey(gameData: GameData, playerData: PlayerData): string {
    return `${playerData.id}-${gameData.gameId}-${Date.now()}`;
  }

  private calculateConsensus(fraud: any, strategy: any): any {
    // Implement consensus logic
    return {
      confidence: (fraud.confidence + strategy.confidence) / 2,
      recommendation: this.mergeRecommendations(fraud, strategy)
    };
  }

  private mergeRecommendations(fraud: any, strategy: any): any {
    // Merge recommendations from both AI services
    return {
      action: strategy.recommendedAction,
      risk: fraud.riskLevel,
      priority: this.calculatePriority(fraud, strategy)
    };
  }
}
```

## 🧪 Testing Strategy

### Test Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/________\  Unit Tests (Many)
```

### Unit Testing

```typescript
// tests/unit/ai/NovaSanctumAI.test.ts
import { NovaSanctumAI } from '../../../src/ai/NovaSanctumAI';
import { mockGameData, mockPlayerData } from '../../mocks/data';

describe('NovaSanctumAI Unit Tests', () => {
  let aiService: NovaSanctumAI;

  beforeEach(() => {
    aiService = new NovaSanctumAI();
  });

  describe('analyzePlayerBehavior', () => {
    it('should return fraud score for valid input', async () => {
      const result = await aiService.analyzePlayerBehavior({
        playerId: 'test-player',
        gameData: mockGameData
      });

      expect(result).toHaveProperty('fraudScore');
      expect(result.fraudScore).toBeGreaterThanOrEqual(0);
      expect(result.fraudScore).toBeLessThanOrEqual(1);
    });

    it('should handle invalid input gracefully', async () => {
      await expect(
        aiService.analyzePlayerBehavior({
          playerId: '',
          gameData: null
        })
      ).rejects.toThrow('Invalid input data');
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/game-flow.test.ts
import { GamingEngine } from '../../src/gaming/GamingEngine';
import { AIServiceManager } from '../../src/ai/services/AIServiceManager';
import { DatabaseService } from '../../src/database/DatabaseService';

describe('Game Flow Integration', () => {
  let gamingEngine: GamingEngine;
  let aiManager: AIServiceManager;
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.connect();
    
    aiManager = new AIServiceManager();
    gamingEngine = new GamingEngine(dbService, aiManager);
  });

  afterAll(async () => {
    await dbService.disconnect();
  });

  it('should complete full game with AI integration', async () => {
    // Create game
    const game = await gamingEngine.createGame({
      name: 'Test Strategy Game',
      category: 'strategy',
      maxPlayers: 2
    });

    // Join players
    const player1 = await gamingEngine.joinGame(game.id, 'player1');
    const player2 = await gamingEngine.joinGame(game.id, 'player2');

    // Play game
    await gamingEngine.processAction(game.id, player1.id, {
      type: 'move',
      data: { x: 1, y: 1 }
    });

    // Verify AI analysis was performed
    const gameState = await gamingEngine.getGameState(game.id);
    expect(gameState.aiInsights).toBeDefined();
    expect(gameState.aiInsights.fraud).toBeDefined();
    expect(gameState.aiInsights.strategy).toBeDefined();
  });
});
```

### Performance Testing

```typescript
// tests/performance/load-test.ts
import { GamingEngine } from '../../src/gaming/GamingEngine';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  let gamingEngine: GamingEngine;

  beforeEach(() => {
    gamingEngine = new GamingEngine();
  });

  it('should handle 1000 concurrent game actions', async () => {
    const startTime = performance.now();
    
    const promises = Array.from({ length: 1000 }, (_, i) =>
      gamingEngine.processAction('test-game', `player-${i}`, {
        type: 'action',
        data: { value: i }
      })
    );

    await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should maintain response time under load', async () => {
    const responseTimes: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await gamingEngine.processAction('test-game', 'player', {
        type: 'action',
        data: { value: i }
      });
      const end = performance.now();
      responseTimes.push(end - start);
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(100); // Average response time < 100ms
  });
});
```

## 🔧 Development Tools

### VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "ms-vscode.vscode-terraform"
  ]
}
```

### Debugging Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/api/gateway.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/gdi-dapp/src"
    }
  ]
}
```

### Git Hooks

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run linting
npm run lint

# Run tests
npm run test:unit

# Check formatting
npm run format:check

# Type checking
npm run type-check
```

## 📚 Learning Resources

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [AWS Documentation](https://docs.aws.amazon.com/)

### Courses
- [Blockchain Development](https://cryptozombies.io/)
- [AI/ML Fundamentals](https://www.coursera.org/learn/machine-learning)
- [System Design](https://www.educative.io/courses/grokking-the-system-design-interview)

### Books
- "Clean Code" by Robert C. Martin
- "Design Patterns" by Gang of Four
- "Building Microservices" by Sam Newman

## 🤝 Contributing

### Code Review Guidelines

1. **Functionality**: Does the code work as intended?
2. **Performance**: Is the code efficient and scalable?
3. **Security**: Are there any security vulnerabilities?
4. **Maintainability**: Is the code readable and well-documented?
5. **Testing**: Are there adequate tests?

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Implement your feature
3. **Write Tests**: Add unit and integration tests
4. **Update Documentation**: Update relevant documentation
5. **Submit PR**: Create pull request with detailed description
6. **Code Review**: Address review comments
7. **Merge**: Merge after approval

### Commit Message Convention

```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U username -d database_name

# Reset database
npm run db:reset
```

#### Docker Issues
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker-compose down
docker-compose up --build
```

#### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Blockchain Issues
```bash
# Check network connection
npx hardhat node

# Reset local blockchain
npx hardhat clean
npx hardhat compile
```

---

This developer guide provides comprehensive information for contributing to the GameDin L3 + AthenaMist AI project. For additional support, please reach out to the development team or check the project documentation. 