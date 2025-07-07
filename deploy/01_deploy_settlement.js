const { deployments, getNamedAccounts, ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  
  console.log("🚀 Deploying GameDin Settlement Contracts to Base L2...");
  console.log("Deployer:", deployer);
  
  // Deploy GameDin Settlement Contract
  console.log("📋 Deploying GameDin Settlement Contract...");
  const settlement = await deploy("GameDinSettlement", {
    from: deployer,
    args: [
      deployer, // initialOwner
      ethers.parseEther(process.env.INITIAL_SUPPLY || "1000000000")
    ],
    log: true,
    gasLimit: 5000000,
    waitConfirmations: 5
  });
  
  console.log("✅ GameDin Settlement deployed to:", settlement.address);
  
  // Deploy L3 Bridge Contract
  console.log("🌉 Deploying GameDin L3 Bridge Contract...");
  const bridge = await deploy("GameDinL3Bridge", {
    from: deployer,
    args: [settlement.address],
    log: true,
    gasLimit: 3000000,
    waitConfirmations: 5
  });
  
  console.log("✅ GameDin L3 Bridge deployed to:", bridge.address);
  
  // Deploy NovaSanctum Oracle
  console.log("🔮 Deploying NovaSanctum AI Oracle...");
  const oracle = await deploy("NovaSanctumOracle", {
    from: deployer,
    args: [],
    log: true,
    gasLimit: 4000000,
    waitConfirmations: 5
  });
  
  console.log("✅ NovaSanctum Oracle deployed to:", oracle.address);
  
  // Deploy GameDin Token
  console.log("🪙 Deploying GameDin Token...");
  const token = await deploy("GameDinToken", {
    from: deployer,
    args: [],
    log: true,
    gasLimit: 3000000,
    waitConfirmations: 5
  });
  
  console.log("✅ GameDin Token deployed to:", token.address);
  
  // Deploy Gaming Core
  console.log("🎮 Deploying Gaming Core...");
  const gamingCore = await deploy("GamingCore", {
    from: deployer,
    args: [token.address, oracle.address],
    log: true,
    gasLimit: 4000000,
    waitConfirmations: 5
  });
  
  console.log("✅ Gaming Core deployed to:", gamingCore.address);
  
  // Deploy NFT Marketplace
  console.log("🖼️ Deploying NFT Marketplace...");
  const marketplace = await deploy("NFTMarketplace", {
    from: deployer,
    args: [token.address],
    log: true,
    gasLimit: 3000000,
    waitConfirmations: 5
  });
  
  console.log("✅ NFT Marketplace deployed to:", marketplace.address);
  
  // Deploy AI Oracle
  console.log("🤖 Deploying AI Oracle...");
  const aiOracle = await deploy("AIOracle", {
    from: deployer,
    args: [oracle.address],
    log: true,
    gasLimit: 2000000,
    waitConfirmations: 5
  });
  
  console.log("✅ AI Oracle deployed to:", aiOracle.address);
  
  // Configure contracts
  console.log("⚙️ Configuring contracts...");
  
  // Add gaming core as authorized game contract
  const tokenContract = await ethers.getContract("GameDinToken");
  await tokenContract.addGameContract(gamingCore.address);
  console.log("✅ Gaming Core added as authorized game contract");
  
  // Add deployer as gas sponsor
  await tokenContract.addGasSponsor(deployer);
  console.log("✅ Deployer added as gas sponsor");
  
  // Set NovaSanctum Oracle in token contract
  await tokenContract.setNovaSanctumOracle(oracle.address);
  console.log("✅ NovaSanctum Oracle set in token contract");
  
  // Set gaming engine in token contract
  await tokenContract.setGamingEngine(gamingCore.address);
  console.log("✅ Gaming Engine set in token contract");
  
  // Add authorized callers to NovaSanctum Oracle
  const oracleContract = await ethers.getContract("NovaSanctumOracle");
  await oracleContract.addAuthorizedCaller(gamingCore.address);
  await oracleContract.addAuthorizedCaller(deployer);
  console.log("✅ Authorized callers added to NovaSanctum Oracle");
  
  // Save deployment addresses
  const addresses = {
    settlement: settlement.address,
    bridge: bridge.address,
    oracle: oracle.address,
    token: token.address,
    gamingCore: gamingCore.address,
    marketplace: marketplace.address,
    aiOracle: aiOracle.address,
    deployer: deployer,
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployedAt: new Date().toISOString()
  };
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
  
  console.log("📄 Deployment addresses saved to deployed-addresses.json");
  
  // Print summary
  console.log("\n🎉 GameDin Settlement Deployment Complete!");
  console.log("==========================================");
  console.log(`Network: ${addresses.network}`);
  console.log(`Chain ID: ${addresses.chainId}`);
  console.log(`Settlement: ${addresses.settlement}`);
  console.log(`Bridge: ${addresses.bridge}`);
  console.log(`NovaSanctum Oracle: ${addresses.oracle}`);
  console.log(`GameDin Token: ${addresses.token}`);
  console.log(`Gaming Core: ${addresses.gamingCore}`);
  console.log(`NFT Marketplace: ${addresses.marketplace}`);
  console.log(`AI Oracle: ${addresses.aiOracle}`);
  console.log("\n🚀 Ready for L3 deployment!");
};

module.exports.tags = ["Settlement"]; 