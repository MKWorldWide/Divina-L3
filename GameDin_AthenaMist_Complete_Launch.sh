#!/bin/bash

# GameDin L3 + AthenaMist Complete Launch Script
# Ultimate deployment script for AI-powered gaming blockchain

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
PROJECT_NAME="gamedin-l3-athenamist"
ENVIRONMENT=${1:-development}

print_header() {
    echo -e "${PURPLE}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 GameDin L3 + AthenaMist                ║"
    echo "║              Ultimate AI-Powered Gaming Blockchain           ║"
    echo "║                                                              ║"
    echo "║  🎮 Gaming Infrastructure  •  🔮 AI Integration  •  ⚡ L3   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}Environment: ${YELLOW}$ENVIRONMENT${NC}"
    echo -e "${CYAN}Project: ${YELLOW}$PROJECT_NAME${NC}"
    echo ""
}

# Check system requirements
check_system_requirements() {
    echo -e "${YELLOW}🔍 Checking system requirements...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        echo -e "${YELLOW}📥 Install Node.js: https://nodejs.org/${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed${NC}"
        exit 1
    fi
    
    # Check Docker (optional but recommended)
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️ Docker not found - some features may be limited${NC}"
    else
        echo -e "${GREEN}✅ Docker found${NC}"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is required but not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ System requirements met${NC}"
}

