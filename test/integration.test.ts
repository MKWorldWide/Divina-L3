import { ethers } from 'ethers';
import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DatabaseService } from '../database/DatabaseService';
import { BlockchainService } from '../blockchain/BlockchainService';
import { UnifiedAIService } from '../ai/UnifiedAIService';
import { GamingEngine } from '../gaming/GamingEngine';
import { NovaSanctumAI } from '../ai/NovaSanctumAI';
import { AthenaMistAI } from '../ai/AthenaMistAI';

// Import contract ABIs and addresses
import GamingCoreABI from '../artifacts/contracts/GamingCore.sol/GamingCore.json';
import GDITokenABI from '../artifacts/contracts/GDIToken.sol/GDIToken.json';
import AIOracleABI from '../artifacts/contracts/AIOracle.sol/AIOracle.json';

describe('GameDin L3 Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let databaseService: DatabaseService;
  let blockchainService: BlockchainService;
  let aiService: UnifiedAIService;
  let gamingEngine: GamingEngine;
  let novaSanctumAI: NovaSanctumAI;
  let athenaMistAI: AthenaMistAI;
  
  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Wallet;
  let gamingCoreContract: ethers.Contract;
  let gdiTokenContract: ethers.Contract;
  let aiOracleContract: ethers.Contract;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    databaseService = new DatabaseService();
    await databaseService.connect(mongoUri);
    blockchainService = new BlockchainService();
    await blockchainService.initialize();
    novaSanctumAI = new NovaSanctumAI();
    athenaMistAI = new AthenaMistAI();
    aiService = new UnifiedAIService(novaSanctumAI, athenaMistAI);
    await aiService.initialize();
    gamingEngine = new GamingEngine(databaseService, aiService, blockchainService);
    await gamingEngine.start();
    provider = new ethers.JsonRpcProvider(process.env.TEST_RPC_URL || 'http://localhost:8545');
    wallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY || '0x1234567890123456789012345678901234567890123456789012345678901234', provider);
    // Deploy test contracts
    const GamingCoreFactory = new ethers.ContractFactory(
      GamingCoreABI.abi,
      GamingCoreABI.bytecode,
      wallet
    );
    gamingCoreContract = await GamingCoreFactory.deploy();
    await gamingCoreContract.waitForDeployment();
    const GDITokenFactory = new ethers.ContractFactory(
      GDITokenABI.abi,
      GDITokenABI.bytecode,
      wallet
    );
    gdiTokenContract = await GDITokenFactory.deploy();
    await gdiTokenContract.waitForDeployment();
    const AIOracleFactory = new ethers.ContractFactory(
      AIOracleABI.abi,
      AIOracleABI.bytecode,
      wallet
    );
    aiOracleContract = await AIOracleFactory.deploy();
    await aiOracleContract.waitForDeployment();
  });

  after(async () => {
    await gamingEngine.stop();
    await aiService.shutdown();
    await blockchainService.disconnect();
    await databaseService.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await databaseService.clearTestData();
  });

  describe('Smart Contract Integration', () => {
    it('should deploy and initialize contracts correctly', async () => {
      expect(gamingCoreContract.target).to.be.a('string');
      expect(gdiTokenContract.target).to.be.a('string');
      expect(aiOracleContract.target).to.be.a('string');
    });
    it('should mint GDI tokens to test wallet', async () => {
      const mintAmount = ethers.parseEther('1000');
      await gdiTokenContract.mint(wallet.address, mintAmount);
      const balance = await gdiTokenContract.balanceOf(wallet.address);
      expect(balance).to.equal(mintAmount);
    });
    it('should allow staking GDI tokens', async () => {
      const stakeAmount = ethers.parseEther('100');
      await gdiTokenContract.approve(gamingCoreContract.target, stakeAmount);
      await gamingCoreContract.stake(stakeAmount);
      const stakedBalance = await gamingCoreContract.stakedBalance(wallet.address);
      expect(stakedBalance).to.equal(stakeAmount);
    });
  });
}); 