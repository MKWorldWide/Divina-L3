const { ethers } = require("hardhat");

async function main() {
  console.log("Testing deployment...");
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Try to get deployed contracts
  try {
    const settlement = await ethers.getContract("GameDinSettlement");
    console.log("✅ GameDinSettlement deployed at:", settlement.address);
  } catch (e) {
    console.log("❌ GameDinSettlement not found");
  }
  
  try {
    const bridge = await ethers.getContract("GameDinL3Bridge");
    console.log("✅ GameDinL3Bridge deployed at:", bridge.address);
  } catch (e) {
    console.log("❌ GameDinL3Bridge not found");
  }
  
  try {
    const oracle = await ethers.getContract("NovaSanctumOracle");
    console.log("✅ NovaSanctumOracle deployed at:", oracle.address);
  } catch (e) {
    console.log("❌ NovaSanctumOracle not found");
  }
  
  try {
    const token = await ethers.getContract("GameDinToken");
    console.log("✅ GameDinToken deployed at:", token.address);
  } catch (e) {
    console.log("❌ GameDinToken not found");
  }
  
  try {
    const gamingCore = await ethers.getContract("GamingCore");
    console.log("✅ GamingCore deployed at:", gamingCore.address);
  } catch (e) {
    console.log("❌ GamingCore not found");
  }
  
  try {
    const marketplace = await ethers.getContract("NFTMarketplace");
    console.log("✅ NFTMarketplace deployed at:", marketplace.address);
  } catch (e) {
    console.log("❌ NFTMarketplace not found");
  }
  
  try {
    const aiOracle = await ethers.getContract("AIOracle");
    console.log("✅ AIOracle deployed at:", aiOracle.address);
  } catch (e) {
    console.log("❌ AIOracle not found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 