/**
 * GameDin L3 - Frontend Configuration
 * 
 * This module provides a centralized configuration system for the GameDin L3 frontend,
 * including environment variables, feature flags, and runtime configuration.
 */

// Default configuration (development)
const defaultConfig = {
  // App info
  app: {
    name: 'GameDin L3',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },

  // API endpoints
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.gamedin.io/v1',
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },

  // Blockchain configuration
  blockchain: {
    defaultChainId: parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || '1', 10),
    supportedChains: [
      {
        id: 1,
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/' + (process.env.NEXT_PUBLIC_INFURA_ID || ''),
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
      },
      {
        id: 5,
        name: 'Goerli Testnet',
        rpcUrl: 'https://goerli.infura.io/v3/' + (process.env.NEXT_PUBLIC_INFURA_ID || ''),
        explorerUrl: 'https://goerli.etherscan.io',
        nativeCurrency: {
          name: 'Goerli ETH',
          symbol: 'gETH',
          decimals: 18,
        },
      },
      // Add other supported chains here
    ],
    
    // Contract addresses
    contracts: {
      gameDinToken: process.env.NEXT_PUBLIC_GAMEDIN_TOKEN_ADDRESS || '',
      gameDinL3Bridge: process.env.NEXT_PUBLIC_L3_BRIDGE_ADDRESS || '',
      gamingCore: process.env.NEXT_PUBLIC_GAMING_CORE_ADDRESS || '',
      aiOracle: process.env.NEXT_PUBLIC_AI_ORACLE_ADDRESS || '',
    },
  },

  // IPFS configuration
  ipfs: {
    gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs',
    uploadEndpoint: process.env.NEXT_PUBLIC_IPFS_UPLOAD_URL || 'https://ipfs.infura.io:5001/api/v0/add',
  },

  // Web3 configuration
  web3: {
    autoConnect: true,
    pollBalanceInterval: 10000, // 10 seconds
    pollBlockNumberInterval: 10000, // 10 seconds
    defaultGasLimit: 2000000, // Default gas limit for transactions
    defaultGasBuffer: 0.1, // 10% buffer for gas estimation
  },

  // Wallet configuration
  wallet: {
    connectTimeout: 30000, // 30 seconds
    supportedWallets: ['metamask', 'walletconnect', 'coinbase'],
    walletConnect: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      rpc: {
        1: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID || ''}`,
        5: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID || ''}`,
      },
      chains: [1, 5],
    },
  },

  // Feature flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    enableMaintenance: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
    
    // Game features
    enableMultiplayer: true,
    enableNftMarketplace: true,
    enableLeaderboards: true,
    enableAchievements: true,
    enableSocialFeatures: true,
    
    // UI features
    enableDarkMode: true,
    enableNotifications: true,
    enableTutorial: true,
  },

  // Analytics configuration
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID || '',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '',
  },

  // Performance configuration
  performance: {
    imageOptimization: true,
    lazyLoading: true,
    preloadCriticalAssets: true,
    enableServiceWorker: true,
    enableCache: true,
    cacheVersion: 'v1',
  },

  // SEO configuration
  seo: {
    defaultTitle: 'GameDin L3 - Next Generation Blockchain Gaming',
    defaultDescription: 'Experience the future of gaming with GameDin L3. Play, earn, and own your in-game assets on the blockchain.',
    defaultImage: '/images/og-image.jpg',
    siteName: 'GameDin L3',
    twitterHandle: '@GameDinL3',
  },

  // Social links
  social: {
    twitter: 'https://twitter.com/GameDinL3',
    discord: 'https://discord.gg/gamedin',
    telegram: 'https://t.me/gamedin',
    github: 'https://github.com/GameDinL3',
    medium: 'https://medium.com/gamedin',
  },
};

// Environment-specific overrides
const environmentConfigs = {
  production: {
    app: {
      name: 'GameDin L3',
    },
    features: {
      enableDebug: false,
    },
    analytics: {
      enable: true,
    },
  },
  development: {
    features: {
      enableDebug: true,
    },
    api: {
      baseUrl: 'http://localhost:3000/api',
    },
  },
  test: {
    features: {
      enableAnalytics: false,
    },
  },
};

// Merge configurations
const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = environmentConfigs[env] || {};
  
  // Deep merge default config with environment config
  const config = JSON.parse(JSON.stringify(defaultConfig));
  
  const mergeDeep = (target, source) => {
    if (source && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          mergeDeep(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    }
    return target;
  };
  
  return mergeDeep(config, envConfig);
};

// Create config instance
const config = getConfig();

// Helper functions
const getChainConfig = (chainId) => {
  return config.blockchain.supportedChains.find(chain => chain.id === chainId);
};

const isChainSupported = (chainId) => {
  return config.blockchain.supportedChains.some(chain => chain.id === chainId);
};

const getContractAddress = (contractName, chainId = null) => {
  const chainIdToUse = chainId || config.blockchain.defaultChainId;
  const chainConfig = getChainConfig(chainIdToUse);
  
  if (!chainConfig) {
    console.warn(`Chain ID ${chainIdToUse} not found in configuration`);
    return null;
  }
  
  return chainConfig.contracts?.[contractName] || config.blockchain.contracts[contractName];
};

// Export configuration and helpers
export {
  config as default,
  getChainConfig,
  isChainSupported,
  getContractAddress,
};
