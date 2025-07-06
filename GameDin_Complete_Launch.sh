#!/bin/bash

# GameDin L3 Complete Launch Script
# Ultimate deployment script for the complete gaming ecosystem with NovaSanctum integration

set -e

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
PROJECT_NAME="gamedin-l3-ecosystem"
VERSION="1.0.0"
DEPLOYMENT_TYPE="${1:-development}"

# ASCII Art Header
print_header() {
    echo -e "${PURPLE}${BOLD}"
    cat << 'EOF'
   ▄████  ▄▄▄       ███▄ ▄███▓▓█████ ▓█████▄  ██▓ ███▄    █     ██▓     ▓█████▄ 
  ██▒ ▀█▒▒████▄    ▓██▒▀█▀ ██▒▓█   ▀ ▒██▀ ██▌▓██▒ ██ ▀█   █    ▓██▒     ▒██▀ ██▌
 ▒██░▄▄▄░▒██  ▀█▄  ▓██    ▓██░▒███   ░██   █▌▒██▒▓██  ▀█ ██▒   ▒██░     ░██   █▌
 ░▓█  ██▓░██▄▄▄▄██ ▒██    ▒██ ▒▓█  ▄ ░▓█▄   ▌░██░▓██▒  ▐▌██▒   ▒██░     ░▓█▄   ▌
 ░▒▓███▀▒ ▓█   ▓██▒▒██▒   ░██▒░▒████▒░▒████▓ ░██░▒██░   ▓██░   ░██████▒ ░▒████▓ 
  ░▒   ▒  ▒▒   ▓▒█░░ ▒░   ░  ░░░ ▒░ ░ ▒▒▓  ▒ ░▓  ░ ▒░   ▒ ▒    ░ ▒░▓  ░  ▒▒▓  ▒ 
   ░   ░   ▒   ▒▒ ░░  ░      ░ ░ ░  ░ ░ ▒  ▒  ▒ ░░ ░░   ░ ▒░   ░ ░ ▒  ░  ░ ▒  ▒ 

        🚀 Layer 3 Gaming Blockchain with NovaSanctum AI Integration
        ================================================================
EOF
    echo -e "${NC}"
    echo -e "${CYAN}🌟 Welcome to the Future of Gaming Blockchain Infrastructure!${NC}"
    echo -e "${BLUE}Version: ${VERSION} | Deployment: ${DEPLOYMENT_TYPE}${NC}"
    echo ""
}

# Check system requirements
check_system_requirements() {
    echo -e "${YELLOW}🔍 Checking system requirements...${NC}"
    
    local requirements=(
        "node:Node.js 18+"
        "npm:NPM Package Manager"
        "docker:Docker Engine"
        "git:Git Version Control"
        "curl:HTTP Client"
    )
    
    local missing=()
    
    for req in "${requirements[@]}"; do
        local cmd="${req%:*}"
        local desc="${req#*:}"
        
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$desc")
            echo -e "  ${RED}❌ $desc${NC}"
        else
            echo -e "  ${GREEN}✅ $desc${NC}"
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}💥 Missing requirements: ${missing[*]}${NC}"
        echo -e "${YELLOW}Please install the missing components and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All system requirements satisfied${NC}"
    echo ""
}

# Setup complete project structure
setup_complete_project() {
    echo -e "${YELLOW}🏗️ Setting up complete GameDin L3 ecosystem...${NC}"
    
    if [ -d "$PROJECT_NAME" ]; then
        echo -e "${CYAN}📁 Project directory exists, updating...${NC}"
        cd "$PROJECT_NAME"
    else
        echo -e "${CYAN}📁 Creating new project directory...${NC}"
        mkdir -p "$PROJECT_NAME"
        cd "$PROJECT_NAME"
    fi
    
    # Run the complete scaffold
    echo -e "${BLUE}🔧 Running complete scaffold...${NC}"
    if [ -f "../GameDin_Complete_Scaffold.sh" ]; then
        chmod +x "../GameDin_Complete_Scaffold.sh"
        "../GameDin_Complete_Scaffold.sh"
    else
        echo -e "${YELLOW}⚠️ Complete scaffold not found, creating basic structure...${NC}"
        # Create basic structure if scaffold is missing
        mkdir -p {core,l3-node,gaming-sdk,real-time-engine,bridge-relayer,frontend,integrations/novasanctum}
    fi
    
    # Run infrastructure setup
    echo -e "${BLUE}🏗️ Setting up infrastructure...${NC}"
    if [ -f "../GameDin_Infrastructure_Setup.sh" ]; then
        chmod +x "../GameDin_Infrastructure_Setup.sh"
        "../GameDin_Infrastructure_Setup.sh"
    fi
    
    echo -e "${GREEN}✅ Project structure created${NC}"
}

