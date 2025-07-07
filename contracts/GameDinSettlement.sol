// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GameDin Settlement Contract
 * @dev L2 settlement layer for GameDin L3 gaming blockchain
 * Handles cross-chain asset transfers, dispute resolution, and final settlement
 */
contract GameDinSettlement is ERC20, ERC20Pausable, AccessControl, ReentrancyGuard {
    // =============================================================================
    // CONSTANTS & ROLES
    // =============================================================================
    
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant SETTLEMENT_TIMEOUT = 7 days;
    uint256 public constant DISPUTE_WINDOW = 3 days;
    uint256 public constant MAX_SETTLEMENT_AMOUNT = 1000000 * 10**18; // 1M tokens
    
    // =============================================================================
    // STRUCTS & ENUMS
    // =============================================================================
    
    enum SettlementStatus {
        PENDING,
        CONFIRMED,
        DISPUTED,
        RESOLVED,
        CANCELLED
    }
    
    enum DisputeReason {
        INSUFFICIENT_FUNDS,
        INVALID_TRANSACTION,
        FRAUD_DETECTED,
        TECHNICAL_ERROR,
        OTHER
    }
    
    struct Settlement {
        uint256 settlementId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        SettlementStatus status;
        string l3TransactionHash;
        bytes32 merkleRoot;
        uint256 disputeDeadline;
        address disputeInitiator;
        DisputeReason disputeReason;
        string disputeDetails;
    }
    
    struct Dispute {
        uint256 settlementId;
        address initiator;
        DisputeReason reason;
        string details;
        uint256 timestamp;
        bool resolved;
        address resolver;
        string resolution;
    }
    
    struct BridgeConfig {
        address bridgeAddress;
        bool isActive;
        uint256 minConfirmations;
        uint256 maxAmount;
        uint256 fee;
    }
    
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    uint256 public settlementCounter;
    uint256 public totalSettlements;
    uint256 public totalDisputes;
    uint256 public settlementFee = 0.001 * 10**18; // 0.001 tokens
    uint256 public disputeFee = 0.01 * 10**18; // 0.01 tokens
    
    mapping(uint256 => Settlement) public settlements;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public userSettlements;
    mapping(bytes32 => bool) public processedL3Transactions;
    mapping(address => BridgeConfig) public bridgeConfigs;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    event SettlementCreated(
        uint256 indexed settlementId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string l3TransactionHash,
        uint256 timestamp
    );
    
    event SettlementConfirmed(
        uint256 indexed settlementId,
        address indexed confirmer,
        uint256 timestamp
    );
    
    event SettlementDisputed(
        uint256 indexed settlementId,
        address indexed initiator,
        DisputeReason reason,
        string details,
        uint256 timestamp
    );
    
    event DisputeResolved(
        uint256 indexed settlementId,
        address indexed resolver,
        string resolution,
        uint256 timestamp
    );
    
    event BridgeConfigUpdated(
        address indexed bridgeAddress,
        bool isActive,
        uint256 minConfirmations,
        uint256 maxAmount,
        uint256 fee
    );
    
    event SettlementFeeUpdated(uint256 oldFee, uint256 newFee);
    event DisputeFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    constructor(
        address initialOwner,
        uint256 initialSupply
    ) ERC20("GameDin Settlement Token", "GDIS") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(SETTLEMENT_ROLE, initialOwner);
        _grantRole(BRIDGE_ROLE, initialOwner);
        _grantRole(DISPUTE_RESOLVER_ROLE, initialOwner);
        _grantRole(EMERGENCY_ROLE, initialOwner);
        
        _mint(initialOwner, initialSupply);
    }
    
    // =============================================================================
    // SETTLEMENT FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Create a new settlement
     * @param to Recipient address
     * @param amount Settlement amount
     * @param l3TransactionHash L3 transaction hash
     * @param merkleRoot Merkle root for verification
     */
    function createSettlement(
        address to,
        uint256 amount,
        string memory l3TransactionHash,
        bytes32 merkleRoot
    ) external onlyRole(SETTLEMENT_ROLE) whenNotPaused nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= MAX_SETTLEMENT_AMOUNT, "Amount exceeds maximum");
        require(bytes(l3TransactionHash).length > 0, "Invalid L3 transaction hash");
        require(!processedL3Transactions[keccak256(abi.encodePacked(l3TransactionHash))], "L3 transaction already processed");
        
        settlementCounter++;
        uint256 settlementId = settlementCounter;
        
        Settlement storage settlement = settlements[settlementId];
        settlement.settlementId = settlementId;
        settlement.from = msg.sender;
        settlement.to = to;
        settlement.amount = amount;
        settlement.timestamp = block.timestamp;
        settlement.status = SettlementStatus.PENDING;
        settlement.l3TransactionHash = l3TransactionHash;
        settlement.merkleRoot = merkleRoot;
        settlement.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
        
        userSettlements[to].push(settlementId);
        processedL3Transactions[keccak256(abi.encodePacked(l3TransactionHash))] = true;
        totalSettlements++;
        
        emit SettlementCreated(settlementId, msg.sender, to, amount, l3TransactionHash, block.timestamp);
    }
    
    /**
     * @dev Confirm a settlement
     * @param settlementId Settlement ID
     */
    function confirmSettlement(uint256 settlementId) external onlyRole(SETTLEMENT_ROLE) whenNotPaused {
        Settlement storage settlement = settlements[settlementId];
        require(settlement.settlementId != 0, "Settlement does not exist");
        require(settlement.status == SettlementStatus.PENDING, "Settlement not pending");
        require(block.timestamp <= settlement.disputeDeadline, "Dispute window expired");
        
        settlement.status = SettlementStatus.CONFIRMED;
        
        // Transfer tokens to recipient
        _transfer(settlement.from, settlement.to, settlement.amount);
        
        emit SettlementConfirmed(settlementId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Initiate a dispute for a settlement
     * @param settlementId Settlement ID
     * @param reason Dispute reason
     * @param details Dispute details
     */
    function initiateDispute(
        uint256 settlementId,
        DisputeReason reason,
        string memory details
    ) external payable whenNotPaused {
        require(msg.value >= disputeFee, "Insufficient dispute fee");
        
        Settlement storage settlement = settlements[settlementId];
        require(settlement.settlementId != 0, "Settlement does not exist");
        require(settlement.status == SettlementStatus.PENDING, "Settlement not pending");
        require(block.timestamp <= settlement.disputeDeadline, "Dispute window expired");
        require(msg.sender == settlement.to || hasRole(DISPUTE_RESOLVER_ROLE, msg.sender), "Not authorized to dispute");
        
        settlement.status = SettlementStatus.DISPUTED;
        settlement.disputeInitiator = msg.sender;
        settlement.disputeReason = reason;
        settlement.disputeDetails = details;
        
        totalDisputes++;
        
        Dispute storage dispute = disputes[settlementId];
        dispute.settlementId = settlementId;
        dispute.initiator = msg.sender;
        dispute.reason = reason;
        dispute.details = details;
        dispute.timestamp = block.timestamp;
        
        emit SettlementDisputed(settlementId, msg.sender, reason, details, block.timestamp);
    }
    
    /**
     * @dev Resolve a dispute
     * @param settlementId Settlement ID
     * @param resolution Resolution details
     * @param approveSettlement Whether to approve the settlement
     */
    function resolveDispute(
        uint256 settlementId,
        string memory resolution,
        bool approveSettlement
    ) external onlyRole(DISPUTE_RESOLVER_ROLE) whenNotPaused {
        Settlement storage settlement = settlements[settlementId];
        Dispute storage dispute = disputes[settlementId];
        
        require(settlement.settlementId != 0, "Settlement does not exist");
        require(settlement.status == SettlementStatus.DISPUTED, "Settlement not disputed");
        require(!dispute.resolved, "Dispute already resolved");
        
        dispute.resolved = true;
        dispute.resolver = msg.sender;
        dispute.resolution = resolution;
        
        if (approveSettlement) {
            settlement.status = SettlementStatus.RESOLVED;
            _transfer(settlement.from, settlement.to, settlement.amount);
        } else {
            settlement.status = SettlementStatus.CANCELLED;
        }
        
        emit DisputeResolved(settlementId, msg.sender, resolution, block.timestamp);
    }
    
    // =============================================================================
    // BRIDGE FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Configure a bridge
     * @param bridgeAddress Bridge contract address
     * @param isActive Whether bridge is active
     * @param minConfirmations Minimum confirmations required
     * @param maxAmount Maximum amount per transaction
     * @param fee Bridge fee
     */
    function configureBridge(
        address bridgeAddress,
        bool isActive,
        uint256 minConfirmations,
        uint256 maxAmount,
        uint256 fee
    ) external onlyRole(BRIDGE_ROLE) {
        require(bridgeAddress != address(0), "Invalid bridge address");
        
        BridgeConfig storage config = bridgeConfigs[bridgeAddress];
        config.bridgeAddress = bridgeAddress;
        config.isActive = isActive;
        config.minConfirmations = minConfirmations;
        config.maxAmount = maxAmount;
        config.fee = fee;
        
        emit BridgeConfigUpdated(bridgeAddress, isActive, minConfirmations, maxAmount, fee);
    }
    
    /**
     * @dev Process bridge transaction
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     * @param bridgeAddress Bridge address
     */
    function processBridgeTransaction(
        address from,
        address to,
        uint256 amount,
        address bridgeAddress
    ) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        BridgeConfig storage config = bridgeConfigs[bridgeAddress];
        require(config.isActive, "Bridge not active");
        require(amount <= config.maxAmount, "Amount exceeds bridge limit");
        
        _transfer(from, to, amount);
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get settlement details
     * @param settlementId Settlement ID
     * @return id Settlement ID
     * @return from Sender address
     * @return to Recipient address
     * @return amount Amount
     * @return timestamp Timestamp
     * @return status Settlement status
     * @return l3TransactionHash L3 transaction hash
     * @return merkleRoot Merkle root
     * @return disputeDeadline Dispute deadline
     * @return disputeInitiator Dispute initiator
     * @return disputeReason Dispute reason
     * @return disputeDetails Dispute details
     */
    function getSettlement(uint256 settlementId) external view returns (
        uint256 id,
        address from,
        address to,
        uint256 amount,
        uint256 timestamp,
        SettlementStatus status,
        string memory l3TransactionHash,
        bytes32 merkleRoot,
        uint256 disputeDeadline,
        address disputeInitiator,
        DisputeReason disputeReason,
        string memory disputeDetails
    ) {
        Settlement storage settlement = settlements[settlementId];
        return (
            settlement.settlementId,
            settlement.from,
            settlement.to,
            settlement.amount,
            settlement.timestamp,
            settlement.status,
            settlement.l3TransactionHash,
            settlement.merkleRoot,
            settlement.disputeDeadline,
            settlement.disputeInitiator,
            settlement.disputeReason,
            settlement.disputeDetails
        );
    }
    
    /**
     * @dev Get dispute details
     * @param settlementId Settlement ID
     * @return id Settlement ID
     * @return initiator Dispute initiator
     * @return reason Dispute reason
     * @return details Dispute details
     * @return timestamp Timestamp
     * @return resolved Whether resolved
     * @return resolver Resolver address
     * @return resolution Resolution details
     */
    function getDispute(uint256 settlementId) external view returns (
        uint256 id,
        address initiator,
        DisputeReason reason,
        string memory details,
        uint256 timestamp,
        bool resolved,
        address resolver,
        string memory resolution
    ) {
        Dispute storage dispute = disputes[settlementId];
        return (
            dispute.settlementId,
            dispute.initiator,
            dispute.reason,
            dispute.details,
            dispute.timestamp,
            dispute.resolved,
            dispute.resolver,
            dispute.resolution
        );
    }
    
    /**
     * @dev Get user settlements
     * @param user User address
     * @return settlementIds Array of settlement IDs
     */
    function getUserSettlements(address user) external view returns (uint256[] memory) {
        return userSettlements[user];
    }
    
    /**
     * @dev Get bridge configuration
     * @param bridgeAddress Bridge address
     * @return bridge Bridge address
     * @return isActive Whether active
     * @return minConfirmations Minimum confirmations
     * @return maxAmount Maximum amount
     * @return fee Bridge fee
     */
    function getBridgeConfig(address bridgeAddress) external view returns (
        address bridge,
        bool isActive,
        uint256 minConfirmations,
        uint256 maxAmount,
        uint256 fee
    ) {
        BridgeConfig storage config = bridgeConfigs[bridgeAddress];
        return (
            config.bridgeAddress,
            config.isActive,
            config.minConfirmations,
            config.maxAmount,
            config.fee
        );
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Update settlement fee
     * @param newFee New fee amount
     */
    function updateSettlementFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldFee = settlementFee;
        settlementFee = newFee;
        emit SettlementFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update dispute fee
     * @param newFee New fee amount
     */
    function updateDisputeFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldFee = disputeFee;
        disputeFee = newFee;
        emit DisputeFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw ETH
     */
    function emergencyWithdrawETH() external onlyRole(EMERGENCY_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    /**
     * @dev Emergency withdraw tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawTokens(address token, uint256 amount) external onlyRole(EMERGENCY_ROLE) {
        IERC20(token).transfer(msg.sender, amount);
    }
    
    // =============================================================================
    // OVERRIDE FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Override transfer function to check pause
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Pausable) whenNotPaused {
        super._update(from, to, amount);
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 