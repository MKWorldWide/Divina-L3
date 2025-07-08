const https = require('https');

async function getTestnetETH() {
  const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("🚰 Requesting testnet ETH from faucet...");
  console.log("Address:", address);
  
  // Try multiple faucet endpoints
  const faucets = [
    {
      name: "Base Sepolia Faucet",
      url: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
      method: "GET"
    },
    {
      name: "Alchemy Base Sepolia Faucet", 
      url: "https://www.alchemy.com/faucets/base-sepolia",
      method: "GET"
    }
  ];
  
  console.log("\n📋 Available faucets:");
  faucets.forEach((faucet, index) => {
    console.log(`${index + 1}. ${faucet.name}: ${faucet.url}`);
  });
  
  console.log("\n💡 Manual steps to get testnet ETH:");
  console.log("1. Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  console.log("2. Connect your wallet or enter address: " + address);
  console.log("3. Request testnet ETH");
  console.log("4. Wait for confirmation (usually 1-2 minutes)");
  console.log("5. Check balance and run deployment again");
  
  console.log("\n🔍 Alternative faucets:");
  console.log("- https://www.alchemy.com/faucets/base-sepolia");
  console.log("- https://sepoliafaucet.com/");
  console.log("- https://faucet.sepolia.dev/");
  
  console.log("\n⏳ After getting testnet ETH, run:");
  console.log("npm run deploy:testnet");
}

getTestnetETH().catch(console.error); 