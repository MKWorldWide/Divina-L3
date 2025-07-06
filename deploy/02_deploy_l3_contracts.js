const { deployments, getNamedAccounts } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  
  console.log("🚀 Deploying GameDin L3 Gaming Contracts...");
  console.log("Deployer:", deployer);
  
  // Load settlement addresses
  const settlementAddresses = require('../deployed-addresses.json');
  
  // Deploy Enhanced Gaming Token with L3 features
  console.log("🪙 Deploying Enhanced GameDin Token (L3)...");
  const l3Token = await deploy("GameDinToken", {
    from: deployer,
    args: [],
    log: true,
    gasLimit: 5000000,
    waitConfirmations: 3
  });
  
  console.log("✅ Enhanced GameDin Token deployed to:", l3Token.address);
  
  // Deploy NovaSanctum AI Oracle (L3 version)
  console.log("🔮 Deploying NovaSanctum AI Oracle (L3)...");
  const l3Oracle = await deploy("NovaSanctumOracle", {
    from: deployer,
    args: [],
    log: true,
    gasLimit: 4000000,
    waitConfirmations: 3
  });
  
  console.log("✅ NovaSanctum AI Oracle deployed to:", l3Oracle.address);
  
  // Deploy Gaming Engine
  console.log("🎮 Deploying Gaming Engine...");
  const gamingEngine = await deploy("GamingEngine", {
    from: deployer,
    args: [l3Token.address, l3Oracle.address],
    log: true,
    gasLimit: 4000000,
    waitConfirmations: 3
  });
  
  console.log("✅ Gaming Engine deployed to:", gamingEngine.address);
  
  // Deploy Cross-Chain Bridge
  console.log("🌉 Deploying Cross-Chain Bridge...");
  const bridge = await deploy("Bridge", {
    from: deployer,
    args: [settlementAddresses.bridge, l3Token.address],
    log: true,
    gasLimit: 3000000,
    waitConfirmations: 3
  });
  
  console.log("✅ Cross-Chain Bridge deployed to:", bridge.address);
  
  // Deploy NFT Marketplace
  console.log("🖼️ Deploying NFT Marketplace...");
  const marketplace = await deploy("NFTMarketplace", {
    from: deployer,
    args: [l3Token.address],
    log: true,
    gasLimit: 3000000,
    waitConfirmations: 3
  });
  
  console.log("✅ NFT Marketplace deployed to:", marketplace.address);
  
  // Deploy AI Oracle
  console.log("🤖 Deploying AI Oracle...");
  const aiOracle = await deploy("AIOracle", {
    from: deployer,
    args: [l3Oracle.address],
    log: true,
    gasLimit: 2000000,
    waitConfirmations: 3
  });
  
  console.log("✅ AI Oracle deployed to:", aiOracle.address);
  
  // Configure L3 contracts
  console.log("⚙️ Configuring L3 contracts...");
  
  // Configure GameDin Token
  const tokenContract = await ethers.getContract("GameDinToken");
  await tokenContract.addGameContract(gamingEngine.address);
  await tokenContract.addGasSponsor(deployer);
  await tokenContract.setNovaSanctumOracle(l3Oracle.address);
  await tokenContract.setGamingEngine(gamingEngine.address);
  await tokenContract.setL3Bridge(bridge.address);
  console.log("✅ GameDin Token configured");
  
  // Configure NovaSanctum Oracle
  const oracleContract = await ethers.getContract("NovaSanctumOracle");
  await oracleContract.addAuthorizedCaller(gamingEngine.address);
  await oracleContract.addAuthorizedCaller(deployer);
  await oracleContract.setAIServiceProvider(aiOracle.address);
  console.log("✅ NovaSanctum Oracle configured");
  
  // Configure Gaming Engine
  const engineContract = await ethers.getContract("GamingEngine");
  await engineContract.setTokenContract(l3Token.address);
  await engineContract.setOracleContract(l3Oracle.address);
  await engineContract.setBridgeContract(bridge.address);
  console.log("✅ Gaming Engine configured");
  
  // Configure Bridge
  const bridgeContract = await ethers.getContract("Bridge");
  await bridgeContract.setTokenContract(l3Token.address);
  await bridgeContract.setSettlementContract(settlementAddresses.settlement);
  console.log("✅ Bridge configured");
  
  // Create initial achievements
  console.log("🏆 Creating initial achievements...");
  const achievements = [
    {
      name: "FIRST_STEPS",
      description: "Take your first steps in the GameDin universe",
      xpReward: 100,
      tokenReward: ethers.utils.parseEther("10")
    },
    {
      name: "GAMING_MASTER",
      description: "Complete 100 game actions",
      xpReward: 1000,
      tokenReward: ethers.utils.parseEther("100")
    },
    {
      name: "ACHIEVEMENT_HUNTER",
      description: "Unlock 10 achievements",
      xpReward: 500,
      tokenReward: ethers.utils.parseEther("50")
    },
    {
      name: "COMMUNITY_BUILDER",
      description: "Invite 5 friends to GameDin",
      xpReward: 200,
      tokenReward: ethers.utils.parseEther("20")
    },
    {
      name: "BLOCKCHAIN_PIONEER",
      description: "Make your first cross-chain transaction",
      xpReward: 300,
      tokenReward: ethers.utils.parseEther("30")
    }
  ];
  
  for (const achievement of achievements) {
    await oracleContract.createAchievement(
      achievement.name,
      achievement.description,
      achievement.xpReward,
      achievement.tokenReward
    );
    console.log(`✅ Achievement created: ${achievement.name}`);
  }
  
  // Save L3 deployment addresses
  const l3Addresses = {
    l3Token: l3Token.address,
    l3Oracle: l3Oracle.address,
    gamingEngine: gamingEngine.address,
    bridge: bridge.address,
    marketplace: marketplace.address,
    aiOracle: aiOracle.address,
    deployer: deployer,
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployedAt: new Date().toISOString(),
    settlementAddresses: settlementAddresses
  };
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('l3-deployed-addresses.json', JSON.stringify(l3Addresses, null, 2));
  
  console.log("📄 L3 deployment addresses saved to l3-deployed-addresses.json");
  
  // Print summary
  console.log("\n🎉 GameDin L3 Deployment Complete!");
  console.log("==================================");
  console.log(`Network: ${l3Addresses.network}`);
  console.log(`Chain ID: ${l3Addresses.chainId}`);
  console.log(`L3 Token: ${l3Addresses.l3Token}`);
  console.log(`NovaSanctum Oracle: ${l3Addresses.l3Oracle}`);
  console.log(`Gaming Engine: ${l3Addresses.gamingEngine}`);
  console.log(`Cross-Chain Bridge: ${l3Addresses.bridge}`);
  console.log(`NFT Marketplace: ${l3Addresses.marketplace}`);
  console.log(`AI Oracle: ${l3Addresses.aiOracle}`);
  console.log("\n🎮 Ready for gaming!");
  
  // Verify contracts on block explorer (if supported)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts on block explorer...");
    
    try {
      await hre.run("verify:verify", {
        address: l3Token.address,
        constructorArguments: []
      });
      
      await hre.run("verify:verify", {
        address: l3Oracle.address,
        constructorArguments: []
      });
      
      await hre.run("verify:verify", {
        address: gamingEngine.address,
        constructorArguments: [l3Token.address, l3Oracle.address]
      });
      
      console.log("✅ Contracts verified successfully");
    } catch (error) {
      console.log("⚠️ Contract verification failed:", error.message);
    }
  }
};

module.exports.tags = ["L3"]; 