# Initialize and install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${CYAN}📄 Creating package.json...${NC}"
        cat > package.json << 'EOF'
{
  "name": "gamedin-l3-ecosystem",
  "version": "1.0.0",
  "description": "GameDin Layer 3 Gaming Blockchain Ecosystem with NovaSanctum Integration",
  "private": true,
  "workspaces": [
    "core",
    "l3-node",
    "gaming-sdk",
    "real-time-engine",
    "bridge-relayer",
    "frontend/*",
    "integrations/*"
  ],
  "scripts": {
    "install:all": "npm install && npm run bootstrap",
    "bootstrap": "lerna bootstrap",
    "build": "lerna run build",
    "test": "lerna run test",
    "start:dev": "./infrastructure/scripts/deploy-dev.sh",
    "start:prod": "./infrastructure/scripts/deploy-production.sh",
    "novasanctum:sync": "node integrations/novasanctum/sync.js",
    "analytics": "node tools/analytics.js"
  },
  "devDependencies": {
    "lerna": "^7.1.5",
    "concurrently": "^8.2.0"
  }
}
EOF
    fi
    
    # Install dependencies
    echo -e "${BLUE}⬇️ Installing npm packages...${NC}"
    npm install --silent 2>/dev/null || npm install
    
    # Install lerna if needed
    if ! command -v lerna &> /dev/null; then
        echo -e "${BLUE}📦 Installing Lerna...${NC}"
        npm install -g lerna@latest
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Setup environment configuration
setup_environment() {
    echo -e "${YELLOW}⚙️ Setting up environment configuration...${NC}"
    
    # Create environment file
    if [ ! -f ".env" ]; then
        echo -e "${BLUE}📝 Creating environment configuration...${NC}"
        cat > .env << 'EOF'
# GameDin L3 Environment Configuration
GAMEDIN_NETWORK=development
SETTLEMENT_LAYER=base-sepolia
CHAIN_ID=1337420
INITIAL_SUPPLY=1000000000

# NovaSanctum Integration
NOVASANCTUM_API_KEY=your_novasanctum_api_key_here
NOVASANCTUM_API_URL=https://api.novasanctum.com/v2
ENABLE_AI_ANALYSIS=true
ENABLE_FRAUD_DETECTION=true

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
EOF
        
        echo -e "${YELLOW}⚠️ Please update .env with your actual configuration values${NC}"
        echo -e "${YELLOW}🔑 Especially NovaSanctum API key and RPC URLs${NC}"
    fi
    
    echo -e "${GREEN}✅ Environment configured${NC}"
}

