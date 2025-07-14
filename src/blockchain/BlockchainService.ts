/**
 * @file BlockchainService.ts
 * @description Blockchain service for GameDin L3 ecosystem
 * @dev Handles all blockchain interactions including smart contract calls, transaction management, and cross-chain operations
 * @dev Supports multiple networks and provides real-time blockchain data
 */

import { ethers, Contract, Wallet, providers } from 'ethers';
import type { 
    GameResult, 
    BlockchainTransaction, 
    SmartContractCall,
    NetworkConfig,
    BridgeTransaction,
    CrossChainTransfer
} from '../types/gaming';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../database/DatabaseService';

/**
 * @interface BlockchainConfig
 * @description Blockchain service configuration
 */
export interface BlockchainConfig {
    networks: {
        [networkId: string]: NetworkConfig;
    };
    defaultNetwork: string;
    gasLimit: number;
    gasPrice: number;
    maxRetries: number;
    retryDelay: number;
    confirmations: number;
    bridgeEnabled: boolean;
    crossChainEnabled: boolean;
    monitoringEnabled: boolean;
}

/**
 * @interface ContractAddresses
 * @description Smart contract addresses
 */
export interface ContractAddresses {
    gamingCore: string;
    gdiToken: string;
    aiOracle: string;
    bridge: string;
    nftMarketplace: string;
    treasury: string;
}

/**
 * @interface BlockchainMetrics
 * @description Blockchain performance metrics
 */
export interface BlockchainMetrics {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageGasUsed: number;
    averageTransactionTime: number;
    pendingTransactions: number;
    networkLatency: number;
    crossChainTransfers: number;
    bridgeTransactions: number;
}

/**
 * @class BlockchainService
 * @description Blockchain service for GameDin L3
 */
export class BlockchainService {
    private config: BlockchainConfig;
    private logger: Logger;
    private database: DatabaseService;
    private providers: Map<string, providers.Provider> = new Map();
    private wallets: Map<string, Wallet> = new Map();
    private contracts: Map<string, Contract> = new Map();
    private isInitialized: boolean = false;
    
    // Performance metrics
    private metrics: BlockchainMetrics = {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        averageGasUsed: 0,
        averageTransactionTime: 0,
        pendingTransactions: 0,
        networkLatency: 0,
        crossChainTransfers: 0,
        bridgeTransactions: 0
    };

    constructor(config: BlockchainConfig) {
        this.config = config;
        this.logger = new Logger('BlockchainService');
        this.database = new DatabaseService(config.databaseConfig);
    }

    /**
     * @method initialize
     * @description Initialize blockchain service
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing Blockchain Service...');
            
            // Initialize providers for all networks
            await this.initializeProviders();
            
            // Initialize wallets
            await this.initializeWallets();
            
            // Deploy or connect to smart contracts
            await this.initializeContracts();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start monitoring if enabled
            if (this.config.monitoringEnabled) {
                this.startMonitoring();
            }
            
            this.isInitialized = true;
            this.logger.info('Blockchain Service initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Blockchain Service:', error);
            throw error;
        }
    }

    /**
     * @method initializeProviders
     * @description Initialize blockchain providers
     */
    private async initializeProviders(): Promise<void> {
        for (const [networkId, networkConfig] of Object.entries(this.config.networks)) {
            try {
                let provider: providers.Provider;
                
                if (networkConfig.rpcUrl.startsWith('ws')) {
                    provider = new providers.WebSocketProvider(networkConfig.rpcUrl);
                } else {
                    provider = new providers.JsonRpcProvider(networkConfig.rpcUrl);
                }
                
                // Test connection
                await provider.getNetwork();
                
                this.providers.set(networkId, provider);
                this.logger.info(`Provider initialized for network ${networkId}`);
                
            } catch (error) {
                this.logger.error(`Failed to initialize provider for network ${networkId}:`, error);
                throw error;
            }
        }
    }

    /**
     * @method initializeWallets
     * @description Initialize wallets for each network
     */
    private async initializeWallets(): Promise<void> {
        for (const [networkId, networkConfig] of Object.entries(this.config.networks)) {
            try {
                const provider = this.providers.get(networkId);
                if (!provider) continue;
                
                const wallet = new Wallet(networkConfig.privateKey, provider);
                this.wallets.set(networkId, wallet);
                
                this.logger.info(`Wallet initialized for network ${networkId}: ${wallet.address}`);
                
            } catch (error) {
                this.logger.error(`Failed to initialize wallet for network ${networkId}:`, error);
                throw error;
            }
        }
    }

