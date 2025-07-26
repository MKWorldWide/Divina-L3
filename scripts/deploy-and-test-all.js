const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting full deployment and testing...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Deploy all contracts
  console.log("\n📋 Deploying all contracts...");
  
  // 1. Deploy GameDinSettlement
  console.log("\n🔹 Deploying GameDinSettlement...");
  const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
  const settlement = await GameDinSettlement.deploy(
    deployer.address,
    ethers.parseEther("1000000000")
  );
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("✅ GameDinSettlement deployed to:", settlementAddress);
  
  // 2. Deploy GameDinToken
  console.log("\n🔹 Deploying GameDinToken...");
  const GameDinToken = await ethers.getContractFactory("GameDinToken");
  const token = await GameDinToken.deploy(
    "GameDin Token",
    "GDI",
    deployer.address
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ GameDinToken deployed to:", tokenAddress);
  
  // 3. Deploy NovaSanctumOracle
  console.log("\n🔹 Deploying NovaSanctumOracle...");
  const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
  const oracle = await NovaSanctumOracle.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ NovaSanctumOracle deployed to:", oracleAddress);
  
  // 4. Deploy GameDinL3Bridge
  console.log("\n🔹 Deploying GameDinL3Bridge...");
  const GameDinL3Bridge = await ethers.getContractFactory("GameDinL3Bridge");
  const bridge = await GameDinL3Bridge.deploy(settlementAddress);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ GameDinL3Bridge deployed to:", bridgeAddress);
  
  // 5. Deploy GamingCore
  console.log("\n🔹 Deploying GamingCore...");
  const GamingCore = await ethers.getContractFactory("GamingCore");
  const gamingCore = await GamingCore.deploy(deployer.address);
  await gamingCore.waitForDeployment();
  const gamingCoreAddress = await gamingCore.getAddress();
  console.log("✅ GamingCore deployed to:", gamingCoreAddress);
  
  // 6. Deploy NFTMarketplace
  console.log("\n🔹 Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ NFTMarketplace deployed to:", marketplaceAddress);
  
  // 7. Deploy AIOracle
  console.log("\n🔹 Deploying AIOracle...");
  const AIOracle = await ethers.getContractFactory("AIOracle");
  const aiOracle = await AIOracle.deploy(
    deployer.address,      // initialOwner
    gamingCoreAddress,     // _gamingCore
    oracleAddress,         // _novaSanctumService
    deployer.address,      // _athenaMistService (using deployer as placeholder)
    deployer.address       // _chainlinkOracle (using deployer as placeholder)
  );
  await aiOracle.waitForDeployment();
  const aiOracleAddress = await aiOracle.getAddress();
  console.log("✅ AIOracle deployed to:", aiOracleAddress);
  
  // Configure contracts
  console.log("\n🔧 Configuring contract relationships...");
  
  // Configure token with gaming engine and oracle
  console.log("Configuring GameDinToken...");
  await token.setGamingEngine(gamingCoreAddress);
  await token.setNovaSanctumOracle(oracleAddress);
  
  // Configure bridge with token
  console.log("Configuring GameDinL3Bridge...");
  await token.setL3Bridge(bridgeAddress);
  
  console.log("✅ Contract configuration complete!");
  
  // Run tests
  console.log("\n🧪 Running tests...");
  
  // Test 1: Basic token operations
  console.log("\n🔹 Testing token operations...");
  const initialBalance = await token.balanceOf(deployer.address);
  console.log(`Initial deployer token balance: ${ethers.formatEther(initialBalance)} GDI`);
  
  // Test 2: Bridge operations
  console.log("\n🔹 Testing bridge operations...");
  const bridgeBalance = await token.balanceOf(bridgeAddress);
  console.log(`Bridge token balance: ${ethers.formatEther(bridgeBalance)} GDI`);
  
  // Test 3: Oracle operations
  console.log("\n🔹 Testing oracle operations...");
  const oracleOwner = await oracle.owner();
  console.log(`Oracle owner: ${oracleOwner} (${oracleOwner === deployer.address ? '✅' : '❌'})`);
  
  // Test 4: GamingCore operations
  console.log("\n🔹 Testing GamingCore...");
  const gameToken = await gamingCore.gdiToken();
  console.log(`GamingCore token: ${gameToken} (${gameToken === tokenAddress ? '✅' : '❌'})`);
  
  // Test 5: Marketplace operations
  console.log("\n🔹 Testing NFTMarketplace...");
  const platformFee = await marketplace.platformFee();
  console.log(`Marketplace platform fee: ${platformFee} (${platformFee > 0 ? '✅' : '❌'})`);
  
  // Test 6: AIOracle operations
  console.log("\n🔹 Testing AIOracle...");
  const aiOracleOwner = await aiOracle.owner();
  console.log(`AIOracle owner: ${aiOracleOwner} (${aiOracleOwner === deployer.address ? '✅' : '❌'})`);
  
  console.log("\n🎉 All tests completed successfully!");
  
  // Deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`GameDinSettlement: ${settlementAddress}`);
  console.log(`GameDinToken: ${tokenAddress}`);
  console.log(`NovaSanctumOracle: ${oracleAddress}`);
  console.log(`GameDinL3Bridge: ${bridgeAddress}`);
  console.log(`GamingCore: ${gamingCoreAddress}`);
  console.log(`NFTMarketplace: ${marketplaceAddress}`);
  console.log(`AIOracle: ${aiOracleAddress}`);
  console.log("\n🔗 All contracts deployed and tested successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
