# GameDin L3 Complete Deployment Guide

## 🚀 Overview

This guide provides step-by-step instructions for deploying the complete GameDin L3 gaming blockchain system, including smart contracts, real-time gaming engine, AI services, and infrastructure.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18+)
- **npm** or **yarn**
- **Git**
- **Docker** (optional)
- **Terraform** (for infrastructure)
- **AWS CLI** (for cloud deployment)

### Required Accounts
- **Ethereum Wallet** with testnet/mainnet ETH
- **AWS Account** (for infrastructure)
- **GitHub Account** (for version control)

### Environment Setup
```bash
# Clone the repository
git clone https://github.com/gamedin/mkzenith.git
cd mkzenith

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

## 🔧 Environment Configuration

### 1. Blockchain Configuration
```bash
# .env file configuration
# Ethereum Networks
ETHEREUM_MAINNET_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_TESTNET_RPC=https://goerli.infura.io/v3/YOUR_PROJECT_ID
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_TESTNET_RPC=https://goerli.base.org

# GameDin L3 Network
GAMEDIN_L3_RPC=http://localhost:8545
GAMEDIN_L3_CHAIN_ID=31337

# Contract Addresses (will be populated after deployment)
GDI_TOKEN_ADDRESS=
GAMING_CORE_ADDRESS=
NOVA_SANCTUM_ORACLE_ADDRESS=
AI_ORACLE_ADDRESS=
NFT_MARKETPLACE_ADDRESS=
BRIDGE_ADDRESS=
SETTLEMENT_ADDRESS=
TOURNAMENT_ADDRESS=
```

### 2. AI Services Configuration
```bash
# AI Service Configuration
NOVA_SANCTUM_API_KEY=your_nova_sanctum_api_key
ATHENA_MIST_API_KEY=your_athena_mist_api_key
AI_SERVICE_ENDPOINT=https://api.gamedin.ai
AI_VALIDATION_ENABLED=true
AI_FRAUD_DETECTION_ENABLED=true
```

### 3. Database Configuration
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/gamedin
REDIS_URL=redis://localhost:6379
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000
```

### 4. Infrastructure Configuration
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=gamedin-storage
AWS_CLOUDFRONT_DISTRIBUTION=your_distribution_id
```

## 🏗️ Smart Contract Deployment

### Step 1: Compile Contracts
```bash
# Compile all contracts
npx hardhat compile

# Verify compilation
npx hardhat verify --list
```

### Step 2: Deploy to Local Network
```bash
# Start local Hardhat node
npx hardhat node

# In a new terminal, deploy contracts
npx hardhat run scripts/deploy-final.js --network localhost
```

### Step 3: Deploy to Testnet
```bash
# Deploy to Base Goerli testnet
npx hardhat run scripts/deploy-final.js --network base-goerli

# Verify contracts on BaseScan
npx hardhat verify --network base-goerli DEPLOYED_CONTRACT_ADDRESS
```

### Step 4: Deploy to Mainnet
```bash
# Deploy to Base mainnet
npx hardhat run scripts/deploy-final.js --network base-mainnet

# Verify contracts on BaseScan
npx hardhat verify --network base-mainnet DEPLOYED_CONTRACT_ADDRESS
```

## 🤖 AI Services Deployment

### Step 1: Deploy AI Services
```bash
# Deploy NovaSanctum AI
cd src/ai
npm run deploy:nova-sanctum

# Deploy AthenaMist AI
npm run deploy:athena-mist

# Deploy Unified AI Service
npm run deploy:unified
```

### Step 2: Configure AI Integration
```bash
# Update AI service endpoints
npx hardhat run scripts/configure-ai-services.js --network localhost

# Test AI integration
npx hardhat run scripts/test-ai-integration.js --network localhost
```

## 🎮 Gaming Engine Deployment

### Step 1: Build Gaming Engine
```bash
# Build TypeScript code
npm run build

# Build Docker image (optional)
docker build -t gamedin-gaming-engine .
```

### Step 2: Deploy Gaming Engine
```bash
# Start gaming engine
npm run start:gaming-engine

# Or using Docker
docker run -d --name gamedin-engine gamedin-gaming-engine
```

### Step 3: Configure Gaming Engine
```bash
# Update gaming engine configuration
npx hardhat run scripts/configure-gaming-engine.js --network localhost

# Test gaming engine
npx hardhat run scripts/test-gaming-operations.js --network localhost
```

## 🏆 Tournament System Deployment

### Step 1: Deploy Tournament Contract
```bash
# Deploy tournament contract
npx hardhat run scripts/deploy-tournament.js --network localhost

# Configure tournament system
npx hardhat run scripts/configure-tournament.js --network localhost
```

### Step 2: Test Tournament System
```bash
# Test tournament functionality
npx hardhat run scripts/test-tournament.js --network localhost
```

## 🌉 Bridge and Settlement Deployment

### Step 1: Deploy Bridge Contracts
```bash
# Deploy bridge contracts
npx hardhat run scripts/deploy-bridge-test.js --network localhost

# Configure bridge parameters
npx hardhat run scripts/configure-bridge.js --network localhost
```

### Step 2: Deploy Settlement System
```bash
# Deploy settlement contracts
npx hardhat run scripts/deploy-settlement.js --network localhost

# Configure settlement parameters
npx hardhat run scripts/configure-settlement.js --network localhost
```

## 🏗️ Infrastructure Deployment (AWS)

### Step 1: Initialize Terraform
```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan
```

### Step 2: Deploy Infrastructure
```bash
# Deploy to AWS
terraform apply

