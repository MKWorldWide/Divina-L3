/**
 * Configuration Template for GameDin L3
 * 
 * Copy this file to config.js and update the values as needed.
 * Make sure to never commit sensitive information to version control.
 */

module.exports = {
  // Application
  NODE_ENV: 'development', // 'development', 'staging', 'production'
  PORT: 3001,
  HOST: '0.0.0.0',
  
  // Blockchain
  CHAIN_ID: 31337, // Local Hardhat network
  RPC_URL: 'http://localhost:8545',
  PRIVATE_KEY: 'YOUR_PRIVATE_KEY', // For deployment and admin operations
  
  // Database
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/gamedin',
  DB_LOGGING: 'false', // Set to 'true' for SQL query logging in development
  
  // Redis
  REDIS_URL: 'redis://localhost:6379',
  
  // JWT Authentication
  JWT_SECRET: 'your-secret-key', // Change this in production
  JWT_EXPIRES_IN: '7d',
  
  // API Keys (replace with your actual keys)
  ETHERSCAN_API_KEY: 'YOUR_ETHERSCAN_API_KEY',
  ALCHEMY_API_KEY: 'YOUR_ALCHEMY_API_KEY',
  INFURA_PROJECT_ID: 'YOUR_INFURA_PROJECT_ID',
  
  // AI Services
  OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY',
  NOVASANCTUM_API_KEY: 'YOUR_NOVASANCTUM_API_KEY',
  
  // Monitoring
  SENTRY_DSN: 'YOUR_SENTRY_DSN',
  LOG_LEVEL: 'info', // 'error', 'warn', 'info', 'debug'
  
  // CORS
  CORS_ORIGIN: 'http://localhost:3000', // Frontend URL
  
  // Feature Flags
  ENABLE_MAINTENANCE_MODE: 'false',
  ENABLE_RATE_LIMITING: 'true',
  
  // Email (SMTP)
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: 587,
  SMTP_SECURE: 'false', // 'true' for 465, 'false' for other ports
  SMTP_USER: 'your-email@example.com',
  SMTP_PASS: 'your-email-password',
  
  // AWS (if applicable)
  AWS_ACCESS_KEY_ID: 'YOUR_AWS_ACCESS_KEY',
  AWS_SECRET_ACCESS_KEY: 'YOUR_AWS_SECRET_KEY',
  AWS_REGION: 'us-west-2',
  AWS_S3_BUCKET: 'your-s3-bucket',
  
  // API Security
  API_KEY: 'your-api-key',
  ADMIN_API_KEY: 'your-admin-api-key',
  
  // External Services
  COVALENT_API_KEY: 'YOUR_COVALENT_API_KEY',
  THE_GRAPH_API_KEY: 'YOUR_GRAPH_API_KEY',
  
  // Feature Toggles (for gradual rollouts)
  FEATURE_NEW_UI: 'false',
  FEATURE_AI_ENABLED: 'true',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX: '100', // Limit each IP to 100 requests per windowMs
};

// Helper function to get environment variables with fallbacks
function getEnv(key, defaultValue = undefined) {
  if (process.env[key] !== undefined) {
    return process.env[key];
  }
  if (this[key] !== undefined) {
    return this[key];
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${key} is required but not set`);
}

// Export the config with environment overrides
module.exports = Object.entries(module.exports).reduce((config, [key, defaultValue]) => {
  config[key] = getEnv(key, defaultValue);
  return config;
}, {});