# Setup complete project with AthenaMist integration
setup_complete_project() {
    echo -e "${YELLOW}🏗️ Setting up complete GameDin L3 + AthenaMist project...${NC}"
    
    # Create project directory
    if [ ! -d "$PROJECT_NAME" ]; then
        mkdir -p "$PROJECT_NAME"
        echo -e "${GREEN}✅ Project directory created${NC}"
    fi
    
    cd "$PROJECT_NAME"
    
    # Run GameDin scaffold if not exists
    if [ ! -f "package.json" ]; then
        echo -e "${BLUE}📦 Running GameDin scaffold...${NC}"
        bash ../GameDin_Complete_Scaffold.sh
    fi
    
    # Run AthenaMist integration if not exists
    if [ ! -d "integrations/athenamist" ]; then
        echo -e "${BLUE}🔮 Running AthenaMist integration...${NC}"
        bash ../GameDin_AthenaMist_Integration.sh
    fi
    
    echo -e "${GREEN}✅ Complete project setup finished${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    # Install root dependencies
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found${NC}"
        exit 1
    fi
    
    # Install dependencies
    echo -e "${BLUE}⬇️ Installing npm packages...${NC}"
    npm install --silent 2>/dev/null || npm install
    
    # Install lerna if needed
    if ! command -v lerna &> /dev/null; then
        echo -e "${BLUE}📦 Installing Lerna...${NC}"
        npm install -g lerna@latest
    fi
    
    # Bootstrap monorepo
    echo -e "${BLUE}🔗 Bootstrapping monorepo...${NC}"
    npx lerna bootstrap --silent
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Setup environment configuration
setup_environment() {
    echo -e "${YELLOW}⚙️ Setting up environment configuration...${NC}"
    
    # Create environment file
    if [ ! -f ".env" ]; then
        echo -e "${BLUE}📝 Creating environment configuration...${NC}"
        cat > .env << 'EOF'
# GameDin L3 + AthenaMist Environment Configuration
GAMEDIN_NETWORK=development
SETTLEMENT_LAYER=base-sepolia
CHAIN_ID=1337420
INITIAL_SUPPLY=1000000000

# AthenaMist Integration
ATHENAMIST_API_KEY=your_athenamist_api_key_here
ATHENAMIST_API_URL=https://api.athenamist.ai/v1
ENABLE_ATHENAMIST_ANALYSIS=true
ENABLE_ATHENAMIST_FRAUD=true

# NovaSanctum Integration
NOVASANCTUM_API_KEY=your_novasanctum_api_key_here
NOVASANCTUM_API_URL=https://api.novasanctum.com/v2
ENABLE_NOVASANCTUM_ANALYSIS=true
ENABLE_NOVASANCTUM_FRAUD=true

# Unified AI Configuration
ENABLE_UNIFIED_AI=true
NOVA_SANCTUM_WEIGHT=0.6
ATHENAMIST_WEIGHT=0.4
FRAUD_DETECTION_THRESHOLD=0.8
BEHAVIOR_SCORE_THRESHOLD=0.6

# RPC Configuration
BASE_RPC_URL=https://sepolia.base.org
ETHEREUM_RPC_URL=https://eth-sepolia.rpc.api.coinbase.com/v1/YOUR_API_KEY

# Security (NEVER COMMIT REAL KEYS)
DEPLOYER_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
VALIDATOR_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# Gaming Configuration
ENABLE_GAS_SPONSORING=true
ENABLE_NFT_BATCHING=true
ENABLE_REALTIME_UPDATES=true
MAX_TPS=10000

# Database
DB_PASSWORD=gamedin_dev_password
REDIS_URL=redis://localhost:6379

# Monitoring
GRAFANA_PASSWORD=admin
PROMETHEUS_URL=http://localhost:9090

# AI Service Limits
AI_REQUESTS_PER_MINUTE=100
AI_BATCH_SIZE=50
AI_RETRY_ATTEMPTS=3
AI_TIMEOUT_MS=10000
EOF
        
        echo -e "${YELLOW}⚠️ Please update .env with your actual configuration values${NC}"
        echo -e "${YELLOW}🔑 Especially AthenaMist and NovaSanctum API keys${NC}"
    fi
    
    echo -e "${GREEN}✅ Environment configured${NC}"
}

# Setup AI services
setup_ai_services() {
    echo -e "${YELLOW}🤖 Setting up AI services...${NC}"
    
    # Create AI service configuration
    mkdir -p integrations/ai-services/config
    
    cat > integrations/ai-services/config/ai-config.js << 'EOF'
module.exports = {
  // AthenaMist Configuration
  athenaMist: {
    apiKey: process.env.ATHENAMIST_API_KEY,
    apiUrl: process.env.ATHENAMIST_API_URL,
    features: {
      aiAnalysis: process.env.ENABLE_ATHENAMIST_ANALYSIS === 'true',
      fraudDetection: process.env.ENABLE_ATHENAMIST_FRAUD === 'true',
      realtimeUpdates: true
    }
  },
  
  // NovaSanctum Configuration
  novaSanctum: {
    apiKey: process.env.NOVASANCTUM_API_KEY,
    apiUrl: process.env.NOVASANCTUM_API_URL,
    features: {
      aiAnalysis: process.env.ENABLE_NOVASANCTUM_ANALYSIS === 'true',
      fraudDetection: process.env.ENABLE_NOVASANCTUM_FRAUD === 'true',
      realtimeUpdates: true
    }
  },
  
  // Unified AI Configuration
  unified: {
    enableCombinedAnalysis: process.env.ENABLE_UNIFIED_AI === 'true',
    novaSanctumWeight: parseFloat(process.env.NOVA_SANCTUM_WEIGHT) || 0.6,
    athenaMistWeight: parseFloat(process.env.ATHENAMIST_WEIGHT) || 0.4,
    fallbackToSingle: true
  },
  
  // Performance Configuration
  performance: {
    requestsPerMinute: parseInt(process.env.AI_REQUESTS_PER_MINUTE) || 100,
    batchSize: parseInt(process.env.AI_BATCH_SIZE) || 50,
    retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS) || 3,
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS) || 10000
  }
};
EOF

    # Create AI service health checker
    cat > integrations/ai-services/health-check.js << 'EOF'
const { UnifiedAIService } = require('./src/UnifiedAIService');
const { NovaSanctumOracle } = require('../novasanctum/src/NovaSanctumOracle');
const { AthenaMistIntegration } = require('../athenamist/src/AthenaMistIntegration');
const { ethers } = require('ethers');
const config = require('./config/ai-config');

