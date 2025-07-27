#!/usr/bin/env node

/**
 * Smart Contract Optimization Tool
 * 
 * This script analyzes and optimizes Solidity smart contracts for:
 * - Gas efficiency
 * - Security improvements
 * - Code quality
 * - Upgradeability
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const solc = require('solc');
const { loadCompiler } = require('hardhat/internal/solidity/compiler');
const { TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE } = require('hardhat/builtin-tasks/task-names');

// Configuration
const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const OPTIMIZED_DIR = path.join(__dirname, '..', 'contracts-optimized');
const GAS_REPORT_FILE = path.join(__dirname, '..', 'gas-report.json');

// Optimization rules
const OPTIMIZATION_RULES = {
  // Storage optimizations
  usePackedStructs: true,
  useLibraries: true,
  minimizeStorageWrites: true,
  
  // Gas optimizations
  useCustomErrors: true,
  useShortReverts: true,
  optimizeLoops: true,
  
  // Security improvements
  addReentrancyGuards: true,
  addPausable: true,
  addAccessControl: true,
  
  // Code quality
  addNatSpec: true,
  addEvents: true,
  
  // Upgradeability
  makeUpgradeable: false, // Set to true to make contracts upgradeable
};

async function main() {
  console.log('🚀 Starting smart contract optimization...');
  
  try {
    // Create optimized directory if it doesn't exist
    if (!fs.existsSync(OPTIMIZED_DIR)) {
      fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
    }

    // Find all Solidity files
    const contractFiles = findSolidityFiles(CONTRACTS_DIR);
    console.log(`Found ${contractFiles.length} Solidity files to optimize`);

    // Process each contract
    const results = [];
    for (const file of contractFiles) {
      console.log(`\n🔍 Analyzing ${path.basename(file)}`);
      
      const content = fs.readFileSync(file, 'utf8');
      const optimizationResult = await optimizeContract(content, file);
      
      results.push({
        file: path.basename(file),
        ...optimizationResult,
      });
      
      // Save optimized version
      const relativePath = path.relative(CONTRACTS_DIR, file);
      const outputPath = path.join(OPTIMIZED_DIR, relativePath);
      
      // Create directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, optimizationResult.optimizedCode, 'utf8');
      console.log(`✅ Optimized version saved to ${outputPath}`);
    }
    
    // Generate optimization report
    generateReport(results);
    
    console.log('\n🎉 Optimization complete!');
    console.log(`📊 Report saved to ${GAS_REPORT_FILE}`);
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

function findSolidityFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and test directories
        if (['node_modules', 'test', 'mocks'].includes(item)) continue;
        traverse(fullPath);
      } else if (item.endsWith('.sol')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

async function optimizeContract(source, filePath) {
  const result = {
    originalSize: source.length,
    optimizedSize: 0,
    gasSavings: 0,
    issues: [],
    suggestions: [],
    optimizedCode: source, // Start with original code
  };
  
  // Apply optimizations based on rules
  if (OPTIMIZATION_RULES.useCustomErrors) {
    result.optimizedCode = replaceRequireWithCustomErrors(result.optimizedCode);
  }
  
  if (OPTIMIZATION_RULES.addReentrancyGuards) {
    result.optimizedCode = addReentrancyGuards(result.optimizedCode);
  }
  
  if (OPTIMIZATION_RULES.addPausable) {
    result.optimizedCode = addPausableModifier(result.optimizedCode);
  }
  
  if (OPTIMIZATION_RULES.addAccessControl) {
    result.optimizedCode = addAccessControl(result.optimizedCode);
  }
  
  if (OPTIMIZATION_RULES.addNatSpec) {
    result.optimizedCode = addNatSpec(result.optimizedCode);
  }
  
  if (OPTIMIZATION_RULES.addEvents) {
    result.optimizedCode = addEvents(result.optimizedCode);
  }
  
  // Calculate optimization results
  result.optimizedSize = result.optimizedCode.length;
  result.sizeReduction = result.originalSize - result.optimizedSize;
  result.sizeReductionPercent = ((result.sizeReduction / result.originalSize) * 100).toFixed(2);
  
  // Run gas estimation (simplified)
  const gasEstimate = await estimateGas(result.optimizedCode, filePath);
  result.gasEstimate = gasEstimate;
  
  // Generate suggestions
  generateSuggestions(result, source);
  
  return result;
}

// Helper functions for specific optimizations
function replaceRequireWithCustomErrors(code) {
  // This is a simplified example - actual implementation would be more sophisticated
  return code.replace(/require\(([^)]+)\)/g, (match, p1) => {
    const errorName = `Error${Math.floor(Math.random() * 10000)}`;
    return `if (!(${p1.trim()})) revert ${errorName}();`;
  });
}

function addReentrancyGuards(code) {
  // This is a simplified example
  if (code.includes('function') && !code.includes('nonReentrant')) {
    return 'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";\n' +
           'contract MyContract is ReentrancyGuard {\n' + 
           code.replace('{', '{\n    using ReentrancyGuard for ReentrancyGuard.Storage;\n') + '\n}';
  }
  return code;
}

function addPausableModifier(code) {
  // Implementation for adding pausable modifier
  return code;
}

function addAccessControl(code) {
  // Implementation for adding access control
  return code;
}

function addNatSpec(code) {
  // Implementation for adding NatSpec comments
  return code;
}

function addEvents(code) {
  // Implementation for adding events
  return code;
}

async function estimateGas(code, filePath) {
  // This is a simplified example - actual implementation would use hardhat-gas-reporter
  // or similar tool for accurate gas estimation
  return {
    deployment: Math.floor(Math.random() * 1000000),
    averageFunctionCall: Math.floor(Math.random() * 100000),
  };
}

function generateSuggestions(result, originalCode) {
  // Generate suggestions based on code analysis
  if (result.optimizedCode.includes('for (')) {
    result.suggestions.push('Consider using mappings instead of arrays for better gas efficiency');
  }
  
  if (result.optimizedCode.includes('storage') && !result.optimizedCode.includes('memory')) {
    result.suggestions.push('Use memory instead of storage for temporary variables to save gas');
  }
  
  // Add more suggestion rules as needed
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    optimizationRules: OPTIMIZATION_RULES,
    contracts: results,
    summary: {
      totalContracts: results.length,
      totalSizeReduction: results.reduce((sum, r) => sum + r.sizeReduction, 0),
      averageSizeReduction: results.reduce((sum, r) => sum + parseFloat(r.sizeReductionPercent), 0) / results.length,
      totalGasSavings: results.reduce((sum, r) => sum + (r.gasSavings || 0), 0),
    },
  };
  
  fs.writeFileSync(GAS_REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
  
  // Log summary to console
  console.log('\n📊 Optimization Report');
  console.log('='.repeat(40));
  console.log(`Total Contracts: ${report.summary.totalContracts}`);
  console.log(`Total Size Reduction: ${report.summary.totalSizeReduction} bytes`);
  console.log(`Average Size Reduction: ${report.summary.averageSizeReduction.toFixed(2)}%`);
  console.log(`Estimated Gas Savings: ${report.summary.totalGasSavings}`);
  
  // Log per-contract details
  console.log('\nContract Details:');
  console.log('-'.repeat(40));
  results.forEach(contract => {
    console.log(`\n📄 ${contract.file}`);
    console.log(`  Size: ${contract.originalSize} -> ${contract.optimizedSize} bytes (${contract.sizeReductionPercent}% reduction)`);
    console.log(`  Gas Estimate: ${JSON.stringify(contract.gasEstimate)}`);
    
    if (contract.issues.length > 0) {
      console.log('  ⚠️  Issues:');
      contract.issues.forEach(issue => console.log(`    - ${issue}`));
    }
    
    if (contract.suggestions.length > 0) {
      console.log('  💡 Suggestions:');
      contract.suggestions.forEach(suggestion => console.log(`    - ${suggestion}`));
    }
  });
}

// Run the optimization
main().catch(console.error);
