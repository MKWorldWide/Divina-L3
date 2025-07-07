// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GameDin L3 Bridge Contract
 * @dev Handles cross-chain transfers between L2 settlement layer and L3 gaming network
 * Manages asset bridging, validation, and cross-chain communication
 */
contract GameDinL3Bridge is AccessControl, ReentrancyGuard, Pausable {
    // =============================================================================
    // CONSTANTS & ROLES
    // =============================================================================
    
    bytes32 public constant BRIDGE_OPERATOR_ROLE = keccak256("BRIDGE_OPERATOR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant BRIDGE_TIMEOUT = 24 hours;
    uint256 public constant MAX_BRIDGE_AMOUNT = 100000 * 10**18; // 100K tokens
    uint256 public constant MIN_BRIDGE_AMOUNT = 1 * 10**18; // 1 token
    
    // =============================================================================
    // STRUCTS & ENUMS
    // =============================================================================
    
    enum BridgeStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    enum AssetType {
        TOKEN,
        NFT,
        ETH
    }
    
    struct BridgeRequest {
        uint256 requestId;
        address sender;
        address recipient;
        AssetType assetType;
        address assetAddress;
        uint256 amount;
        uint256 tokenId;
        BridgeStatus status;
        uint256 timestamp;
        uint256 deadline;
        bytes32 merkleRoot;
        string l3TransactionHash;
        address validator;
        bool isL3ToL2;
    }
    
    struct BridgeConfig {
        bool isActive;
        uint256 minConfirmations;
        uint256 maxAmount;
        uint256 fee;
        uint256 timeout;
    }
    
    struct ValidatorInfo {
        bool isActive;
        uint256 totalProcessed;
        uint256 successRate;
        uint256 lastActivity;
        uint256 stake;
    }
    
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    address public settlementContract;
    uint256 public requestCounter;
    uint256 public totalRequests;
    uint256 public totalVolume;
    uint256 public bridgeFee = 0.001 * 10**18; // 0.001 tokens
    uint256 public validatorStake = 1000 * 10**18; // 1000 tokens
    
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(address => uint256[]) public userRequests;
    mapping(address => ValidatorInfo) public validators;
    mapping(bytes32 => bool) public processedTransactions;
    mapping(address => BridgeConfig) public bridgeConfigs;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    event BridgeRequestCreated(
        uint256 indexed requestId,
        address indexed sender,
        address indexed recipient,
        AssetType assetType,
        address assetAddress,
        uint256 amount,
        uint256 tokenId,
        bool isL3ToL2,
        uint256 timestamp
    );
    
    event BridgeRequestProcessed(
        uint256 indexed requestId,
        address indexed validator,
        BridgeStatus status,
        string l3TransactionHash,
        uint256 timestamp
    );
    
    event BridgeRequestCompleted(
        uint256 indexed requestId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event ValidatorRegistered(
        address indexed validator,
        uint256 stake,
        uint256 timestamp
    );
    
    event ValidatorStakeUpdated(
        address indexed validator,
        uint256 oldStake,
        uint256 newStake
    );
    
    event BridgeFeeUpdated(uint256 oldFee, uint256 newFee);
    event ValidatorStakeUpdated(uint256 oldStake, uint256 newStake);
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    constructor(address _settlementContract) {
        require(_settlementContract != address(0), "Invalid settlement contract");
        settlementContract = _settlementContract;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_OPERATOR_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }
    
    // =============================================================================
    // BRIDGE FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Create a bridge request from L2 to L3
     * @param recipient Recipient address on L3
     * @param assetType Type of asset to bridge
     * @param assetAddress Asset contract address
     * @param amount Amount to bridge
     * @param tokenId Token ID (for NFTs)
     */
    function bridgeToL3(
        address recipient,
        AssetType assetType,
        address assetAddress,
        uint256 amount,
        uint256 tokenId
    ) external payable whenNotPaused nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount >= MIN_BRIDGE_AMOUNT, "Amount too small");
        require(amount <= MAX_BRIDGE_AMOUNT, "Amount too large");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        
        requestCounter++;
        uint256 requestId = requestCounter;
        
        BridgeRequest storage request = bridgeRequests[requestId];
        request.requestId = requestId;
        request.sender = msg.sender;
        request.recipient = recipient;
        request.assetType = assetType;
        request.assetAddress = assetAddress;
        request.amount = amount;
        request.tokenId = tokenId;
        request.status = BridgeStatus.PENDING;
        request.timestamp = block.timestamp;
        request.deadline = block.timestamp + BRIDGE_TIMEOUT;
        request.isL3ToL2 = false;
        
        userRequests[msg.sender].push(requestId);
        totalRequests++;
        totalVolume += amount;
        
        // Transfer assets to bridge contract
        if (assetType == AssetType.TOKEN) {
            IERC20(assetAddress).transferFrom(msg.sender, address(this), amount);
        } else if (assetType == AssetType.NFT) {
            IERC721(assetAddress).transferFrom(msg.sender, address(this), tokenId);
        } else if (assetType == AssetType.ETH) {
            require(msg.value >= amount + bridgeFee, "Insufficient ETH");
        }
        
        emit BridgeRequestCreated(
            requestId,
            msg.sender,
            recipient,
            assetType,
            assetAddress,
            amount,
            tokenId,
            false,
            block.timestamp
        );
    }
    
    /**
     * @dev Process bridge request (L2 to L3)
     * @param requestId Request ID
     * @param l3TransactionHash L3 transaction hash
     * @param merkleRoot Merkle root for verification
     */
    function processL2ToL3Request(
        uint256 requestId,
        string memory l3TransactionHash,
        bytes32 merkleRoot
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.requestId != 0, "Request does not exist");
        require(request.status == BridgeStatus.PENDING, "Request not pending");
        require(!request.isL3ToL2, "Invalid request direction");
        require(block.timestamp <= request.deadline, "Request expired");
        
        request.status = BridgeStatus.PROCESSING;
        request.l3TransactionHash = l3TransactionHash;
        request.merkleRoot = merkleRoot;
        request.validator = msg.sender;
        
        // Update validator stats
        ValidatorInfo storage validator = validators[msg.sender];
        validator.totalProcessed++;
        validator.lastActivity = block.timestamp;
        
        emit BridgeRequestProcessed(
            requestId,
            msg.sender,
            BridgeStatus.PROCESSING,
            l3TransactionHash,
            block.timestamp
        );
    }
    
    /**
     * @dev Complete bridge request (L2 to L3)
     * @param requestId Request ID
     */
    function completeL2ToL3Request(uint256 requestId) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.requestId != 0, "Request does not exist");
        require(request.status == BridgeStatus.PROCESSING, "Request not processing");
        require(!request.isL3ToL2, "Invalid request direction");
        
        request.status = BridgeStatus.COMPLETED;
        
        // Update validator stats
        ValidatorInfo storage validator = validators[msg.sender];
        validator.successRate = (validator.successRate * (validator.totalProcessed - 1) + 100) / validator.totalProcessed;
        
        emit BridgeRequestCompleted(
            requestId,
            request.recipient,
            request.amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Process bridge request from L3 to L2
     * @param sender Sender address on L3
     * @param recipient Recipient address on L2
     * @param assetType Type of asset
     * @param assetAddress Asset contract address
     * @param amount Amount to bridge
     * @param tokenId Token ID (for NFTs)
     * @param l3TransactionHash L3 transaction hash
     * @param merkleRoot Merkle root for verification
     */
    function processL3ToL2Request(
        address sender,
        address recipient,
        AssetType assetType,
        address assetAddress,
        uint256 amount,
        uint256 tokenId,
        string memory l3TransactionHash,
        bytes32 merkleRoot
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        require(sender != address(0), "Invalid sender");
        require(recipient != address(0), "Invalid recipient");
        require(amount >= MIN_BRIDGE_AMOUNT, "Amount too small");
        require(amount <= MAX_BRIDGE_AMOUNT, "Amount too large");
        require(bytes(l3TransactionHash).length > 0, "Invalid L3 transaction hash");
        require(!processedTransactions[keccak256(abi.encodePacked(l3TransactionHash))], "Transaction already processed");
        
        requestCounter++;
        uint256 requestId = requestCounter;
        
        BridgeRequest storage request = bridgeRequests[requestId];
        request.requestId = requestId;
        request.sender = sender;
        request.recipient = recipient;
        request.assetType = assetType;
        request.assetAddress = assetAddress;
        request.amount = amount;
        request.tokenId = tokenId;
        request.status = BridgeStatus.PROCESSING;
        request.timestamp = block.timestamp;
        request.deadline = block.timestamp + BRIDGE_TIMEOUT;
        request.l3TransactionHash = l3TransactionHash;
        request.merkleRoot = merkleRoot;
        request.validator = msg.sender;
        request.isL3ToL2 = true;
        
        userRequests[recipient].push(requestId);
        totalRequests++;
        totalVolume += amount;
        processedTransactions[keccak256(abi.encodePacked(l3TransactionHash))] = true;
        
        // Transfer assets to recipient
        if (assetType == AssetType.TOKEN) {
            IERC20(assetAddress).transfer(recipient, amount);
        } else if (assetType == AssetType.NFT) {
            IERC721(assetAddress).transferFrom(address(this), recipient, tokenId);
        } else if (assetType == AssetType.ETH) {
            payable(recipient).transfer(amount);
        }
        
        request.status = BridgeStatus.COMPLETED;
        
        // Update validator stats
        ValidatorInfo storage validator = validators[msg.sender];
        validator.totalProcessed++;
        validator.successRate = (validator.successRate * (validator.totalProcessed - 1) + 100) / validator.totalProcessed;
        validator.lastActivity = block.timestamp;
        
        emit BridgeRequestCreated(
            requestId,
            sender,
            recipient,
            assetType,
            assetAddress,
            amount,
            tokenId,
            true,
            block.timestamp
        );
        
        emit BridgeRequestCompleted(
            requestId,
            recipient,
            amount,
            block.timestamp
        );
    }
    
    // =============================================================================
    // VALIDATOR FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Register as a validator
     */
    function registerValidator() external whenNotPaused {
        require(!validators[msg.sender].isActive, "Already registered");
        
        // Transfer stake to contract
        IERC20(settlementContract).transferFrom(msg.sender, address(this), validatorStake);
        
        ValidatorInfo storage validator = validators[msg.sender];
        validator.isActive = true;
        validator.stake = validatorStake;
        validator.lastActivity = block.timestamp;
        
        _grantRole(VALIDATOR_ROLE, msg.sender);
        
        emit ValidatorRegistered(msg.sender, validatorStake, block.timestamp);
    }
    
    /**
     * @dev Unregister as a validator
     */
    function unregisterValidator() external whenNotPaused {
        ValidatorInfo storage validator = validators[msg.sender];
        require(validator.isActive, "Not registered");
        
        validator.isActive = false;
        
        // Return stake to validator
        IERC20(settlementContract).transfer(msg.sender, validator.stake);
        
        _revokeRole(VALIDATOR_ROLE, msg.sender);
        
        emit ValidatorStakeUpdated(msg.sender, validator.stake, 0);
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get bridge request details
     * @param requestId Request ID
     * @return id Request ID
     * @return sender Sender address
     * @return recipient Recipient address
     * @return assetType Asset type
     * @return assetAddress Asset address
     * @return amount Amount
     * @return tokenId Token ID
     * @return status Request status
     * @return timestamp Timestamp
     * @return deadline Deadline
     * @return merkleRoot Merkle root
     * @return l3TransactionHash L3 transaction hash
     * @return validator Validator address
     * @return isL3ToL2 Whether L3 to L2
     */
    function getBridgeRequest(uint256 requestId) external view returns (
        uint256 id,
        address sender,
        address recipient,
        AssetType assetType,
        address assetAddress,
        uint256 amount,
        uint256 tokenId,
        BridgeStatus status,
        uint256 timestamp,
        uint256 deadline,
        bytes32 merkleRoot,
        string memory l3TransactionHash,
        address validator,
        bool isL3ToL2
    ) {
        BridgeRequest storage request = bridgeRequests[requestId];
        return (
            request.requestId,
            request.sender,
            request.recipient,
            request.assetType,
            request.assetAddress,
            request.amount,
            request.tokenId,
            request.status,
            request.timestamp,
            request.deadline,
            request.merkleRoot,
            request.l3TransactionHash,
            request.validator,
            request.isL3ToL2
        );
    }
    
    /**
     * @dev Get validator information
     * @param validator Validator address
     * @return isActive Whether active
     * @return totalProcessed Total processed
     * @return successRate Success rate
     * @return lastActivity Last activity
     * @return stake Stake amount
     */
    function getValidatorInfo(address validator) external view returns (
        bool isActive,
        uint256 totalProcessed,
        uint256 successRate,
        uint256 lastActivity,
        uint256 stake
    ) {
        ValidatorInfo storage info = validators[validator];
        return (
            info.isActive,
            info.totalProcessed,
            info.successRate,
            info.lastActivity,
            info.stake
        );
    }
    
    /**
     * @dev Get user requests
     * @param user User address
     * @return requestIds Array of request IDs
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Update bridge fee
     * @param newFee New fee amount
     */
    function updateBridgeFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldFee = bridgeFee;
        bridgeFee = newFee;
        emit BridgeFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update validator stake requirement
     * @param newStake New stake amount
     */
    function updateValidatorStake(uint256 newStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldStake = validatorStake;
        validatorStake = newStake;
        emit ValidatorStakeUpdated(oldStake, newStake);
    }
    
    /**
     * @dev Update settlement contract
     * @param newSettlement New settlement contract address
     */
    function updateSettlementContract(address newSettlement) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newSettlement != address(0), "Invalid settlement contract");
        settlementContract = newSettlement;
    }
    
    /**
     * @dev Pause bridge
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause bridge
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawTokens(address token, uint256 amount) external onlyRole(EMERGENCY_ROLE) {
        IERC20(token).transfer(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw ETH
     */
    function emergencyWithdrawETH() external onlyRole(EMERGENCY_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // =============================================================================
    // RECEIVE FUNCTION
    // =============================================================================
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 