async function checkAIServicesHealth() {
    console.log('🔍 Checking AI services health...');
    
    const healthStatus = {
        athenaMist: { status: 'unknown', error: null },
        novaSanctum: { status: 'unknown', error: null },
        unified: { status: 'unknown', error: null }
    };
    
    try {
        // Test AthenaMist
        if (config.athenaMist.apiKey && config.athenaMist.apiKey !== 'your_athenamist_api_key_here') {
            const athenaMist = new AthenaMistIntegration(config.athenaMist.apiKey, null);
            await athenaMist.analyzePlayer('test', {});
            healthStatus.athenaMist.status = 'healthy';
        } else {
            healthStatus.athenaMist.status = 'not_configured';
        }
    } catch (error) {
        healthStatus.athenaMist.status = 'error';
        healthStatus.athenaMist.error = error.message;
    }
    
    try {
        // Test NovaSanctum
        if (config.novaSanctum.apiKey && config.novaSanctum.apiKey !== 'your_novasanctum_api_key_here') {
            const novaSanctum = new NovaSanctumOracle(config.novaSanctum.apiKey, null);
            await novaSanctum.getPlayerAIAnalysis('test', {});
            healthStatus.novaSanctum.status = 'healthy';
        } else {
            healthStatus.novaSanctum.status = 'not_configured';
        }
    } catch (error) {
        healthStatus.novaSanctum.status = 'error';
        healthStatus.novaSanctum.error = error.message;
    }
    
    // Overall status
    const healthyServices = Object.values(healthStatus).filter(s => s.status === 'healthy').length;
    if (healthyServices >= 1) {
        healthStatus.unified.status = 'healthy';
    } else {
        healthStatus.unified.status = 'error';
        healthStatus.unified.error = 'No AI services available';
    }
    
    console.log('📊 AI Services Health Status:');
    console.log(JSON.stringify(healthStatus, null, 2));
    
    return healthStatus;
}

if (require.main === module) {
    checkAIServicesHealth();
}

module.exports = { checkAIServicesHealth };
EOF

    echo -e "${GREEN}✅ AI services configured${NC}"
}

# Create development scripts
create_dev_scripts() {
    echo -e "${YELLOW}🛠️ Creating development scripts...${NC}"
    
    mkdir -p scripts
    
    # Quick development start script
    cat > scripts/dev-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting GameDin L3 + AthenaMist Development Environment"

# Check if Docker is running
if command -v docker &> /dev/null; then
    if ! docker info &> /dev/null; then
        echo "⚠️ Docker is not running. Starting Docker..."
        # This command may vary by OS
        open -a Docker 2>/dev/null || echo "Please start Docker manually"
        sleep 10
    fi
fi

# Check environment
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup first."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check AI services
echo "🔍 Checking AI services..."
node integrations/ai-services/health-check.js

# Start services
echo "🚀 Starting services..."

# Start L3 node
echo "⚡ Starting L3 node..."
cd l3-node && npm start &
L3_PID=$!

# Start bridge relayer
echo "🌉 Starting bridge relayer..."
cd ../bridge-relayer && npm start &
BRIDGE_PID=$!

# Start real-time engine
echo "🎮 Starting real-time engine..."
cd ../real-time-engine && npm start &
ENGINE_PID=$!

# Start frontend
echo "🌐 Starting frontend..."
cd ../frontend/gaming-portal && npm start &
FRONTEND_PID=$!

# Start AI integration
echo "🤖 Starting AI integration..."
cd ../../integrations/athenamist && node sync.js &
AI_PID=$!

echo "✅ All services started!"
echo ""
echo "🔗 Service URLs:"
echo "• L3 RPC: http://localhost:8545"
echo "• Gaming WebSocket: ws://localhost:9546"
echo "• Frontend: http://localhost:3000"
echo "• Grafana: http://localhost:3001"
echo "• Prometheus: http://localhost:9090"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $L3_PID $BRIDGE_PID $ENGINE_PID $FRONTEND_PID $AI_PID; exit" INT
wait
EOF

    chmod +x scripts/dev-start.sh
    
    # Health check script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 GameDin L3 + AthenaMist Health Check"
echo "======================================"

# Check L3 node
echo "⚡ Checking L3 node..."
if curl -s http://localhost:8545/health > /dev/null; then
    echo "✅ L3 node is healthy"
else
    echo "❌ L3 node is not responding"
fi

# Check bridge relayer
echo "🌉 Checking bridge relayer..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Bridge relayer is healthy"
else
    echo "❌ Bridge relayer is not responding"
fi

# Check real-time engine
echo "🎮 Checking real-time engine..."
if curl -s http://localhost:9546/health > /dev/null; then
    echo "✅ Real-time engine is healthy"
else
    echo "❌ Real-time engine is not responding"
fi

# Check AI services
echo "🤖 Checking AI services..."
node integrations/ai-services/health-check.js

echo ""
echo "🎉 Health check complete!"
EOF

    chmod +x scripts/health-check.sh
    
    echo -e "${GREEN}✅ Development scripts created${NC}"
}

