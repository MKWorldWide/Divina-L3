#!/usr/bin/env node

/**
 * 🌌 Celestial Genesis Collective - TDD Test Runner
 * 
 * This script implements Test-Driven Development principles:
 * - Red: Run failing tests first
 * - Green: Implement minimal code to pass tests
 * - Refactor: Improve code while maintaining test coverage
 * 
 * The runner integrates with the Celestial Genesis Collective governance
 * to ensure collective intelligence and emergent behavior patterns.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// TDD CONFIGURATION
// ============================================================================

const TDD_CONFIG = {
  // Test phases following Red-Green-Refactor cycle
  phases: {
    RED: {
      name: '🔴 RED - Write Failing Tests',
      description: 'Write tests that fail initially',
      testPattern: '**/*.red.test.ts',
      expectedOutcome: 'FAILURE',
      color: '\x1b[31m', // Red
    },
    GREEN: {
      name: '🟢 GREEN - Make Tests Pass',
      description: 'Implement minimal code to pass tests',
      testPattern: '**/*.green.test.ts',
      expectedOutcome: 'SUCCESS',
      color: '\x1b[32m', // Green
    },
    REFACTOR: {
      name: '🔄 REFACTOR - Improve Code',
      description: 'Refactor while maintaining test coverage',
      testPattern: '**/*.refactor.test.ts',
      expectedOutcome: 'SUCCESS',
      color: '\x1b[33m', // Yellow
    },
    INTEGRATION: {
      name: '🔗 INTEGRATION - System Tests',
      description: 'Test system integration and collective behavior',
      testPattern: '**/*.integration.test.ts',
      expectedOutcome: 'SUCCESS',
      color: '\x1b[36m', // Cyan
    },
    E2E: {
      name: '🌐 E2E - End-to-End Tests',
      description: 'Test complete user workflows',
      testPattern: '**/*.e2e.test.ts',
      expectedOutcome: 'SUCCESS',
      color: '\x1b[35m', // Magenta
    }
  },
  
  // Collective intelligence settings
  collective: {
    minTestCoverage: 90,
    maxTestDuration: 300000, // 5 minutes
    retryAttempts: 3,
    parallelExecution: true,
    emergentBehaviorTracking: true,
  },
  
  // Output configuration
  output: {
    directory: './test-results',
    detailedReports: true,
    coverageReports: true,
    performanceMetrics: true,
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Logs messages with TDD phase colors
 */
const log = (phase, message) => {
  const color = TDD_CONFIG.phases[phase]?.color || '\x1b[0m';
  const reset = '\x1b[0m';
  console.log(`${color}${message}${reset}`);
};

/**
 * Logs collective intelligence messages
 */
const logCollective = (message) => {
  const color = '\x1b[34m'; // Blue
  const reset = '\x1b[0m';
  console.log(`${color}🌌 ${message}${reset}`);
};

/**
 * Creates test result directory
 */
const createTestDirectory = () => {
  const dir = TDD_CONFIG.output.directory;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Generates unique test run ID
 */
const generateTestRunId = () => {
  return `tdd-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validates immutable framework compliance
 */
const validateImmutableCompliance = () => {
  logCollective('Validating immutable framework compliance...');
  
  try {
    // Run TypeScript strict mode check
    execSync('npx tsc --noEmit --strict --noImplicitAny --strictNullChecks', {
      stdio: 'pipe'
    });
    logCollective('✅ Immutable framework validation passed');
    return true;
  } catch (error) {
    logCollective('❌ Immutable framework validation failed');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
};

/**
 * Runs tests for a specific phase
 */
const runTestPhase = async (phase, testRunId) => {
  const phaseConfig = TDD_CONFIG.phases[phase];
  if (!phaseConfig) {
    throw new Error(`Unknown test phase: ${phase}`);
  }
  
  log(phase, `\n${phaseConfig.name}`);
  log(phase, `📋 ${phaseConfig.description}`);
  
  const startTime = Date.now();
  const results = {
    phase,
    testRunId,
    startTime,
    endTime: null,
    duration: 0,
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    coverage: 0,
    performance: {},
    collectiveMetrics: {}
  };
  
  try {
    // Find test files for this phase
    const testFiles = findTestFiles(phaseConfig.testPattern);
    
    if (testFiles.length === 0) {
      log(phase, `⚠️  No test files found for pattern: ${phaseConfig.testPattern}`);
      results.skipped = 1;
      return results;
    }
    
    log(phase, `🧪 Running ${testFiles.length} test files...`);
    
    // Run tests with appropriate configuration
    const testResults = await runTests(testFiles, phase);
    
    // Process results
    results.tests = testResults.tests;
    results.passed = testResults.passed;
    results.failed = testResults.failed;
    results.skipped = testResults.skipped;
    results.coverage = testResults.coverage || 0;
    results.performance = testResults.performance || {};
    
    // Validate expected outcome
    const isSuccess = results.failed === 0;
    const expectedSuccess = phaseConfig.expectedOutcome === 'SUCCESS';
    
    if (isSuccess === expectedSuccess) {
      log(phase, `✅ Phase ${phase} completed as expected`);
    } else {
      log(phase, `❌ Phase ${phase} did not meet expected outcome`);
      if (phase === 'RED' && isSuccess) {
        log(phase, `⚠️  RED phase should have failing tests - consider writing more challenging tests`);
      }
    }
    
  } catch (error) {
    log(phase, `💥 Phase ${phase} failed with error: ${error.message}`);
    results.failed = 1;
    results.error = error.message;
  }
  
  results.endTime = Date.now();
  results.duration = results.endTime - startTime;
  
  return results;
};

/**
 * Finds test files matching a pattern
 */
const findTestFiles = (pattern) => {
  const testDirs = ['test/unit', 'test/integration', 'test/e2e'];
  const files = [];
  
  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      const dirFiles = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of dirFiles) {
        if (file.isFile() && file.name.endsWith('.test.ts')) {
          // Simple pattern matching - could be enhanced with glob
          if (pattern.includes('*') || file.name.includes(pattern.replace('**/*', ''))) {
            files.push(path.join(dir, file.name));
          }
        }
      }
    }
  }
  
  return files;
};

/**
 * Runs tests using Hardhat test runner
 */
const runTests = (testFiles, phase) => {
  return new Promise((resolve, reject) => {
    const args = [
      'test',
      ...testFiles,
      '--timeout', TDD_CONFIG.collective.maxTestDuration.toString(),
      '--reporter', 'spec'
    ];
    
    if (TDD_CONFIG.output.coverageReports) {
      args.push('--coverage');
    }
    
    const testProcess = spawn('npx', ['hardhat', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, TDD_PHASE: phase }
    });
    
    let stdout = '';
    let stderr = '';
    
    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    testProcess.on('close', (code) => {
      const results = parseTestResults(stdout, stderr, code, phase);
      resolve(results);
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Parses test output to extract results
 */
const parseTestResults = (stdout, stderr, code, phase) => {
  const results = {
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    coverage: 0,
    performance: {}
  };
  
  // Parse Mocha test results
  const testMatches = stdout.match(/(\d+) passing|(\d+) failing|(\d+) pending/g);
  if (testMatches) {
    testMatches.forEach(match => {
      const count = parseInt(match.match(/\d+/)[0]);
      if (match.includes('passing')) results.passed = count;
      if (match.includes('failing')) results.failed = count;
      if (match.includes('pending')) results.skipped = count;
    });
  }
  
  // Parse coverage if available
  const coverageMatch = stdout.match(/Statements\s+:\s+(\d+\.?\d*)%/);
  if (coverageMatch) {
    results.coverage = parseFloat(coverageMatch[1]);
  }
  
  // Extract performance metrics
  const durationMatch = stdout.match(/Duration:\s+(\d+\.?\d*)ms/);
  if (durationMatch) {
    results.performance.duration = parseFloat(durationMatch[1]);
  }
  
  return results;
};

/**
 * Tracks emergent behavior patterns
 */
const trackEmergentBehavior = (testResults) => {
  if (!TDD_CONFIG.collective.emergentBehaviorTracking) {
    return;
  }
  
  logCollective('🔍 Analyzing emergent behavior patterns...');
  
  const patterns = {
    testSuccessRate: (testResults.passed / (testResults.passed + testResults.failed)) * 100,
    averageCoverage: testResults.coverage,
    performanceTrend: testResults.performance.duration || 0,
    collectiveStability: calculateCollectiveStability(testResults)
  };
  
  logCollective(`📊 Collective Intelligence Metrics:`);
  logCollective(`   Success Rate: ${patterns.testSuccessRate.toFixed(2)}%`);
  logCollective(`   Coverage: ${patterns.averageCoverage.toFixed(2)}%`);
  logCollective(`   Performance: ${patterns.performanceTrend}ms`);
  logCollective(`   Stability: ${patterns.collectiveStability.toFixed(2)}`);
  
  return patterns;
};

/**
 * Calculates collective stability based on test results
 */
const calculateCollectiveStability = (results) => {
  const factors = [
    results.passed / Math.max(results.passed + results.failed, 1), // Success rate
    results.coverage / 100, // Coverage ratio
    Math.min(results.performance.duration || 0, 1000) / 1000 // Performance ratio
  ];
  
  return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
};

/**
 * Generates comprehensive test report
 */
const generateTestReport = (allResults, testRunId) => {
  const report = {
    testRunId,
    timestamp: new Date().toISOString(),
    summary: {
      totalPhases: Object.keys(TDD_CONFIG.phases).length,
      completedPhases: allResults.length,
      totalTests: allResults.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
      totalPassed: allResults.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: allResults.reduce((sum, r) => sum + r.failed, 0),
      totalSkipped: allResults.reduce((sum, r) => sum + r.skipped, 0),
      averageCoverage: allResults.reduce((sum, r) => sum + r.coverage, 0) / allResults.length,
      totalDuration: allResults.reduce((sum, r) => sum + r.duration, 0)
    },
    phases: allResults,
    collectiveIntelligence: {
      emergentBehaviors: allResults.map(r => r.collectiveMetrics).filter(Boolean),
      overallStability: calculateCollectiveStability({
        passed: allResults.reduce((sum, r) => sum + r.passed, 0),
        failed: allResults.reduce((sum, r) => sum + r.failed, 0),
        coverage: allResults.reduce((sum, r) => sum + r.coverage, 0) / allResults.length,
        performance: { duration: allResults.reduce((sum, r) => sum + (r.performance.duration || 0), 0) }
      })
    },
    recommendations: generateRecommendations(allResults)
  };
  
  // Save report to file
  const reportPath = path.join(TDD_CONFIG.output.directory, `tdd-report-${testRunId}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
};

/**
 * Generates recommendations based on test results
 */
const generateRecommendations = (results) => {
  const recommendations = [];
  
  const totalTests = results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const successRate = (totalPassed / totalTests) * 100;
  const averageCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length;
  
  if (successRate < 80) {
    recommendations.push('🔴 Improve test success rate - focus on fixing failing tests');
  }
  
  if (averageCoverage < TDD_CONFIG.collective.minTestCoverage) {
    recommendations.push(`📊 Increase test coverage to at least ${TDD_CONFIG.collective.minTestCoverage}%`);
  }
  
  if (results.some(r => r.failed > 0)) {
    recommendations.push('🛠️  Address failing tests before proceeding to next phase');
  }
  
  if (results.some(r => r.skipped > 0)) {
    recommendations.push('⏭️  Implement skipped tests to improve coverage');
  }
  
  return recommendations;
};

/**
 * Main TDD test runner function
 */
const runTDDTestSuite = async () => {
  console.log('\n🌌 CELESTIAL GENESIS COLLECTIVE - TDD TEST RUNNER');
  console.log('=' .repeat(60));
  
  const testRunId = generateTestRunId();
  logCollective(`🚀 Starting TDD test run: ${testRunId}`);
  
  // Create output directory
  createTestDirectory();
  
  // Validate immutable framework compliance
  if (!validateImmutableCompliance()) {
    console.error('❌ Immutable framework validation failed. Exiting.');
    process.exit(1);
  }
  
  const allResults = [];
  const phases = Object.keys(TDD_CONFIG.phases);
  
  for (const phase of phases) {
    try {
      const results = await runTestPhase(phase, testRunId);
      
      // Track emergent behavior
      results.collectiveMetrics = trackEmergentBehavior(results);
      
      allResults.push(results);
      
      // Check if we should continue based on phase outcome
      if (phase === 'RED' && results.failed === 0) {
        logCollective('⚠️  RED phase has no failing tests - consider writing more challenging tests');
      }
      
      if (phase === 'GREEN' && results.failed > 0) {
        logCollective('❌ GREEN phase has failing tests - fix implementation before proceeding');
        break;
      }
      
    } catch (error) {
      logCollective(`💥 Phase ${phase} failed: ${error.message}`);
      allResults.push({
        phase,
        testRunId,
        error: error.message,
        failed: 1
      });
      break;
    }
  }
  
  // Generate comprehensive report
  const report = generateTestReport(allResults, testRunId);
  
  // Display summary
  console.log('\n📊 TDD TEST RUN SUMMARY');
  console.log('=' .repeat(40));
  console.log(`Test Run ID: ${testRunId}`);
  console.log(`Total Phases: ${report.summary.completedPhases}/${report.summary.totalPhases}`);
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.totalPassed}`);
  console.log(`Failed: ${report.summary.totalFailed}`);
  console.log(`Skipped: ${report.summary.totalSkipped}`);
  console.log(`Average Coverage: ${report.summary.averageCoverage.toFixed(2)}%`);
  console.log(`Total Duration: ${report.summary.totalDuration}ms`);
  console.log(`Collective Stability: ${report.collectiveIntelligence.overallStability.toFixed(2)}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  console.log(`\n📄 Detailed report saved to: ${TDD_CONFIG.output.directory}/tdd-report-${testRunId}.json`);
  
  // Exit with appropriate code
  const hasFailures = report.summary.totalFailed > 0;
  process.exit(hasFailures ? 1 : 0);
};

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  runTDDTestSuite().catch(error => {
    console.error('💥 TDD test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTDDTestSuite,
  TDD_CONFIG,
  validateImmutableCompliance,
  trackEmergentBehavior
}; 