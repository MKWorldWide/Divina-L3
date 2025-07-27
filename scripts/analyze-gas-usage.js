#!/usr/bin/env node

/**
 * Gas Usage Analyzer for Smart Contracts
 * 
 * This script analyzes gas usage of smart contract functions
 * and provides optimization recommendations.
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const colors = require('colors');

// Configuration
const GAS_REPORT_FILE = path.join(__dirname, '..', 'gas-report.json');
const OPTIMIZATION_REPORT_FILE = path.join(__dirname, '..', 'optimization-report.md');

// Gas costs for reference (in gas units)
const GAS_COSTS = {
  SLOAD: 800,
  SSTORE: 20000,
  BALANCE: 700,
  EXTCODESIZE: 700,
  EXTCODEHASH: 400,
  EXTCODECOPY: 2600,
  CALL: 700,
  CALLCODE: 700,
  DELEGATECALL: 700,
  STATICCALL: 700,
  SELFDESTRUCT: 5000,
  CREATE: 32000,
  CREATE2: 32000,
  TX_BASE: 21000,
  TX_DATA_ZERO: 4,
  TX_DATA_NONZERO: 16,
  LOG_TOPIC: 375,
  LOG_DATA: 8,
};

// Known gas optimization patterns
const OPTIMIZATION_PATTERNS = [
  {
    name: 'Use Custom Errors',
    description: 'Replace require statements with custom errors to save gas on revert strings',
    pattern: /require\(([^)]+)\)/g,
    fix: (match, condition) => `if (!${condition.trim()}) revert CustomError();`,
    gasSavings: 20000, // Approximate gas saved per require
  },
  {
    name: 'Cache Array Length',
    description: 'Cache array length in for loops to avoid reading it on each iteration',
    pattern: /for\s*\(\s*uint\s+\w+\s*=\s*0;\s*\w+\s*<\s*(\w+)\.length;\s*\w+\+\+\s*\)/g,
    fix: (match, arrayName) => `uint256 ${arrayName}Length = ${arrayName}.length;\n        for (uint256 i = 0; i < ${arrayName}Length; i++)`,
    gasSavings: 100, // Per iteration
  },
  // Add more optimization patterns as needed
];

async function main() {
  console.log('🔍 Analyzing gas usage...');
  
  try {
    // Get all contract artifacts
    const contractNames = await getContractNames();
    const analysisResults = [];
    
    // Analyze each contract
    for (const contractName of contractNames) {
      console.log(`\n📄 Analyzing ${contractName}...`);
      const result = await analyzeContract(contractName);
      analysisResults.push(result);
    }
    
    // Generate reports
    await generateGasReport(analysisResults);
    await generateOptimizationReport(analysisResults);
    
    console.log('\n🎉 Gas analysis complete!');
    console.log(`📊 Gas report saved to: ${GAS_REPORT_FILE}`);
    console.log(`💡 Optimization report saved to: ${OPTIMIZATION_REPORT_FILE}`);
    
  } catch (error) {
    console.error('❌ Error during gas analysis:', error);
    process.exit(1);
  }
}

async function getContractNames() {
  // This is a simplified example - in a real implementation, you would
  // scan the artifacts directory or use Hardhat's built-in functions
  return [
    'GameDinToken',
    'GameDinL3Bridge',
    'GamingCore',
    'AIOracle',
  ];
}

async function analyzeContract(contractName) {
  const Contract = await ethers.getContractFactory(contractName);
  const contract = await Contract.deploy();
  await contract.deployed();
  
  const functions = Object.keys(Contract.interface.functions);
  const analysis = {
    name: contractName,
    deploymentGas: (await contract.deployTransaction.wait()).gasUsed.toString(),
    functions: [],
    issues: [],
    optimizations: [],
  };
  
  // Analyze each function
  for (const func of functions) {
    if (func === '') continue; // Skip fallback/receive
    
    try {
      const funcAnalysis = await analyzeFunction(contract, func);
      analysis.functions.push(funcAnalysis);
      
      // Check for potential optimizations
      const optimizations = findOptimizations(funcAnalysis);
      analysis.optimizations.push(...optimizations);
      
    } catch (error) {
      console.warn(`  ⚠️  Could not analyze function ${func}:`, error.message);
    }
  }
  
  return analysis;
}

async function analyzeFunction(contract, funcSignature) {
  console.log(`  🔍 Analyzing function: ${funcSignature}`);
  
  // This is a simplified example - in a real implementation, you would:
  // 1. Estimate gas for the function with different inputs
  // 2. Analyze the bytecode for gas patterns
  // 3. Check for common gas optimization opportunities
  
  const funcName = funcSignature.split('(')[0];
  const func = contract.interface.getFunction(funcName);
  
  // Skip functions that require parameters for now
  if (func.inputs.length > 0) {
    return {
      name: funcName,
      signature: funcSignature,
      gasEstimate: 'N/A - requires parameters',
      optimizations: [],
    };
  }
  
  // Estimate gas for the function
  let gasEstimate;
  try {
    const tx = await contract[funcName]();
    const receipt = await tx.wait();
    gasEstimate = receipt.gasUsed.toString();
  } catch (error) {
    // If the function is not callable without parameters
    gasEstimate = 'N/A - call failed';
  }
  
  return {
    name: funcName,
    signature: funcSignature,
    gasEstimate,
    optimizations: [],
  };
}

function findOptimizations(funcAnalysis) {
  const optimizations = [];
  
  // This is a simplified example - in a real implementation, you would:
  // 1. Analyze the function's bytecode
  // 2. Look for known gas-inefficient patterns
  // 3. Check for storage access patterns
  
  // Example optimization check
  if (funcAnalysis.signature.includes('[]')) {
    optimizations.push({
      type: 'array-iteration',
      description: 'Consider using mappings instead of arrays for better gas efficiency',
      potentialSavings: '100-1000 gas per iteration',
    });
  }
  
  return optimizations;
}

async function generateGasReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    blockNumber: await ethers.provider.getBlockNumber(),
    contracts: results.map(contract => ({
      name: contract.name,
      deploymentGas: contract.deploymentGas,
      functions: contract.functions.map(f => ({
        name: f.name,
        signature: f.signature,
        gasEstimate: f.gasEstimate,
      })),
    })),
  };
  
  fs.writeFileSync(GAS_REPORT_FILE, JSON.stringify(report, null, 2));
  
  // Print summary to console
  console.log('\n📊 Gas Usage Summary');
  console.log('='.repeat(80));
  
  const table = new Table({
    head: ['Contract', 'Function', 'Gas Estimate'],
    style: { head: ['cyan'] },
  });
  
  for (const contract of results) {
    for (const func of contract.functions) {
      table.push([
        contract.name,
        func.signature,
        func.gasEstimate,
      ]);
    }
    
    // Add deployment cost
    table.push([
      contract.name,
      'DEPLOYMENT',
      contract.deploymentGas,
    ]);
    
    // Add separator between contracts
    if (contract !== results[results.length - 1]) {
      table.push([{ colSpan: 3, content: '' }]);
    }
  }
  
  console.log(table.toString());
}

async function generateOptimizationReport(results) {
  let markdown = `# Smart Contract Optimization Report\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Summary
  markdown += '## 📊 Summary\n\n';
  markdown += `- **Total Contracts Analyzed**: ${results.length}\n`;
  
  const totalOptimizations = results.reduce((sum, r) => sum + (r.optimizations?.length || 0), 0);
  markdown += `- **Total Optimization Opportunities**: ${totalOptimizations}\n\n`;
  
  // Per-contract analysis
  markdown += '## 📋 Contract Analysis\n\n';
  
  for (const contract of results) {
    markdown += `### ${contract.name}\n`;
    markdown += `- **Deployment Gas**: ${contract.deploymentGas}\n`;
    
    if (contract.optimizations?.length > 0) {
      markdown += '\n#### 🚀 Optimization Opportunities\n\n';
      
      for (const opt of contract.optimizations) {
        markdown += `##### ${opt.type}\n`;
        markdown += `- **Description**: ${opt.description}\n`;
        markdown += `- **Potential Savings**: ${opt.potentialSavings || 'Varies'}\n\n`;
      }
    } else {
      markdown += '\nNo optimization opportunities found.\n\n';
    }
    
    mark += '---\n\n';
  }
  
  // General optimization recommendations
  markdown += '## 💡 General Optimization Recommendations\n\n';
  markdown += '1. **Use Custom Errors**: Replace require statements with custom errors to save gas on revert strings\n';
  markdown += '2. **Cache Storage Variables**: Cache frequently accessed storage variables in memory\n';
  markdown += '3. **Use Mappings Over Arrays**: Mappings are more gas-efficient than arrays for lookups\n';
  markdown += '4. **Minimize Storage Writes**: Batch storage writes to minimize SSTORE operations\n';
  markdown += '5. **Use View/Pure Functions**: Mark functions as view or pure when they don\'t modify state\n';
  
  fs.writeFileSync(OPTIMIZATION_REPORT_FILE, markdown);
}

// Run the analysis
main().catch(console.error);
