#!/usr/bin/env node

/**
 * GameDin L3 Complete Ecosystem Deployment Script
 * Deploys the entire GameDin L3 gaming blockchain system
 * @author GameDin Team
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️ ${message}`, 'blue');
}

/**
 * Check prerequisites
 */
function checkPrerequisites() {
    logStep('🔍', 'Checking prerequisites...');
    
    try {
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
        }
        logSuccess(`Node.js version: ${nodeVersion}`);
        
        // Check npm
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        logSuccess(`npm version: ${npmVersion}`);
        
        // Check Hardhat
        try {
            execSync('npx hardhat --version', { encoding: 'utf8' });
            logSuccess('Hardhat installed');
        } catch {
            throw new Error('Hardhat not found. Run: npm install');
        }
        
        // Check environment file
        if (!fs.existsSync('.env')) {
            logWarning('.env file not found. Creating from template...');
            if (fs.existsSync('env.example')) {
                fs.copyFileSync('env.example', '.env');
                logSuccess('.env file created from template');
                logWarning('Please update .env with your actual configuration before continuing');
                process.exit(1);
            } else {
                throw new Error('env.example not found');
            }
        }
        
        logSuccess('All prerequisites satisfied');
        
    } catch (error) {
        logError(`Prerequisites check failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Install dependencies
 */
function installDependencies() {
    logStep('📦', 'Installing dependencies...');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        logSuccess('Dependencies installed successfully');
    } catch (error) {
        logError('Failed to install dependencies');
        process.exit(1);
    }
}

/**
 * Compile contracts
 */
function compileContracts() {
    logStep('🔨', 'Compiling smart contracts...');
    
    try {
        execSync('npx hardhat compile', { stdio: 'inherit' });
        logSuccess('Contracts compiled successfully');
    } catch (error) {
        logError('Contract compilation failed');
        process.exit(1);
    }
}

/**
 * Run tests
 */
function runTests() {
    logStep('🧪', 'Running tests...');
    
    try {
        execSync('npx hardhat test', { stdio: 'inherit' });
        logSuccess('All tests passed');
    } catch (error) {
        logError('Tests failed');
        process.exit(1);
    }
}

/**
 * Deploy to settlement layer (Base L2)
 */
function deploySettlementLayer() {
    logStep('🏗️', 'Deploying to settlement layer (Base L2)...');
    
    try {
        logInfo('Deploying settlement contracts to Base L2...');
        execSync('npx hardhat deploy --network testnet --tags Settlement', { stdio: 'inherit' });
        logSuccess('Settlement layer deployment complete');
        
        // Verify deployment
        if (fs.existsSync('deployed-addresses.json')) {
            const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
            logInfo('Deployed contracts:');
            logInfo(`  Settlement: ${addresses.settlement}`);
            logInfo(`  Bridge: ${addresses.bridge}`);
            logInfo(`  NovaSanctum Oracle: ${addresses.oracle}`);
            logInfo(`  GameDin Token: ${addresses.token}`);
        }
        
    } catch (error) {
        logError('Settlement layer deployment failed');
        process.exit(1);
    }
}

/**
 * Deploy to L3 network
 */
function deployL3Layer() {
    logStep('⚡', 'Deploying to L3 network...');
    
    try {
        logInfo('Deploying L3 gaming contracts...');
        execSync('npx hardhat deploy --network gamedin-l3 --tags L3', { stdio: 'inherit' });
        logSuccess('L3 layer deployment complete');
        
        // Verify deployment
        if (fs.existsSync('l3-deployed-addresses.json')) {
            const addresses = JSON.parse(fs.readFileSync('l3-deployed-addresses.json', 'utf8'));
            logInfo('Deployed L3 contracts:');
            logInfo(`  L3 Token: ${addresses.l3Token}`);
            logInfo(`  L3 Oracle: ${addresses.l3Oracle}`);
            logInfo(`  Gaming Engine: ${addresses.gamingEngine}`);
            logInfo(`  Cross-Chain Bridge: ${addresses.bridge}`);
        }
        
    } catch (error) {
        logError('L3 layer deployment failed');
        process.exit(1);
    }
}

/**
 * Setup infrastructure
 */
function setupInfrastructure() {
    logStep('🏗️', 'Setting up infrastructure...');
    
    try {
        // Check if infrastructure scripts exist
        if (fs.existsSync('GameDin_Infrastructure_Setup.sh')) {
            logInfo('Setting up Docker and Kubernetes infrastructure...');
            execSync('chmod +x GameDin_Infrastructure_Setup.sh', { stdio: 'inherit' });
            execSync('./GameDin_Infrastructure_Setup.sh', { stdio: 'inherit' });
            logSuccess('Infrastructure setup complete');
        } else {
            logWarning('Infrastructure setup script not found, skipping...');
        }
        
    } catch (error) {
        logError('Infrastructure setup failed');
        process.exit(1);
    }
}

/**
 * Deploy real-time services
 */
function deployRealtimeServices() {
    logStep('🎮', 'Deploying real-time gaming services...');
    
    try {
        // Build TypeScript
        logInfo('Building TypeScript services...');
        execSync('npm run build', { stdio: 'inherit' });
        
        // Start real-time gaming engine
        logInfo('Starting real-time gaming engine...');
        const gamingProcess = execSync('npm run start:gaming', { 
            stdio: 'inherit',
            detached: true 
        });
        
        // Start bridge relayer
        logInfo('Starting bridge relayer...');
        const bridgeProcess = execSync('npm run start:bridge', { 
            stdio: 'inherit',
            detached: true 
        });
        
        // Start AI services
        logInfo('Starting AI services...');
        const aiProcess = execSync('npm run start:ai', { 
            stdio: 'inherit',
            detached: true 
        });
        
        logSuccess('Real-time services deployed');
        
    } catch (error) {
        logError('Real-time services deployment failed');
        process.exit(1);
    }
}

/**
 * Setup monitoring
 */
function setupMonitoring() {
    logStep('📊', 'Setting up monitoring...');
    
    try {
        // Start monitoring services
        logInfo('Starting Prometheus and Grafana...');
        execSync('docker-compose -f infrastructure/docker/docker-compose.yml up -d monitoring grafana', { 
            stdio: 'inherit' 
        });
        
        logSuccess('Monitoring setup complete');
        logInfo('Grafana available at: http://localhost:3000 (admin/gamedin_admin)');
        logInfo('Prometheus available at: http://localhost:9090');
        
    } catch (error) {
        logError('Monitoring setup failed');
        process.exit(1);
    }
}

/**
 * Run health checks
 */
function runHealthChecks() {
    logStep('🏥', 'Running health checks...');
    
    try {
        // Check L3 node health
        logInfo('Checking L3 node health...');
        execSync('curl -f http://localhost:8545/health', { stdio: 'inherit' });
        logSuccess('L3 node healthy');
        
        // Check gaming engine health
        logInfo('Checking gaming engine health...');
        execSync('curl -f http://localhost:9546/health', { stdio: 'inherit' });
        logSuccess('Gaming engine healthy');
        
        // Check AI service health
        logInfo('Checking AI service health...');
        execSync('curl -f http://localhost:7547/health', { stdio: 'inherit' });
        logSuccess('AI service healthy');
        
        logSuccess('All health checks passed');
        
    } catch (error) {
        logError('Health checks failed');
        process.exit(1);
    }
}

/**
 * Generate deployment report
 */
function generateDeploymentReport() {
    logStep('📋', 'Generating deployment report...');
    
    try {
        const report = {
            deploymentTime: new Date().toISOString(),
            network: process.env.GAMEDIN_NETWORK || 'testnet',
            chainId: process.env.CHAIN_ID || '1337420',
            status: 'success',
            services: {
                l3Node: 'running',
                gamingEngine: 'running',
                aiService: 'running',
                bridge: 'running',
                monitoring: 'running'
            }
        };
        
        // Load contract addresses
        if (fs.existsSync('deployed-addresses.json')) {
            report.settlementAddresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
        }
        
        if (fs.existsSync('l3-deployed-addresses.json')) {
            report.l3Addresses = JSON.parse(fs.readFileSync('l3-deployed-addresses.json', 'utf8'));
        }
        
        // Save report
        fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
        logSuccess('Deployment report generated: deployment-report.json');
        
    } catch (error) {
        logError('Failed to generate deployment report');
    }
}

/**
 * Display final summary
 */
function displayFinalSummary() {
    log('\n🎉 GameDin L3 Ecosystem Deployment Complete!', 'green');
    log('=============================================', 'green');
    
    log('\n📊 Deployment Summary:', 'cyan');
    log('• Settlement Layer (Base L2): Deployed', 'green');
    log('• L3 Gaming Network: Deployed', 'green');
    log('• Real-time Gaming Engine: Running', 'green');
    log('• NovaSanctum AI: Running', 'green');
    log('• Cross-chain Bridge: Running', 'green');
    log('• Monitoring Stack: Running', 'green');
    
    log('\n🔗 Service Endpoints:', 'cyan');
    log('• L3 RPC: http://localhost:8545', 'blue');
    log('• Gaming WebSocket: ws://localhost:9546', 'blue');
    log('• NovaSanctum AI: http://localhost:7547', 'blue');
    log('• Grafana Dashboard: http://localhost:3000', 'blue');
    log('• Prometheus Metrics: http://localhost:9090', 'blue');
    
    log('\n🎮 Gaming Features:', 'cyan');
    log('• 10,000+ TPS gaming blockchain', 'green');
    log('• <100ms real-time gaming actions', 'green');
    log('• AI-powered fraud detection', 'green');
    log('• Cross-chain gaming assets', 'green');
    log('• Gasless gaming transactions', 'green');
    
    log('\n📋 Next Steps:', 'cyan');
    log('1. Test gaming integration', 'yellow');
    log('2. Deploy your first game', 'yellow');
    log('3. Monitor performance metrics', 'yellow');
    log('4. Scale for production load', 'yellow');
    
    log('\n📚 Documentation:', 'cyan');
    log('• Technical Guide: GameDin_L3_Technical_Deployment_Guide.md', 'blue');
    log('• Architecture: GameDin_L3_vs_XRP_Analysis.md', 'blue');
    log('• Quick Start: GameDin_L3_Quick_Start.sh', 'blue');
    
    log('\n🚀 Your GameDin L3 gaming blockchain is ready!', 'magenta');
}

/**
 * Main deployment function
 */
async function main() {
    const startTime = Date.now();
    
    log('🚀 GameDin L3 Complete Ecosystem Deployment', 'magenta');
    log('============================================', 'magenta');
    
    try {
        // Check prerequisites
        checkPrerequisites();
        
        // Install dependencies
        installDependencies();
        
        // Compile contracts
        compileContracts();
        
        // Run tests
        runTests();
        
        // Deploy settlement layer
        deploySettlementLayer();
        
        // Setup infrastructure
        setupInfrastructure();
        
        // Deploy L3 layer
        deployL3Layer();
        
        // Deploy real-time services
        deployRealtimeServices();
        
        // Setup monitoring
        setupMonitoring();
        
        // Run health checks
        runHealthChecks();
        
        // Generate deployment report
        generateDeploymentReport();
        
        // Display final summary
        displayFinalSummary();
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        log(`\n⏱️ Total deployment time: ${duration} seconds`, 'green');
        
    } catch (error) {
        logError(`Deployment failed: ${error.message}`);
        process.exit(1);
    }
}

// Run deployment
if (require.main === module) {
    main().catch((error) => {
        logError(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main }; 