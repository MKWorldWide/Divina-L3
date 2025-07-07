// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GameDin Tournament Contract
 * @dev Advanced tournament system for GameDin L3 gaming platform
 * Handles tournament creation, player registration, matchmaking, and prize distribution
 */
contract GamingTournament is AccessControl, ReentrancyGuard, Pausable {
    // =============================================================================
    // CONSTANTS & ROLES
    // =============================================================================
    
    bytes32 public constant TOURNAMENT_ORGANIZER_ROLE = keccak256("TOURNAMENT_ORGANIZER_ROLE");
    bytes32 public constant MATCH_REFEREE_ROLE = keccak256("MATCH_REFEREE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant MAX_TOURNAMENT_PLAYERS = 1024;
    uint256 public constant MIN_TOURNAMENT_PLAYERS = 4;
    uint256 public constant MAX_TOURNAMENT_DURATION = 7 days;
    uint256 public constant MIN_TOURNAMENT_DURATION = 1 hours;
    
    // =============================================================================
    // STRUCTS & ENUMS
    // =============================================================================
    
    enum TournamentStatus {
        CREATED,
        REGISTRATION_OPEN,
        REGISTRATION_CLOSED,
        IN_PROGRESS,
        FINISHED,
        CANCELLED
    }
    
    enum TournamentType {
        SINGLE_ELIMINATION,
        DOUBLE_ELIMINATION,
        ROUND_ROBIN,
        SWISS_SYSTEM,
        BATTLE_ROYALE
    }
    
    enum MatchStatus {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
    
    struct Tournament {
        uint256 tournamentId;
        string name;
        string description;
        TournamentType tournamentType;
        TournamentStatus status;
        uint256 entryFee;
        uint256 prizePool;
        uint256 maxPlayers;
        uint256 currentPlayers;
        uint256 startTime;
        uint256 endTime;
        address organizer;
        address[] players;
        uint256[] matchIds;
        mapping(address => PlayerStats) playerStats;
        mapping(uint256 => Match) matches;
    }
    
    struct PlayerStats {
        uint256 wins;
        uint256 losses;
        uint256 draws;
        uint256 totalScore;
        uint256 rank;
        bool isEliminated;
        uint256 lastMatchTime;
    }
    
    struct Match {
        uint256 matchId;
        uint256 tournamentId;
        address player1;
        address player2;
        address winner;
        MatchStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 player1Score;
        uint256 player2Score;
        string gameData;
        bool isBye;
    }
    
    struct PrizeDistribution {
        uint256 firstPlace;
        uint256 secondPlace;
        uint256 thirdPlace;
        uint256[] otherPrizes;
    }
    
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    address public gdiToken;
    address public gamingCore;
    address public aiOracle;
    
    uint256 public tournamentCounter;
    uint256 public matchCounter;
    uint256 public totalTournaments;
    uint256 public totalMatches;
    uint256 public totalPrizePool;
    
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public playerTournaments;
    mapping(address => uint256[]) public playerMatches;
    
    uint256 public platformFee = 5; // 0.5%
    uint256 public organizerFee = 10; // 1%
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    event TournamentCreated(
        uint256 indexed tournamentId,
        string name,
        TournamentType tournamentType,
        uint256 entryFee,
        uint256 maxPlayers,
        address indexed organizer
    );
    
    event PlayerRegistered(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 entryFee,
        uint256 timestamp
    );
    
    event TournamentStarted(
        uint256 indexed tournamentId,
        uint256 startTime,
        uint256 totalPlayers
    );
    
    event MatchCreated(
        uint256 indexed matchId,
        uint256 indexed tournamentId,
        address player1,
        address player2,
        uint256 scheduledTime
    );
    
    event MatchCompleted(
        uint256 indexed matchId,
        address indexed winner,
        uint256 player1Score,
        uint256 player2Score,
        uint256 timestamp
    );
    
    event TournamentFinished(
        uint256 indexed tournamentId,
        address indexed winner,
        uint256 prizeAmount,
        uint256 timestamp
    );
    
    event PrizeDistributed(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 rank,
        uint256 prizeAmount
    );
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    constructor(
        address _gdiToken,
        address _gamingCore,
        address _aiOracle
    ) {
        gdiToken = _gdiToken;
        gamingCore = _gamingCore;
        aiOracle = _aiOracle;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TOURNAMENT_ORGANIZER_ROLE, msg.sender);
        _grantRole(MATCH_REFEREE_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }
    
    // =============================================================================
    // TOURNAMENT MANAGEMENT
    // =============================================================================
    
    /**
     * @dev Create a new tournament
     * @param name Tournament name
     * @param description Tournament description
     * @param tournamentType Type of tournament
     * @param entryFee Entry fee in GDI tokens
     * @param maxPlayers Maximum number of players
     * @param startTime Tournament start time
     * @param duration Tournament duration
     */
    function createTournament(
        string memory name,
        string memory description,
        TournamentType tournamentType,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 startTime,
        uint256 duration
    ) external onlyRole(TOURNAMENT_ORGANIZER_ROLE) whenNotPaused {
        require(bytes(name).length > 0, "Tournament name required");
        require(maxPlayers >= MIN_TOURNAMENT_PLAYERS, "Too few players");
        require(maxPlayers <= MAX_TOURNAMENT_PLAYERS, "Too many players");
        require(startTime > block.timestamp, "Start time must be in future");
        require(duration >= MIN_TOURNAMENT_DURATION, "Duration too short");
        require(duration <= MAX_TOURNAMENT_DURATION, "Duration too long");
        
        tournamentCounter++;
        uint256 tournamentId = tournamentCounter;
        
        Tournament storage tournament = tournaments[tournamentId];
        tournament.tournamentId = tournamentId;
        tournament.name = name;
        tournament.description = description;
        tournament.tournamentType = tournamentType;
        tournament.status = TournamentStatus.CREATED;
        tournament.entryFee = entryFee;
        tournament.prizePool = 0;
        tournament.maxPlayers = maxPlayers;
        tournament.currentPlayers = 0;
        tournament.startTime = startTime;
        tournament.endTime = startTime + duration;
        tournament.organizer = msg.sender;
        
        totalTournaments++;
        
        emit TournamentCreated(
            tournamentId,
            name,
            tournamentType,
            entryFee,
            maxPlayers,
            msg.sender
        );
    }
    
    /**
     * @dev Register for a tournament
     * @param tournamentId Tournament ID
     */
    function registerForTournament(uint256 tournamentId) external whenNotPaused nonReentrant {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.tournamentId != 0, "Tournament does not exist");
        require(tournament.status == TournamentStatus.CREATED, "Registration not open");
        require(tournament.currentPlayers < tournament.maxPlayers, "Tournament full");
        require(tournament.players.length == 0 || !isPlayerRegistered(tournamentId, msg.sender), "Already registered");
        
        // Transfer entry fee
        IERC20(gdiToken).transferFrom(msg.sender, address(this), tournament.entryFee);
        tournament.prizePool += tournament.entryFee;
        totalPrizePool += tournament.entryFee;
        
        // Add player to tournament
        tournament.players.push(msg.sender);
        tournament.currentPlayers++;
        playerTournaments[msg.sender].push(tournamentId);
        
        // Initialize player stats
        tournament.playerStats[msg.sender] = PlayerStats({
            wins: 0,
            losses: 0,
            draws: 0,
            totalScore: 0,
            rank: 0,
            isEliminated: false,
            lastMatchTime: 0
        });
        
        emit PlayerRegistered(tournamentId, msg.sender, tournament.entryFee, block.timestamp);
    }
    
    /**
     * @dev Start a tournament
     * @param tournamentId Tournament ID
     */
    function startTournament(uint256 tournamentId) external onlyRole(TOURNAMENT_ORGANIZER_ROLE) whenNotPaused {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.tournamentId != 0, "Tournament does not exist");
        require(tournament.status == TournamentStatus.CREATED, "Tournament already started");
        require(tournament.currentPlayers >= MIN_TOURNAMENT_PLAYERS, "Not enough players");
        require(block.timestamp >= tournament.startTime, "Tournament not ready to start");
        
        tournament.status = TournamentStatus.IN_PROGRESS;
        
        // Generate initial matches based on tournament type
        generateInitialMatches(tournamentId);
        
        emit TournamentStarted(tournamentId, block.timestamp, tournament.currentPlayers);
    }
    
    // =============================================================================
    // MATCH MANAGEMENT
    // =============================================================================
    
    /**
     * @dev Create a match between two players
     * @param tournamentId Tournament ID
     * @param player1 First player address
     * @param player2 Second player address
     * @param scheduledTime Scheduled match time
     */
    function createMatch(
        uint256 tournamentId,
        address player1,
        address player2,
        uint256 scheduledTime
    ) internal {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.tournamentId != 0, "Tournament does not exist");
        require(tournament.status == TournamentStatus.IN_PROGRESS, "Tournament not in progress");
        require(isPlayerRegistered(tournamentId, player1), "Player 1 not registered");
        require(isPlayerRegistered(tournamentId, player2), "Player 2 not registered");
        require(player1 != player2, "Players must be different");
        
        matchCounter++;
        uint256 matchId = matchCounter;
        
        Match storage matchData = matches[matchId];
        matchData.matchId = matchId;
        matchData.tournamentId = tournamentId;
        matchData.player1 = player1;
        matchData.player2 = player2;
        matchData.status = MatchStatus.SCHEDULED;
        matchData.startTime = scheduledTime;
        matchData.isBye = false;
        
        tournament.matchIds.push(matchId);
        playerMatches[player1].push(matchId);
        playerMatches[player2].push(matchId);
        totalMatches++;
        
        emit MatchCreated(matchId, tournamentId, player1, player2, scheduledTime);
    }
    
    /**
     * @dev Create a match between two players (public interface)
     * @param tournamentId Tournament ID
     * @param player1 First player address
     * @param player2 Second player address
     * @param scheduledTime Scheduled match time
     */
    function createMatchPublic(
        uint256 tournamentId,
        address player1,
        address player2,
        uint256 scheduledTime
    ) external onlyRole(MATCH_REFEREE_ROLE) whenNotPaused {
        createMatch(tournamentId, player1, player2, scheduledTime);
    }
    
    /**
     * @dev Complete a match with results
     * @param matchId Match ID
     * @param winner Winner address
     * @param player1Score Player 1 score
     * @param player2Score Player 2 score
     * @param gameData Additional game data
     */
    function completeMatch(
        uint256 matchId,
        address winner,
        uint256 player1Score,
        uint256 player2Score,
        string memory gameData
    ) external onlyRole(MATCH_REFEREE_ROLE) whenNotPaused {
        Match storage matchData = matches[matchId];
        require(matchData.matchId != 0, "Match does not exist");
        require(matchData.status == MatchStatus.SCHEDULED || matchData.status == MatchStatus.IN_PROGRESS, "Match not active");
        require(winner == matchData.player1 || winner == matchData.player2 || winner == address(0), "Invalid winner");
        
        matchData.status = MatchStatus.COMPLETED;
        matchData.winner = winner;
        matchData.player1Score = player1Score;
        matchData.player2Score = player2Score;
        matchData.gameData = gameData;
        matchData.endTime = block.timestamp;
        
        // Update player stats
        Tournament storage tournament = tournaments[matchData.tournamentId];
        if (winner == matchData.player1) {
            tournament.playerStats[matchData.player1].wins++;
            tournament.playerStats[matchData.player2].losses++;
        } else if (winner == matchData.player2) {
            tournament.playerStats[matchData.player2].wins++;
            tournament.playerStats[matchData.player1].losses++;
        } else {
            // Draw
            tournament.playerStats[matchData.player1].draws++;
            tournament.playerStats[matchData.player2].draws++;
        }
        
        tournament.playerStats[matchData.player1].totalScore += player1Score;
        tournament.playerStats[matchData.player2].totalScore += player2Score;
        tournament.playerStats[matchData.player1].lastMatchTime = block.timestamp;
        tournament.playerStats[matchData.player2].lastMatchTime = block.timestamp;
        
        emit MatchCompleted(matchId, winner, player1Score, player2Score, block.timestamp);
    }
    
    // =============================================================================
    // TOURNAMENT COMPLETION
    // =============================================================================
    
    /**
     * @dev Finish a tournament and distribute prizes
     * @param tournamentId Tournament ID
     * @param winners Array of winner addresses in order
     */
    function finishTournament(
        uint256 tournamentId,
        address[] memory winners
    ) external onlyRole(TOURNAMENT_ORGANIZER_ROLE) whenNotPaused {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.tournamentId != 0, "Tournament does not exist");
        require(tournament.status == TournamentStatus.IN_PROGRESS, "Tournament not in progress");
        require(winners.length > 0, "No winners specified");
        
        tournament.status = TournamentStatus.FINISHED;
        
        // Calculate prize distribution
        uint256 totalPrize = tournament.prizePool;
        uint256 platformFeeAmount = (totalPrize * platformFee) / 1000;
        uint256 organizerFeeAmount = (totalPrize * organizerFee) / 1000;
        uint256 remainingPrize = totalPrize - platformFeeAmount - organizerFeeAmount;
        
        // Distribute prizes
        for (uint256 i = 0; i < winners.length; i++) {
            require(isPlayerRegistered(tournamentId, winners[i]), "Winner not registered");
            
            uint256 prizeAmount;
            if (i == 0) {
                prizeAmount = (remainingPrize * 50) / 100; // 50% for 1st place
            } else if (i == 1) {
                prizeAmount = (remainingPrize * 30) / 100; // 30% for 2nd place
            } else if (i == 2) {
                prizeAmount = (remainingPrize * 20) / 100; // 20% for 3rd place
            } else {
                prizeAmount = 0; // No prize for other positions
            }
            
            if (prizeAmount > 0) {
                IERC20(gdiToken).transfer(winners[i], prizeAmount);
                emit PrizeDistributed(tournamentId, winners[i], i + 1, prizeAmount);
            }
        }
        
        // Transfer fees
        if (platformFeeAmount > 0) {
            IERC20(gdiToken).transfer(address(this), platformFeeAmount);
        }
        if (organizerFeeAmount > 0) {
            IERC20(gdiToken).transfer(tournament.organizer, organizerFeeAmount);
        }
        
        emit TournamentFinished(tournamentId, winners[0], remainingPrize, block.timestamp);
    }
    
    // =============================================================================
    // HELPER FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Check if a player is registered for a tournament
     * @param tournamentId Tournament ID
     * @param player Player address
     * @return True if registered
     */
    function isPlayerRegistered(uint256 tournamentId, address player) public view returns (bool) {
        Tournament storage tournament = tournaments[tournamentId];
        for (uint256 i = 0; i < tournament.players.length; i++) {
            if (tournament.players[i] == player) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Generate initial matches for a tournament
     * @param tournamentId Tournament ID
     */
    function generateInitialMatches(uint256 tournamentId) internal {
        Tournament storage tournament = tournaments[tournamentId];
        
        if (tournament.tournamentType == TournamentType.SINGLE_ELIMINATION) {
            generateSingleEliminationMatches(tournamentId);
        } else if (tournament.tournamentType == TournamentType.BATTLE_ROYALE) {
            generateBattleRoyaleMatch(tournamentId);
        }
        // Add other tournament type implementations
    }
    
    /**
     * @dev Generate single elimination matches
     * @param tournamentId Tournament ID
     */
    function generateSingleEliminationMatches(uint256 tournamentId) internal {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 playerCount = tournament.players.length;
        
        // Create first round matches
        for (uint256 i = 0; i < playerCount; i += 2) {
            if (i + 1 < playerCount) {
                createMatch(
                    tournamentId,
                    tournament.players[i],
                    tournament.players[i + 1],
                    tournament.startTime
                );
            } else {
                // Bye for odd player
                matchCounter++;
                uint256 matchId = matchCounter;
                
                Match storage matchData = matches[matchId];
                matchData.matchId = matchId;
                matchData.tournamentId = tournamentId;
                matchData.player1 = tournament.players[i];
                matchData.player2 = address(0);
                matchData.status = MatchStatus.COMPLETED;
                matchData.winner = tournament.players[i];
                matchData.isBye = true;
                
                tournament.matchIds.push(matchId);
                playerMatches[tournament.players[i]].push(matchId);
                totalMatches++;
            }
        }
    }
    
    /**
     * @dev Generate battle royale match
     * @param tournamentId Tournament ID
     */
    function generateBattleRoyaleMatch(uint256 tournamentId) internal {
        Tournament storage tournament = tournaments[tournamentId];
        
        // Create one big match with all players
        matchCounter++;
        uint256 matchId = matchCounter;
        
        Match storage matchData = matches[matchId];
        matchData.matchId = matchId;
        matchData.tournamentId = tournamentId;
        matchData.player1 = tournament.players[0];
        matchData.player2 = tournament.players[1];
        matchData.status = MatchStatus.SCHEDULED;
        matchData.startTime = tournament.startTime;
        matchData.isBye = false;
        
        tournament.matchIds.push(matchId);
        for (uint256 i = 0; i < tournament.players.length; i++) {
            playerMatches[tournament.players[i]].push(matchId);
        }
        totalMatches++;
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get tournament information
     * @param tournamentId Tournament ID
     */
    function getTournament(uint256 tournamentId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        TournamentType tournamentType,
        TournamentStatus status,
        uint256 entryFee,
        uint256 prizePool,
        uint256 maxPlayers,
        uint256 currentPlayers,
        uint256 startTime,
        uint256 endTime,
        address organizer
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.tournamentId,
            tournament.name,
            tournament.description,
            tournament.tournamentType,
            tournament.status,
            tournament.entryFee,
            tournament.prizePool,
            tournament.maxPlayers,
            tournament.currentPlayers,
            tournament.startTime,
            tournament.endTime,
            tournament.organizer
        );
    }
    
    /**
     * @dev Get tournament players
     * @param tournamentId Tournament ID
     * @return players Array of player addresses
     */
    function getTournamentPlayers(uint256 tournamentId) external view returns (address[] memory) {
        return tournaments[tournamentId].players;
    }
    
    /**
     * @dev Get player stats for a tournament
     * @param tournamentId Tournament ID
     * @param player Player address
     */
    function getPlayerStats(uint256 tournamentId, address player) external view returns (
        uint256 wins,
        uint256 losses,
        uint256 draws,
        uint256 totalScore,
        uint256 rank,
        bool isEliminated,
        uint256 lastMatchTime
    ) {
        PlayerStats storage stats = tournaments[tournamentId].playerStats[player];
        return (
            stats.wins,
            stats.losses,
            stats.draws,
            stats.totalScore,
            stats.rank,
            stats.isEliminated,
            stats.lastMatchTime
        );
    }
    
    /**
     * @dev Get match information
     * @param matchId Match ID
     */
    function getMatch(uint256 matchId) external view returns (
        uint256 id,
        uint256 tournamentId,
        address player1,
        address player2,
        address winner,
        MatchStatus status,
        uint256 startTime,
        uint256 endTime,
        uint256 player1Score,
        uint256 player2Score,
        string memory gameData,
        bool isBye
    ) {
        Match storage matchData = matches[matchId];
        return (
            matchData.matchId,
            matchData.tournamentId,
            matchData.player1,
            matchData.player2,
            matchData.winner,
            matchData.status,
            matchData.startTime,
            matchData.endTime,
            matchData.player1Score,
            matchData.player2Score,
            matchData.gameData,
            matchData.isBye
        );
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Update platform fee
     * @param newFee New fee percentage (basis points)
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 50, "Fee too high"); // Max 5%
        platformFee = newFee;
    }
    
    /**
     * @dev Update organizer fee
     * @param newFee New fee percentage (basis points)
     */
    function updateOrganizerFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 100, "Fee too high"); // Max 10%
        organizerFee = newFee;
    }
    
    /**
     * @dev Pause tournament system
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause tournament system
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw tokens
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyRole(EMERGENCY_ROLE) {
        IERC20(gdiToken).transfer(msg.sender, amount);
    }
} 