require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("dotenv").config();

// TypeScript support for tests
require("ts-node/register");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000, // Optimized for gaming contracts
      },
      viaIR: true, // Enable IR-based optimization
      evmVersion: "paris", // Latest EVM version for better optimization
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: 1000000000, // 1 gwei
      blockGasLimit: 30000000, // 30M gas limit for gaming
      allowUnlimitedContractSize: true, // Allow large contracts
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      gasPrice: 1000000000,
      allowUnlimitedContractSize: true,
    },
    testnet: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: 1000000000,
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY || "",
        },
      },
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: 1000000000,
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY || "",
        },
      },
    },
    "gamedin-l3": {
      url: process.env.L3_RPC_URL || "http://localhost:8545",
      accounts: process.env.VALIDATOR_PRIVATE_KEY ? [process.env.VALIDATOR_PRIVATE_KEY] : [],
      chainId: parseInt(process.env.CHAIN_ID || "1337420"),
      gasPrice: 1000000000, // 0.001 GDIN per transaction
      blockGasLimit: 30000000, // 30M gas for complex gaming logic
      allowUnlimitedContractSize: true,
    },
    "gamedin-l3-testnet": {
      url: process.env.L3_TESTNET_RPC_URL || "http://localhost:8546",
      accounts: process.env.TESTNET_VALIDATOR_PRIVATE_KEY ? [process.env.TESTNET_VALIDATOR_PRIVATE_KEY] : [],
      chainId: parseInt(process.env.TESTNET_CHAIN_ID || "1337421"),
      gasPrice: 1000000000,
      blockGasLimit: 30000000,
      allowUnlimitedContractSize: true,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    validator: {
      default: 1,
    },
    gamingPool: {
      default: 2,
    },
    rewardPool: {
      default: 3,
    },
    bridgeRelayer: {
      default: 4,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 1,
    showMethodSig: true,
    showTimeSpent: true,
    showOptimizations: true, // Show optimization details
  },
  mocha: {
    timeout: 120000, // 2 minutes for complex gaming tests
    require: ["ts-node/register"], // Enable TypeScript for tests
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },
  // Enhanced compiler settings for gaming optimization
  compilers: [
    {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1000000, // High optimization for gaming contracts
          details: {
            yul: true, // Enable Yul optimizer
            yulDetails: {
              optimizerSteps: "u", // Ultra optimization
            },
          },
        },
        viaIR: true,
        evmVersion: "paris",
        debug: {
          revertStrings: "strip", // Remove revert strings in production
        },
      },
    },
  ],
  // Deployment configuration
  deploy: {
    // Gaming contract deployment order
    tags: ["Settlement", "Gaming", "Bridge", "AI", "Governance"],
  },
}; 