# Setup NovaSanctum integration
setup_novasanctum() {
    echo -e "${YELLOW}🔮 Setting up NovaSanctum AI integration...${NC}"
    
    mkdir -p integrations/novasanctum/src
    
    # Create NovaSanctum configuration
    cat > integrations/novasanctum/config.js << 'EOF'
module.exports = {
  apiKey: process.env.NOVASANCTUM_API_KEY,
  apiUrl: process.env.NOVASANCTUM_API_URL || 'https://api.novasanctum.com/v2',
  features: {
    aiAnalysis: process.env.ENABLE_AI_ANALYSIS === 'true',
    fraudDetection: process.env.ENABLE_FRAUD_DETECTION === 'true',
    realtimeUpdates: true,
    behaviorAnalytics: true
  },
  limits: {
    requestsPerMinute: 100,
    batchSize: 50,
    retryAttempts: 3
  }
};
EOF

    # Create integration sync script
    cat > integrations/novasanctum/sync.js << 'EOF'
const { NovaSanctumOracle } = require('./src/NovaSanctumOracle');
const { ethers } = require('ethers');
const config = require('./config');

async function syncNovaSanctum() {
    console.log('🔮 Starting NovaSanctum synchronization...');
    
    try {
        // Initialize provider
        const provider = new ethers.providers.JsonRpcProvider(
            process.env.L3_RPC_URL || 'http://localhost:8545'
        );
        
        // Initialize NovaSanctum Oracle
        const oracle = new NovaSanctumOracle(config.apiKey, provider);
        
        // Test connection
        console.log('🔍 Testing NovaSanctum connection...');
        const testResult = await oracle.testConnection();
        
        if (testResult.success) {
            console.log('✅ NovaSanctum connection successful');
            console.log(`📊 API Status: ${testResult.status}`);
            console.log(`🎯 Features Available: ${testResult.features.join(', ')}`);
        } else {
            console.error('❌ NovaSanctum connection failed:', testResult.error);
            return;
        }
        
        // Start real-time integration if enabled
        if (config.features.realtimeUpdates) {
            console.log('🔄 Starting real-time integration...');
            await oracle.startRealtimeIntegration();
            console.log('✅ Real-time integration active');
        }
        
        console.log('🎉 NovaSanctum synchronization complete!');
        
    } catch (error) {
        console.error('💥 NovaSanctum synchronization failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    syncNovaSanctum();
}

module.exports = { syncNovaSanctum };
EOF

    echo -e "${GREEN}✅ NovaSanctum integration configured${NC}"
}

# Create development scripts
create_dev_scripts() {
    echo -e "${YELLOW}🛠️ Creating development scripts...${NC}"
    
    mkdir -p scripts
    
    # Quick development start script
    cat > scripts/dev-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting GameDin L3 Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start infrastructure
echo "🐳 Starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Deploy contracts
echo "📋 Deploying contracts..."
cd core && npm run deploy:local

# Start real-time engine
echo "🎮 Starting gaming engine..."
cd ../real-time-engine && npm start &

# Start NovaSanctum integration
echo "🔮 Starting NovaSanctum integration..."
npm run novasanctum:sync &

echo "✅ Development environment ready!"
echo "🔗 L3 RPC: http://localhost:8545"
echo "🎮 Gaming WebSocket: ws://localhost:9546"
echo "📊 Grafana: http://localhost:3000"
EOF

    chmod +x scripts/dev-start.sh

    # Production health check script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "🏥 GameDin L3 Health Check"
echo "=========================="

# Check L3 node
echo "🔍 Checking L3 node..."
if curl -s http://localhost:8545/health > /dev/null; then
    echo "✅ L3 node is healthy"
else
    echo "❌ L3 node is not responding"
fi

# Check gaming engine
echo "🎮 Checking gaming engine..."
if curl -s http://localhost:9546/health > /dev/null; then
    echo "✅ Gaming engine is healthy"
else
    echo "❌ Gaming engine is not responding"
fi

# Check NovaSanctum integration
echo "🔮 Checking NovaSanctum integration..."
if node -e "
const config = require('./integrations/novasanctum/config');
if (config.apiKey && config.apiKey !== 'your_novasanctum_api_key_here') {
    console.log('✅ NovaSanctum API key configured');
} else {
    console.log('❌ NovaSanctum API key not configured');
}
"; then
    echo "API key check completed"
fi

echo "🎉 Health check completed"
EOF

    chmod +x scripts/health-check.sh

    echo -e "${GREEN}✅ Development scripts created${NC}"
}

# Deploy based on type
deploy_environment() {
    echo -e "${YELLOW}🚀 Deploying ${DEPLOYMENT_TYPE} environment...${NC}"
    
    case $DEPLOYMENT_TYPE in
        "development"|"dev")
            echo -e "${BLUE}🧪 Starting development deployment...${NC}"
            
            # Make scripts executable
            chmod +x scripts/dev-start.sh infrastructure/scripts/deploy-dev.sh 2>/dev/null || true
            
            # Run development deployment
            if [ -f "infrastructure/scripts/deploy-dev.sh" ]; then
                ./infrastructure/scripts/deploy-dev.sh
            else
                echo -e "${CYAN}📦 Starting basic development environment...${NC}"
                ./scripts/dev-start.sh
            fi
            ;;
            
        "production"|"prod")
            echo -e "${RED}🏭 Starting production deployment...${NC}"
            echo -e "${YELLOW}⚠️ This will deploy to production infrastructure!${NC}"
            read -p "Are you sure? (yes/no): " confirm
            
            if [ "$confirm" = "yes" ]; then
                chmod +x infrastructure/scripts/deploy-production.sh 2>/dev/null || true
                ./infrastructure/scripts/deploy-production.sh
            else
                echo -e "${BLUE}Deployment cancelled${NC}"
                exit 0
            fi
            ;;
            
        "test"|"testing")
            echo -e "${PURPLE}🧪 Running test suite...${NC}"
            npm run test
            ;;
            
        *)
            echo -e "${RED}❌ Unknown deployment type: $DEPLOYMENT_TYPE${NC}"
            echo -e "${YELLOW}Available options: development, production, test${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ ${DEPLOYMENT_TYPE} deployment completed${NC}"
}

