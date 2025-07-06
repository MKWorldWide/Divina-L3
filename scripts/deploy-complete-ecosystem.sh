#!/bin/bash

# =============================================================================
# GameDin L3 + AthenaMist AI Complete Ecosystem Deployment Script
# =============================================================================
# This script deploys the complete gaming blockchain ecosystem with dual AI
# services, real-time gaming engine, smart contracts, and infrastructure.
# =============================================================================

set -e  # Exit on any error

# ============ CONFIGURATION ============
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="$PROJECT_ROOT/deployment.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============ LOGGING FUNCTIONS ============
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_header() {
    echo -e "${CYAN}================================================================${NC}" | tee -a "$DEPLOYMENT_LOG"
    echo -e "${CYAN}$1${NC}" | tee -a "$DEPLOYMENT_LOG"
    echo -e "${CYAN}================================================================${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# ============ SYSTEM CHECK FUNCTIONS ============
check_system_requirements() {
    log_step "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "OS: Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "OS: macOS detected"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        log_info "OS: Windows detected"
    else
        log_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
    
    # Check available memory (minimum 4GB)
    if command -v free >/dev/null 2>&1; then
        MEMORY_KB=$(free | grep Mem | awk '{print $2}')
        MEMORY_GB=$((MEMORY_KB / 1024 / 1024))
        if [ "$MEMORY_GB" -lt 4 ]; then
            log_error "Insufficient memory: ${MEMORY_GB}GB (minimum 4GB required)"
            exit 1
        fi
        log_info "Memory: ${MEMORY_GB}GB available"
    fi
    
    # Check available disk space (minimum 10GB)
    DISK_SPACE=$(df . | tail -1 | awk '{print $4}')
    DISK_SPACE_GB=$((DISK_SPACE / 1024 / 1024))
    if [ "$DISK_SPACE_GB" -lt 10 ]; then
        log_error "Insufficient disk space: ${DISK_SPACE_GB}GB (minimum 10GB required)"
        exit 1
    fi
    log_info "Disk space: ${DISK_SPACE_GB}GB available"
    
    log_success "System requirements check passed"
}

check_dependencies() {
    log_step "Checking required dependencies..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("Node.js")
    else
        NODE_VERSION=$(node --version)
        log_info "Node.js: $NODE_VERSION"
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        missing_deps+=("npm")
    else
        NPM_VERSION=$(npm --version)
        log_info "npm: $NPM_VERSION"
    fi
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        missing_deps+=("Docker")
    else
        DOCKER_VERSION=$(docker --version)
        log_info "Docker: $DOCKER_VERSION"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        missing_deps+=("Docker Compose")
    else
        COMPOSE_VERSION=$(docker-compose --version)
        log_info "Docker Compose: $COMPOSE_VERSION"
    fi
    
    # Check Git
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("Git")
    else
        GIT_VERSION=$(git --version)
        log_info "Git: $GIT_VERSION"
    fi
    
    # Check Python
    if ! command -v python3 >/dev/null 2>&1; then
        missing_deps+=("Python 3")
    else
        PYTHON_VERSION=$(python3 --version)
        log_info "Python: $PYTHON_VERSION"
    fi
    
    # Check Rust
    if ! command -v rustc >/dev/null 2>&1; then
        missing_deps+=("Rust")
    else
        RUST_VERSION=$(rustc --version)
        log_info "Rust: $RUST_VERSION"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies and run the script again"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

# ============ ENVIRONMENT SETUP ============
setup_environment() {
    log_step "Setting up deployment environment..."
    
    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/data"
    mkdir -p "$PROJECT_ROOT/config"
    mkdir -p "$PROJECT_ROOT/backups"
    mkdir -p "$PROJECT_ROOT/monitoring"
    
    # Create environment file if it doesn't exist
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_info "Creating environment configuration file..."
        cp "$PROJECT_ROOT/env.example" "$PROJECT_ROOT/.env"
        log_success "Environment file created from template"
    else
        log_info "Environment file already exists"
    fi
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
        log_success "Environment variables loaded"
    fi
    
    log_success "Environment setup completed"
}

# ============ DEPENDENCY INSTALLATION ============
install_dependencies() {
    log_step "Installing project dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install Node.js dependencies
    log_info "Installing Node.js dependencies..."
    npm install --production=false
    
    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies..."
        pip3 install -r requirements.txt
    fi
    
    # Install Rust dependencies
    if [ -f "Cargo.toml" ]; then
        log_info "Installing Rust dependencies..."
        cargo build --release
    fi
    
    # Install frontend dependencies
    if [ -d "gdi-dapp" ]; then
        log_info "Installing frontend dependencies..."
        cd gdi-dapp
        npm install
        cd ..
    fi
    
    log_success "All dependencies installed successfully"
}

# ============ BLOCKCHAIN SETUP ============
setup_blockchain() {
    log_step "Setting up blockchain infrastructure..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy smart contracts
    log_info "Deploying smart contracts..."
    
    # Deploy GDI Token
    log_info "Deploying GDI Token contract..."
    npx hardhat run scripts/deploy-gdi-token.js --network localhost
    
    # Deploy Gaming Core
    log_info "Deploying Gaming Core contract..."
    npx hardhat run scripts/deploy-gaming-core.js --network localhost
    
    # Deploy AI Oracle
    log_info "Deploying AI Oracle contract..."
    npx hardhat run scripts/deploy-ai-oracle.js --network localhost
    
    # Deploy Bridge
    log_info "Deploying Bridge contract..."
    npx hardhat run scripts/deploy-bridge.js --network localhost
    
    # Deploy NFT Marketplace
    log_info "Deploying NFT Marketplace contract..."
    npx hardhat run scripts/deploy-nft-marketplace.js --network localhost
    
    # Verify contracts
    log_info "Verifying smart contracts..."
    npx hardhat verify --network localhost
    
    log_success "Blockchain infrastructure setup completed"
}

# ============ AI SERVICES SETUP ============
setup_ai_services() {
    log_step "Setting up AI services..."
    
    cd "$PROJECT_ROOT"
    
    # Setup NovaSanctum AI
    log_info "Setting up NovaSanctum AI service..."
    if [ -d "ai/novaSanctum" ]; then
        cd ai/novaSanctum
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        python3 setup.py install
        cd ../..
    fi
    
    # Setup AthenaMist AI
    log_info "Setting up AthenaMist AI service..."
    if [ -d "ai/athenaMist" ]; then
        cd ai/athenaMist
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        python3 setup.py install
        cd ../..
    fi
    
    # Setup Unified AI Service
    log_info "Setting up Unified AI Service..."
    if [ -d "ai/unified" ]; then
        cd ai/unified
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        python3 setup.py install
        cd ../..
    fi
    
    # Train AI models
    log_info "Training AI models..."
    python3 scripts/train-ai-models.py
    
    log_success "AI services setup completed"
}

# ============ DATABASE SETUP ============
setup_database() {
    log_step "Setting up databases..."
    
    cd "$PROJECT_ROOT"
    
    # Setup PostgreSQL
    log_info "Setting up PostgreSQL database..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    log_info "Running database migrations..."
    npm run db:migrate
    
    # Seed initial data
    log_info "Seeding initial data..."
    npm run db:seed
    
    # Setup Redis
    log_info "Setting up Redis cache..."
    docker-compose up -d redis
    
    # Setup MongoDB (for analytics)
    log_info "Setting up MongoDB for analytics..."
    docker-compose up -d mongodb
    
    log_success "Database setup completed"
}

# ============ GAMING ENGINE SETUP ============
setup_gaming_engine() {
    log_step "Setting up real-time gaming engine..."
    
    cd "$PROJECT_ROOT"
    
    # Build gaming engine
    log_info "Building gaming engine..."
    npm run build:gaming-engine
    
    # Setup WebSocket server
    log_info "Setting up WebSocket server..."
    npm run setup:websocket
    
    # Setup game servers
    log_info "Setting up game servers..."
    npm run setup:game-servers
    
    # Setup load balancer
    log_info "Setting up load balancer..."
    docker-compose up -d nginx
    
    log_success "Gaming engine setup completed"
}

# ============ FRONTEND SETUP ============
setup_frontend() {
    log_step "Setting up frontend applications..."
    
    cd "$PROJECT_ROOT"
    
    # Build main dApp
    log_info "Building main gaming dApp..."
    cd gdi-dapp
    npm run build
    cd ..
    
    # Build admin dashboard
    if [ -d "admin-dashboard" ]; then
        log_info "Building admin dashboard..."
        cd admin-dashboard
        npm run build
        cd ..
    fi
    
    # Build analytics dashboard
    if [ -d "analytics-dashboard" ]; then
        log_info "Building analytics dashboard..."
        cd analytics-dashboard
        npm run build
        cd ..
    fi
    
    # Setup static file server
    log_info "Setting up static file server..."
    docker-compose up -d nginx
    
    log_success "Frontend setup completed"
}

# ============ MONITORING SETUP ============
setup_monitoring() {
    log_step "Setting up monitoring and analytics..."
    
    cd "$PROJECT_ROOT"
    
    # Setup Prometheus
    log_info "Setting up Prometheus monitoring..."
    docker-compose up -d prometheus
    
    # Setup Grafana
    log_info "Setting up Grafana dashboards..."
    docker-compose up -d grafana
    
    # Setup ELK Stack
    log_info "Setting up ELK Stack for logging..."
    docker-compose up -d elasticsearch
    docker-compose up -d logstash
    docker-compose up -d kibana
    
    # Setup Jaeger for tracing
    log_info "Setting up Jaeger tracing..."
    docker-compose up -d jaeger
    
    # Setup health checks
    log_info "Setting up health checks..."
    npm run setup:health-checks
    
    log_success "Monitoring setup completed"
}

# ============ SECURITY SETUP ============
setup_security() {
    log_step "Setting up security measures..."
    
    cd "$PROJECT_ROOT"
    
    # Generate SSL certificates
    log_info "Generating SSL certificates..."
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Setup firewall rules
    log_info "Setting up firewall rules..."
    if command -v ufw >/dev/null 2>&1; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp
        sudo ufw allow 8080/tcp
        sudo ufw enable
    fi
    
    # Setup rate limiting
    log_info "Setting up rate limiting..."
    npm run setup:rate-limiting
    
    # Setup DDoS protection
    log_info "Setting up DDoS protection..."
    docker-compose up -d ddos-guard
    
    log_success "Security setup completed"
}

# ============ DEPLOYMENT VERIFICATION ============
verify_deployment() {
    log_step "Verifying deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Check all services are running
    log_info "Checking service status..."
    
    # Check blockchain node
    if curl -s http://localhost:8545 >/dev/null; then
        log_success "Blockchain node is running"
    else
        log_error "Blockchain node is not running"
        return 1
    fi
    
    # Check WebSocket server
    if curl -s http://localhost:8080/health >/dev/null; then
        log_success "WebSocket server is running"
    else
        log_error "WebSocket server is not running"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 >/dev/null; then
        log_success "Frontend is running"
    else
        log_error "Frontend is not running"
        return 1
    fi
    
    # Check AI services
    if curl -s http://localhost:5000/health >/dev/null; then
        log_success "AI services are running"
    else
        log_error "AI services are not running"
        return 1
    fi
    
    # Check databases
    if docker-compose ps | grep -q "postgres.*Up"; then
        log_success "PostgreSQL is running"
    else
        log_error "PostgreSQL is not running"
        return 1
    fi
    
    if docker-compose ps | grep -q "redis.*Up"; then
        log_success "Redis is running"
    else
        log_error "Redis is not running"
        return 1
    fi
    
    # Check monitoring
    if curl -s http://localhost:9090 >/dev/null; then
        log_success "Prometheus is running"
    else
        log_error "Prometheus is not running"
        return 1
    fi
    
    if curl -s http://localhost:3001 >/dev/null; then
        log_success "Grafana is running"
    else
        log_error "Grafana is not running"
        return 1
    fi
    
    log_success "All services are running correctly"
}

# ============ PERFORMANCE TESTING ============
run_performance_tests() {
    log_step "Running performance tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run load tests
    log_info "Running load tests..."
    npm run test:load
    
    # Run stress tests
    log_info "Running stress tests..."
    npm run test:stress
    
    # Run AI performance tests
    log_info "Running AI performance tests..."
    npm run test:ai-performance
    
    # Run blockchain performance tests
    log_info "Running blockchain performance tests..."
    npm run test:blockchain-performance
    
    log_success "Performance tests completed"
}

# ============ BACKUP SETUP ============
setup_backups() {
    log_step "Setting up backup systems..."
    
    cd "$PROJECT_ROOT"
    
    # Create backup directories
    mkdir -p backups/database
    mkdir -p backups/config
    mkdir -p backups/logs
    
    # Setup database backups
    log_info "Setting up database backups..."
    npm run setup:db-backups
    
    # Setup configuration backups
    log_info "Setting up configuration backups..."
    cp -r config backups/config/
    
    # Setup automated backup script
    log_info "Setting up automated backup script..."
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/automated_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose exec -T postgres pg_dump -U postgres gamedin > "$BACKUP_DIR/database.sql"

# Backup configuration
cp -r config "$BACKUP_DIR/"

# Backup logs
cp -r logs "$BACKUP_DIR/"

# Compress backup
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR.tar.gz"
EOF
    
    chmod +x scripts/backup.sh
    
    # Setup cron job for automated backups
    log_info "Setting up automated backup schedule..."
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_ROOT/scripts/backup.sh") | crontab -
    
    log_success "Backup systems setup completed"
}

# ============ DOCUMENTATION GENERATION ============
generate_documentation() {
    log_step "Generating documentation..."
    
    cd "$PROJECT_ROOT"
    
    # Generate API documentation
    log_info "Generating API documentation..."
    npm run docs:generate
    
    # Generate deployment documentation
    log_info "Generating deployment documentation..."
    cat > DEPLOYMENT_COMPLETE.md << EOF
# GameDin L3 + AthenaMist AI - Deployment Complete

## Deployment Summary
- **Deployment Date:** $(date)
- **Deployment ID:** $TIMESTAMP
- **Status:** SUCCESS

## Services Deployed
- ✅ Blockchain Infrastructure (Smart Contracts)
- ✅ AI Services (NovaSanctum + AthenaMist)
- ✅ Real-time Gaming Engine
- ✅ Frontend Applications
- ✅ Database Systems
- ✅ Monitoring & Analytics
- ✅ Security Measures
- ✅ Backup Systems

## Access Information
- **Frontend:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001
- **API Documentation:** http://localhost:8080/docs
- **Monitoring:** http://localhost:9090 (Prometheus)
- **Analytics:** http://localhost:3002 (Grafana)
- **Blockchain Explorer:** http://localhost:8545

## Performance Metrics
- **Target TPS:** 10,000+
- **Transaction Cost:** $0.001
- **Finality:** 1 second
- **AI Response Time:** < 100ms
- **Gaming Latency:** < 50ms

## Next Steps
1. Configure production environment variables
2. Set up SSL certificates for production
3. Configure domain names
4. Set up monitoring alerts
5. Run security audit
6. Deploy to production

## Support
For support and questions, please refer to the documentation or contact the development team.
EOF
    
    log_success "Documentation generated successfully"
}

# ============ MAIN DEPLOYMENT FUNCTION ============
main() {
    log_header "GameDin L3 + AthenaMist AI Complete Ecosystem Deployment"
    log_info "Starting deployment at $(date)"
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Deployment Log: $DEPLOYMENT_LOG"
    
    # Initialize deployment log
    echo "GameDin L3 + AthenaMist AI Deployment Log" > "$DEPLOYMENT_LOG"
    echo "Started at: $(date)" >> "$DEPLOYMENT_LOG"
    echo "==========================================" >> "$DEPLOYMENT_LOG"
    
    # Run deployment steps
    check_system_requirements
    check_dependencies
    setup_environment
    install_dependencies
    setup_blockchain
    setup_ai_services
    setup_database
    setup_gaming_engine
    setup_frontend
    setup_monitoring
    setup_security
    verify_deployment
    run_performance_tests
    setup_backups
    generate_documentation
    
    # Final success message
    log_header "DEPLOYMENT COMPLETED SUCCESSFULLY"
    log_success "GameDin L3 + AthenaMist AI ecosystem is now running!"
    log_info "Access your applications at:"
    log_info "  - Frontend: http://localhost:3000"
    log_info "  - Admin Dashboard: http://localhost:3001"
    log_info "  - Monitoring: http://localhost:9090"
    log_info "  - Analytics: http://localhost:3002"
    
    log_info "Deployment completed at $(date)"
    log_info "Check DEPLOYMENT_COMPLETE.md for detailed information"
    
    echo "Deployment completed successfully at: $(date)" >> "$DEPLOYMENT_LOG"
}

# ============ ERROR HANDLING ============
handle_error() {
    log_error "Deployment failed at step: $1"
    log_error "Error details: $2"
    echo "Deployment failed at: $(date)" >> "$DEPLOYMENT_LOG"
    echo "Failed step: $1" >> "$DEPLOYMENT_LOG"
    echo "Error: $2" >> "$DEPLOYMENT_LOG"
    exit 1
}

# Set up error handling
trap 'handle_error "${BASH_SOURCE[0]}:${LINENO}" "$BASH_COMMAND"' ERR

# ============ SCRIPT EXECUTION ============
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 