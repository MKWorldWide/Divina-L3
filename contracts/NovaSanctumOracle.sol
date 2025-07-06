// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NovaSanctum AI Oracle
 * @dev AI-powered oracle for GameDin L3 gaming blockchain
 * @author GameDin Team
 * @notice Provides real-time AI validation, fraud detection, and consensus optimization
 */
contract NovaSanctumOracle is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // =============================================================================
    // STRUCTS AND ENUMS
    // =============================================================================
    
    struct AIAnalysis {
        uint256 fraudScore;            // 0-100 fraud score
        uint256 trustScore;            // 0-100 trust score
        bool isValid;                  // Overall validation result
        uint256 confidence;            // AI confidence level (0-100)
        string reason;                 // Reason for decision
        uint256 timestamp;             // Analysis timestamp
    }
    
    struct PlayerBehavior {
        uint256 totalActions;          // Total actions performed
        uint256 suspiciousActions;     // Number of suspicious actions
        uint256 lastActionTime;        // Last action timestamp
        uint256 averageActionValue;    // Average value per action
        uint256 maxActionValue;        // Maximum single action value
        bool isFlagged;                // Whether player is flagged
        uint256 flagReason;            // Reason for flagging
    }
    
    struct ConsensusOptimization {
        uint256 optimalThreshold;      // Optimal consensus threshold
        uint256 recommendedValidators; // Recommended validator count
        uint256 expectedFinality;      // Expected finality time in ms
        uint256 fraudRisk;             // Current fraud risk level
        bool shouldAdjust;             // Whether to adjust consensus
    }
    
    struct ValidatorMetrics {
        address validator;             // Validator address
        uint256 uptime;                // Uptime percentage
        uint256 responseTime;          // Average response time in ms
        uint256 consensusParticipation; // Consensus participation rate
        uint256 trustScore;            // AI trust score
        bool isOptimal;                // Whether validator is optimal
    }

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    // AI Configuration
    uint256 public constant MAX_FRAUD_SCORE = 100;
    uint256 public constant MIN_TRUST_SCORE = 50;
    uint256 public constant AI_CONFIDENCE_THRESHOLD = 80;
    uint256 public constant SUSPICIOUS_ACTION_THRESHOLD = 5;
    
    // Player behavior tracking
    mapping(address => PlayerBehavior) public playerBehaviors;
    mapping(address => AIAnalysis[]) public playerAnalyses;
    mapping(bytes32 => AIAnalysis) public transactionAnalyses;
    
    // Consensus optimization
    mapping(address => ValidatorMetrics) public validatorMetrics;
    ConsensusOptimization public currentOptimization;
    
    // AI Service configuration
    address public aiServiceProvider;
    mapping(address => bool) public authorizedCallers;
    uint256 public aiResponseTimeout;
    uint256 public lastOptimizationUpdate;
    
    // Statistics
    uint256 public totalAnalyses;
    uint256 public totalFraudDetected;
    uint256 public totalOptimizations;
    uint256 public averageResponseTime;
    
    // Counters
    Counters.Counter private _analysisCounter;
    Counters.Counter private _optimizationCounter;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    event AIAnalysisCompleted(
        address indexed player,
        bytes32 indexed transactionHash,
        uint256 fraudScore,
        uint256 trustScore,
        bool isValid,
        uint256 confidence,
        string reason
    );
    
    event FraudDetected(
        address indexed player,
        bytes32 indexed transactionHash,
        uint256 fraudScore,
        string reason,
        uint256 timestamp
    );
    
    event PlayerFlagged(
        address indexed player,
        uint256 flagReason,
        string details,
        uint256 timestamp
    );
    
    event ConsensusOptimized(
        uint256 oldThreshold,
        uint256 newThreshold,
        uint256 expectedFinality,
        uint256 fraudRisk,
        uint256 timestamp
    );
    
    event ValidatorMetricsUpdated(
        address indexed validator,
        uint256 uptime,
        uint256 responseTime,
        uint256 trustScore,
        bool isOptimal
    );
    
    event AIServiceProviderUpdated(address indexed oldProvider, address indexed newProvider);
    event AuthorizedCallerAdded(address indexed caller, address indexed addedBy);
    event AuthorizedCallerRemoved(address indexed caller, address indexed removedBy);
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    constructor() {
        aiResponseTimeout = 1000; // 1 second timeout
        lastOptimizationUpdate = block.timestamp;
        
        // Initialize default consensus optimization
        currentOptimization = ConsensusOptimization({
            optimalThreshold: 67,      // 67% for gaming
            recommendedValidators: 21,  // 21 validators
            expectedFinality: 200,     // 200ms finality
            fraudRisk: 10,             // Low fraud risk
            shouldAdjust: false
        });
    }
    
    // =============================================================================
    // AI VALIDATION FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Validate a player action using AI analysis
     * @param player Player address
     * @param gameId Game identifier
     * @param actionType Type of action
     * @param xpAmount XP amount
     * @param tokenAmount Token amount
     * @param gameData Additional game data
     * @return Whether the action is valid
     */
    function validatePlayerAction(
        address player,
        string memory gameId,
        string memory actionType,
        uint256 xpAmount,
        uint256 tokenAmount,
        bytes memory gameData
    ) external onlyAuthorizedCaller whenNotPaused returns (bool) {
        require(player != address(0), "Invalid player address");
        
        // Generate transaction hash for tracking
        bytes32 transactionHash = keccak256(abi.encodePacked(
            player,
            gameId,
            actionType,
            xpAmount,
            tokenAmount,
            gameData,
            block.timestamp
        ));
        
        // Perform AI analysis
        AIAnalysis memory analysis = _performAIAnalysis(
            player,
            gameId,
            actionType,
            xpAmount,
            tokenAmount,
            gameData,
            transactionHash
        );
        
        // Store analysis
        transactionAnalyses[transactionHash] = analysis;
        playerAnalyses[player].push(analysis);
        
        // Update player behavior
        _updatePlayerBehavior(player, analysis);
        
        // Emit events
        emit AIAnalysisCompleted(
            player,
            transactionHash,
            analysis.fraudScore,
            analysis.trustScore,
            analysis.isValid,
            analysis.confidence,
            analysis.reason
        );
        
        if (analysis.fraudScore > MAX_FRAUD_SCORE / 2) {
            emit FraudDetected(
                player,
                transactionHash,
                analysis.fraudScore,
                analysis.reason,
                block.timestamp
            );
            totalFraudDetected++;
        }
        
        totalAnalyses++;
        _analysisCounter.increment();
        
        return analysis.isValid;
    }
    
    /**
     * @dev Internal function to perform AI analysis
     */
    function _performAIAnalysis(
        address player,
        string memory gameId,
        string memory actionType,
        uint256 xpAmount,
        uint256 tokenAmount,
        bytes memory gameData,
        bytes32 transactionHash
    ) internal view returns (AIAnalysis memory) {
        PlayerBehavior storage behavior = playerBehaviors[player];
        
        // Calculate fraud score based on multiple factors
        uint256 fraudScore = _calculateFraudScore(
            player,
            behavior,
            xpAmount,
            tokenAmount,
            actionType
        );
        
        // Calculate trust score
        uint256 trustScore = _calculateTrustScore(player, behavior);
        
        // Determine if action is valid
        bool isValid = fraudScore < MAX_FRAUD_SCORE / 2 && 
                      trustScore > MIN_TRUST_SCORE;
        
        // Generate reason for decision
        string memory reason = _generateReason(fraudScore, trustScore, behavior);
        
        return AIAnalysis({
            fraudScore: fraudScore,
            trustScore: trustScore,
            isValid: isValid,
            confidence: _calculateConfidence(fraudScore, trustScore),
            reason: reason,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @dev Calculate fraud score based on various factors
     */
    function _calculateFraudScore(
        address player,
        PlayerBehavior storage behavior,
        uint256 xpAmount,
        uint256 tokenAmount,
        string memory actionType
    ) internal view returns (uint256) {
        uint256 fraudScore = 0;
        
        // Check for suspicious action patterns
        if (behavior.suspiciousActions > SUSPICIOUS_ACTION_THRESHOLD) {
            fraudScore += 30;
        }
        
        // Check for unusual reward amounts
        if (xpAmount > behavior.averageActionValue * 10) {
            fraudScore += 25;
        }
        
        if (tokenAmount > behavior.maxActionValue * 5) {
            fraudScore += 25;
        }
        
        // Check for rapid successive actions
        if (block.timestamp - behavior.lastActionTime < 1) {
            fraudScore += 20;
        }
        
        // Check if player is flagged
        if (behavior.isFlagged) {
            fraudScore += 50;
        }
        
        return fraudScore > MAX_FRAUD_SCORE ? MAX_FRAUD_SCORE : fraudScore;
    }
    
    /**
     * @dev Calculate trust score for a player
     */
    function _calculateTrustScore(
        address player,
        PlayerBehavior storage behavior
    ) internal view returns (uint256) {
        uint256 trustScore = 50; // Base trust score
        
        // Increase trust based on positive behavior
        if (behavior.totalActions > 100) {
            trustScore += 20;
        }
        
        if (behavior.suspiciousActions == 0) {
            trustScore += 20;
        }
        
        if (behavior.averageActionValue > 0 && 
            behavior.averageActionValue < 1000) {
            trustScore += 10;
        }
        
        return trustScore > 100 ? 100 : trustScore;
    }
    
    /**
     * @dev Calculate AI confidence level
     */
    function _calculateConfidence(
        uint256 fraudScore,
        uint256 trustScore
    ) internal pure returns (uint256) {
        // Higher confidence when scores are clear
        if (fraudScore < 20 && trustScore > 80) {
            return 95;
        } else if (fraudScore > 80 || trustScore < 20) {
            return 90;
        } else {
            return 75; // Medium confidence for unclear cases
        }
    }
    
    /**
     * @dev Generate reason for AI decision
     */
    function _generateReason(
        uint256 fraudScore,
        uint256 trustScore,
        PlayerBehavior storage behavior
    ) internal view returns (string memory) {
        if (fraudScore > 80) {
            return "High fraud score detected";
        } else if (trustScore < 30) {
            return "Low trust score";
        } else if (behavior.isFlagged) {
            return "Player flagged for suspicious activity";
        } else if (fraudScore > 50) {
            return "Moderate fraud risk";
        } else {
            return "Action validated successfully";
        }
    }
    
    // =============================================================================
    // CONSENSUS OPTIMIZATION
    // =============================================================================
    
    /**
     * @dev Optimize consensus parameters based on AI analysis
     * @return Optimization result
     */
    function optimizeConsensus() external onlyAuthorizedCaller whenNotPaused returns (ConsensusOptimization memory) {
        require(block.timestamp - lastOptimizationUpdate > 300, "Too frequent optimization");
        
        // Analyze current network state
        uint256 currentFraudRisk = _calculateNetworkFraudRisk();
        uint256 currentLoad = _calculateNetworkLoad();
        
        // Determine optimal parameters
        uint256 newThreshold = _calculateOptimalThreshold(currentFraudRisk, currentLoad);
        uint256 newFinality = _calculateOptimalFinality(currentFraudRisk, currentLoad);
        
        // Update optimization
        ConsensusOptimization memory oldOptimization = currentOptimization;
        currentOptimization = ConsensusOptimization({
            optimalThreshold: newThreshold,
            recommendedValidators: 21, // Keep constant for now
            expectedFinality: newFinality,
            fraudRisk: currentFraudRisk,
            shouldAdjust: newThreshold != oldOptimization.optimalThreshold
        });
        
        lastOptimizationUpdate = block.timestamp;
        totalOptimizations++;
        _optimizationCounter.increment();
        
        emit ConsensusOptimized(
            oldOptimization.optimalThreshold,
            newThreshold,
            newFinality,
            currentFraudRisk,
            block.timestamp
        );
        
        return currentOptimization;
    }
    
    /**
     * @dev Calculate optimal consensus threshold
     */
    function _calculateOptimalThreshold(
        uint256 fraudRisk,
        uint256 networkLoad
    ) internal pure returns (uint256) {
        // Higher fraud risk = higher threshold
        if (fraudRisk > 50) {
            return 80; // 80% threshold for high fraud
        } else if (fraudRisk > 20) {
            return 75; // 75% threshold for moderate fraud
        } else {
            return 67; // 67% threshold for low fraud (gaming optimized)
        }
    }
    
    /**
     * @dev Calculate optimal finality time
     */
    function _calculateOptimalFinality(
        uint256 fraudRisk,
        uint256 networkLoad
    ) internal pure returns (uint256) {
        // Higher fraud risk = longer finality
        if (fraudRisk > 50) {
            return 1000; // 1 second for high fraud
        } else if (fraudRisk > 20) {
            return 500; // 500ms for moderate fraud
        } else {
            return 200; // 200ms for low fraud (gaming optimized)
        }
    }
    
    /**
     * @dev Calculate current network fraud risk
     */
    function _calculateNetworkFraudRisk() internal view returns (uint256) {
        // Simplified calculation - in practice would use more sophisticated metrics
        if (totalAnalyses == 0) return 10;
        
        return (totalFraudDetected * 100) / totalAnalyses;
    }
    
    /**
     * @dev Calculate current network load
     */
    function _calculateNetworkLoad() internal view returns (uint256) {
        // Simplified calculation - in practice would use actual network metrics
        return 50; // Medium load
    }
    
    // =============================================================================
    // VALIDATOR METRICS
    // =============================================================================
    
    /**
     * @dev Update validator metrics
     * @param validator Validator address
     * @param uptime Uptime percentage
     * @param responseTime Average response time in ms
     * @param consensusParticipation Consensus participation rate
     */
    function updateValidatorMetrics(
        address validator,
        uint256 uptime,
        uint256 responseTime,
        uint256 consensusParticipation
    ) external onlyAuthorizedCaller whenNotPaused {
        require(validator != address(0), "Invalid validator address");
        
        // Calculate trust score
        uint256 trustScore = _calculateValidatorTrustScore(
            uptime,
            responseTime,
            consensusParticipation
        );
        
        // Determine if validator is optimal
        bool isOptimal = trustScore > 80 && uptime > 95 && responseTime < 100;
        
        validatorMetrics[validator] = ValidatorMetrics({
            validator: validator,
            uptime: uptime,
            responseTime: responseTime,
            consensusParticipation: consensusParticipation,
            trustScore: trustScore,
            isOptimal: isOptimal
        });
        
        emit ValidatorMetricsUpdated(
            validator,
            uptime,
            responseTime,
            trustScore,
            isOptimal
        );
    }
    
    /**
     * @dev Calculate validator trust score
     */
    function _calculateValidatorTrustScore(
        uint256 uptime,
        uint256 responseTime,
        uint256 consensusParticipation
    ) internal pure returns (uint256) {
        uint256 trustScore = 0;
        
        // Uptime contribution (40% weight)
        trustScore += (uptime * 40) / 100;
        
        // Response time contribution (30% weight)
        if (responseTime < 50) {
            trustScore += 30;
        } else if (responseTime < 100) {
            trustScore += 20;
        } else if (responseTime < 200) {
            trustScore += 10;
        }
        
        // Consensus participation contribution (30% weight)
        trustScore += (consensusParticipation * 30) / 100;
        
        return trustScore;
    }
    
    // =============================================================================
    // PLAYER BEHAVIOR MANAGEMENT
    // =============================================================================
    
    /**
     * @dev Update player behavior based on AI analysis
     */
    function _updatePlayerBehavior(
        address player,
        AIAnalysis memory analysis
    ) internal {
        PlayerBehavior storage behavior = playerBehaviors[player];
        
        behavior.totalActions++;
        behavior.lastActionTime = block.timestamp;
        
        if (analysis.fraudScore > MAX_FRAUD_SCORE / 2) {
            behavior.suspiciousActions++;
            
            // Flag player if too many suspicious actions
            if (behavior.suspiciousActions > SUSPICIOUS_ACTION_THRESHOLD) {
                behavior.isFlagged = true;
                behavior.flagReason = 1; // Too many suspicious actions
                
                emit PlayerFlagged(
                    player,
                    behavior.flagReason,
                    "Multiple suspicious actions detected",
                    block.timestamp
                );
            }
        }
    }
    
    /**
     * @dev Flag a player for manual review
     * @param player Player address
     * @param reason Flag reason
     * @param details Additional details
     */
    function flagPlayer(
        address player,
        uint256 reason,
        string memory details
    ) external onlyOwner {
        require(player != address(0), "Invalid player address");
        
        PlayerBehavior storage behavior = playerBehaviors[player];
        behavior.isFlagged = true;
        behavior.flagReason = reason;
        
        emit PlayerFlagged(player, reason, details, block.timestamp);
    }
    
    /**
     * @dev Unflag a player
     * @param player Player address
     */
    function unflagPlayer(address player) external onlyOwner {
        require(player != address(0), "Invalid player address");
        
        PlayerBehavior storage behavior = playerBehaviors[player];
        behavior.isFlagged = false;
        behavior.flagReason = 0;
    }
    
    // =============================================================================
    // QUERY FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get current consensus optimization
     * @return Current optimization parameters
     */
    function getCurrentOptimization() external view returns (ConsensusOptimization memory) {
        return currentOptimization;
    }
    
    /**
     * @dev Get player behavior data
     * @param player Player address
     * @return Player behavior data
     */
    function getPlayerBehavior(address player) external view returns (
        uint256 totalActions,
        uint256 suspiciousActions,
        uint256 lastActionTime,
        uint256 averageActionValue,
        uint256 maxActionValue,
        bool isFlagged,
        uint256 flagReason
    ) {
        PlayerBehavior storage behavior = playerBehaviors[player];
        return (
            behavior.totalActions,
            behavior.suspiciousActions,
            behavior.lastActionTime,
            behavior.averageActionValue,
            behavior.maxActionValue,
            behavior.isFlagged,
            behavior.flagReason
        );
    }
    
    /**
     * @dev Get validator metrics
     * @param validator Validator address
     * @return Validator metrics
     */
    function getValidatorMetrics(address validator) external view returns (
        uint256 uptime,
        uint256 responseTime,
        uint256 consensusParticipation,
        uint256 trustScore,
        bool isOptimal
    ) {
        ValidatorMetrics storage metrics = validatorMetrics[validator];
        return (
            metrics.uptime,
            metrics.responseTime,
            metrics.consensusParticipation,
            metrics.trustScore,
            metrics.isOptimal
        );
    }
    
    /**
     * @dev Get AI analysis for a transaction
     * @param transactionHash Transaction hash
     * @return AI analysis result
     */
    function getTransactionAnalysis(bytes32 transactionHash) external view returns (
        uint256 fraudScore,
        uint256 trustScore,
        bool isValid,
        uint256 confidence,
        string memory reason,
        uint256 timestamp
    ) {
        AIAnalysis storage analysis = transactionAnalyses[transactionHash];
        return (
            analysis.fraudScore,
            analysis.trustScore,
            analysis.isValid,
            analysis.confidence,
            analysis.reason,
            analysis.timestamp
        );
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Set AI service provider
     * @param provider New AI service provider address
     */
    function setAIServiceProvider(address provider) external onlyOwner {
        address oldProvider = aiServiceProvider;
        aiServiceProvider = provider;
        emit AIServiceProviderUpdated(oldProvider, provider);
    }
    
    /**
     * @dev Add authorized caller
     * @param caller Caller address
     */
    function addAuthorizedCaller(address caller) external onlyOwner {
        require(caller != address(0), "Invalid caller address");
        authorizedCallers[caller] = true;
        emit AuthorizedCallerAdded(caller, msg.sender);
    }
    
    /**
     * @dev Remove authorized caller
     * @param caller Caller address
     */
    function removeAuthorizedCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit AuthorizedCallerRemoved(caller, msg.sender);
    }
    
    /**
     * @dev Set AI response timeout
     * @param timeout Timeout in milliseconds
     */
    function setAIResponseTimeout(uint256 timeout) external onlyOwner {
        aiResponseTimeout = timeout;
    }
    
    /**
     * @dev Pause oracle
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause oracle
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // =============================================================================
    // MODIFIERS
    // =============================================================================
    
    modifier onlyAuthorizedCaller() {
        require(
            authorizedCallers[msg.sender] || msg.sender == owner(),
            "Not authorized caller"
        );
        _;
    }
} 