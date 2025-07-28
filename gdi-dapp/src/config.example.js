// Copy this file to config.js and fill in the values
// This file is tracked in version control to document required environment variables

const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // Blockchain Network Configuration
  NETWORK_ID: process.env.REACT_APP_NETWORK_ID || '31337',
  CHAIN_ID: process.env.REACT_APP_CHAIN_ID || '31337',
  RPC_URL: process.env.REACT_APP_RPC_URL || 'http://localhost:8545',
  
  // Wallet Configuration
  WALLET_CONNECT_PROJECT_ID: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'your-walletconnect-project-id',
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  
  // External Services
  ALCHEMY_API_KEY: process.env.REACT_APP_ALCHEMY_API_KEY || 'your-alchemy-api-key',
  INFURA_PROJECT_ID: process.env.REACT_APP_INFURA_PROJECT_ID || 'your-infura-project-id',
  
  // Sentry Configuration (if used)
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN || '',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  BUILD_ENV: process.env.REACT_APP_BUILD_ENV || 'development'
};

export default config;
