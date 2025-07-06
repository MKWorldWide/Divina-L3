// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Bridge
 * @dev Cross-chain bridge for GameDin L3 ecosystem
 * @dev Enables seamless asset transfers between blockchains
 * @dev Supports tokens, NFTs, and gaming assets
 */
contract Bridge is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;

    // ============ STRUCTS ============
    
    struct BridgeRequest {
        uint256 requestId;
        address sender;
        address recipient;
        uint256 sourceChainId;
        uint256 destinationChainId;
        BridgeAssetType assetType;
        address assetAddress;
        uint256 amount;
        uint256 tokenId; // For NFTs
        bytes32 hash;
        BridgeStatus status;
        uint256 timestamp;
        uint256 processedAt;
        address relayer;
    }

    struct ChainConfig {
        bool isSupported;
        uint256 minConfirmations;
        uint256 maxGasLimit;
        uint256 bridgeFee;
        bool isActive;
    }

    struct RelayerInfo {
        address relayer;
        uint256 totalProcessed;
        uint256 totalVolume;
        uint256 lastActivity;
        bool isActive;
        uint256 stake;
    }

    // ============ ENUMS ============
    
    enum BridgeAssetType {
        TOKEN,
        NFT,
        GAMING_ASSET
    }

    enum BridgeStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    // ============ STATE VARIABLES ============
    
    Counters.Counter private _requestIds;
    
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(uint256 => ChainConfig) public supportedChains;
    mapping(address => RelayerInfo) public relayers;
    mapping(bytes32 => bool) public processedHashes;
    mapping(address => bool) public authorizedRelayers;
    
    uint256 public chainId;
    uint256 public minRelayerStake = 1000 * 10**18; // 1000 tokens
    uint256 public bridgeFee = 0.001 * 10**18; // 0.001 tokens
    uint256 public maxBridgeAmount = 100000 * 10**18; // 100k tokens
    uint256 public totalVolume;
    uint256 public totalRequests;
    
    address public gdiToken;
    address public gamingCore;
    
    // ============ EVENTS ============
    
    event BridgeRequestCreated(
        uint256 indexed requestId,
        address indexed sender,
        address indexed recipient,
        uint256 sourceChainId,
        uint256 destinationChainId,
        BridgeAssetType assetType,
        uint256 amount,
        bytes32 hash
    );
    
    event BridgeRequestProcessed(
        uint256 indexed requestId,
        address indexed relayer,
        BridgeStatus status,
        uint256 timestamp
    );
    
    event ChainAdded(uint256 indexed chainId, uint256 minConfirmations, uint256 bridgeFee);
    event ChainUpdated(uint256 indexed chainId, bool isActive);
    event RelayerRegistered(address indexed relayer, uint256 stake);
    event RelayerStakeUpdated(address indexed relayer, uint256 newStake);
    event BridgeFeeUpdated(uint256 newFee);
    event MaxBridgeAmountUpdated(uint256 newAmount);

    // ============ MODIFIERS ============
    
    modifier onlyRelayer() {
        require(authorizedRelayers[msg.sender], "Only authorized relayers");
        _;
    }
    
    modifier onlySupportedChain(uint256 _chainId) {
        require(supportedChains[_chainId].isSupported, "Chain not supported");
        _;
    }
    
    modifier onlyActiveChain(uint256 _chainId) {
        require(supportedChains[_chainId].isActive, "Chain not active");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor(
        uint256 _chainId,
        address _gdiToken,
        address _gamingCore
    ) {
        chainId = _chainId;
        gdiToken = _gdiToken;
        gamingCore = _gamingCore;
        
        // Add current chain as supported
        supportedChains[_chainId] = ChainConfig({
            isSupported: true,
            minConfirmations: 12,
            maxGasLimit: 500000,
            bridgeFee: bridgeFee,
            isActive: true
        });
    }

    // ============ BRIDGE FUNCTIONS ============
    
    /**
     * @dev Create a bridge request for tokens
     * @param recipient Recipient address on destination chain
     * @param destinationChainId Destination chain ID
     * @param assetAddress Token address
     * @param amount Amount to bridge
     */
    function bridgeTokens(
        address recipient,
        uint256 destinationChainId,
        address assetAddress,
        uint256 amount
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        onlySupportedChain(destinationChainId)
        onlyActiveChain(destinationChainId)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= maxBridgeAmount, "Amount exceeds maximum");
        require(recipient != address(0), "Invalid recipient");
        require(destinationChainId != chainId, "Cannot bridge to same chain");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        
        // Transfer tokens from sender to bridge
        IERC20(assetAddress).transferFrom(msg.sender, address(this), amount);
        
        // Create bridge request
        _createBridgeRequest(
            msg.sender,
            recipient,
            destinationChainId,
            BridgeAssetType.TOKEN,
            assetAddress,
            amount,
            0
        );
    }
    
    /**
     * @dev Create a bridge request for NFTs
     * @param recipient Recipient address on destination chain
     * @param destinationChainId Destination chain ID
     * @param assetAddress NFT contract address
     * @param tokenId Token ID
     */
    function bridgeNFT(
        address recipient,
        uint256 destinationChainId,
        address assetAddress,
        uint256 tokenId
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        onlySupportedChain(destinationChainId)
        onlyActiveChain(destinationChainId)
    {
        require(recipient != address(0), "Invalid recipient");
        require(destinationChainId != chainId, "Cannot bridge to same chain");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        
        // Transfer NFT from sender to bridge
        IERC721(assetAddress).transferFrom(msg.sender, address(this), tokenId);
        
        // Create bridge request
        _createBridgeRequest(
            msg.sender,
            recipient,
            destinationChainId,
            BridgeAssetType.NFT,
            assetAddress,
            1,
            tokenId
        );
    }
    
    /**
     * @dev Create a bridge request for gaming assets
     * @param recipient Recipient address on destination chain
     * @param destinationChainId Destination chain ID
     * @param assetAddress Gaming asset address
     * @param amount Amount to bridge
     */
    function bridgeGamingAsset(
        address recipient,
        uint256 destinationChainId,
        address assetAddress,
        uint256 amount
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        onlySupportedChain(destinationChainId)
        onlyActiveChain(destinationChainId)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(destinationChainId != chainId, "Cannot bridge to same chain");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        
        // Transfer gaming asset from sender to bridge
        IERC20(assetAddress).transferFrom(msg.sender, address(this), amount);
        
        // Create bridge request
        _createBridgeRequest(
            msg.sender,
            recipient,
            destinationChainId,
            BridgeAssetType.GAMING_ASSET,
            assetAddress,
            amount,
            0
        );
    }
    
    /**
     * @dev Internal function to create bridge request
     */
    function _createBridgeRequest(
        address sender,
        address recipient,
        uint256 destinationChainId,
        BridgeAssetType assetType,
        address assetAddress,
        uint256 amount,
        uint256 tokenId
    ) internal {
        _requestIds.increment();
        uint256 requestId = _requestIds.current();
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                requestId,
                sender,
                recipient,
                chainId,
                destinationChainId,
                assetType,
                assetAddress,
                amount,
                tokenId,
                block.timestamp
            )
        );
        
        BridgeRequest storage request = bridgeRequests[requestId];
        request.requestId = requestId;
        request.sender = sender;
        request.recipient = recipient;
        request.sourceChainId = chainId;
        request.destinationChainId = destinationChainId;
        request.assetType = assetType;
        request.assetAddress = assetAddress;
        request.amount = amount;
        request.tokenId = tokenId;
        request.hash = hash;
        request.status = BridgeStatus.PENDING;
        request.timestamp = block.timestamp;
        
        totalRequests++;
        totalVolume += amount;
        
        emit BridgeRequestCreated(
            requestId,
            sender,
            recipient,
            chainId,
            destinationChainId,
            assetType,
            amount,
            hash
        );
    }
    
    /**
     * @dev Process bridge request (called by relayers)
     * @param requestId Request ID
     * @param success Whether the bridge was successful
     */
    function processBridgeRequest(
        uint256 requestId,
        bool success
    ) 
        external 
        onlyRelayer 
        nonReentrant 
        whenNotPaused 
    {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.requestId != 0, "Request does not exist");
        require(request.status == BridgeStatus.PENDING, "Request not pending");
        require(request.destinationChainId == chainId, "Wrong destination chain");
        
        // Update request status
        request.status = success ? BridgeStatus.COMPLETED : BridgeStatus.FAILED;
        request.processedAt = block.timestamp;
        request.relayer = msg.sender;
        
        // Update relayer stats
        RelayerInfo storage relayer = relayers[msg.sender];
        relayer.totalProcessed++;
        relayer.totalVolume += request.amount;
        relayer.lastActivity = block.timestamp;
        
        if (success) {
            // Transfer assets to recipient
            if (request.assetType == BridgeAssetType.TOKEN) {
                IERC20(request.assetAddress).transfer(request.recipient, request.amount);
            } else if (request.assetType == BridgeAssetType.NFT) {
                IERC721(request.assetAddress).transferFrom(address(this), request.recipient, request.tokenId);
            } else if (request.assetType == BridgeAssetType.GAMING_ASSET) {
                IERC20(request.assetAddress).transfer(request.recipient, request.amount);
            }
        } else {
            // Return assets to sender
            if (request.assetType == BridgeAssetType.TOKEN) {
                IERC20(request.assetAddress).transfer(request.sender, request.amount);
            } else if (request.assetType == BridgeAssetType.NFT) {
                IERC721(request.assetAddress).transferFrom(address(this), request.sender, request.tokenId);
            } else if (request.assetType == BridgeAssetType.GAMING_ASSET) {
                IERC20(request.assetAddress).transfer(request.sender, request.amount);
            }
        }
        
        emit BridgeRequestProcessed(requestId, msg.sender, request.status, block.timestamp);
    }
    
    /**
     * @dev Cancel bridge request (only sender can cancel)
     * @param requestId Request ID
     */
    function cancelBridgeRequest(uint256 requestId) external nonReentrant {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.requestId != 0, "Request does not exist");
        require(request.sender == msg.sender, "Only sender can cancel");
        require(request.status == BridgeStatus.PENDING, "Request not pending");
        require(request.sourceChainId == chainId, "Wrong source chain");
        
        request.status = BridgeStatus.CANCELLED;
        request.processedAt = block.timestamp;
        
        // Return assets to sender
        if (request.assetType == BridgeAssetType.TOKEN) {
            IERC20(request.assetAddress).transfer(request.sender, request.amount);
        } else if (request.assetType == BridgeAssetType.NFT) {
            IERC721(request.assetAddress).transferFrom(address(this), request.sender, request.tokenId);
        } else if (request.assetType == BridgeAssetType.GAMING_ASSET) {
            IERC20(request.assetAddress).transfer(request.sender, request.amount);
        }
        
        emit BridgeRequestProcessed(requestId, address(0), BridgeStatus.CANCELLED, block.timestamp);
    }

    // ============ RELAYER FUNCTIONS ============
    
    /**
     * @dev Register as a relayer
     */
    function registerRelayer() external payable nonReentrant {
        require(msg.value >= minRelayerStake, "Insufficient stake");
        require(!authorizedRelayers[msg.sender], "Already registered");
        
        authorizedRelayers[msg.sender] = true;
        
        RelayerInfo storage relayer = relayers[msg.sender];
        relayer.relayer = msg.sender;
        relayer.stake = msg.value;
        relayer.isActive = true;
        relayer.lastActivity = block.timestamp;
        
        emit RelayerRegistered(msg.sender, msg.value);
    }
    
    /**
     * @dev Update relayer stake
     */
    function updateRelayerStake() external payable nonReentrant {
        require(authorizedRelayers[msg.sender], "Not a relayer");
        
        RelayerInfo storage relayer = relayers[msg.sender];
        relayer.stake += msg.value;
        
        emit RelayerStakeUpdated(msg.sender, relayer.stake);
    }
    
    /**
     * @dev Withdraw relayer stake
     * @param amount Amount to withdraw
     */
    function withdrawRelayerStake(uint256 amount) external nonReentrant {
        require(authorizedRelayers[msg.sender], "Not a relayer");
        
        RelayerInfo storage relayer = relayers[msg.sender];
        require(relayer.stake >= amount, "Insufficient stake");
        require(relayer.stake - amount >= minRelayerStake, "Stake below minimum");
        
        relayer.stake -= amount;
        payable(msg.sender).transfer(amount);
        
        emit RelayerStakeUpdated(msg.sender, relayer.stake);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Add supported chain
     * @param _chainId Chain ID
     * @param minConfirmations Minimum confirmations required
     * @param _bridgeFee Bridge fee for this chain
     */
    function addSupportedChain(
        uint256 _chainId,
        uint256 minConfirmations,
        uint256 _bridgeFee
    ) external onlyOwner {
        require(_chainId != chainId, "Cannot add current chain");
        require(!supportedChains[_chainId].isSupported, "Chain already supported");
        
        supportedChains[_chainId] = ChainConfig({
            isSupported: true,
            minConfirmations: minConfirmations,
            maxGasLimit: 500000,
            bridgeFee: _bridgeFee,
            isActive: true
        });
        
        emit ChainAdded(_chainId, minConfirmations, _bridgeFee);
    }
    
    /**
     * @dev Update chain status
     * @param _chainId Chain ID
     * @param isActive Whether chain is active
     */
    function updateChainStatus(uint256 _chainId, bool isActive) external onlyOwner {
        require(supportedChains[_chainId].isSupported, "Chain not supported");
        supportedChains[_chainId].isActive = isActive;
        
        emit ChainUpdated(_chainId, isActive);
    }
    
    /**
     * @dev Update bridge fee
     * @param newFee New bridge fee
     */
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        bridgeFee = newFee;
        emit BridgeFeeUpdated(newFee);
    }
    
    /**
     * @dev Update maximum bridge amount
     * @param newAmount New maximum amount
     */
    function updateMaxBridgeAmount(uint256 newAmount) external onlyOwner {
        maxBridgeAmount = newAmount;
        emit MaxBridgeAmountUpdated(newAmount);
    }
    
    /**
     * @dev Update minimum relayer stake
     * @param newStake New minimum stake
     */
    function updateMinRelayerStake(uint256 newStake) external onlyOwner {
        minRelayerStake = newStake;
    }
    
    /**
     * @dev Pause bridge operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause bridge operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw accumulated fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    /**
     * @dev Emergency withdraw all funds
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get bridge request details
     * @param requestId Request ID
     * @return Request details
     */
    function getBridgeRequest(uint256 requestId)
        external
        view
        returns (
            address sender,
            address recipient,
            uint256 sourceChainId,
            uint256 destinationChainId,
            BridgeAssetType assetType,
            address assetAddress,
            uint256 amount,
            uint256 tokenId,
            BridgeStatus status,
            uint256 timestamp,
            uint256 processedAt,
            address relayer
        )
    {
        BridgeRequest storage request = bridgeRequests[requestId];
        return (
            request.sender,
            request.recipient,
            request.sourceChainId,
            request.destinationChainId,
            request.assetType,
            request.assetAddress,
            request.amount,
            request.tokenId,
            request.status,
            request.timestamp,
            request.processedAt,
            request.relayer
        );
    }
    
    /**
     * @dev Get chain configuration
     * @param _chainId Chain ID
     * @return Chain configuration
     */
    function getChainConfig(uint256 _chainId)
        external
        view
        returns (
            bool isSupported,
            uint256 minConfirmations,
            uint256 maxGasLimit,
            uint256 bridgeFee,
            bool isActive
        )
    {
        ChainConfig storage config = supportedChains[_chainId];
        return (
            config.isSupported,
            config.minConfirmations,
            config.maxGasLimit,
            config.bridgeFee,
            config.isActive
        );
    }
    
    /**
     * @dev Get relayer information
     * @param relayer Relayer address
     * @return Relayer information
     */
    function getRelayerInfo(address relayer)
        external
        view
        returns (
            uint256 totalProcessed,
            uint256 totalVolume,
            uint256 lastActivity,
            bool isActive,
            uint256 stake
        )
    {
        RelayerInfo storage info = relayers[relayer];
        return (
            info.totalProcessed,
            info.totalVolume,
            info.lastActivity,
            info.isActive,
            info.stake
        );
    }
    
    /**
     * @dev Get total requests count
     * @return Total requests
     */
    function getTotalRequests() external view returns (uint256) {
        return _requestIds.current();
    }
    
    /**
     * @dev Check if address is authorized relayer
     * @param relayer Relayer address
     * @return True if authorized
     */
    function isAuthorizedRelayer(address relayer) external view returns (bool) {
        return authorizedRelayers[relayer];
    }
    
    /**
     * @dev Get pending requests for a chain
     * @param _chainId Chain ID
     * @return Array of pending request IDs
     */
    function getPendingRequests(uint256 _chainId) external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 total = _requestIds.current();
        
        // Count pending requests
        for (uint256 i = 1; i <= total; i++) {
            if (bridgeRequests[i].destinationChainId == _chainId && 
                bridgeRequests[i].status == BridgeStatus.PENDING) {
                count++;
            }
        }
        
        // Create array of pending request IDs
        uint256[] memory pendingRequests = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= total; i++) {
            if (bridgeRequests[i].destinationChainId == _chainId && 
                bridgeRequests[i].status == BridgeStatus.PENDING) {
                pendingRequests[index] = i;
                index++;
            }
        }
        
        return pendingRequests;
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 