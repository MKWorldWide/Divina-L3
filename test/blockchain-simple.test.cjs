/**
 * 🔗 SIMPLE BLOCKCHAIN TEST
 * 
 * 📋 PURPOSE: Quick verification of blockchain connectivity
 * 🎯 COVERAGE: Basic blockchain operations
 */

const { ethers } = require('ethers');

async function testBlockchain() {
  console.log('🧪 Testing Blockchain Connectivity...');
  
  try {
    // Connect to local blockchain
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Latest block number: ${blockNumber}`);
    
    // Get account balance
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      const balance = await provider.getBalance(accounts[0]);
      console.log(`✅ Account balance: ${ethers.formatEther(balance)} ETH`);
    }
    
    console.log('🎉 Blockchain test PASSED!');
    return true;
    
  } catch (error) {
    console.log(`❌ Blockchain test FAILED: ${error.message}`);
    return false;
  }
}

// Run test
testBlockchain().then(success => {
  process.exit(success ? 0 : 1);
}); 