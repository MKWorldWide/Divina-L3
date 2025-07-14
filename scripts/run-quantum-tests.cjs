#!/usr/bin/env node

/**
 * 🧪 QUANTUM TEST RUNNER
 * 
 * 📋 PURPOSE: Execute all critical system tests
 * 🎯 COVERAGE: Blockchain, Gaming, AI, Database, API
 * 🔄 UPDATE: Real-time test execution and reporting
 * 📊 OUTPUT: Comprehensive test results and metrics
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🎯 TEST CONFIGURATION
const TEST_CONFIG = {
  timeout: 300000, // 5 minutes
  retries: 3,
  parallel: false, // Run sequentially for stability
  outputDir: './test-results',
  logLevel: 'info'
};

// 📊 TEST METRICS
let testMetrics = {
  startTime: Date.now(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  testSuites: [],
  errors: []
};

// 🧪 TEST SUITES
const TEST_SUITES = [
  {
    name: 'Blockchain Critical Tests',
    pattern: 'test/blockchain-critical.test.ts',
    description: 'Smart contracts, wallet operations, transactions'
  },
  {
    name: 'Gaming Critical Tests', 
    pattern: 'test/gaming-critical.test.ts',
    description: 'Game creation, player management, real-time features'
  },
  {
    name: 'AI Critical Tests',
    pattern: 'test/ai-critical.test.ts', 
    description: 'NovaSanctum, AthenaMist, unified orchestration'
  }
];

// 🚀 TEST EXECUTION
async function runTestSuite(testSuite) {
  console.log(`\n🧪 Running ${testSuite.name}...`);
  console.log(`📋 ${testSuite.description}`);
  
  return new Promise((resolve, reject) => {
    // Use Vitest for better TypeScript and ESM support
    const testProcess = spawn('npx', [
      'vitest', 'run', testSuite.pattern, '--reporter=verbose'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    testProcess.on('close', (code) => {
      const result = {
        name: testSuite.name,
        pattern: testSuite.pattern,
        exitCode: code,
        output,
        errorOutput,
        success: code === 0,
        duration: Date.now() - testMetrics.startTime
      };

      if (code === 0) {
        console.log(`✅ ${testSuite.name} PASSED`);
        testMetrics.passedTests++;
      } else {
        console.log(`❌ ${testSuite.name} FAILED (exit code: ${code})`);
        testMetrics.failedTests++;
        testMetrics.errors.push({
          suite: testSuite.name,
          error: errorOutput,
          code
        });
      }

      testMetrics.testSuites.push(result);
      testMetrics.totalTests++;
      
      resolve(result);
    });

    testProcess.on('error', (error) => {
      console.log(`💥 ${testSuite.name} ERROR: ${error.message}`);
      testMetrics.errors.push({
        suite: testSuite.name,
        error: error.message,
        code: -1
      });
      reject(error);
    });
  });
}

// 📊 RESULTS REPORTING
function generateReport() {
  const endTime = Date.now();
  const totalDuration = endTime - testMetrics.startTime;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 QUANTUM TEST RESULTS REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n⏱️  Execution Time: ${totalDuration}ms`);
  console.log(`📈 Total Test Suites: ${testMetrics.totalTests}`);
  console.log(`✅ Passed: ${testMetrics.passedTests}`);
  console.log(`❌ Failed: ${testMetrics.failedTests}`);
  console.log(`⏭️  Skipped: ${testMetrics.skippedTests}`);
  
  const successRate = testMetrics.totalTests > 0 
    ? ((testMetrics.passedTests / testMetrics.totalTests) * 100).toFixed(2)
    : 0;
  
  console.log(`📊 Success Rate: ${successRate}%`);
  
  if (testMetrics.errors.length > 0) {
    console.log('\n🚨 ERRORS DETECTED:');
    testMetrics.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.suite}:`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Error: ${error.error.substring(0, 200)}...`);
    });
  }
  
  // Save detailed report
  const reportPath = path.join(TEST_CONFIG.outputDir, 'quantum-test-report.json');
  fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    metrics: testMetrics,
    config: TEST_CONFIG,
    summary: {
      totalDuration,
      successRate,
      status: testMetrics.failedTests === 0 ? 'PASSED' : 'FAILED'
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return testMetrics.failedTests === 0;
}

// 🚀 MAIN EXECUTION
async function runQuantumTests() {
  console.log('🚀 STARTING QUANTUM TEST SUITE');
  console.log('='.repeat(80));
  console.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`🔄 Retries: ${TEST_CONFIG.retries}`);
  console.log(`📊 Output Directory: ${TEST_CONFIG.outputDir}`);
  console.log('='.repeat(80));
  
  try {
    // Run test suites sequentially
    for (const testSuite of TEST_SUITES) {
      try {
        await runTestSuite(testSuite);
      } catch (error) {
        console.log(`💥 Failed to run ${testSuite.name}: ${error.message}`);
        testMetrics.failedTests++;
      }
    }
    
    // Generate final report
    const success = generateReport();
    
    if (success) {
      console.log('\n🎉 ALL QUANTUM TESTS PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 SOME QUANTUM TESTS FAILED!');
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`💥 QUANTUM TEST RUNNER ERROR: ${error.message}`);
    process.exit(1);
  }
}

// 🎯 ENTRY POINT
if (require.main === module) {
  runQuantumTests();
}

module.exports = { runQuantumTests, TEST_CONFIG }; 