const { ethers } = require("hardhat");
const { execSync } = require("child_process");

const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const required = ethers.parseEther("0.01");
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");

async function checkBalance() {
  const balance = await provider.getBalance(address);
  console.log(`Current balance for ${address}: ${ethers.formatEther(balance)} ETH`);
  return balance;
}

async function tryFaucet() {
  // No public programmatic faucet for Base Sepolia, so print instructions
  console.log("\n⚠️  No programmatic faucet available for Base Sepolia.");
  console.log("Please use one of the following faucets:");
  console.log("- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  console.log("- https://www.alchemy.com/faucets/base-sepolia");
  console.log("- https://sepoliafaucet.com/");
  console.log("\nPaste your address and request testnet ETH.\n");
}

async function deployIfReady() {
  const balance = await checkBalance();
  if (balance >= required) {
    console.log("\n✅ Sufficient balance. Deploying to testnet...\n");
    try {
      execSync("npm run deploy:testnet", { stdio: "inherit" });
    } catch (e) {
      console.error("Deployment failed:", e.message);
    }
  } else {
    console.log("\n❌ Insufficient balance for deployment.");
    await tryFaucet();
    console.log("After receiving testnet ETH, re-run this script: npm run auto-testnet\n");
  }
}

deployIfReady(); 