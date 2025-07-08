const { ethers } = require("hardhat");

async function checkSepoliaBalance() {
  console.log("💰 Checking deployer balance on Ethereum Sepolia testnet...");
  
  try {
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const balance = await provider.getBalance(address);
    
    console.log("Address:", address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    console.log("Balance (wei):", balance.toString());
    
    const requiredBalance = ethers.parseEther("0.01");
    console.log("Required for deployment:", ethers.formatEther(requiredBalance), "ETH");
    
    if (balance >= requiredBalance) {
      console.log("✅ Sufficient balance for deployment!");
      console.log("🚀 You can now run: npm run deploy:sepolia");
    } else {
      console.log("❌ Insufficient balance for deployment");
      console.log("\n💡 Get Sepolia testnet ETH from these faucets:");
      console.log("1. Alchemy Sepolia Faucet: https://www.alchemy.com/faucets/ethereum-sepolia");
      console.log("2. Sepolia Faucet: https://sepoliafaucet.com/");
      console.log("3. Infura Sepolia Faucet: https://www.infura.io/faucet/sepolia");
      console.log("4. Chainlink Faucet: https://faucets.chain.link/sepolia");
      console.log("\nPaste your address and request testnet ETH.");
      console.log("After receiving ETH, run: npm run deploy:sepolia");
    }
    
  } catch (error) {
    console.error("Error checking balance:", error.message);
    console.log("💡 Make sure you have testnet ETH from a faucet");
  }
}

checkSepoliaBalance().catch(console.error); 