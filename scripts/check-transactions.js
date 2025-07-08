const { ethers } = require("hardhat");

async function checkTransactions() {
  console.log("🔍 Checking recent transactions for deployer address...");
  
  const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
  
  try {
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);
    
    // Check balance
    const balance = await provider.getBalance(address);
    console.log(`Current balance: ${ethers.formatEther(balance)} ETH`);
    
    // Check last 10 blocks for transactions
    console.log("\n📋 Checking last 10 blocks for transactions...");
    
    for (let i = 0; i < 10; i++) {
      const blockNumber = currentBlock - i;
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (block && block.transactions) {
          const relevantTxs = block.transactions.filter(tx => 
            tx.to === address || tx.from === address
          );
          
          if (relevantTxs.length > 0) {
            console.log(`\nBlock ${blockNumber}:`);
            relevantTxs.forEach(tx => {
              console.log(`  ${tx.from === address ? 'OUT' : 'IN'} - ${ethers.formatEther(tx.value)} ETH`);
              console.log(`  Hash: ${tx.hash}`);
              console.log(`  Status: ${tx.confirmations > 0 ? 'Confirmed' : 'Pending'}`);
            });
          }
        }
      } catch (error) {
        // Skip blocks that can't be fetched
        continue;
      }
    }
    
    console.log("\n💡 If you don't see any incoming transactions, the faucet request may have failed.");
    console.log("Try requesting testnet ETH again from:");
    console.log("- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log("- https://www.alchemy.com/faucets/base-sepolia");
    
  } catch (error) {
    console.error("Error checking transactions:", error.message);
  }
}

checkTransactions().catch(console.error); 