// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title GamingCore
 * @dev Core gaming smart contract for GameDin L3 ecosystem
 * @dev Handles game state, player interactions, and AI integration
 * @dev Supports real-time gaming with AI-powered analytics
 */
contract GamingCore is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    // ============ STRUCTS ============
    
    struct Game {
        uint256 gameId;
        string gameType;
        uint256 minStake;
        uint256 maxStake;
        uint256 maxPlayers;
        uint256 currentPlayers;
        GameState state;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPot;
        mapping(address => Player) players;
        address[] playerAddresses;
        uint256[] aiAnalytics;
    }

    struct Player {
        address playerAddress;
        uint256 stake;
        uint256 score;
        uint256 rank;
        bool isActive;
        uint256 joinTime;
        uint256 lastActionTime;
        uint256[] aiPredictions;
        PlayerStats stats;
    }

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 totalEarnings;
        uint256 totalStaked;
        uint256 winRate;
        uint256 averageScore;
        uint256 lastGameTime;
    }

    struct AIAnalytics {
        uint256 fraudScore;
        uint256 skillLevel;
        uint256 riskAssessment;
        uint256 predictedOutcome;
        uint256[] behaviorPatterns;
    }

    // ============ ENUMS ============
    
    enum GameState {
        WAITING,
        ACTIVE,
        FINISHED,
        CANCELLED
    }

    enum GameType {
        BATTLE_ROYALE,
        TOURNAMENT,
        CHALLENGE,
        CUSTOM
    }

    // ============ STATE VARIABLES ============
    
    Counters.Counter private _gameIds;
    Counters.Counter private _playerIds;
    
    mapping(uint256 => Game) public games;
    mapping(address => PlayerStats) public playerStats;
    mapping(address => AIAnalytics) public aiAnalytics;
    mapping(address => uint256) public playerBalances;
    
    uint256 public platformFee = 25; // 0.25%
    uint256 public aiServiceFee = 15; // 0.15%
    uint256 public minGameDuration = 300; // 5 minutes
    uint256 public maxGameDuration = 3600; // 1 hour
    
    address public gdiToken;
    address public aiOracle;
    address public treasury;
    
    // ============ EVENTS ============
    
    event GameCreated(uint256 indexed gameId, string gameType, uint256 minStake, uint256 maxPlayers);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 stake);
    event GameStarted(uint256 indexed gameId, uint256 startTime);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize);
    event PlayerAction(uint256 indexed gameId, address indexed player, string action, uint256 score);
    event AIAnalysisUpdated(address indexed player, uint256 fraudScore, uint256 skillLevel);
    event BalanceUpdated(address indexed player, uint256 newBalance);
    event PlatformFeeUpdated(uint256 newFee);
    event AIOracleUpdated(address newOracle);

    // ============ MODIFIERS ============
    
    modifier onlyGameExists(uint256 gameId) {
        require(games[gameId].gameId != 0, "Game does not exist");
        _;
    }
    
    modifier onlyGameState(uint256 gameId, GameState state) {
        require(games[gameId].state == state, "Invalid game state");
        _;
    }
    
    modifier onlyPlayerInGame(uint256 gameId, address player) {
        require(games[gameId].players[player].isActive, "Player not in game");
        _;
    }
    
    modifier onlyAIOracle() {
        require(msg.sender == aiOracle, "Only AI Oracle can call");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor(
        address _gdiToken,
        address _aiOracle,
        address _treasury
    ) {
        gdiToken = _gdiToken;
        aiOracle = _aiOracle;
        treasury = _treasury;
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Create a new game
     * @param gameType Type of game to create
     * @param minStake Minimum stake required to join
     * @param maxStake Maximum stake allowed
     * @param maxPlayers Maximum number of players
     * @param duration Game duration in seconds
     */
    function createGame(
        string memory gameType,
        uint256 minStake,
        uint256 maxStake,
        uint256 maxPlayers,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        require(minStake > 0, "Min stake must be greater than 0");
        require(maxStake >= minStake, "Max stake must be >= min stake");
        require(maxPlayers > 1, "Max players must be > 1");
        require(duration >= minGameDuration && duration <= maxGameDuration, "Invalid duration");
        
        _gameIds.increment();
        uint256 gameId = _gameIds.current();
        
        Game storage game = games[gameId];
        game.gameId = gameId;
        game.gameType = gameType;
        game.minStake = minStake;
        game.maxStake = maxStake;
        game.maxPlayers = maxPlayers;
        game.currentPlayers = 0;
        game.state = GameState.WAITING;
        game.startTime = 0;
        game.endTime = 0;
        game.totalPot = 0;
        
        emit GameCreated(gameId, gameType, minStake, maxPlayers);
        return gameId;
    }
    
    /**
     * @dev Join a game with specified stake
     * @param gameId ID of the game to join
     * @param stake Amount to stake
     */
    function joinGame(uint256 gameId, uint256 stake) 
        external 
        nonReentrant 
        onlyGameExists(gameId)
        onlyGameState(gameId, GameState.WAITING)
    {
        Game storage game = games[gameId];
        require(stake >= game.minStake && stake <= game.maxStake, "Invalid stake amount");
        require(game.currentPlayers < game.maxPlayers, "Game is full");
        require(!game.players[msg.sender].isActive, "Already in game");
        require(IERC20(gdiToken).balanceOf(msg.sender) >= stake, "Insufficient balance");
        
        // Transfer tokens to contract
        IERC20(gdiToken).transferFrom(msg.sender, address(this), stake);
        
        // Add player to game
        game.players[msg.sender] = Player({
            playerAddress: msg.sender,
            stake: stake,
            score: 0,
            rank: 0,
            isActive: true,
            joinTime: block.timestamp,
            lastActionTime: block.timestamp,
            aiPredictions: new uint256[](0),
            stats: playerStats[msg.sender]
        });
        
        game.playerAddresses.push(msg.sender);
        game.currentPlayers++;
        game.totalPot += stake;
        
        // Update player stats
        playerStats[msg.sender].gamesPlayed++;
        playerStats[msg.sender].totalStaked += stake;
        playerStats[msg.sender].lastGameTime = block.timestamp;
        
        emit PlayerJoined(gameId, msg.sender, stake);
        
        // Auto-start game if full
        if (game.currentPlayers == game.maxPlayers) {
            _startGame(gameId);
        }
    }
    
    /**
     * @dev Start a game manually (for games that don't auto-start)
     * @param gameId ID of the game to start
     */
    function startGame(uint256 gameId) 
        external 
        onlyOwner 
        onlyGameExists(gameId)
        onlyGameState(gameId, GameState.WAITING)
    {
        Game storage game = games[gameId];
        require(game.currentPlayers >= 2, "Need at least 2 players");
        _startGame(gameId);
    }
    
    /**
     * @dev Internal function to start a game
     * @param gameId ID of the game to start
     */
    function _startGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.ACTIVE;
        game.startTime = block.timestamp;
        game.endTime = block.timestamp + 3600; // 1 hour default
        
        emit GameStarted(gameId, block.timestamp);
    }
    
    /**
     * @dev Submit player action and score
     * @param gameId ID of the game
     * @param action Action performed by player
     * @param score Score for the action
     */
    function submitAction(
        uint256 gameId,
        string memory action,
        uint256 score
    ) 
        external 
        onlyGameExists(gameId)
        onlyGameState(gameId, GameState.ACTIVE)
        onlyPlayerInGame(gameId, msg.sender)
    {
        Game storage game = games[gameId];
        Player storage player = game.players[msg.sender];
        
        player.score += score;
        player.lastActionTime = block.timestamp;
        
        emit PlayerAction(gameId, msg.sender, action, score);
        
        // Check if game should end
        if (block.timestamp >= game.endTime) {
            _finishGame(gameId);
        }
    }
    
    /**
     * @dev Finish a game and distribute prizes
     * @param gameId ID of the game to finish
     */
    function finishGame(uint256 gameId) 
        external 
        onlyOwner 
        onlyGameExists(gameId)
        onlyGameState(gameId, GameState.ACTIVE)
    {
        _finishGame(gameId);
    }
    
    /**
     * @dev Internal function to finish a game
     * @param gameId ID of the game to finish
     */
    function _finishGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.FINISHED;
        game.endTime = block.timestamp;
        
        // Calculate fees
        uint256 platformFeeAmount = (game.totalPot * platformFee) / 10000;
        uint256 aiFeeAmount = (game.totalPot * aiServiceFee) / 10000;
        uint256 prizePool = game.totalPot - platformFeeAmount - aiFeeAmount;
        
        // Find winner (highest score)
        address winner = address(0);
        uint256 highestScore = 0;
        
        for (uint256 i = 0; i < game.playerAddresses.length; i++) {
            address playerAddr = game.playerAddresses[i];
            Player storage player = game.players[playerAddr];
            
            if (player.score > highestScore) {
                highestScore = player.score;
                winner = playerAddr;
            }
        }
        
        // Distribute prizes
        if (winner != address(0)) {
            playerBalances[winner] += prizePool;
            playerStats[winner].gamesWon++;
            playerStats[winner].totalEarnings += prizePool;
            
            // Update win rate
            playerStats[winner].winRate = (playerStats[winner].gamesWon * 100) / playerStats[winner].gamesPlayed;
        }
        
        // Transfer fees
        IERC20(gdiToken).transfer(treasury, platformFeeAmount);
        IERC20(gdiToken).transfer(aiOracle, aiFeeAmount);
        
        emit GameFinished(gameId, winner, prizePool);
    }
    
    /**
     * @dev Update AI analytics for a player
     * @param player Player address
     * @param fraudScore Fraud detection score
     * @param skillLevel Skill level assessment
     * @param riskAssessment Risk assessment
     * @param predictedOutcome Predicted game outcome
     */
    function updateAIAnalytics(
        address player,
        uint256 fraudScore,
        uint256 skillLevel,
        uint256 riskAssessment,
        uint256 predictedOutcome
    ) external onlyAIOracle {
        AIAnalytics storage analytics = aiAnalytics[player];
        analytics.fraudScore = fraudScore;
        analytics.skillLevel = skillLevel;
        analytics.riskAssessment = riskAssessment;
        analytics.predictedOutcome = predictedOutcome;
        
        emit AIAnalysisUpdated(player, fraudScore, skillLevel);
    }
    
    /**
     * @dev Withdraw player balance
     * @param amount Amount to withdraw
     */
    function withdrawBalance(uint256 amount) external nonReentrant {
        require(playerBalances[msg.sender] >= amount, "Insufficient balance");
        
        playerBalances[msg.sender] -= amount;
        IERC20(gdiToken).transfer(msg.sender, amount);
        
        emit BalanceUpdated(msg.sender, playerBalances[msg.sender]);
    }
    
    /**
     * @dev Get player balance
     * @param player Player address
     * @return Player's balance
     */
    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }
    
    /**
     * @dev Get game information
     * @param gameId Game ID
     * @return Game details
     */
    function getGame(uint256 gameId) 
        external 
        view 
        onlyGameExists(gameId)
        returns (
            uint256 id,
            string memory gameType,
            uint256 minStake,
            uint256 maxStake,
            uint256 maxPlayers,
            uint256 currentPlayers,
            GameState state,
            uint256 startTime,
            uint256 endTime,
            uint256 totalPot
        )
    {
        Game storage game = games[gameId];
        return (
            game.gameId,
            game.gameType,
            game.minStake,
            game.maxStake,
            game.maxPlayers,
            game.currentPlayers,
            game.state,
            game.startTime,
            game.endTime,
            game.totalPot
        );
    }
    
    /**
     * @dev Get player information in a game
     * @param gameId Game ID
     * @param player Player address
     * @return Player details
     */
    function getPlayerInGame(uint256 gameId, address player)
        external
        view
        onlyGameExists(gameId)
        returns (
            address playerAddress,
            uint256 stake,
            uint256 score,
            uint256 rank,
            bool isActive,
            uint256 joinTime,
            uint256 lastActionTime
        )
    {
        Player storage playerData = games[gameId].players[player];
        return (
            playerData.playerAddress,
            playerData.stake,
            playerData.score,
            playerData.rank,
            playerData.isActive,
            playerData.joinTime,
            playerData.lastActionTime
        );
    }
    
    /**
     * @dev Get player statistics
     * @param player Player address
     * @return Player statistics
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 gamesWon,
            uint256 totalEarnings,
            uint256 totalStaked,
            uint256 winRate,
            uint256 averageScore,
            uint256 lastGameTime
        )
    {
        PlayerStats storage stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.gamesWon,
            stats.totalEarnings,
            stats.totalStaked,
            stats.winRate,
            stats.averageScore,
            stats.lastGameTime
        );
    }
    
    /**
     * @dev Get AI analytics for a player
     * @param player Player address
     * @return AI analytics
     */
    function getAIAnalytics(address player)
        external
        view
        returns (
            uint256 fraudScore,
            uint256 skillLevel,
            uint256 riskAssessment,
            uint256 predictedOutcome
        )
    {
        AIAnalytics storage analytics = aiAnalytics[player];
        return (
            analytics.fraudScore,
            analytics.skillLevel,
            analytics.riskAssessment,
            analytics.predictedOutcome
        );
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update platform fee
     * @param newFee New fee percentage (basis points)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }
    
    /**
     * @dev Update AI oracle address
     * @param newOracle New oracle address
     */
    function updateAIOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        aiOracle = newOracle;
        emit AIOracleUpdated(newOracle);
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Get total games created
     * @return Total number of games
     */
    function getTotalGames() external view returns (uint256) {
        return _gameIds.current();
    }
} 