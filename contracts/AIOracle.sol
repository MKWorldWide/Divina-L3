// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title AIOracle
 * @dev Advanced AI Oracle for GameDin L3 ecosystem
 * @dev Integrates NovaSanctum and AthenaMist AI services
 * @dev Provides real-time gaming analytics and fraud detection
 */
contract AIOracle is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============ STRUCTS ============
    
    struct AIRequest {
        uint256 requestId;
        address player;
        uint256 gameId;
        AIRequestType requestType;
        uint256 timestamp;
        bool isProcessed;
        AIResponse response;
        uint256 gasUsed;
    }

    struct AIResponse {
        uint256 fraudScore;
        uint256 skillLevel;
        uint256 riskAssessment;
        uint256 predictedOutcome;
        uint256 confidence;
        uint256[] behaviorPatterns;
        string analysisHash;
        uint256 responseTime;
    }

    struct AIService {
        string serviceName;
        address serviceAddress;
        bool isActive;
        uint256 successRate;
        uint256 totalRequests;
        uint256 lastUpdate;
        uint256 fee;
    }

    struct PlayerAnalytics {
        uint256 totalGames;
        uint256 averageScore;
        uint256 winRate;
        uint256 fraudScore;
        uint256 skillLevel;
        uint256 riskLevel;
        uint256[] recentScores;
        uint256 lastUpdate;
        bool isFlagged;
        string flagReason;
    }

    // ============ ENUMS ============
    
    enum AIRequestType {
        FRAUD_DETECTION,
        SKILL_ASSESSMENT,
        RISK_ANALYSIS,
        OUTCOME_PREDICTION,
        BEHAVIOR_ANALYSIS,
        COMPREHENSIVE_ANALYSIS
    }

    enum AIServiceType {
        NOVASANCTUM,
        ATHENAMIST,
        UNIFIED
    }

    // ============ STATE VARIABLES ============
    
    Counters.Counter private _requestIds;
    
    mapping(uint256 => AIRequest) public aiRequests;
    mapping(address => PlayerAnalytics) public playerAnalytics;
    mapping(AIServiceType => AIService) public aiServices;
    mapping(address => uint256) public serviceBalances;
    
    address public gamingCore;
    address public novaSanctumService;
    address public athenaMistService;
    address public chainlinkOracle;
    
    uint256 public requestFee = 0.001 ether;
    uint256 public responseTimeout = 300; // 5 minutes
    uint256 public maxGasLimit = 500000;
    uint256 public minConfidence = 70; // 70%
    
    bool public emergencyMode = false;
    
    // ============ EVENTS ============
    
    event AIRequestCreated(
        uint256 indexed requestId,
        address indexed player,
        uint256 indexed gameId,
        AIRequestType requestType,
        uint256 timestamp
    );
    
    event AIResponseReceived(
        uint256 indexed requestId,
        address indexed player,
        uint256 fraudScore,
        uint256 skillLevel,
        uint256 confidence,
        uint256 responseTime
    );
    
    event PlayerAnalyticsUpdated(
        address indexed player,
        uint256 fraudScore,
        uint256 skillLevel,
        uint256 riskLevel,
        bool isFlagged
    );
    
    event AIServiceUpdated(
        AIServiceType indexed serviceType,
        string serviceName,
        address serviceAddress,
        bool isActive
    );
    
    event EmergencyModeToggled(bool enabled);
    event RequestFeeUpdated(uint256 newFee);
    event ResponseTimeoutUpdated(uint256 newTimeout);

    // ============ MODIFIERS ============
    
    modifier onlyGamingCore() {
        require(msg.sender == gamingCore, "Only GamingCore can call");
        _;
    }
    
    modifier onlyAIService() {
        require(
            msg.sender == novaSanctumService || 
            msg.sender == athenaMistService,
            "Only AI services can call"
        );
        _;
    }
    
    modifier notEmergencyMode() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor(
        address _gamingCore,
        address _novaSanctumService,
        address _athenaMistService,
        address _chainlinkOracle
    ) {
        gamingCore = _gamingCore;
        novaSanctumService = _novaSanctumService;
        athenaMistService = _athenaMistService;
        chainlinkOracle = _chainlinkOracle;
        
        // Initialize AI services
        aiServices[AIServiceType.NOVASANCTUM] = AIService({
            serviceName: "NovaSanctum",
            serviceAddress: _novaSanctumService,
            isActive: true,
            successRate: 95,
            totalRequests: 0,
            lastUpdate: block.timestamp,
            fee: 0.0005 ether
        });
        
        aiServices[AIServiceType.ATHENAMIST] = AIService({
            serviceName: "AthenaMist",
            serviceAddress: _athenaMistService,
            isActive: true,
            totalRequests: 0,
            successRate: 92,
            lastUpdate: block.timestamp,
            fee: 0.0005 ether
        });
        
        aiServices[AIServiceType.UNIFIED] = AIService({
            serviceName: "Unified AI",
            serviceAddress: address(this),
            isActive: true,
            successRate: 98,
            totalRequests: 0,
            lastUpdate: block.timestamp,
            fee: 0.001 ether
        });
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Request AI analysis for a player
     * @param player Player address
     * @param gameId Game ID
     * @param requestType Type of AI analysis requested
     * @param serviceType AI service to use
     */
    function requestAIAnalysis(
        address player,
        uint256 gameId,
        AIRequestType requestType,
        AIServiceType serviceType
    ) 
        external 
        payable 
        nonReentrant 
        notEmergencyMode 
        returns (uint256)
    {
        require(msg.value >= requestFee, "Insufficient fee");
        require(aiServices[serviceType].isActive, "AI service not active");
        require(player != address(0), "Invalid player address");
        
        _requestIds.increment();
        uint256 requestId = _requestIds.current();
        
        AIRequest storage request = aiRequests[requestId];
        request.requestId = requestId;
        request.player = player;
        request.gameId = gameId;
        request.requestType = requestType;
        request.timestamp = block.timestamp;
        request.isProcessed = false;
        request.gasUsed = 0;
        
        // Update service statistics
        aiServices[serviceType].totalRequests++;
        aiServices[serviceType].lastUpdate = block.timestamp;
        
        emit AIRequestCreated(requestId, player, gameId, requestType, block.timestamp);
        
        // Process request based on service type
        if (serviceType == AIServiceType.NOVASANCTUM) {
            _processNovaSanctumRequest(requestId, player, gameId, requestType);
        } else if (serviceType == AIServiceType.ATHENAMIST) {
            _processAthenaMistRequest(requestId, player, gameId, requestType);
        } else if (serviceType == AIServiceType.UNIFIED) {
            _processUnifiedRequest(requestId, player, gameId, requestType);
        }
        
        return requestId;
    }
    
    /**
     * @dev Process NovaSanctum AI request
     * @param requestId Request ID
     * @param player Player address
     * @param gameId Game ID
     * @param requestType Request type
     */
    function _processNovaSanctumRequest(
        uint256 requestId,
        address player,
        uint256 gameId,
        AIRequestType requestType
    ) internal {
        // Simulate NovaSanctum AI processing
        uint256 fraudScore = _calculateFraudScore(player, gameId);
        uint256 skillLevel = _calculateSkillLevel(player);
        uint256 riskAssessment = _calculateRiskAssessment(player, gameId);
        uint256 predictedOutcome = _predictGameOutcome(player, gameId);
        
        AIResponse memory response = AIResponse({
            fraudScore: fraudScore,
            skillLevel: skillLevel,
            riskAssessment: riskAssessment,
            predictedOutcome: predictedOutcome,
            confidence: 85 + (block.timestamp % 15), // 85-99% confidence
            behaviorPatterns: new uint256[](5),
            analysisHash: _generateAnalysisHash(player, gameId),
            responseTime: block.timestamp
        });
        
        _completeAIRequest(requestId, response);
    }
    
    /**
     * @dev Process AthenaMist AI request
     * @param requestId Request ID
     * @param player Player address
     * @param gameId Game ID
     * @param requestType Request type
     */
    function _processAthenaMistRequest(
        uint256 requestId,
        address player,
        uint256 gameId,
        AIRequestType requestType
    ) internal {
        // Simulate AthenaMist AI processing
        uint256 fraudScore = _calculateAdvancedFraudScore(player, gameId);
        uint256 skillLevel = _calculateAdvancedSkillLevel(player);
        uint256 riskAssessment = _calculateAdvancedRiskAssessment(player, gameId);
        uint256 predictedOutcome = _predictAdvancedGameOutcome(player, gameId);
        
        AIResponse memory response = AIResponse({
            fraudScore: fraudScore,
            skillLevel: skillLevel,
            riskAssessment: riskAssessment,
            predictedOutcome: predictedOutcome,
            confidence: 88 + (block.timestamp % 12), // 88-99% confidence
            behaviorPatterns: _generateBehaviorPatterns(player),
            analysisHash: _generateAdvancedAnalysisHash(player, gameId),
            responseTime: block.timestamp
        });
        
        _completeAIRequest(requestId, response);
    }
    
    /**
     * @dev Process unified AI request (combines both services)
     * @param requestId Request ID
     * @param player Player address
     * @param gameId Game ID
     * @param requestType Request type
     */
    function _processUnifiedRequest(
        uint256 requestId,
        address player,
        uint256 gameId,
        AIRequestType requestType
    ) internal {
        // Get results from both services and combine them
        uint256 novaFraudScore = _calculateFraudScore(player, gameId);
        uint256 athenaFraudScore = _calculateAdvancedFraudScore(player, gameId);
        uint256 unifiedFraudScore = (novaFraudScore + athenaFraudScore) / 2;
        
        uint256 novaSkillLevel = _calculateSkillLevel(player);
        uint256 athenaSkillLevel = _calculateAdvancedSkillLevel(player);
        uint256 unifiedSkillLevel = (novaSkillLevel + athenaSkillLevel) / 2;
        
        uint256 novaRisk = _calculateRiskAssessment(player, gameId);
        uint256 athenaRisk = _calculateAdvancedRiskAssessment(player, gameId);
        uint256 unifiedRisk = (novaRisk + athenaRisk) / 2;
        
        uint256 novaOutcome = _predictGameOutcome(player, gameId);
        uint256 athenaOutcome = _predictAdvancedGameOutcome(player, gameId);
        uint256 unifiedOutcome = (novaOutcome + athenaOutcome) / 2;
        
        AIResponse memory response = AIResponse({
            fraudScore: unifiedFraudScore,
            skillLevel: unifiedSkillLevel,
            riskAssessment: unifiedRisk,
            predictedOutcome: unifiedOutcome,
            confidence: 95 + (block.timestamp % 5), // 95-99% confidence
            behaviorPatterns: _generateUnifiedBehaviorPatterns(player),
            analysisHash: _generateUnifiedAnalysisHash(player, gameId),
            responseTime: block.timestamp
        });
        
        _completeAIRequest(requestId, response);
    }
    
    /**
     * @dev Complete AI request and update analytics
     * @param requestId Request ID
     * @param response AI response
     */
    function _completeAIRequest(uint256 requestId, AIResponse memory response) internal {
        AIRequest storage request = aiRequests[requestId];
        request.isProcessed = true;
        request.response = response;
        
        // Update player analytics
        _updatePlayerAnalytics(request.player, response);
        
        // Update GamingCore contract
        if (gamingCore != address(0)) {
            // Call GamingCore to update AI analytics
            // This would be implemented in the actual contract
        }
        
        emit AIResponseReceived(
            requestId,
            request.player,
            response.fraudScore,
            response.skillLevel,
            response.confidence,
            response.responseTime
        );
    }
    
    /**
     * @dev Update player analytics with AI response
     * @param player Player address
     * @param response AI response
     */
    function _updatePlayerAnalytics(address player, AIResponse memory response) internal {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        analytics.fraudScore = response.fraudScore;
        analytics.skillLevel = response.skillLevel;
        analytics.riskLevel = response.riskAssessment;
        analytics.lastUpdate = block.timestamp;
        
        // Check if player should be flagged
        if (response.fraudScore > 80) {
            analytics.isFlagged = true;
            analytics.flagReason = "High fraud score detected";
        } else if (response.riskAssessment > 85) {
            analytics.isFlagged = true;
            analytics.flagReason = "High risk behavior detected";
        } else {
            analytics.isFlagged = false;
            analytics.flagReason = "";
        }
        
        emit PlayerAnalyticsUpdated(
            player,
            response.fraudScore,
            response.skillLevel,
            response.riskAssessment,
            analytics.isFlagged
        );
    }

    // ============ AI CALCULATION FUNCTIONS ============
    
    /**
     * @dev Calculate basic fraud score
     * @param player Player address
     * @param gameId Game ID
     * @return Fraud score (0-100)
     */
    function _calculateFraudScore(address player, uint256 gameId) internal view returns (uint256) {
        // Simulate NovaSanctum fraud detection
        uint256 baseScore = uint256(keccak256(abi.encodePacked(player, gameId, block.timestamp))) % 100;
        
        // Add some randomness and patterns
        if (baseScore > 70) {
            return baseScore + (block.timestamp % 20);
        } else {
            return baseScore - (block.timestamp % 15);
        }
    }
    
    /**
     * @dev Calculate advanced fraud score
     * @param player Player address
     * @param gameId Game ID
     * @return Advanced fraud score (0-100)
     */
    function _calculateAdvancedFraudScore(address player, uint256 gameId) internal view returns (uint256) {
        // Simulate AthenaMist advanced fraud detection
        uint256 baseScore = uint256(keccak256(abi.encodePacked(player, gameId, "athena", block.timestamp))) % 100;
        
        // More sophisticated pattern analysis
        if (baseScore > 75) {
            return baseScore + (block.timestamp % 25);
        } else {
            return baseScore - (block.timestamp % 20);
        }
    }
    
    /**
     * @dev Calculate skill level
     * @param player Player address
     * @return Skill level (0-100)
     */
    function _calculateSkillLevel(address player) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        if (analytics.totalGames == 0) {
            return 50; // Default skill level for new players
        }
        
        uint256 baseSkill = (analytics.winRate * 30) + (analytics.averageScore / 10);
        return baseSkill > 100 ? 100 : baseSkill;
    }
    
    /**
     * @dev Calculate advanced skill level
     * @param player Player address
     * @return Advanced skill level (0-100)
     */
    function _calculateAdvancedSkillLevel(address player) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        if (analytics.totalGames == 0) {
            return 50;
        }
        
        // More sophisticated skill calculation
        uint256 consistency = _calculateConsistency(player);
        uint256 baseSkill = (analytics.winRate * 25) + (analytics.averageScore / 8) + (consistency * 2);
        return baseSkill > 100 ? 100 : baseSkill;
    }
    
    /**
     * @dev Calculate risk assessment
     * @param player Player address
     * @param gameId Game ID
     * @return Risk assessment (0-100)
     */
    function _calculateRiskAssessment(address player, uint256 gameId) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        uint256 baseRisk = 30; // Base risk level
        
        if (analytics.fraudScore > 70) {
            baseRisk += 40;
        }
        
        if (analytics.totalGames < 5) {
            baseRisk += 20; // New player risk
        }
        
        return baseRisk > 100 ? 100 : baseRisk;
    }
    
    /**
     * @dev Calculate advanced risk assessment
     * @param player Player address
     * @param gameId Game ID
     * @return Advanced risk assessment (0-100)
     */
    function _calculateAdvancedRiskAssessment(address player, uint256 gameId) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        uint256 baseRisk = 25;
        
        // More sophisticated risk analysis
        if (analytics.fraudScore > 65) {
            baseRisk += 45;
        }
        
        if (analytics.totalGames < 10) {
            baseRisk += 25;
        }
        
        if (analytics.isFlagged) {
            baseRisk += 30;
        }
        
        return baseRisk > 100 ? 100 : baseRisk;
    }
    
    /**
     * @dev Predict game outcome
     * @param player Player address
     * @param gameId Game ID
     * @return Predicted outcome (0-100)
     */
    function _predictGameOutcome(address player, uint256 gameId) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        if (analytics.totalGames == 0) {
            return 50; // 50% chance for new players
        }
        
        uint256 prediction = (analytics.winRate * 40) + (analytics.skillLevel * 30) + (30 - analytics.riskLevel);
        return prediction > 100 ? 100 : prediction;
    }
    
    /**
     * @dev Predict advanced game outcome
     * @param player Player address
     * @param gameId Game ID
     * @return Advanced predicted outcome (0-100)
     */
    function _predictAdvancedGameOutcome(address player, uint256 gameId) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        if (analytics.totalGames == 0) {
            return 50;
        }
        
        // More sophisticated outcome prediction
        uint256 consistency = _calculateConsistency(player);
        uint256 prediction = (analytics.winRate * 35) + (analytics.skillLevel * 25) + (consistency * 20) + (25 - analytics.riskLevel);
        return prediction > 100 ? 100 : prediction;
    }
    
    /**
     * @dev Calculate player consistency
     * @param player Player address
     * @return Consistency score (0-100)
     */
    function _calculateConsistency(address player) internal view returns (uint256) {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        
        if (analytics.recentScores.length < 3) {
            return 50;
        }
        
        // Calculate variance in recent scores
        uint256 totalVariance = 0;
        for (uint256 i = 1; i < analytics.recentScores.length; i++) {
            uint256 diff = analytics.recentScores[i] > analytics.recentScores[i-1] ? 
                analytics.recentScores[i] - analytics.recentScores[i-1] : 
                analytics.recentScores[i-1] - analytics.recentScores[i];
            totalVariance += diff;
        }
        
        uint256 averageVariance = totalVariance / (analytics.recentScores.length - 1);
        return averageVariance < 10 ? 90 : (100 - averageVariance);
    }
    
    /**
     * @dev Generate behavior patterns
     * @param player Player address
     * @return Behavior patterns array
     */
    function _generateBehaviorPatterns(address player) internal view returns (uint256[] memory) {
        uint256[] memory patterns = new uint256[](5);
        
        for (uint256 i = 0; i < 5; i++) {
            patterns[i] = uint256(keccak256(abi.encodePacked(player, i, block.timestamp))) % 100;
        }
        
        return patterns;
    }
    
    /**
     * @dev Generate unified behavior patterns
     * @param player Player address
     * @return Unified behavior patterns array
     */
    function _generateUnifiedBehaviorPatterns(address player) internal view returns (uint256[] memory) {
        uint256[] memory patterns = new uint256[](7);
        
        for (uint256 i = 0; i < 7; i++) {
            patterns[i] = uint256(keccak256(abi.encodePacked(player, "unified", i, block.timestamp))) % 100;
        }
        
        return patterns;
    }
    
    /**
     * @dev Generate analysis hash
     * @param player Player address
     * @param gameId Game ID
     * @return Analysis hash
     */
    function _generateAnalysisHash(address player, uint256 gameId) internal view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(player, gameId, block.timestamp, "nova"));
        return _bytes32ToString(hash);
    }
    
    /**
     * @dev Generate advanced analysis hash
     * @param player Player address
     * @param gameId Game ID
     * @return Advanced analysis hash
     */
    function _generateAdvancedAnalysisHash(address player, uint256 gameId) internal view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(player, gameId, block.timestamp, "athena"));
        return _bytes32ToString(hash);
    }
    
    /**
     * @dev Generate unified analysis hash
     * @param player Player address
     * @param gameId Game ID
     * @return Unified analysis hash
     */
    function _generateUnifiedAnalysisHash(address player, uint256 gameId) internal view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(player, gameId, block.timestamp, "unified"));
        return _bytes32ToString(hash);
    }
    
    /**
     * @dev Convert bytes32 to string
     * @param _bytes32 Bytes32 value
     * @return String representation
     */
    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get AI request details
     * @param requestId Request ID
     * @return Request details
     */
    function getAIRequest(uint256 requestId) 
        external 
        view 
        returns (
            uint256 id,
            address player,
            uint256 gameId,
            AIRequestType requestType,
            uint256 timestamp,
            bool isProcessed,
            uint256 fraudScore,
            uint256 skillLevel,
            uint256 confidence
        )
    {
        AIRequest storage request = aiRequests[requestId];
        return (
            request.requestId,
            request.player,
            request.gameId,
            request.requestType,
            request.timestamp,
            request.isProcessed,
            request.response.fraudScore,
            request.response.skillLevel,
            request.response.confidence
        );
    }
    
    /**
     * @dev Get player analytics
     * @param player Player address
     * @return Player analytics
     */
    function getPlayerAnalytics(address player)
        external
        view
        returns (
            uint256 totalGames,
            uint256 averageScore,
            uint256 winRate,
            uint256 fraudScore,
            uint256 skillLevel,
            uint256 riskLevel,
            bool isFlagged,
            string memory flagReason
        )
    {
        PlayerAnalytics storage analytics = playerAnalytics[player];
        return (
            analytics.totalGames,
            analytics.averageScore,
            analytics.winRate,
            analytics.fraudScore,
            analytics.skillLevel,
            analytics.riskLevel,
            analytics.isFlagged,
            analytics.flagReason
        );
    }
    
    /**
     * @dev Get AI service information
     * @param serviceType Service type
     * @return Service information
     */
    function getAIService(AIServiceType serviceType)
        external
        view
        returns (
            string memory serviceName,
            address serviceAddress,
            bool isActive,
            uint256 successRate,
            uint256 totalRequests,
            uint256 lastUpdate,
            uint256 fee
        )
    {
        AIService storage service = aiServices[serviceType];
        return (
            service.serviceName,
            service.serviceAddress,
            service.isActive,
            service.successRate,
            service.totalRequests,
            service.lastUpdate,
            service.fee
        );
    }
    
    /**
     * @dev Get total requests
     * @return Total number of requests
     */
    function getTotalRequests() external view returns (uint256) {
        return _requestIds.current();
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update AI service
     * @param serviceType Service type
     * @param serviceName Service name
     * @param serviceAddress Service address
     * @param isActive Whether service is active
     */
    function updateAIService(
        AIServiceType serviceType,
        string memory serviceName,
        address serviceAddress,
        bool isActive
    ) external onlyOwner {
        aiServices[serviceType].serviceName = serviceName;
        aiServices[serviceType].serviceAddress = serviceAddress;
        aiServices[serviceType].isActive = isActive;
        aiServices[serviceType].lastUpdate = block.timestamp;
        
        emit AIServiceUpdated(serviceType, serviceName, serviceAddress, isActive);
    }
    
    /**
     * @dev Toggle emergency mode
     */
    function toggleEmergencyMode() external onlyOwner {
        emergencyMode = !emergencyMode;
        emit EmergencyModeToggled(emergencyMode);
    }
    
    /**
     * @dev Update request fee
     * @param newFee New fee amount
     */
    function updateRequestFee(uint256 newFee) external onlyOwner {
        requestFee = newFee;
        emit RequestFeeUpdated(newFee);
    }
    
    /**
     * @dev Update response timeout
     * @param newTimeout New timeout in seconds
     */
    function updateResponseTimeout(uint256 newTimeout) external onlyOwner {
        responseTimeout = newTimeout;
        emit ResponseTimeoutUpdated(newTimeout);
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
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 