    /**
     * @method initializeContracts
     * @description Initialize smart contracts
     */
    private async initializeContracts(): Promise<void> {
        for (const [networkId, networkConfig] of Object.entries(this.config.networks)) {
            try {
                const provider = this.providers.get(networkId);
                const wallet = this.wallets.get(networkId);
                
                if (!provider || !wallet) continue;
                
                // Initialize GamingCore contract
                const gamingCoreContract = new Contract(
                    networkConfig.contracts.gamingCore,
                    this.getGamingCoreABI(),
                    wallet
                );
                this.contracts.set(`${networkId}_gamingCore`, gamingCoreContract);
                
                // Initialize GDI Token contract
                const gdiTokenContract = new Contract(
                    networkConfig.contracts.gdiToken,
                    this.getGDITokenABI(),
                    wallet
                );
                this.contracts.set(`${networkId}_gdiToken`, gdiTokenContract);
                
                // Initialize AI Oracle contract
                const aiOracleContract = new Contract(
                    networkConfig.contracts.aiOracle,
                    this.getAIOracleABI(),
                    wallet
                );
                this.contracts.set(`${networkId}_aiOracle`, aiOracleContract);
                
                // Initialize Bridge contract
                const bridgeContract = new Contract(
                    networkConfig.contracts.bridge,
                    this.getBridgeABI(),
                    wallet
                );
                this.contracts.set(`${networkId}_bridge`, bridgeContract);
                
                // Initialize NFT Marketplace contract
                const nftMarketplaceContract = new Contract(
                    networkConfig.contracts.nftMarketplace,
                    this.getNFTMarketplaceABI(),
                    wallet
                );
                this.contracts.set(`${networkId}_nftMarketplace`, nftMarketplaceContract);
                
                this.logger.info(`Contracts initialized for network ${networkId}`);
                
            } catch (error) {
                this.logger.error(`Failed to initialize contracts for network ${networkId}:`, error);
                throw error;
            }
        }
    }

    /**
     * @method setupEventListeners
     * @description Setup blockchain event listeners
     */
    private setupEventListeners(): void {
        for (const [networkId, provider] of this.providers.entries()) {
            provider.on('block', (blockNumber: number) => {
                this.handleNewBlock(networkId, blockNumber);
            });
            
            provider.on('error', (error: Error) => {
                this.logger.error(`Provider error for network ${networkId}:`, error);
            });
        }
    }

    /**
     * @method startMonitoring
     * @description Start blockchain monitoring
     */
    private startMonitoring(): void {
        setInterval(() => {
            this.updateMetrics();
        }, 30000); // Update every 30 seconds
    }

    // ============ GAME TRANSACTION METHODS ============
    
    /**
     * @method processGameResult
     * @description Process game result on blockchain
     * @param game Game instance
     * @returns Transaction hash
     */
    async processGameResult(game: any): Promise<string> {
        const startTime = Date.now();
        
        try {
            const networkId = this.config.defaultNetwork;
            const gamingCoreContract = this.contracts.get(`${networkId}_gamingCore`);
            const gdiTokenContract = this.contracts.get(`${networkId}_gdiToken`);
            
            if (!gamingCoreContract || !gdiTokenContract) {
                throw new Error('Contracts not initialized');
            }
            
            // Calculate rewards
            const rewards = this.calculateGameRewards(game);
            
            // Process rewards for each player
            const transactions: string[] = [];
            
            for (const [playerId, reward] of Object.entries(rewards)) {
                const tx = await this.distributeGameReward(
                    networkId,
                    playerId,
                    reward as number,
                    game.gameId
                );
                transactions.push(tx);
            }
            
            // Record game completion
            const gameTx = await this.recordGameCompletion(
                networkId,
                game.gameId,
                game.result,
                rewards
            );
            
            // Save transaction to database
            const transaction: BlockchainTransaction = {
                gameId: game.gameId,
                playerId: 'system',
                txHash: gameTx,
                txType: 'game_completion',
                amount: Object.values(rewards).reduce((a: number, b: number) => a + b, 0),
                status: 'confirmed',
                blockNumber: await this.getBlockNumber(networkId),
                gasUsed: 0,
                gasPrice: this.config.gasPrice
            };
            
            await this.database.saveBlockchainTransaction(transaction);
            
            this.metrics.successfulTransactions++;
            this.metrics.averageTransactionTime = (this.metrics.averageTransactionTime + (Date.now() - startTime)) / 2;
            
            return gameTx;
            
        } catch (error) {
            this.metrics.failedTransactions++;
            this.logger.error(`Error processing game result:`, error);
            throw error;
        } finally {
            this.metrics.totalTransactions++;
        }
    }
    
