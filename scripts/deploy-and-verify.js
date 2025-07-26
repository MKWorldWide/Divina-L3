const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment and verification...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Deploy GameDinSettlement
  console.log("\n📋 Deploying GameDinSettlement...");
  const GameDinSettlement = await ethers.getContractFactory("GameDinSettlement");
  const settlement = await GameDinSettlement.deploy(
    deployer.address,
    ethers.parseEther("1000000000")
  );
  await settlement.waitForDeployment();
  console.log("✅ GameDinSettlement deployed to:", await settlement.getAddress());
  
  // Deploy GameDinToken
  console.log("\n🪙 Deploying GameDinToken...");
  const GameDinToken = await ethers.getContractFactory("GameDinToken");
  const token = await GameDinToken.deploy(
    "GameDin Token",
    "GDI",
    deployer.address
  );
  await token.waitForDeployment();
  console.log("✅ GameDinToken deployed to:", await token.getAddress());
  
  // Deploy NovaSanctumOracle
  console.log("\n🔮 Deploying NovaSanctumOracle...");
  const NovaSanctumOracle = await ethers.getContractFactory("NovaSanctumOracle");
  const oracle = await NovaSanctumOracle.deploy(deployer.address);
  await oracle.waitForDeployment();
  console.log("✅ NovaSanctumOracle deployed to:", await oracle.getAddress());
  
  // Verify basic functionality
  console.log("\n🧪 Verifying basic functionality...");
  
  // Check token details
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  console.log(`Token: ${tokenName} (${tokenSymbol})`);
  
  // Check settlement details
  const settlementName = await settlement.name();
  const settlementSymbol = await settlement.symbol();
  console.log(`Settlement: ${settlementName} (${settlementSymbol})`);
  
  // Check oracle owner
  const oracleOwner = await oracle.owner();
  console.log(`Oracle Owner: ${oracleOwner} (${oracleOwner === deployer.address ? '✅' : '❌'})`);
  
  console.log("\n🎉 Deployment and verification complete!");
  console.log("================================");
  console.log(`GameDinSettlement: ${await settlement.getAddress()}`);
  console.log(`GameDinToken: ${await token.getAddress()}`);
  console.log(`NovaSanctumOracle: ${await oracle.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