# Deploy environment
deploy_environment() {
    echo -e "${YELLOW}🚀 Deploying $ENVIRONMENT environment...${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${BLUE}🏭 Deploying to production...${NC}"
        
        # Check if Kubernetes is available
        if command -v kubectl &> /dev/null; then
            echo -e "${BLUE}☸️ Deploying to Kubernetes...${NC}"
            kubectl apply -f infrastructure/kubernetes/
        else
            echo -e "${YELLOW}⚠️ Kubernetes not found, using Docker Compose...${NC}"
            docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
        fi
    else
        echo -e "${BLUE}🛠️ Starting development environment...${NC}"
        
        # Start development services
        if command -v docker-compose &> /dev/null; then
            docker-compose -f infrastructure/docker/docker-compose.yml up -d
        else
            echo -e "${YELLOW}⚠️ Docker Compose not found, starting manually...${NC}"
            ./scripts/dev-start.sh
        fi
    fi
    
    echo -e "${GREEN}✅ Environment deployed${NC}"
}

# Final setup and instructions
final_setup() {
    echo -e "${YELLOW}📋 Creating final setup instructions...${NC}"
    
    cat > QUICK_START.md << 'EOF'
# 🚀 GameDin L3 + AthenaMist Quick Start

## 🎯 What's Ready

✅ **Complete GameDin L3 ecosystem** with 10,000+ TPS gaming infrastructure
✅ **AthenaMist AI integration** for behavioral pattern recognition
✅ **NovaSanctum AI integration** for advanced analytics
✅ **Unified AI service** combining both AI capabilities
✅ **Production-ready infrastructure** with Docker and Kubernetes
✅ **Real-time monitoring** with Grafana and Prometheus

## 🚀 Quick Commands

### Development
```bash
# Start everything
./scripts/dev-start.sh

# Health check
./scripts/health-check.sh

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

### Production
```bash
# Deploy to production
./GameDin_AthenaMist_Complete_Launch.sh production

# Monitor
kubectl get pods -n gamedin-l3
```

### AI Integration
```bash
# Test AI services
node integrations/ai-services/health-check.js

# Sync AthenaMist
node integrations/athenamist/sync.js

# Test unified AI
npm run test:ai
```

## 🔗 Important URLs

- **L3 RPC**: http://localhost:8545
- **Gaming WebSocket**: ws://localhost:9546  
- **Frontend**: http://localhost:3000
- **Grafana Dashboard**: http://localhost:3001
- **Prometheus Metrics**: http://localhost:9090

## 🤖 AI Features

### AthenaMist AI
- **Behavioral pattern recognition**
- **Real-time fraud detection**
- **Player behavior analysis**
- **Predictive analytics**

### NovaSanctum AI
- **Advanced player analytics**
- **Transaction pattern analysis**
- **Real-time insights**
- **Predictive modeling**

### Unified AI Service
- **Combined analysis** from both AI services
- **Weighted scoring** (60% NovaSanctum, 40% AthenaMist)
- **Consensus detection** for fraud prevention
- **Fallback mechanisms** for reliability

## 📚 Documentation

- Integration Guide: `GameDin_AthenaMist_Integration_Guide.md`
- Implementation Plan: `GameDin_Layer3_Implementation_Plan.md`
- Technical Guide: `GameDin_L3_Technical_Deployment_Guide.md`
- API Documentation: `docs/api/`

## 🆘 Support

- GitHub Issues: Create an issue for bugs
- Discord: Join our development community
- Email: dev@gamedin.com
EOF

    # Display success information
    echo ""
    echo -e "${GREEN}${BOLD}🎉 GameDin L3 + AthenaMist Successfully Deployed!${NC}"
    echo ""
    echo -e "${CYAN}📊 Deployment Summary:${NC}"
    echo -e "• ${GREEN}✅ Complete GameDin L3 ecosystem${NC}"
    echo -e "• ${GREEN}✅ AthenaMist AI integration${NC}"
    echo -e "• ${GREEN}✅ NovaSanctum AI integration${NC}"
    echo -e "• ${GREEN}✅ Unified AI service${NC}"
    echo -e "• ${GREEN}✅ Production infrastructure${NC}"
    echo -e "• ${GREEN}✅ Development scripts${NC}"
    echo ""
    echo -e "${BLUE}🔗 Key URLs:${NC}"
    echo -e "• ${YELLOW}L3 RPC:${NC} http://localhost:8545"
    echo -e "• ${YELLOW}Gaming WebSocket:${NC} ws://localhost:9546"
    echo -e "• ${YELLOW}Frontend:${NC} http://localhost:3000"
    echo -e "• ${YELLOW}Grafana Dashboard:${NC} http://localhost:3001"
    echo -e "• ${YELLOW}Prometheus Metrics:${NC} http://localhost:9090"
    echo ""
    echo -e "${PURPLE}🤖 AI Integration Features:${NC}"
    echo -e "• ${GREEN}AthenaMist behavioral analysis${NC}"
    echo -e "• ${GREEN}NovaSanctum advanced analytics${NC}"
    echo -e "• ${GREEN}Unified AI consensus detection${NC}"
    echo -e "• ${GREEN}Real-time fraud prevention${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. ${CYAN}Update .env with your API keys${NC}"
    echo -e "2. ${CYAN}Configure AI service weights${NC}"
    echo -e "3. ${CYAN}Run health check: ./scripts/health-check.sh${NC}"
    echo -e "4. ${CYAN}Deploy your first AI-powered game!${NC}"
    echo ""
    echo -e "${GREEN}🚀 Your AI-powered gaming blockchain is ready to revolutionize the industry!${NC}"
}

# Main execution function
main() {
    print_header
    check_system_requirements
    setup_complete_project
    install_dependencies
    setup_environment
    setup_ai_services
    create_dev_scripts
    deploy_environment
    final_setup
}

# Help function
show_help() {
    echo -e "${CYAN}GameDin L3 + AthenaMist Complete Launch Script${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  $0 [environment]"
    echo ""
    echo -e "${YELLOW}Environments:${NC}"
    echo -e "  development  - Development environment (default)"
    echo -e "  production   - Production environment"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0              # Deploy development environment"
    echo -e "  $0 development  # Deploy development environment"
    echo -e "  $0 production   # Deploy production environment"
    echo ""
    echo -e "${YELLOW}Features:${NC}"
    echo -e "  • Complete GameDin L3 ecosystem"
    echo -e "  • AthenaMist AI integration"
    echo -e "  • NovaSanctum AI integration"
    echo -e "  • Unified AI service"
    echo -e "  • Production-ready infrastructure"
    echo -e "  • Real-time monitoring"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@" 