    /**
     * @method distributeGameReward
     * @description Distribute game reward to player
     * @param networkId Network ID
     * @param playerId Player ID
     * @param amount Reward amount
     * @param gameId Game ID
     * @returns Transaction hash
     */
    private async distributeGameReward(
        networkId: string,
        playerId: string,
        amount: number,
        gameId: string
    ): Promise<string> {
        try {
            const gdiTokenContract = this.contracts.get(`${networkId}_gdiToken`);
            if (!gdiTokenContract) {
                throw new Error('GDI Token contract not found');
            }
            
            const tx = await gdiTokenContract.distributeGamingRewards(
                playerId,
                ethers.utils.parseEther(amount.toString()),
                gameId,
                {
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            // Save transaction
            const transaction: BlockchainTransaction = {
                gameId,
                playerId,
                txHash: tx.hash,
                txType: 'game_reward',
                amount,
                status: 'confirmed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toNumber(),
                gasPrice: parseFloat(ethers.utils.formatUnits(receipt.effectiveGasPrice, 'gwei'))
            };
            
            await this.database.saveBlockchainTransaction(transaction);
            
            return tx.hash;
            
        } catch (error) {
            this.logger.error(`Error distributing reward to ${playerId}:`, error);
            throw error;
        }
    }
    
    /**
     * @method recordGameCompletion
     * @description Record game completion on blockchain
     * @param networkId Network ID
     * @param gameId Game ID
     * @param result Game result
     * @param rewards Rewards distribution
     * @returns Transaction hash
     */
    private async recordGameCompletion(
        networkId: string,
        gameId: string,
        result: GameResult,
        rewards: { [key: string]: number }
    ): Promise<string> {
        try {
            const gamingCoreContract = this.contracts.get(`${networkId}_gamingCore`);
            if (!gamingCoreContract) {
                throw new Error('GamingCore contract not found');
            }
            
            const tx = await gamingCoreContract.recordGameCompletion(
                gameId,
                result.winner || ethers.constants.AddressZero,
                JSON.stringify(result),
                Object.keys(rewards),
                Object.values(rewards).map(r => ethers.utils.parseEther(r.toString())),
                {
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            return tx.hash;
            
        } catch (error) {
            this.logger.error(`Error recording game completion:`, error);
            throw error;
        }
    }

    // ============ AI ORACLE METHODS ============
    
    /**
     * @method submitAIAnalysis
     * @description Submit AI analysis to blockchain
     * @param playerId Player ID
     * @param gameId Game ID
     * @param analysis AI analysis
     * @returns Transaction hash
     */
    async submitAIAnalysis(
        playerId: string,
        gameId: string,
        analysis: any
    ): Promise<string> {
        try {
            const networkId = this.config.defaultNetwork;
            const aiOracleContract = this.contracts.get(`${networkId}_aiOracle`);
            
            if (!aiOracleContract) {
                throw new Error('AI Oracle contract not found');
            }
            
            const tx = await aiOracleContract.submitAnalysis(
                playerId,
                gameId,
                analysis.fraudScore,
                analysis.skillLevel,
                analysis.riskAssessment,
                analysis.predictedOutcome,
                analysis.confidence,
                JSON.stringify(analysis.behaviorPatterns),
                JSON.stringify(analysis.recommendations),
                analysis.analysisHash,
                {
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            return tx.hash;
            
        } catch (error) {
            this.logger.error(`Error submitting AI analysis:`, error);
            throw error;
        }
    }
    
    /**
     * @method getAIAnalysis
     * @description Get AI analysis from blockchain
     * @param playerId Player ID
     * @param gameId Game ID
     * @returns AI analysis
     */
    async getAIAnalysis(playerId: string, gameId: string): Promise<any> {
        try {
            const networkId = this.config.defaultNetwork;
            const aiOracleContract = this.contracts.get(`${networkId}_aiOracle`);
            
            if (!aiOracleContract) {
                throw new Error('AI Oracle contract not found');
            }
            
            const analysis = await aiOracleContract.getAnalysis(playerId, gameId);
            
            return {
                fraudScore: analysis.fraudScore.toNumber(),
                skillLevel: analysis.skillLevel.toNumber(),
                riskAssessment: analysis.riskAssessment.toNumber(),
                predictedOutcome: analysis.predictedOutcome.toNumber(),
                confidence: analysis.confidence.toNumber(),
                behaviorPatterns: JSON.parse(analysis.behaviorPatterns),
                recommendations: JSON.parse(analysis.recommendations),
                timestamp: analysis.timestamp.toNumber()
            };
            
        } catch (error) {
            this.logger.error(`Error getting AI analysis:`, error);
            throw error;
        }
    }

    // ============ BRIDGE METHODS ============
    
    /**
     * @method bridgeTokens
     * @description Bridge tokens to another network
     * @param fromNetwork Source network
     * @param toNetwork Destination network
     * @param playerId Player ID
     * @param amount Token amount
     * @returns Bridge transaction
     */
    async bridgeTokens(
        fromNetwork: string,
        toNetwork: string,
        playerId: string,
        amount: number
    ): Promise<BridgeTransaction> {
        try {
            const bridgeContract = this.contracts.get(`${fromNetwork}_bridge`);
            if (!bridgeContract) {
                throw new Error('Bridge contract not found');
            }
            
            const tx = await bridgeContract.bridgeTokens(
                playerId,
                this.config.networks[toNetwork].chainId,
                this.config.networks[fromNetwork].contracts.gdiToken,
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            const bridgeTx: BridgeTransaction = {
                fromNetwork,
                toNetwork,
                playerId,
                amount,
                txHash: tx.hash,
                status: 'pending',
                timestamp: Date.now()
            };
            
            this.metrics.bridgeTransactions++;
            
            return bridgeTx;
            
        } catch (error) {
            this.logger.error(`Error bridging tokens:`, error);
            throw error;
        }
    }
    
    /**
     * @method processBridgeRequest
     * @description Process bridge request
     * @param networkId Network ID
     * @param requestId Request ID
     * @param success Success status
     * @returns Transaction hash
     */
    async processBridgeRequest(
        networkId: string,
        requestId: number,
        success: boolean
    ): Promise<string> {
        try {
            const bridgeContract = this.contracts.get(`${networkId}_bridge`);
            if (!bridgeContract) {
                throw new Error('Bridge contract not found');
            }
            
            const tx = await bridgeContract.processBridgeRequest(
                requestId,
                success,
                {
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            return tx.hash;
            
        } catch (error) {
            this.logger.error(`Error processing bridge request:`, error);
            throw error;
        }
    }

    // ============ NFT MARKETPLACE METHODS ============
    
    /**
     * @method createNFTListing
     * @description Create NFT listing
     * @param playerId Player ID
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param price Listing price
     * @returns Transaction hash
     */
    async createNFTListing(
        playerId: string,
        nftContract: string,
        tokenId: number,
        price: number
    ): Promise<string> {
        try {
            const networkId = this.config.defaultNetwork;
            const nftMarketplaceContract = this.contracts.get(`${networkId}_nftMarketplace`);
            
            if (!nftMarketplaceContract) {
                throw new Error('NFT Marketplace contract not found');
            }
            
            const tx = await nftMarketplaceContract.createFixedPriceListing(
                nftContract,
                tokenId,
                ethers.utils.parseEther(price.toString()),
                7 * 24 * 60 * 60, // 7 days
                {
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            return tx.hash;
            
        } catch (error) {
            this.logger.error(`Error creating NFT listing:`, error);
            throw error;
        }
    }
    
    /**
     * @method buyNFTListing
     * @description Buy NFT listing
     * @param listingId Listing ID
     * @param buyerId Buyer ID
     * @returns Transaction hash
     */
    async buyNFTListing(listingId: number, buyerId: string): Promise<string> {
        try {
            const networkId = this.config.defaultNetwork;
            const nftMarketplaceContract = this.contracts.get(`${networkId}_nftMarketplace`);
            
            if (!nftMarketplaceContract) {
                throw new Error('NFT Marketplace contract not found');
            }
            
            const listing = await nftMarketplaceContract.getListing(listingId);
            const price = ethers.utils.formatEther(listing.price);
            
            const tx = await nftMarketplaceContract.buyListing(
                listingId,
                {
                    value: ethers.utils.parseEther(price),
                    gasLimit: this.config.gasLimit,
                    gasPrice: ethers.utils.parseUnits(this.config.gasPrice.toString(), 'gwei')
                }
            );
            
            const receipt = await tx.wait(this.config.confirmations);
            
            return tx.hash;
            
        } catch (error) {
            this.logger.error(`Error buying NFT listing:`, error);
            throw error;
        }
    }

    // ============ UTILITY METHODS ============
    
    /**
     * @method calculateGameRewards
     * @description Calculate game rewards
     * @param game Game instance
     * @returns Rewards distribution
     */
    private calculateGameRewards(game: any): { [key: string]: number } {
        const rewards: { [key: string]: number } = {};
        const totalPot = game.state.totalPot;
        
        if (game.result && game.result.winner) {
            // Winner gets 80% of pot
            rewards[game.result.winner] = totalPot * 0.8;
            
            // Other players get participation rewards
            for (const playerId of game.players.keys()) {
                if (playerId !== game.result.winner) {
                    rewards[playerId] = totalPot * 0.2 / (game.players.size - 1);
                }
            }
        } else {
            // Split pot equally among all players
            const equalShare = totalPot / game.players.size;
            for (const playerId of game.players.keys()) {
                rewards[playerId] = equalShare;
            }
        }
        
        return rewards;
    }
    
    /**
     * @method getBlockNumber
     * @description Get current block number
     * @param networkId Network ID
     * @returns Block number
     */
    private async getBlockNumber(networkId: string): Promise<number> {
        const provider = this.providers.get(networkId);
        if (!provider) {
            throw new Error(`Provider not found for network ${networkId}`);
        }
        
        return await provider.getBlockNumber();
    }
    
    /**
     * @method handleNewBlock
     * @description Handle new block event
     * @param networkId Network ID
     * @param blockNumber Block number
     */
    private async handleNewBlock(networkId: string, blockNumber: number): Promise<void> {
        this.logger.debug(`New block ${blockNumber} on network ${networkId}`);
        
        // Process pending transactions
        await this.processPendingTransactions(networkId);
    }
    
    /**
     * @method processPendingTransactions
     * @description Process pending transactions
     * @param networkId Network ID
     */
    private async processPendingTransactions(networkId: string): Promise<void> {
        // Implement pending transaction processing logic
    }
    
    /**
     * @method updateMetrics
     * @description Update performance metrics
     */
    private updateMetrics(): void {
        // Update network latency
        this.calculateNetworkLatency();
        
        // Update pending transactions count
        this.calculatePendingTransactions();
    }
    
    /**
     * @method calculateNetworkLatency
     * @description Calculate network latency
     */
    private async calculateNetworkLatency(): Promise<void> {
        const startTime = Date.now();
        
        try {
            const provider = this.providers.get(this.config.defaultNetwork);
            if (provider) {
                await provider.getBlockNumber();
                this.metrics.networkLatency = Date.now() - startTime;
            }
        } catch (error) {
            this.logger.error('Error calculating network latency:', error);
        }
    }
    
    /**
     * @method calculatePendingTransactions
     * @description Calculate pending transactions count
     */
    private async calculatePendingTransactions(): Promise<void> {
        try {
            const provider = this.providers.get(this.config.defaultNetwork);
            if (provider) {
                const pendingCount = await provider.getTransactionCount('pending');
                this.metrics.pendingTransactions = pendingCount;
            }
        } catch (error) {
            this.logger.error('Error calculating pending transactions:', error);
        }
    }

    // ============ ABI METHODS ============
    
    /**
     * @method getGamingCoreABI
     * @description Get GamingCore contract ABI
     * @returns Contract ABI
     */
    private getGamingCoreABI(): any[] {
        return [
            'function recordGameCompletion(string gameId, address winner, string result, address[] players, uint256[] rewards) external',
            'function getGameResult(string gameId) external view returns (address winner, string result)',
            'event GameCompleted(string gameId, address winner, uint256 totalRewards)'
        ];
    }
    
    /**
     * @method getGDITokenABI
     * @description Get GDI Token contract ABI
     * @returns Contract ABI
     */
    private getGDITokenABI(): any[] {
        return [
            'function distributeGamingRewards(address user, uint256 amount, uint256 gameId) external',
            'function balanceOf(address account) external view returns (uint256)',
            'function transfer(address to, uint256 amount) external returns (bool)',
            'event GamingRewardsDistributed(address indexed user, uint256 amount, uint256 gameId)'
        ];
    }
    
    /**
     * @method getAIOracleABI
     * @description Get AI Oracle contract ABI
     * @returns Contract ABI
     */
    private getAIOracleABI(): any[] {
        return [
            'function submitAnalysis(address playerId, string gameId, uint256 fraudScore, uint256 skillLevel, uint256 riskAssessment, uint256 predictedOutcome, uint256 confidence, string behaviorPatterns, string recommendations, bytes32 analysisHash) external',
            'function getAnalysis(address playerId, string gameId) external view returns (uint256 fraudScore, uint256 skillLevel, uint256 riskAssessment, uint256 predictedOutcome, uint256 confidence, string behaviorPatterns, string recommendations, uint256 timestamp)',
            'event AnalysisSubmitted(address indexed playerId, string gameId, bytes32 analysisHash)'
        ];
    }
    
    /**
     * @method getBridgeABI
     * @description Get Bridge contract ABI
     * @returns Contract ABI
     */
    private getBridgeABI(): any[] {
        return [
            'function bridgeTokens(address recipient, uint256 destinationChainId, address assetAddress, uint256 amount) external payable',
            'function processBridgeRequest(uint256 requestId, bool success) external',
            'function getBridgeRequest(uint256 requestId) external view returns (address sender, address recipient, uint256 sourceChainId, uint256 destinationChainId, uint8 assetType, address assetAddress, uint256 amount, uint256 tokenId, uint8 status, uint256 timestamp, uint256 processedAt, address relayer)',
            'event BridgeRequestCreated(uint256 indexed requestId, address indexed sender, address indexed recipient, uint256 sourceChainId, uint256 destinationChainId, uint8 assetType, uint256 amount, bytes32 hash)'
        ];
    }
    
    /**
     * @method getNFTMarketplaceABI
     * @description Get NFT Marketplace contract ABI
     * @returns Contract ABI
     */
    private getNFTMarketplaceABI(): any[] {
        return [
            'function createFixedPriceListing(address nftContract, uint256 tokenId, uint256 price, uint256 duration) external payable',
            'function buyListing(uint256 listingId) external',
            'function getListing(uint256 listingId) external view returns (address nftContract, uint256 tokenId, address seller, uint256 price, uint256 aiSuggestedPrice, bool isActive, uint8 listingType, uint256 minBid, uint256 currentBid, address currentBidder, uint256 auctionEndTime, uint256 createdAt, uint256 expiresAt)',
            'event ListingCreated(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price, uint8 listingType, uint256 expiresAt)'
        ];
    }
    
    /**
     * @method getMetrics
     * @description Get performance metrics
     * @returns Performance metrics
     */
    getMetrics(): BlockchainMetrics {
        return { ...this.metrics };
    }
    
    /**
     * @method isReady
     * @description Check if service is ready
     * @returns True if ready
     */
    isReady(): boolean {
        return this.isInitialized;
    }
    
    /**
     * @method close
     * @description Close blockchain service
     */
    async close(): Promise<void> {
        try {
            this.logger.info('Closing Blockchain Service...');
            
            // Close all providers
            for (const provider of this.providers.values()) {
                if (provider instanceof providers.WebSocketProvider) {
                    provider.destroy();
                }
            }
            
            this.logger.info('Blockchain Service closed');
            
        } catch (error) {
            this.logger.error('Error closing Blockchain Service:', error);
        }
    }
} 