# Final setup and information
final_setup() {
    echo -e "${YELLOW}🎯 Final setup and information...${NC}"
    
    # Create quick reference guide
    cat > QUICK_START.md << 'EOF'
# GameDin L3 Quick Start Guide

## 🚀 Quick Commands

### Development
```bash
# Start everything
npm run start:dev

# Health check
./scripts/health-check.sh

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

### Production
```bash
# Deploy to production
npm run start:prod

# Monitor
kubectl get pods -n gamedin-l3
```

### NovaSanctum Integration
```bash
# Sync NovaSanctum data
npm run novasanctum:sync

# Test AI features
node integrations/novasanctum/test-ai.js
```

## 🔗 Important URLs

- **L3 RPC**: http://localhost:8545
- **Gaming WebSocket**: ws://localhost:9546  
- **Grafana Dashboard**: http://localhost:3000
- **Prometheus Metrics**: http://localhost:9090

## 📚 Documentation

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
    echo -e "${GREEN}${BOLD}🎉 GameDin L3 Ecosystem Successfully Deployed!${NC}"
    echo ""
    echo -e "${CYAN}📊 Deployment Summary:${NC}"
    echo -e "• ${GREEN}✅ Project structure created${NC}"
    echo -e "• ${GREEN}✅ Dependencies installed${NC}"
    echo -e "• ${GREEN}✅ Environment configured${NC}"
    echo -e "• ${GREEN}✅ NovaSanctum AI integration ready${NC}"
    echo -e "• ${GREEN}✅ Infrastructure deployed${NC}"
    echo -e "• ${GREEN}✅ Development scripts created${NC}"
    echo ""
    echo -e "${BLUE}🔗 Key URLs:${NC}"
    echo -e "• ${YELLOW}L3 RPC:${NC} http://localhost:8545"
    echo -e "• ${YELLOW}Gaming WebSocket:${NC} ws://localhost:9546"
    echo -e "• ${YELLOW}Grafana Dashboard:${NC} http://localhost:3000"
    echo -e "• ${YELLOW}Prometheus Metrics:${NC} http://localhost:9090"
    echo ""
    echo -e "${PURPLE}🔮 NovaSanctum Features:${NC}"
    echo -e "• ${GREEN}AI-powered player analysis${NC}"
    echo -e "• ${GREEN}Real-time fraud detection${NC}"
    echo -e "• ${GREEN}Dynamic reward optimization${NC}"
    echo -e "• ${GREEN}Behavioral pattern recognition${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. ${CYAN}Update .env with your API keys${NC}"
    echo -e "2. ${CYAN}Configure NovaSanctum integration${NC}"
    echo -e "3. ${CYAN}Run health check: ./scripts/health-check.sh${NC}"
    echo -e "4. ${CYAN}Deploy your first game!${NC}"
    echo ""
    echo -e "${GREEN}🚀 Your GameDin L3 ecosystem is ready to revolutionize gaming!${NC}"
}

# Main execution function
main() {
    print_header
    check_system_requirements
    setup_complete_project
    install_dependencies
    setup_environment
    setup_novasanctum
    create_dev_scripts
    deploy_environment
    final_setup
}

# Help function
show_help() {
    echo "GameDin L3 Complete Launch Script"
    echo ""
    echo "Usage: $0 [deployment_type]"
    echo ""
    echo "Deployment Types:"
    echo "  development  - Start development environment (default)"
    echo "  production   - Deploy to production infrastructure"
    echo "  test         - Run test suite"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start development environment"
    echo "  $0 development        # Start development environment"
    echo "  $0 production         # Deploy to production"
    echo "  $0 test              # Run tests"
    echo ""
    echo "Environment Variables:"
    echo "  NOVASANCTUM_API_KEY  - Your NovaSanctum API key"
    echo "  BASE_RPC_URL         - Base network RPC URL"
    echo "  ETHEREUM_RPC_URL     - Ethereum RPC URL"
}

# Handle script arguments
case "${1:-}" in
    "-h"|"--help"|"help")
        show_help
        exit 0
        ;;
    "")
        DEPLOYMENT_TYPE="development"
        ;;
    *)
        DEPLOYMENT_TYPE="$1"
        ;;
esac

# Trap to handle interruption
trap 'echo -e "\n${YELLOW}⚠️ Deployment interrupted by user${NC}"; exit 130' INT

# Run main function
main "$@" 