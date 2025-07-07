// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


/**
 * @title GDIToken
 * @dev GameDin L3 native token with gaming rewards, staking, and governance
 * @dev Supports AI-powered reward distribution and gaming ecosystem integration
 */
contract GDIToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        address _gamingCore,
        address _aiOracle,
        address _treasury
    ) ERC20(name, symbol) {
        gamingCore = _gamingCore;
        aiOracle = _aiOracle;
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(GAMING_CORE_ROLE, _gamingCore);
        _grantRole(AI_ORACLE_ROLE, _aiOracle);
        _grantRole(TREASURY_ROLE, _treasury);
        
        // Mint initial supply to treasury
        _mint(_treasury, INITIAL_SUPPLY);
    }
    

    // ============ ROLES ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GAMING_CORE_ROLE = keccak256("GAMING_CORE_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // ============ STRUCTS ============
    struct StakingInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardTime;
        uint256 totalRewards;
        uint256 lockPeriod;
        bool isLocked;
    }

    struct RewardPool {
        uint256 totalRewards;
        uint256 distributedRewards;
        uint256 lastUpdateTime;
        uint256 rewardRate;
        bool isActive;
    }

    struct GovernanceProposal {
        uint256 proposalId;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
        mapping(address => bool) votedFor;
    }

    // ============ STATE VARIABLES ============
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 2_000_000_000 * 10**18; // 2 billion max supply
    
    uint256 public stakingRewardRate = 10; // 10% APY
    uint256 public gamingRewardRate = 5; // 5% of gaming fees
    uint256 public governanceQuorum = 100_000 * 10**18; // 100k tokens for quorum
    
    mapping(address => StakingInfo) public stakingInfo;
    mapping(uint256 => RewardPool) public rewardPools;
    mapping(uint256 => GovernanceProposal) public governanceProposals;
    
    uint256 private _proposalIds;
    uint256 private _rewardPoolIds;
    
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public gamingRewardsPool;
    
    address public gamingCore;
    address public aiOracle;
    address public treasury;
    
    // ============ EVENTS ============
    event TokensStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);
    event GamingRewardsDistributed(address indexed user, uint256 amount, uint256 gameId);
    event GovernanceProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    event RewardPoolCreated(uint256 indexed poolId, uint256 totalRewards, uint256 rewardRate);
    event AIOracleUpdated(address indexed newOracle);
    event GamingCoreUpdated(address indexed newGamingCore);

    // ============ MODIFIERS ============
    modifier onlyGamingCore() {
        require(msg.sender == gamingCore, "Only GamingCore can call");
        _;
    }
    
    modifier onlyAIOracle() {
        require(msg.sender == aiOracle, "Only AI Oracle can call");
        _;
    }
    
    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only Treasury can call");
        _;
    }



    // ============ STAKING FUNCTIONS ============
    
    /**
     * @dev Stake tokens for rewards
     * @param amount Amount to stake
     * @param lockPeriod Lock period in seconds (0 for no lock)
     */
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        StakingInfo storage staker = stakingInfo[msg.sender];
        
        // Claim existing rewards first
        if (staker.amount > 0) {
            _claimStakingRewards(msg.sender);
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking info
        staker.amount += amount;
        staker.startTime = block.timestamp;
        staker.lastRewardTime = block.timestamp;
        staker.lockPeriod = lockPeriod;
        staker.isLocked = lockPeriod > 0;
        
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount, lockPeriod);
    }
    
    /**
     * @dev Unstake tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.amount >= amount, "Insufficient staked amount");
        
        // Check lock period
        if (staker.isLocked) {
            require(block.timestamp >= staker.startTime + staker.lockPeriod, "Tokens are locked");
        }
        
        // Claim rewards first
        _claimStakingRewards(msg.sender);
        
        // Update staking info
        staker.amount -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount, staker.totalRewards);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimStakingRewards() external nonReentrant {
        _claimStakingRewards(msg.sender);
    }
    
    /**
     * @dev Internal function to claim staking rewards
     * @param user User address
     */
    function _claimStakingRewards(address user) internal {
        StakingInfo storage staker = stakingInfo[user];
        require(staker.amount > 0, "No tokens staked");
        
        uint256 rewards = calculateStakingRewards(user);
        if (rewards > 0) {
            staker.totalRewards += rewards;
            staker.lastRewardTime = block.timestamp;
            totalRewardsDistributed += rewards;
            
            // Mint rewards to user
            _mint(user, rewards);
            
            emit RewardsClaimed(user, rewards);
        }
    }
    
    /**
     * @dev Calculate staking rewards for a user
     * @param user User address
     * @return amount Rewards amount
     */
    function calculateStakingRewards(address user) public view returns (uint256) {
        StakingInfo storage staker = stakingInfo[user];
        if (staker.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - staker.lastRewardTime;
        uint256 rewards = (staker.amount * stakingRewardRate * timeStaked) / (365 days * 100);
        
        return rewards;
    }

    // ============ GAMING REWARDS FUNCTIONS ============
    
    /**
     * @dev Distribute gaming rewards (called by GamingCore)
     * @param user User address
     * @param amount Reward amount
     * @param gameId Game ID
     */
    function distributeGamingRewards(
        address user,
        uint256 amount,
        uint256 gameId
    ) external onlyGamingCore {
        require(amount > 0, "Reward amount must be greater than 0");
        require(gamingRewardsPool >= amount, "Insufficient gaming rewards pool");
        
        gamingRewardsPool -= amount;
        _mint(user, amount);
        
        emit GamingRewardsDistributed(user, amount, gameId);
    }
    
    /**
     * @dev Add to gaming rewards pool (called by GamingCore)
     * @param amount Amount to add
     */
    function addToGamingRewardsPool(uint256 amount) external onlyGamingCore {
        gamingRewardsPool += amount;
    }
    
    /**
     * @dev Get gaming rewards pool balance
     * @return balance Pool balance
     */
    function getGamingRewardsPool() external view returns (uint256) {
        return gamingRewardsPool;
    }

    // ============ GOVERNANCE FUNCTIONS ============
    
    /**
     * @dev Create a governance proposal
     * @param description Proposal description
     * @param duration Voting duration in seconds
     * @return proposalId Proposal ID
     */
    function createProposal(
        string memory description,
        uint256 duration
    ) external returns (uint256) {
        require(balanceOf(msg.sender) >= governanceQuorum / 10, "Insufficient tokens to propose");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(duration > 0 && duration <= 7 days, "Invalid duration");
        
        _proposalIds++;
        uint256 proposalId = _proposalIds;
        
        GovernanceProposal storage proposal = governanceProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + duration;
        proposal.executed = false;
        proposal.canceled = false;
        
        emit GovernanceProposalCreated(proposalId, msg.sender, description);
        
        return proposalId;
    }
    
    /**
     * @dev Vote on a proposal
     * @param proposalId Proposal ID
     * @param support True for support, false for against
     */
    function vote(uint256 proposalId, bool support) external {
        GovernanceProposal storage proposal = governanceProposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(!proposal.executed && !proposal.canceled, "Proposal not active");
        
        uint256 votingPower = balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votedFor[msg.sender] = support;
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit VoteCast(msg.sender, proposalId, support);
    }
    
    /**
     * @dev Execute a proposal
     * @param proposalId Proposal ID
     */
    function executeProposal(uint256 proposalId) external {
        GovernanceProposal storage proposal = governanceProposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(proposal.forVotes > proposal.againstVotes, "Proposal not passed");
        require(proposal.forVotes + proposal.againstVotes >= governanceQuorum, "Quorum not reached");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Get proposal information
     * @param proposalId Proposal ID
     * @return proposer Proposer address
     * @return description Proposal description
     * @return forVotes For votes count
     * @return againstVotes Against votes count
     * @return startTime Start time
     * @return endTime End time
     * @return executed Whether executed
     * @return canceled Whether canceled
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 startTime,
            uint256 endTime,
            bool executed,
            bool canceled
        )
    {
        GovernanceProposal storage proposal = governanceProposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.canceled
        );
    }

    // ============ REWARD POOL FUNCTIONS ============
    
    /**
     * @dev Create a reward pool
     * @param totalRewards Total rewards in the pool
     * @param rewardRate Reward rate per second
     * @return poolId Pool ID
     */
    function createRewardPool(uint256 totalRewards, uint256 rewardRate) 
        external 
        onlyRole(TREASURY_ROLE) 
        returns (uint256) 
    {
        require(totalRewards > 0, "Total rewards must be greater than 0");
        require(rewardRate > 0, "Reward rate must be greater than 0");
        
        _rewardPoolIds++;
        uint256 poolId = _rewardPoolIds;
        
        RewardPool storage pool = rewardPools[poolId];
        pool.totalRewards = totalRewards;
        pool.rewardRate = rewardRate;
        pool.lastUpdateTime = block.timestamp;
        pool.isActive = true;
        
        emit RewardPoolCreated(poolId, totalRewards, rewardRate);
        
        return poolId;
    }
    
    /**
     * @dev Get reward pool information
     * @param poolId Pool ID
     * @return totalRewards Total rewards
     * @return distributedRewards Distributed rewards
     * @return lastUpdateTime Last update time
     * @return rewardRate Reward rate
     * @return isActive Whether active
     */
    function getRewardPool(uint256 poolId)
        external
        view
        returns (
            uint256 totalRewards,
            uint256 distributedRewards,
            uint256 lastUpdateTime,
            uint256 rewardRate,
            bool isActive
        )
    {
        RewardPool storage pool = rewardPools[poolId];
        return (
            pool.totalRewards,
            pool.distributedRewards,
            pool.lastUpdateTime,
            pool.rewardRate,
            pool.isActive
        );
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update AI Oracle address
     * @param newOracle New oracle address
     */
    function updateAIOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOracle != address(0), "Invalid oracle address");
        aiOracle = newOracle;
        _grantRole(AI_ORACLE_ROLE, newOracle);
        emit AIOracleUpdated(newOracle);
    }
    
    /**
     * @dev Update Gaming Core address
     * @param newGamingCore New gaming core address
     */
    function updateGamingCore(address newGamingCore) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newGamingCore != address(0), "Invalid gaming core address");
        gamingCore = newGamingCore;
        _grantRole(GAMING_CORE_ROLE, newGamingCore);
        emit GamingCoreUpdated(newGamingCore);
    }
    
    /**
     * @dev Update staking reward rate
     * @param newRate New reward rate
     */
    function updateStakingRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate <= 50, "Reward rate too high"); // Max 50% APY
        stakingRewardRate = newRate;
    }
    
    /**
     * @dev Update governance quorum
     * @param newQuorum New quorum amount
     */
    function updateGovernanceQuorum(uint256 newQuorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        governanceQuorum = newQuorum;
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============ OVERRIDE FUNCTIONS ============
    
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

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get staking information for a user
     * @param user User address
     * @return amount Staked amount
     * @return startTime Start time
     * @return lastRewardTime Last reward time
     * @return totalRewards Total rewards
     * @return lockPeriod Lock period
     * @return isLocked Whether locked
     * @return pendingRewards Pending rewards
     */
    function getStakingInfo(address user)
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 lastRewardTime,
            uint256 totalRewards,
            uint256 lockPeriod,
            bool isLocked,
            uint256 pendingRewards
        )
    {
        StakingInfo storage staker = stakingInfo[user];
        return (
            staker.amount,
            staker.startTime,
            staker.lastRewardTime,
            staker.totalRewards,
            staker.lockPeriod,
            staker.isLocked,
            calculateStakingRewards(user)
        );
    }
    
    /**
     * @dev Get total proposals count
     * @return total Total proposals
     */
    function getTotalProposals() external view returns (uint256) {
        return _proposalIds;
    }
    
    /**
     * @dev Get total reward pools count
     * @return total Total reward pools
     */
    function getTotalRewardPools() external view returns (uint256) {
        return _rewardPoolIds;
    }
    
    /**
     * @dev Check if user has voted on a proposal
     * @param proposalId Proposal ID
     * @param user User address
     * @return hasVoted True if voted
     */
    function hasVoted(uint256 proposalId, address user) external view returns (bool) {
        return governanceProposals[proposalId].hasVoted[user];
    }
    
    /**
     * @dev Get user's vote on a proposal
     * @param proposalId Proposal ID
     * @param user User address
     * @return votedFor True if voted for, false if against
     */
    function getUserVote(uint256 proposalId, address user) external view returns (bool) {
        return governanceProposals[proposalId].votedFor[user];
    }
} 