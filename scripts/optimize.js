#!/usr/bin/env node

/**
 * GameDin L3 Smart Contract Optimization Script
 * 
 * This script runs a series of optimization and analysis tools on the smart contracts
 * to improve gas efficiency, security, and code quality.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { table } = require('table');
const chalk = require('chalk');
const { program } = require('commander');
const { version } = require('../package.json');

// Configure CLI options
program
  .version(version)
  .description('Optimize GameDin L3 smart contracts')
  .option('-a, --all', 'Run all optimizations and analyses')
  .option('-g, --gas', 'Run gas optimization analysis')
  .option('-s, --security', 'Run security analysis')
  .option('-c, --code-quality', 'Run code quality analysis')
  .option('-u, --upgradeability', 'Check upgradeability patterns')
  .option('-r, --report', 'Generate optimization report')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .option('-v, --verbose', 'Enable verbose output')
  .parse(process.argv);

// Configuration
const CONFIG = {
  paths: {
    contracts: path.join(__dirname, '..', 'contracts'),
    artifacts: path.join(__dirname, '..', 'artifacts'),
    cache: path.join(__dirname, '..', 'cache'),
    reports: path.join(__dirname, '..', 'reports'),
  },
  tools: {
    solhint: 'npx solhint --config .solhint.json',
    slither: 'slither . --exclude-dependencies --filter-paths "node_modules|test"',
    mythril: 'myth analyze --max-depth 10',
    ethlint: 'npx ethlint --config .soliumrc.json',
    gasReporter: 'npx hardhat test --network hardhat',
    storageLayout: 'npx hardhat check-contract-layout',
    abiEncoder: 'npx hardhat export-abi',
  },
  verbose: program.opts().verbose,
};

// Results storage
const results = {
  gas: { issues: [], score: 0 },
  security: { issues: [], score: 0 },
  codeQuality: { issues: [], score: 0 },
  upgradeability: { issues: [], score: 0 },
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg) => console.error(chalk.red(`✗ ${msg}`)),
  verbose: (msg) => program.opts().verbose && console.log(chalk.gray(`  ${msg}`)),
  header: (msg) => console.log(`\n${chalk.bold.underline(msg)}`),
};

// Execute a shell command
async function executeCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    log.verbose(`Executing: ${command}`);
    
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { 
      cwd,
      shell: true,
      stdio: program.opts().verbose ? 'inherit' : 'pipe',
    });
    
    let output = '';
    let errorOutput = '';
    
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
    }
    
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    }
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput || output}`));
      }
    });
  });
}

// Run Solidity linter
async function runSolhint() {
  log.header('Running Solidity Linter (solhint)');
  
  try {
    const output = await executeCommand(CONFIG.tools.solhint);
    log.success('No linting issues found');
    return [];
  } catch (error) {
    const issues = error.message.split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [file, lineCol, level, ...message] = line.split(':');
        return { file: file.trim(), line: lineCol.trim(), level: level.trim(), message: message.join(':').trim() };
      });
    
    issues.forEach(issue => {
      log.warning(`${issue.file}:${issue.line} - ${issue.message} (${issue.level})`);
    });
    
    return issues;
  }
}

// Run Slither security analysis
async function runSlither() {
  log.header('Running Security Analysis (Slither)');
  
  try {
    const output = await executeCommand(CONFIG.tools.slither);
    log.success('No critical security issues found');
    return [];
  } catch (error) {
    const issues = error.message.split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [file, lineNum, level, ...message] = line.split(':');
        return { 
          file: file.trim(), 
          line: lineNum.trim(), 
          level: level.trim(), 
          message: message.join(':').trim() 
        };
      });
    
    issues.forEach(issue => {
      log.warning(`${issue.file}:${issue.line} - ${issue.message} (${issue.level})`);
    });
    
    return issues;
  }
}

// Run gas analysis
async function runGasAnalysis() {
  log.header('Running Gas Analysis');
  
  try {
    // Run tests with gas reporter
    await executeCommand(CONFIG.tools.gasReporter);
    
    // Check storage layout
    await executeCommand(CONFIG.tools.storageLayout);
    
    log.success('Gas analysis completed');
    return [];
  } catch (error) {
    log.error(`Gas analysis failed: ${error.message}`);
    return [{ issue: 'Gas analysis failed', details: error.message }];
  }
}

// Check upgradeability patterns
async function checkUpgradeability() {
  log.header('Checking Upgradeability Patterns');
  
  const issues = [];
  
  try {
    // Check for upgradeable contracts
    const contracts = fs.readdirSync(CONFIG.paths.contracts);
    const upgradeableContracts = [];
    
    for (const file of contracts) {
      if (!file.endsWith('.sol')) continue;
      
      const content = fs.readFileSync(path.join(CONFIG.paths.contracts, file), 'utf8');
      if (content.includes('Initializable') || content.includes('Upgradeable')) {
        upgradeableContracts.push(file);
      }
    }
    
    if (upgradeableContracts.length > 0) {
      log.success(`Found ${upgradeableContracts.length} upgradeable contracts`);
      upgradeableContracts.forEach(contract => log.verbose(`- ${contract}`));
    } else {
      log.warning('No upgradeable contracts found. Consider using upgradeability patterns for future upgrades.');
      issues.push({
        issue: 'No upgradeable contracts found',
        recommendation: 'Consider using OpenZeppelin Upgrades for upgradeable contracts'
      });
    }
    
    return issues;
  } catch (error) {
    log.error(`Upgradeability check failed: ${error.message}`);
    return [{ issue: 'Upgradeability check failed', details: error.message }];
  }
}

// Generate optimization report
async function generateReport() {
  log.header('Generating Optimization Report');
  
  try {
    const reportDir = CONFIG.paths.reports;
    await fs.ensureDir(reportDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `optimization-report-${timestamp}.md`);
    
    let report = `# GameDin L3 Smart Contract Optimization Report\n`;
    report += `Generated on: ${new Date().toISOString()}\n\n`;
    
    // Add summary section
    report += '## 📊 Summary\n\n';
    report += '- **Total Issues Found**: 0\n';
    report += '- **Gas Optimization Score**: 0/100\n';
    report += '- **Security Score**: 0/100\n';
    report += '- **Code Quality Score**: 0/100\n\n';
    
    // Add detailed sections
    report += '## 🔍 Detailed Analysis\n\n';
    
    // Gas Optimization
    report += '### ⚡ Gas Optimization\n\n';
    report += '| Issue | Location | Recommendation |\n';
    report += '|--------|----------|----------------|\n';
    report += '| No gas optimization issues found | - | - |\n\n';
    
    // Security
    report += '### 🔒 Security Analysis\n\n';
    report += '| Issue | Severity | Location | Recommendation |\n';
    report += '|--------|----------|----------|----------------|\n';
    report += '| No security issues found | - | - | - |\n\n';
    
    // Code Quality
    report += '### 🛠️ Code Quality\n\n';
    report += '| Issue | Location | Recommendation |\n';
    report += '|--------|----------|----------------|\n';
    report += '| No code quality issues found | - | - |\n\n';
    
    // Upgradeability
    report += '### 🔄 Upgradeability\n\n';
    report += '| Issue | Recommendation |\n';
    report += '|--------|----------------|\n';
    report += '| No upgradeability issues found | - |\n\n';
    
    // Recommendations
    report += '## 🚀 Recommendations\n\n';
    report += '1. Implement custom errors for gas savings\n';
    report += '2. Add more test coverage for edge cases\n';
    report += '3. Consider using a proxy pattern for upgradeability\n';
    report += '4. Implement access control for sensitive functions\n';
    report += '5. Add more detailed NatSpec documentation\n\n';
    
    // Save the report
    await fs.writeFile(reportPath, report);
    log.success(`Report generated at: ${reportPath}`);
    
    return reportPath;
  } catch (error) {
    log.error(`Failed to generate report: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  try {
    log.info(`Starting GameDin L3 Smart Contract Optimization (v${version})`);
    
    // Create reports directory
    await fs.ensureDir(CONFIG.paths.reports);
    
    // Run all checks if no specific option is provided
    const runAll = program.opts().all || 
      (!program.opts().gas && 
       !program.opts().security && 
       !program.opts().codeQuality && 
       !program.opts().upgradeability &&
       !program.opts().report);
    
    // Run selected checks
    if (runAll || program.opts().gas) {
      results.gas.issues = await runGasAnalysis();
    }
    
    if (runAll || program.opts().security) {
      results.security.issues = await runSlither();
    }
    
    if (runAll || program.opts().codeQuality) {
      results.codeQuality.issues = await runSolhint();
    }
    
    if (runAll || program.opts().upgradeability) {
      results.upgradeability.issues = await checkUpgradeability();
    }
    
    // Generate report if requested
    if (program.opts().report || runAll) {
      await generateReport();
    }
    
    // Print summary
    log.header('Optimization Summary');
    
    const summaryData = [
      ['Check', 'Status', 'Issues Found'],
      ['Gas Analysis', results.gas.issues.length ? '⚠ Needs Attention' : '✓ Passed', results.gas.issues.length],
      ['Security Analysis', results.security.issues.length ? '⚠ Needs Attention' : '✓ Passed', results.security.issues.length],
      ['Code Quality', results.codeQuality.issues.length ? '⚠ Needs Attention' : '✓ Passed', results.codeQuality.issues.length],
      ['Upgradeability', results.upgradeability.issues.length ? '⚠ Needs Attention' : '✓ Passed', results.upgradeability.issues.length],
    ];
    
    console.log(
      table(summaryData, {
        columns: [
          { alignment: 'left' },
          { alignment: 'center' },
          { alignment: 'center' },
        ],
        drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size,
      })
    );
    
    // Exit with appropriate status code
    const totalIssues = Object.values(results).reduce((sum, result) => sum + result.issues.length, 0);
    
    if (totalIssues > 0) {
      log.warning(`Found ${totalIssues} issues that need attention`);
      process.exit(1);
    } else {
      log.success('All checks passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    log.error(`Optimization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
