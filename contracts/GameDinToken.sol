// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GameDin Token (GDIN)
 * @dev Enhanced gaming token with L3 features, AI integration, and gaming mechanics
 * @author GameDin Team
 * @notice This token includes XP/leveling, achievements, gas sponsoring, and AI-powered features
 */
contract GameDinToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // =============================================================================
    // STRUCTS AND ENUMS
    // =============================================================================
    
    struct PlayerProfile {
        uint256 xp;                    // Experience points
        uint256 level;                 // Player level
        uint256 prestige;              // Prestige level
        uint256 lastActivity;          // Last activity timestamp
        uint256 totalGamesPlayed;      // Total games played
        uint256 totalRewardsEarned;    // Total rewards earned
        bool isActive;                 // Activity status
        mapping(string => uint256) achievements; // Achievement tracking
        mapping(string => uint256) gameStats;    // Game-specific statistics
    }

    struct Achievement {
        string name;                   // Achievement name
        string description;            // Achievement description
        uint256 xpReward;              // XP reward for unlocking
        uint256 tokenReward;           // Token reward for unlocking
        bool isActive;                 // Whether achievement is active
        uint256 unlockCount;           // How many times unlocked
        uint256 maxUnlocks;            // Maximum unlocks (0 = unlimited)
    }

    struct GameAction {
        string gameId;                 // Game identifier
        string actionType;             // Type of action
        uint256 timestamp;             // Action timestamp
        uint256 xpGained;              // XP gained from action
        uint256 tokensEarned;          // Tokens earned from action
        bytes gameData;                // Additional game data
    }

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    // Gaming-specific mappings
    mapping(address => PlayerProfile) public playerProfiles;
    mapping(bytes32 => Achievement) public achievements;
    mapping(address => GameAction[]) public playerActions;
    mapping(address => bool) public gameContracts;
    mapping(address => bool) public gasSponsors;
    mapping(address => uint256) public sponsoredGasAmounts;
    
    // L3 specific features
    address public l3Bridge;
    address public novaSanctumOracle;
    address public gamingEngine;
    
    // Gaming configuration
    uint256 public constant XP_PER_LEVEL = 1000;
    uint256 public constant MAX_LEVEL = 100;
    uint256 public constant PRESTIGE_THRESHOLD = 100000; // 100k XP for prestige
    uint256 public gasSponsorPool;
    uint256 public totalXPDistributed;
    uint256 public totalAchievementsUnlocked;
    
    // Counters
    Counters.Counter private _achievementCounter;
    Counters.Counter private _playerCounter;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    event GameAction(
        address indexed player,
        string indexed gameId,
        string actionType,
        uint256 xpGained,
        uint256 tokensEarned,
        uint256 timestamp
    );
    
    event PlayerLevelUp(
        address indexed player,
        uint256 oldLevel,
        uint256 newLevel,
        uint256 totalXP
    );
    
    event PlayerPrestige(
        address indexed player,
        uint256 oldPrestige,
        uint256 newPrestige,
        uint256 totalXP
    );
    
    event AchievementUnlocked(
        address indexed player,
        bytes32 indexed achievementId,
        string achievementName,
        uint256 xpReward,
        uint256 tokenReward
    );
    
    event GasSponsored(
        address indexed sponsor,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event GameContractAdded(address indexed gameContract, address indexed addedBy);
    event GameContractRemoved(address indexed gameContract, address indexed removedBy);
    event GasSponsorAdded(address indexed sponsor, address indexed addedBy);
    event GasSponsorRemoved(address indexed sponsor, address indexed removedBy);
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    constructor() ERC20("GameDin Token", "GDIN") {
        _mint(msg.sender, 1000000000 * 10**decimals()); // 1B tokens
        gasSponsorPool = 1000000 * 10**decimals(); // 1M tokens for gas sponsoring
        
        // Initialize first achievement
        _createAchievement(
            "FIRST_STEPS",
            "Take your first steps in the GameDin universe",
            "Complete your first game action",
            100, // 100 XP
            10 * 10**decimals() // 10 tokens
        );
    }
    
    // =============================================================================
    // GAMING MECHANICS
    // =============================================================================
    
    /**
     * @dev Reward a player for gaming actions with AI validation
     * @param player Player address to reward
     * @param xpAmount XP amount to award
     * @param tokenAmount Token amount to award
     * @param gameId Game identifier
     * @param actionType Type of action performed
     * @param gameData Additional game data
     */
    function rewardPlayer(
        address player,
        uint256 xpAmount,
        uint256 tokenAmount,
        string memory gameId,
        string memory actionType,
        bytes memory gameData
    ) external onlyGameContract nonReentrant whenNotPaused {
        require(player != address(0), "Invalid player address");
        require(xpAmount > 0 || tokenAmount > 0, "Must award XP or tokens");
        
        // AI validation through NovaSanctum Oracle
        if (novaSanctumOracle != address(0)) {
            require(
                INovaSanctumOracle(novaSanctumOracle).validatePlayerAction(
                    player,
                    gameId,
                    actionType,
                    xpAmount,
                    tokenAmount,
                    gameData
                ),
                "AI validation failed"
            );
        }
        
        // Update player profile
        PlayerProfile storage profile = playerProfiles[player];
        
        // Award XP
        if (xpAmount > 0) {
            profile.xp += xpAmount;
            totalXPDistributed += xpAmount;
            
            // Check for level up
            uint256 newLevel = profile.xp / XP_PER_LEVEL;
            if (newLevel > profile.level && newLevel <= MAX_LEVEL) {
                uint256 oldLevel = profile.level;
                profile.level = newLevel;
                emit PlayerLevelUp(player, oldLevel, newLevel, profile.xp);
            }
            
            // Check for prestige
            if (profile.xp >= PRESTIGE_THRESHOLD && profile.xp % PRESTIGE_THRESHOLD == 0) {
                uint256 oldPrestige = profile.prestige;
                profile.prestige++;
                emit PlayerPrestige(player, oldPrestige, profile.prestige, profile.xp);
            }
        }
        
        // Award tokens
        if (tokenAmount > 0) {
            _mint(player, tokenAmount);
            profile.totalRewardsEarned += tokenAmount;
        }
        
        // Update activity
        profile.lastActivity = block.timestamp;
        profile.totalGamesPlayed++;
        profile.isActive = true;
        
        // Record game action
        GameAction memory action = GameAction({
            gameId: gameId,
            actionType: actionType,
            timestamp: block.timestamp,
            xpGained: xpAmount,
            tokensEarned: tokenAmount,
            gameData: gameData
        });
        
        playerActions[player].push(action);
        
        emit GameAction(player, gameId, actionType, xpAmount, tokenAmount, block.timestamp);
    }
    
    /**
     * @dev Unlock an achievement for a player
     * @param player Player address
     * @param achievementId Achievement identifier
     */
    function unlockAchievement(
        address player,
        bytes32 achievementId
    ) external onlyGameContract nonReentrant whenNotPaused {
        require(player != address(0), "Invalid player address");
        require(achievements[achievementId].isActive, "Achievement not found or inactive");
        
        Achievement storage achievement = achievements[achievementId];
        PlayerProfile storage profile = playerProfiles[player];
        
        // Check if player can unlock this achievement
        require(
            achievement.maxUnlocks == 0 || 
            profile.achievements[achievement.name] < achievement.maxUnlocks,
            "Achievement unlock limit reached"
        );
        
        // Award XP and tokens
        if (achievement.xpReward > 0) {
            profile.xp += achievement.xpReward;
            totalXPDistributed += achievement.xpReward;
        }
        
        if (achievement.tokenReward > 0) {
            _mint(player, achievement.tokenReward);
            profile.totalRewardsEarned += achievement.tokenReward;
        }
        
        // Update achievement tracking
        profile.achievements[achievement.name]++;
        achievement.unlockCount++;
        totalAchievementsUnlocked++;
        
        emit AchievementUnlocked(
            player,
            achievementId,
            achievement.name,
            achievement.xpReward,
            achievement.tokenReward
        );
    }
    
    // =============================================================================
    // GAS SPONSORING
    // =============================================================================
    
    /**
     * @dev Sponsor gas for a user transaction
     * @param user User to sponsor gas for
     * @param amount Amount of tokens to sponsor
     */
    function sponsorGas(
        address user,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(gasSponsors[msg.sender], "Not authorized sponsor");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, user, amount);
        sponsoredGasAmounts[user] += amount;
        
        emit GasSponsored(msg.sender, user, amount, block.timestamp);
    }
    
    /**
     * @dev Get sponsored gas amount for a user
     * @param user User address
     * @return Amount of sponsored gas
     */
    function getSponsoredGasAmount(address user) external view returns (uint256) {
        return sponsoredGasAmounts[user];
    }
    
    // =============================================================================
    // PLAYER PROFILE MANAGEMENT
    // =============================================================================
    
    /**
     * @dev Get complete player profile
     * @param player Player address
     * @return xp Experience points
     * @return level Current level
     * @return prestige Prestige level
     * @return lastActivity Last activity timestamp
     * @return totalGamesPlayed Total games played
     * @return totalRewardsEarned Total rewards earned
     * @return isActive Activity status
     */
    function getPlayerProfile(address player) external view returns (
        uint256 xp,
        uint256 level,
        uint256 prestige,
        uint256 lastActivity,
        uint256 totalGamesPlayed,
        uint256 totalRewardsEarned,
        bool isActive
    ) {
        PlayerProfile storage profile = playerProfiles[player];
        return (
            profile.xp,
            profile.level,
            profile.prestige,
            profile.lastActivity,
            profile.totalGamesPlayed,
            profile.totalRewardsEarned,
            profile.isActive
        );
    }
    
    /**
     * @dev Get player achievement count
     * @param player Player address
     * @param achievementName Achievement name
     * @return Count of times achievement unlocked
     */
    function getPlayerAchievementCount(
        address player,
        string memory achievementName
    ) external view returns (uint256) {
        return playerProfiles[player].achievements[achievementName];
    }
    
    /**
     * @dev Get player game statistics
     * @param player Player address
     * @param statName Statistic name
     * @return Statistic value
     */
    function getPlayerGameStat(
        address player,
        string memory statName
    ) external view returns (uint256) {
        return playerProfiles[player].gameStats[statName];
    }
    
    /**
     * @dev Get player actions history
     * @param player Player address
     * @param startIndex Start index
     * @param count Number of actions to return
     * @return actions Array of game actions
     */
    function getPlayerActions(
        address player,
        uint256 startIndex,
        uint256 count
    ) external view returns (GameAction[] memory actions) {
        GameAction[] storage allActions = playerActions[player];
        uint256 totalActions = allActions.length;
        
        if (startIndex >= totalActions) {
            return new GameAction[](0);
        }
        
        uint256 endIndex = startIndex + count;
        if (endIndex > totalActions) {
            endIndex = totalActions;
        }
        
        actions = new GameAction[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            actions[i - startIndex] = allActions[i];
        }
    }
    
    // =============================================================================
    // ACHIEVEMENT MANAGEMENT
    // =============================================================================
    
    /**
     * @dev Create a new achievement
     * @param name Achievement name
     * @param description Achievement description
     * @param xpReward XP reward
     * @param tokenReward Token reward
     */
    function createAchievement(
        string memory name,
        string memory description,
        uint256 xpReward,
        uint256 tokenReward
    ) external onlyOwner {
        _createAchievement(name, description, xpReward, tokenReward);
    }
    
    /**
     * @dev Internal function to create achievement
     */
    function _createAchievement(
        string memory name,
        string memory description,
        uint256 xpReward,
        uint256 tokenReward
    ) internal {
        bytes32 achievementId = keccak256(abi.encodePacked(name));
        require(!achievements[achievementId].isActive, "Achievement already exists");
        
        achievements[achievementId] = Achievement({
            name: name,
            description: description,
            xpReward: xpReward,
            tokenReward: tokenReward,
            isActive: true,
            unlockCount: 0,
            maxUnlocks: 0 // Unlimited by default
        });
        
        _achievementCounter.increment();
    }
    
    /**
     * @dev Get achievement details
     * @param achievementId Achievement identifier
     * @return Achievement details
     */
    function getAchievement(bytes32 achievementId) external view returns (
        string memory name,
        string memory description,
        uint256 xpReward,
        uint256 tokenReward,
        bool isActive,
        uint256 unlockCount,
        uint256 maxUnlocks
    ) {
        Achievement storage achievement = achievements[achievementId];
        return (
            achievement.name,
            achievement.description,
            achievement.xpReward,
            achievement.tokenReward,
            achievement.isActive,
            achievement.unlockCount,
            achievement.maxUnlocks
        );
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Add a game contract
     * @param gameContract Game contract address
     */
    function addGameContract(address gameContract) external onlyOwner {
        require(gameContract != address(0), "Invalid game contract address");
        gameContracts[gameContract] = true;
        emit GameContractAdded(gameContract, msg.sender);
    }
    
    /**
     * @dev Remove a game contract
     * @param gameContract Game contract address
     */
    function removeGameContract(address gameContract) external onlyOwner {
        gameContracts[gameContract] = false;
        emit GameContractRemoved(gameContract, msg.sender);
    }
    
    /**
     * @dev Add a gas sponsor
     * @param sponsor Sponsor address
     */
    function addGasSponsor(address sponsor) external onlyOwner {
        require(sponsor != address(0), "Invalid sponsor address");
        gasSponsors[sponsor] = true;
        emit GasSponsorAdded(sponsor, msg.sender);
    }
    
    /**
     * @dev Remove a gas sponsor
     * @param sponsor Sponsor address
     */
    function removeGasSponsor(address sponsor) external onlyOwner {
        gasSponsors[sponsor] = false;
        emit GasSponsorRemoved(sponsor, msg.sender);
    }
    
    /**
     * @dev Set L3 bridge address
     * @param bridge Bridge address
     */
    function setL3Bridge(address bridge) external onlyOwner {
        l3Bridge = bridge;
    }
    
    /**
     * @dev Set NovaSanctum Oracle address
     * @param oracle Oracle address
     */
    function setNovaSanctumOracle(address oracle) external onlyOwner {
        novaSanctumOracle = oracle;
    }
    
    /**
     * @dev Set gaming engine address
     * @param engine Engine address
     */
    function setGamingEngine(address engine) external onlyOwner {
        gamingEngine = engine;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // =============================================================================
    // MODIFIERS
    // =============================================================================
    
    modifier onlyGameContract() {
        require(gameContracts[msg.sender], "Not authorized game contract");
        _;
    }
    
    // =============================================================================
    // OVERRIDES
    // =============================================================================
    
    /**
     * @dev Override transfer to include gaming features
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        super._transfer(from, to, amount);
        
        // Update activity for both addresses
        if (from != address(0)) {
            playerProfiles[from].lastActivity = block.timestamp;
        }
        if (to != address(0)) {
            playerProfiles[to].lastActivity = block.timestamp;
        }
    }
}

/**
 * @title NovaSanctum Oracle Interface
 * @dev Interface for AI-powered validation
 */
interface INovaSanctumOracle {
    function validatePlayerAction(
        address player,
        string memory gameId,
        string memory actionType,
        uint256 xpAmount,
        uint256 tokenAmount,
        bytes memory gameData
    ) external view returns (bool);
} 