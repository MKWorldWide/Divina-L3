const { ethers } = require("hardhat");

async function checkBalance() {
  console.log("💰 Checking deployer balance on testnet...");
  
  try {
    // Connect to testnet
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const balance = await provider.getBalance(address);
    
    console.log("Address:", address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    console.log("Balance (wei):", balance.toString());
    
    const requiredBalance = ethers.parseEther("0.01");
    console.log("Required for deployment:", ethers.formatEther(requiredBalance), "ETH");
    
    if (balance >= requiredBalance) {
      console.log("✅ Sufficient balance for deployment!");
      console.log("🚀 You can now run: npm run deploy:testnet");
    } else {
      console.log("❌ Insufficient balance for deployment");
      console.log("💡 Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    }
    
  } catch (error) {
    console.error("Error checking balance:", error.message);
    console.log("💡 Make sure you have testnet ETH from a faucet");
  }
}

checkBalance().catch(console.error); 