# Verify deployment
terraform output
```

### Step 3: Configure Monitoring
```bash
# Deploy Grafana dashboards
kubectl apply -f monitoring/grafana-dashboard.json

# Deploy Prometheus configuration
kubectl apply -f monitoring/prometheus-config.yaml
```

## 📊 Monitoring and Analytics Setup

### Step 1: Deploy Monitoring Stack
```bash
# Deploy Prometheus
kubectl apply -f monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f monitoring/grafana.yaml

# Deploy AlertManager
kubectl apply -f monitoring/alertmanager.yaml
```

### Step 2: Configure Dashboards
```bash
# Import Grafana dashboards
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana-dashboard.json
```

### Step 3: Set Up Alerting
```bash
# Configure alert rules
kubectl apply -f monitoring/alert-rules.yaml

# Test alerting
npx hardhat run scripts/test-alerts.js --network localhost
```

## 🔒 Security Configuration

### Step 1: Configure Access Control
```bash
# Set up role-based access
npx hardhat run scripts/setup-access-control.js --network localhost

# Configure emergency controls
npx hardhat run scripts/setup-emergency-controls.js --network localhost
```

### Step 2: Security Auditing
```bash
# Run security audit
npm run audit

# Run contract security analysis
npx hardhat run scripts/security-audit.js --network localhost
```

### Step 3: Penetration Testing
```bash
# Run penetration tests
npm run test:security

# Generate security report
npm run report:security
```

## 🧪 Testing and Validation

### Step 1: Unit Tests
```bash
# Run unit tests
npm test

# Run specific test suites
npm run test:contracts
npm run test:gaming
npm run test:ai
```

### Step 2: Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test cross-chain functionality
npm run test:bridge
```

### Step 3: Performance Tests
```bash
# Run performance tests
npm run test:performance

# Load testing
npm run test:load
```

### Step 4: End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Test complete gaming flow
npm run test:gaming-flow
```

## 📱 Frontend Deployment

### Step 1: Build Frontend
```bash
# Navigate to frontend directory
cd gdi-dapp

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 2: Deploy Frontend
```bash
# Deploy to AWS S3
aws s3 sync build/ s3://gamedin-frontend

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔄 Continuous Integration/Deployment

### Step 1: GitHub Actions Setup
```yaml
# .github/workflows/deploy.yml
name: Deploy GameDin L3
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:integration

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy:production
```

### Step 2: Automated Testing
```bash
# Set up automated testing
npm run setup:ci

# Configure test environments
npm run configure:test-env
```

## 📈 Performance Optimization

### Step 1: Database Optimization
```bash
# Optimize database performance
npm run optimize:database

# Set up database indexing
npm run setup:indexes
```

### Step 2: Caching Configuration
```bash
# Configure Redis caching
npm run configure:redis

# Set up CDN caching
npm run configure:cdn
```

### Step 3: Load Balancing
```bash
# Configure load balancer
npm run configure:load-balancer

# Set up auto-scaling
npm run configure:auto-scaling
```

## 🔍 Monitoring and Maintenance

### Step 1: Health Checks
```bash
# Set up health check endpoints
npm run setup:health-checks

# Configure monitoring alerts
npm run configure:alerts
```

### Step 2: Backup Strategy
```bash
# Set up automated backups
npm run setup:backups

# Configure disaster recovery
npm run configure:disaster-recovery
```

### Step 3: Logging Configuration
```bash
# Set up centralized logging
npm run setup:logging

# Configure log rotation
npm run configure:log-rotation
```

## 🚨 Troubleshooting

### Common Issues

#### Contract Deployment Failures
```bash
# Check gas limits
npx hardhat run scripts/check-gas-limits.js

# Verify network configuration
npx hardhat run scripts/verify-network.js
```

#### Gaming Engine Issues
```bash
# Check WebSocket connections
npm run check:websocket

# Verify AI service connectivity
npm run check:ai-services
```

#### Performance Issues
```bash
# Monitor system resources
npm run monitor:resources

# Check database performance
npm run check:database-performance
```

### Emergency Procedures

#### System Pause
```bash
# Pause all gaming operations
npx hardhat run scripts/emergency-pause.js --network localhost
```

#### Emergency Recovery
```bash
# Restore from backup
npm run emergency:restore

# Rollback to previous version
npm run emergency:rollback
```

## 📚 Additional Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)

### Support
- [Discord Community](https://discord.gg/gamedin)
- [GitHub Issues](https://github.com/gamedin/mkzenith/issues)
- [Documentation Wiki](https://docs.gamedin.io)

### Tools
- [GameDin CLI](./src/cli/gdi-cli.ts)
- [Deployment Scripts](./scripts/)
- [Monitoring Dashboards](./monitoring/)

---

## 🎉 Deployment Complete!

Your GameDin L3 gaming blockchain system is now fully deployed and operational. The system includes:

✅ **Smart Contracts**: All core contracts deployed and configured  
✅ **AI Services**: NovaSanctum and AthenaMist AI operational  
✅ **Gaming Engine**: Real-time gaming engine running  
✅ **Tournament System**: Tournament management active  
✅ **Bridge & Settlement**: Cross-chain operations functional  
✅ **Infrastructure**: AWS infrastructure deployed  
✅ **Monitoring**: Real-time monitoring and alerting  
✅ **Security**: Multi-layer security measures active  

**Next Steps:**
1. Test the complete system with real players
2. Monitor performance and adjust configurations
3. Scale infrastructure as needed
4. Deploy additional features and updates

**Welcome to the future of blockchain gaming!** 🚀 