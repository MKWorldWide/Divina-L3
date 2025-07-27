#!/usr/bin/env node

/**
 * Secret Management Setup for GameDin L3
 * 
 * This script helps set up and manage secrets for the project.
 * It supports multiple environments and integrates with AWS Secrets Manager or local .env files.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const readline = require('readline');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Environment configuration
const ENVIRONMENTS = ['development', 'staging', 'production'];
const SECRETS_DIR = path.join(__dirname, '..', 'secrets');
const ENV_TEMPLATE_PATH = path.join(__dirname, '..', 'config.example.js');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt user for input
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Generate a secure random string
const generateRandomString = (length = 64) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Initialize secrets directory and files
async function initializeSecrets() {
  try {
    // Create secrets directory if it doesn't exist
    try {
      await access(SECRETS_DIR);
      console.log('Secrets directory already exists.');
    } catch (error) {
      await mkdir(SECRETS_DIR, { recursive: true });
      console.log('Created secrets directory.');
    }

    // Read the environment template
    const template = await readFile(ENV_TEMPLATE_PATH, 'utf8');

    // Process each environment
    for (const env of ENVIRONMENTS) {
      const envPath = path.join(SECRETS_DIR, `.env.${env}`);
      
      // Skip if file already exists
      try {
        await access(envPath);
        console.log(`Environment file for ${env} already exists.`);
        continue;
      } catch (error) {
        // File doesn't exist, create it
      }

      console.log(`\nSetting up environment: ${env}`);
      console.log('='.repeat(40));

      // Generate secure values for required fields
      const envVars = {
        NODE_ENV: env,
        PORT: env === 'production' ? '80' : '3001',
        JWT_SECRET: generateRandomString(64),
        SESSION_SECRET: generateRandomString(64),
        ENCRYPTION_KEY: generateRandomString(32),
        // Add more default values as needed
      };

      // Ask for user input for other variables
      if (env === 'production') {
        envVars.RPC_URL = await question('Enter production RPC URL: ');
        envVars.ETHERSCAN_API_KEY = await question('Enter Etherscan API key: ');
        envVars.ALCHEMY_API_KEY = await question('Enter Alchemy API key: ');
        envVars.INFURA_PROJECT_ID = await question('Enter Infura Project ID: ');
      } else {
        envVars.RPC_URL = 'http://localhost:8545';
      }

      // Convert to .env format
      let envContent = `# Auto-generated .env file for ${env} environment\n`;
      envContent += `# Generated on: ${new Date().toISOString()}\n\n`;
      
      for (const [key, value] of Object.entries(envVars)) {
        envContent += `${key}=${value}\n`;
      }

      // Write the .env file
      await writeFile(envPath, envContent, { mode: 0o600 }); // Read/write for owner only
      console.log(`Created ${env} environment file at ${envPath}`);
    }

    // Create .gitignore if it doesn't exist
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    let gitignore = '';
    
    try {
      gitignore = await readFile(gitignorePath, 'utf8');
    } catch (error) {
      // .gitignore doesn't exist, create it
    }

    // Add secrets to .gitignore if not already there
    if (!gitignore.includes('# Secrets')) {
      gitignore += '\n# Secrets\nsecrets/\n';
      gitignore += '.env\n';
      gitignore += '.env.*\n';
      gitignore += '!config.example.js\n';
      gitignore += '!config.js\n';
      
      await writeFile(gitignorePath, gitignore);
      console.log('Updated .gitignore to exclude secret files');
    }

    console.log('\n✅ Secret management setup complete!');
    console.log('\nNext steps:');
    console.log('1. Review the generated .env files in the secrets/ directory');
    console.log('2. Add any additional environment-specific variables');
    console.log('3. Never commit these files to version control!');
    
  } catch (error) {
    console.error('❌ Error setting up secrets:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
initializeSecrets();
