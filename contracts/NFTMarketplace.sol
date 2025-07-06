// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NFTMarketplace
 * @dev Advanced NFT marketplace for GameDin L3 gaming ecosystem
 * @dev Supports AI-powered pricing, auctions, and gaming NFT integration
 */
contract NFTMarketplace is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;

    // ============ STRUCTS ============
    
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 aiSuggestedPrice;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
        ListingType listingType;
        uint256 minBid;
        uint256 currentBid;
        address currentBidder;
        uint256 auctionEndTime;
        uint256[] bidHistory;
        address[] bidders;
    }

    struct NFTMetadata {
        string name;
        string description;
        string imageUri;
        string attributes;
        uint256 rarity;
        uint256 power;
        uint256 level;
        string gameType;
        bool isGamingNFT;
        uint256[] stats;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    struct Collection {
        address nftContract;
        string name;
        string description;
        uint256 totalListings;
        uint256 totalVolume;
        uint256 floorPrice;
        bool isVerified;
        address creator;
        uint256 royaltyPercentage;
    }

    // ============ ENUMS ============
    
    enum ListingType {
        FIXED_PRICE,
        AUCTION,
        DUTCH_AUCTION
    }

    enum NFTType {
        CHARACTER,
        WEAPON,
        ARMOR,
        ITEM,
        LAND,
        ARTWORK,
        OTHER
    }

    // ============ STATE VARIABLES ============
    
    Counters.Counter private _listingIds;
    Counters.Counter private _collectionIds;
    
    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => uint256)) public tokenToListingId;
    mapping(address => Collection) public collections;
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userBids;
    
    uint256 public platformFee = 250; // 2.5%
    uint256 public aiOracleFee = 50; // 0.5%
    uint256 public minListingPrice = 0.001 * 10**18; // 0.001 tokens
    uint256 public maxListingPrice = 1000000 * 10**18; // 1M tokens
    uint256 public auctionDuration = 7 days;
    uint256 public dutchAuctionDuration = 3 days;
    
    address public gdiToken;
    address public aiOracle;
    address public gamingCore;
    address public treasury;
    
    uint256 public totalVolume;
    uint256 public totalListings;
    uint256 public totalSales;
    
    // ============ EVENTS ============
    
    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        ListingType listingType,
        uint256 expiresAt
    );
    
    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee
    );
    
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event BidPlaced(uint256 indexed listingId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed listingId, address indexed winner, uint256 finalPrice);
    event CollectionRegistered(address indexed nftContract, string name, address creator);
    event MetadataUpdated(address indexed nftContract, uint256 indexed tokenId, string name);

    // ============ MODIFIERS ============
    
    modifier onlyListingOwner(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "Not listing owner");
        _;
    }
    
    modifier onlyValidListing(uint256 listingId) {
        require(listings[listingId].listingId != 0, "Listing does not exist");
        require(listings[listingId].isActive, "Listing not active");
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
        address _gamingCore,
        address _treasury
    ) {
        gdiToken = _gdiToken;
        aiOracle = _aiOracle;
        gamingCore = _gamingCore;
        treasury = _treasury;
    }

    // ============ LISTING FUNCTIONS ============
    
    /**
     * @dev Create a fixed price listing
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param price Listing price
     * @param duration Listing duration in seconds
     */
    function createFixedPriceListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(price >= minListingPrice && price <= maxListingPrice, "Invalid price");
        require(duration > 0 && duration <= 30 days, "Invalid duration");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(tokenToListingId[nftContract][tokenId] == 0, "Token already listed");
        
        // Transfer NFT to marketplace
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        _createListing(
            nftContract,
            tokenId,
            price,
            ListingType.FIXED_PRICE,
            0,
            duration
        );
    }
    
    /**
     * @dev Create an auction listing
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param minBid Minimum bid amount
     * @param duration Auction duration in seconds
     */
    function createAuctionListing(
        address nftContract,
        uint256 tokenId,
        uint256 minBid,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(minBid >= minListingPrice, "Min bid too low");
        require(duration > 0 && duration <= 30 days, "Invalid duration");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(tokenToListingId[nftContract][tokenId] == 0, "Token already listed");
        
        // Transfer NFT to marketplace
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        _createListing(
            nftContract,
            tokenId,
            0,
            ListingType.AUCTION,
            minBid,
            duration
        );
    }
    
    /**
     * @dev Create a Dutch auction listing
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param startPrice Starting price
     * @param endPrice Ending price
     * @param duration Auction duration in seconds
     */
    function createDutchAuctionListing(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(startPrice > endPrice, "Start price must be higher than end price");
        require(startPrice <= maxListingPrice, "Start price too high");
        require(duration > 0 && duration <= 7 days, "Invalid duration");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(tokenToListingId[nftContract][tokenId] == 0, "Token already listed");
        
        // Transfer NFT to marketplace
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        _createListing(
            nftContract,
            tokenId,
            startPrice,
            ListingType.DUTCH_AUCTION,
            endPrice,
            duration
        );
    }
    
    /**
     * @dev Internal function to create listing
     */
    function _createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        ListingType listingType,
        uint256 minBid,
        uint256 duration
    ) internal {
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        Listing storage listing = listings[listingId];
        listing.listingId = listingId;
        listing.nftContract = nftContract;
        listing.tokenId = tokenId;
        listing.seller = msg.sender;
        listing.price = price;
        listing.listingType = listingType;
        listing.minBid = minBid;
        listing.isActive = true;
        listing.createdAt = block.timestamp;
        listing.expiresAt = block.timestamp + duration;
        
        if (listingType == ListingType.AUCTION) {
            listing.auctionEndTime = block.timestamp + duration;
        }
        
        tokenToListingId[nftContract][tokenId] = listingId;
        userListings[msg.sender].push(listingId);
        
        totalListings++;
        
        // Update collection stats
        if (collections[nftContract].nftContract != address(0)) {
            collections[nftContract].totalListings++;
        }
        
        emit ListingCreated(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            price,
            listingType,
            listing.expiresAt
        );
    }
    
    /**
     * @dev Buy a fixed price listing
     * @param listingId Listing ID
     */
    function buyListing(uint256 listingId) external nonReentrant whenNotPaused onlyValidListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        uint256 platformFeeAmount = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - platformFeeAmount;
        
        // Transfer tokens from buyer to seller and platform
        IERC20(gdiToken).transferFrom(msg.sender, listing.seller, sellerAmount);
        IERC20(gdiToken).transferFrom(msg.sender, treasury, platformFeeAmount);
        
        // Transfer NFT to buyer
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        // Update listing
        listing.isActive = false;
        tokenToListingId[listing.nftContract][listing.tokenId] = 0;
        
        totalVolume += listing.price;
        totalSales++;
        
        emit ListingSold(listingId, msg.sender, listing.seller, listing.price, platformFeeAmount);
    }
    
    /**
     * @dev Place bid on auction
     * @param listingId Listing ID
     * @param bidAmount Bid amount
     */
    function placeBid(uint256 listingId, uint256 bidAmount) external nonReentrant whenNotPaused onlyValidListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp <= listing.auctionEndTime, "Auction ended");
        require(msg.sender != listing.seller, "Cannot bid on your own listing");
        require(bidAmount > listing.currentBid, "Bid too low");
        require(bidAmount >= listing.minBid, "Bid below minimum");
        
        // Return previous bid if exists
        if (listing.currentBid > 0) {
            IERC20(gdiToken).transfer(listing.currentBidder, listing.currentBid);
        }
        
        // Transfer new bid
        IERC20(gdiToken).transferFrom(msg.sender, address(this), bidAmount);
        
        // Update listing
        listing.currentBid = bidAmount;
        listing.currentBidder = msg.sender;
        listing.bidHistory.push(bidAmount);
        listing.bidders.push(msg.sender);
        
        userBids[msg.sender].push(listingId);
        
        emit BidPlaced(listingId, msg.sender, bidAmount);
    }
    
    /**
     * @dev End auction and transfer NFT to winner
     * @param listingId Listing ID
     */
    function endAuction(uint256 listingId) external nonReentrant onlyValidListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp > listing.auctionEndTime, "Auction not ended");
        require(listing.currentBid > 0, "No bids placed");
        
        uint256 platformFeeAmount = (listing.currentBid * platformFee) / 10000;
        uint256 sellerAmount = listing.currentBid - platformFeeAmount;
        
        // Transfer tokens to seller and platform
        IERC20(gdiToken).transfer(listing.seller, sellerAmount);
        IERC20(gdiToken).transfer(treasury, platformFeeAmount);
        
        // Transfer NFT to winner
        IERC721(listing.nftContract).transferFrom(address(this), listing.currentBidder, listing.tokenId);
        
        // Update listing
        listing.isActive = false;
        tokenToListingId[listing.nftContract][listing.tokenId] = 0;
        
        totalVolume += listing.currentBid;
        totalSales++;
        
        emit AuctionEnded(listingId, listing.currentBidder, listing.currentBid);
    }
    
    /**
     * @dev Buy Dutch auction at current price
     * @param listingId Listing ID
     */
    function buyDutchAuction(uint256 listingId) external nonReentrant whenNotPaused onlyValidListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.DUTCH_AUCTION, "Not a Dutch auction");
        require(block.timestamp <= listing.expiresAt, "Auction expired");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        uint256 currentPrice = getDutchAuctionPrice(listingId);
        require(currentPrice > 0, "Auction ended");
        
        uint256 platformFeeAmount = (currentPrice * platformFee) / 10000;
        uint256 sellerAmount = currentPrice - platformFeeAmount;
        
        // Transfer tokens from buyer to seller and platform
        IERC20(gdiToken).transferFrom(msg.sender, listing.seller, sellerAmount);
        IERC20(gdiToken).transferFrom(msg.sender, treasury, platformFeeAmount);
        
        // Transfer NFT to buyer
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        // Update listing
        listing.isActive = false;
        tokenToListingId[listing.nftContract][listing.tokenId] = 0;
        
        totalVolume += currentPrice;
        totalSales++;
        
        emit ListingSold(listingId, msg.sender, listing.seller, currentPrice, platformFeeAmount);
    }
    
    /**
     * @dev Cancel listing
     * @param listingId Listing ID
     */
    function cancelListing(uint256 listingId) external onlyListingOwner(listingId) onlyValidListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Can only cancel fixed price listings");
        
        // Return NFT to seller
        IERC721(listing.nftContract).transferFrom(address(this), listing.seller, listing.tokenId);
        
        // Update listing
        listing.isActive = false;
        tokenToListingId[listing.nftContract][listing.tokenId] = 0;
        
        emit ListingCancelled(listingId, listing.seller);
    }
    
    /**
     * @dev Update listing price
     * @param listingId Listing ID
     * @param newPrice New price
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external onlyListingOwner(listingId) onlyValidListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Can only update fixed price listings");
        require(newPrice >= minListingPrice && newPrice <= maxListingPrice, "Invalid price");
        
        listing.price = newPrice;
        
        emit ListingUpdated(listingId, newPrice);
    }

    // ============ AI INTEGRATION FUNCTIONS ============
    
    /**
     * @dev Update AI suggested price (called by AI Oracle)
     * @param listingId Listing ID
     * @param suggestedPrice AI suggested price
     */
    function updateAISuggestedPrice(uint256 listingId, uint256 suggestedPrice) external onlyAIOracle {
        require(listings[listingId].listingId != 0, "Listing does not exist");
        listings[listingId].aiSuggestedPrice = suggestedPrice;
    }
    
    /**
     * @dev Get AI suggested price for listing
     * @param listingId Listing ID
     * @return AI suggested price
     */
    function getAISuggestedPrice(uint256 listingId) external view returns (uint256) {
        return listings[listingId].aiSuggestedPrice;
    }

    // ============ COLLECTION FUNCTIONS ============
    
    /**
     * @dev Register NFT collection
     * @param nftContract NFT contract address
     * @param name Collection name
     * @param description Collection description
     * @param royaltyPercentage Royalty percentage (basis points)
     */
    function registerCollection(
        address nftContract,
        string memory name,
        string memory description,
        uint256 royaltyPercentage
    ) external {
        require(collections[nftContract].nftContract == address(0), "Collection already registered");
        require(royaltyPercentage <= 1000, "Royalty too high"); // Max 10%
        
        collections[nftContract] = Collection({
            nftContract: nftContract,
            name: name,
            description: description,
            totalListings: 0,
            totalVolume: 0,
            floorPrice: 0,
            isVerified: false,
            creator: msg.sender,
            royaltyPercentage: royaltyPercentage
        });
        
        emit CollectionRegistered(nftContract, name, msg.sender);
    }
    
    /**
     * @dev Update collection metadata
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param metadata NFT metadata
     */
    function updateNFTMetadata(
        address nftContract,
        uint256 tokenId,
        NFTMetadata memory metadata
    ) external {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        
        nftMetadata[tokenId] = metadata;
        
        emit MetadataUpdated(nftContract, tokenId, metadata.name);
    }

    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Get Dutch auction current price
     * @param listingId Listing ID
     * @return Current price
     */
    function getDutchAuctionPrice(uint256 listingId) public view returns (uint256) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.DUTCH_AUCTION, "Not a Dutch auction");
        
        if (block.timestamp >= listing.expiresAt) {
            return listing.minBid; // End price
        }
        
        uint256 timeElapsed = block.timestamp - listing.createdAt;
        uint256 totalDuration = listing.expiresAt - listing.createdAt;
        
        uint256 priceDecrease = ((listing.price - listing.minBid) * timeElapsed) / totalDuration;
        return listing.price - priceDecrease;
    }
    
    /**
     * @dev Get listing details
     * @param listingId Listing ID
     * @return Listing details
     */
    function getListing(uint256 listingId)
        external
        view
        returns (
            address nftContract,
            uint256 tokenId,
            address seller,
            uint256 price,
            uint256 aiSuggestedPrice,
            bool isActive,
            ListingType listingType,
            uint256 minBid,
            uint256 currentBid,
            address currentBidder,
            uint256 auctionEndTime,
            uint256 createdAt,
            uint256 expiresAt
        )
    {
        Listing storage listing = listings[listingId];
        return (
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            listing.price,
            listing.aiSuggestedPrice,
            listing.isActive,
            listing.listingType,
            listing.minBid,
            listing.currentBid,
            listing.currentBidder,
            listing.auctionEndTime,
            listing.createdAt,
            listing.expiresAt
        );
    }
    
    /**
     * @dev Get user listings
     * @param user User address
     * @return Array of listing IDs
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }
    
    /**
     * @dev Get user bids
     * @param user User address
     * @return Array of listing IDs where user has bid
     */
    function getUserBids(address user) external view returns (uint256[] memory) {
        return userBids[user];
    }
    
    /**
     * @dev Get collection information
     * @param nftContract NFT contract address
     * @return Collection information
     */
    function getCollection(address nftContract)
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 totalListings,
            uint256 totalVolume,
            uint256 floorPrice,
            bool isVerified,
            address creator,
            uint256 royaltyPercentage
        )
    {
        Collection storage collection = collections[nftContract];
        return (
            collection.name,
            collection.description,
            collection.totalListings,
            collection.totalVolume,
            collection.floorPrice,
            collection.isVerified,
            collection.creator,
            collection.royaltyPercentage
        );
    }
    
    /**
     * @dev Get NFT metadata
     * @param tokenId Token ID
     * @return NFT metadata
     */
    function getNFTMetadata(uint256 tokenId)
        external
        view
        returns (
            string memory name,
            string memory description,
            string memory imageUri,
            string memory attributes,
            uint256 rarity,
            uint256 power,
            uint256 level,
            string memory gameType,
            bool isGamingNFT
        )
    {
        NFTMetadata storage metadata = nftMetadata[tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.imageUri,
            metadata.attributes,
            metadata.rarity,
            metadata.power,
            metadata.level,
            metadata.gameType,
            metadata.isGamingNFT
        );
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update platform fee
     * @param newFee New fee percentage (basis points)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
    
    /**
     * @dev Update AI Oracle fee
     * @param newFee New fee percentage (basis points)
     */
    function updateAIOracleFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        aiOracleFee = newFee;
    }
    
    /**
     * @dev Update price limits
     * @param newMinPrice New minimum price
     * @param newMaxPrice New maximum price
     */
    function updatePriceLimits(uint256 newMinPrice, uint256 newMaxPrice) external onlyOwner {
        require(newMinPrice < newMaxPrice, "Invalid price range");
        minListingPrice = newMinPrice;
        maxListingPrice = newMaxPrice;
    }
    
    /**
     * @dev Update auction duration
     * @param newDuration New duration in seconds
     */
    function updateAuctionDuration(uint256 newDuration) external onlyOwner {
        require(newDuration > 0 && newDuration <= 30 days, "Invalid duration");
        auctionDuration = newDuration;
    }
    
    /**
     * @dev Verify collection
     * @param nftContract NFT contract address
     * @param isVerified Whether collection is verified
     */
    function verifyCollection(address nftContract, bool isVerified) external onlyOwner {
        require(collections[nftContract].nftContract != address(0), "Collection not registered");
        collections[nftContract].isVerified = isVerified;
    }
    
    /**
     * @dev Pause marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw stuck tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Emergency withdraw stuck NFTs
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     */
    function emergencyWithdrawNFT(address nftContract, uint256 tokenId) external onlyOwner {
        IERC721(nftContract).transferFrom(address(this), owner(), tokenId);
    }
} 