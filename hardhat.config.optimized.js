require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');
require('solidity-coverage');
require('@nomiclabs/hardhat-etherscan');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-contract-sizer');
require('hardhat-abi-exporter');
require('hardhat-spdx-license-identifier');
require('@tenderly/hardhat-tenderly');
require('@nomiclabs/hardhat-solhint');

require('dotenv').config();

// Enable gas reporting if requested
const REPORT_GAS = process.env.REPORT_GAS?.toLowerCase() === 'true';
const ENABLE_OPTIMIZER = process.env.ENABLE_OPTIMIZER?.toLowerCase() !== 'false';

// Default network to use when none is specified
const DEFAULT_NETWORK = process.env.DEFAULT_NETWORK || 'hardhat';

// Get network RPC URLs from environment variables
const getNetworkUrl = (network) => {
  const envVar = `${network.toUpperCase()}_RPC_URL`;
  return process.env[envVar] || '';
};

// Get private keys from environment variables
const getPrivateKeys = () => {
  const keys = process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(',') : [];
  return keys.map(key => key.trim()).filter(key => key !== '');
};

// Network configurations
const networks = {
  hardhat: {
    chainId: 31337,
    allowUnlimitedContractSize: true,
    blockGasLimit: 30000000,
    gas: 2500000,
    gasPrice: 8000000000,
    initialBaseFeePerGas: 0,
    hardfork: 'london',
    mining: {
      auto: true,
      interval: 0,
    },
    forking: process.env.FORKING_ENABLED === 'true' ? {
      url: getNetworkUrl(process.env.FORKING_NETWORK || 'mainnet'),
      blockNumber: process.env.FORKING_BLOCK_NUMBER 
        ? parseInt(process.env.FORKING_BLOCK_NUMBER) 
        : undefined,
    } : undefined,
  },
  localhost: {
    url: 'http://127.0.0.1:8545',
    chainId: 31337,
  },
};

// Add testnet and mainnet configurations if RPC URLs are provided
['mainnet', 'goerli', 'sepolia', 'polygon', 'mumbai', 'optimism', 'arbitrum'].forEach(network => {
  const url = getNetworkUrl(network);
  if (url) {
    networks[network] = {
      url,
      chainId: getChainId(network),
      accounts: getPrivateKeys(),
      gasPrice: network === 'mainnet' ? 'auto' : 'auto',
      gasMultiplier: 1.5,
      timeout: 120000, // 2 minutes
    };
  }
});

// Helper function to get chain ID for known networks
function getChainId(network) {
  const chainIds = {
    mainnet: 1,
    ropsten: 3,
    rinkeby: 4,
    goerli: 5,
    kovan: 42,
    sepolia: 11155111,
    polygon: 137,
    mumbai: 80001,
    optimism: 10,
    'optimism-goerli': 420,
    arbitrum: 42161,
    'arbitrum-goerli': 421613,
  };
  return chainIds[network] || 1; // Default to mainnet if not found
}

// Solidity compiler configuration
const solidity = {
  version: '0.8.20',
  settings: {
    optimizer: {
      enabled: ENABLE_OPTIMIZER,
      runs: 200,
      details: {
        yul: true,
        yulDetails: {
          stackAllocation: true,
          optimizerSteps: 'dhfoDgvulfnTUtnIf',
        },
      },
    },
    viaIR: true, // Enable Yul IR compilation pipeline
    metadata: {
      bytecodeHash: 'ipfs',
    },
    outputSelection: {
      '*': {
        '*': ['storageLayout'],
      },
    },
  },
};

// Gas reporter configuration
const gasReporter = {
  enabled: REPORT_GAS,
  currency: 'USD', // Can be changed to ETH, BNB, etc.
  gasPrice: 20, // Gas price in gwei
  coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
  token: 'ETH', // Main token for gas reporting
  showTimeSpent: true,
  excludeContracts: [
    'mocks/',
    'test/',
    'interfaces/',
    'libraries/',
  ],
  src: 'contracts',
};

// Etherscan configuration
const etherscan = {
  apiKey: {
    // Add API keys for different networks
    mainnet: process.env.ETHERSCAN_API_KEY || '',
    goerli: process.env.ETHERSCAN_API_KEY || '',
    sepolia: process.env.ETHERSCAN_API_KEY || '',
    polygon: process.env.POLYGONSCAN_API_KEY || '',
    polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
    optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || '',
    optimisticGoerli: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || '',
    arbitrumOne: process.env.ARBISCAN_API_KEY || '',
    arbitrumGoerli: process.env.ARBISCAN_API_KEY || '',
  },
  customChains: [
    {
      network: 'optimisticGoerli',
      chainId: 420,
      urls: {
        apiURL: 'https://api-goerli-optimism.etherscan.io/api',
        browserURL: 'https://goerli-optimism.etherscan.io',
      },
    },
    // Add other custom chains as needed
  ],
};

// Contract Sizer configuration
const contractSizer = {
  alphaSort: true,
  disambiguatePaths: false,
  runOnCompile: true,
  strict: true,
  only: [':GameDin', 'AIOracle', 'GamingCore'],
};

// ABI Exporter configuration
const abiExporter = {
  path: './abis',
  runOnCompile: true,
  clear: true,
  flat: true,
  only: [':GameDin', 'AIOracle', 'GamingCore'],
  spacing: 2,
  pretty: true,
  format: 'minimal',
};

// SPDX License Identifier configuration
const spdxLicenseIdentifier = {
  overwrite: true,
  runOnCompile: true,
};

// Export the configuration
module.exports = {
  defaultNetwork: DEFAULT_NETWORK,
  networks,
  solidity,
  gasReporter,
  etherscan,
  contractSizer,
  abiExporter,
  spdxLicenseIdentifier,
  
  // Path configuration
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  
  // Typechain configuration
  typechain: {
    outDir: 'types',
    target: 'ethers-v6',
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
  },
  
  // Mocha configuration
  mocha: {
    timeout: 200000, // 200 seconds
    color: true,
    bail: false,
    parallel: true,
    jobs: 4,
  },
  
  // Tenderly configuration (if used)
  tenderly: {
    project: 'project-name',
    username: 'username',
    privateVerification: true,
  },
};

// This is a workaround for the "Cannot find module" error
// when using hardhat-gas-reporter with TypeScript
if (process.env.REPORT_GAS) {
  require('hardhat-gas-reporter');
}
