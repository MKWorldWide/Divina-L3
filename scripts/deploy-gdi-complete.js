// Quantum-detailed ESM migration for deployment orchestrator
import { deployGDIMetadata } from './deploy-metadata.js';
import { createRaydiumPool, addInitialLiquidity } from './create-raydium-pool.js';
import { revokeAuthorities, checkAuthorityStatus } from './revoke-authorities.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Complete GDI Token Deployment Orchestrator
 * 
 * This script orchestrates the complete GDI token deployment process:
 * 1. Deploy metadata to Arweave and set on-chain metadata
 * 2. Create Raydium USDC/GDI liquidity pool
 * 3. Add initial liquidity to the pool
 * 4. Revoke authorities for security
 * 5. Verify all deployments
 * 
 * Usage: node scripts/deploy-gdi-complete.js [--skip-metadata] [--skip-pool] [--skip-revoke]
 */

async function deployGDIComplete() {
    const startTime = Date.now();
    const deploymentLog = {
        startTime: new Date().toISOString(),
        steps: [],
        errors: [],
        endTime: null,
        success: false
    };
    
    try {
        console.log('🚀 Starting Complete GDI Token Deployment...');
        console.log('=' .repeat(60));
        
        const args = process.argv.slice(2);
        const skipMetadata = args.includes('--skip-metadata');
        const skipPool = args.includes('--skip-pool');
        const skipRevoke = args.includes('--skip-revoke');
        
        console.log('📋 Deployment Configuration:');
        console.log('   Skip Metadata:', skipMetadata ? '✅' : '❌');
        console.log('   Skip Pool Creation:', skipPool ? '✅' : '❌');
        console.log('   Skip Authority Revocation:', skipRevoke ? '✅' : '❌');
        console.log('');
        
        // Step 1: Deploy Metadata
        if (!skipMetadata) {
            console.log('📤 STEP 1: Deploying GDI Token Metadata...');
            console.log('-'.repeat(40));
            
            try {
                await deployGDIMetadata();
                deploymentLog.steps.push({
                    step: 'metadata_deployment',
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Metadata deployment completed successfully!\n');
            } catch (error) {
                console.error('❌ Metadata deployment failed:', error.message);
                deploymentLog.steps.push({
                    step: 'metadata_deployment',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                deploymentLog.errors.push({
                    step: 'metadata_deployment',
                    error: error.message
                });
            }
        } else {
            console.log('⏭️  Skipping metadata deployment...\n');
            deploymentLog.steps.push({
                step: 'metadata_deployment',
                status: 'skipped',
                timestamp: new Date().toISOString()
            });
        }
        
        // Step 2: Create Raydium Pool
        if (!skipPool) {
            console.log('🏊 STEP 2: Creating Raydium USDC/GDI Pool...');
            console.log('-'.repeat(40));
            
            try {
                await createRaydiumPool();
                deploymentLog.steps.push({
                    step: 'pool_creation',
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Pool creation completed successfully!\n');
                
                // Add initial liquidity if pool was created successfully
                console.log('💧 Adding initial liquidity to pool...');
                console.log('-'.repeat(40));
                
                // Load pool info to get pool ID
                const poolInfoPath = path.join(__dirname, '../raydium-pool-info.json');
                if (fs.existsSync(poolInfoPath)) {
                    const poolInfo = JSON.parse(fs.readFileSync(poolInfoPath, 'utf8'));
                    
                    // Add initial liquidity (example amounts - adjust as needed)
                    const gdiAmount = 1000000000; // 1 GDI (with 9 decimals)
                    const usdcAmount = 1000000; // 1 USDC (with 6 decimals)
                    
                    await addInitialLiquidity(poolInfo.poolId, gdiAmount, usdcAmount);
                    deploymentLog.steps.push({
                        step: 'initial_liquidity',
                        status: 'success',
                        timestamp: new Date().toISOString(),
                        amounts: { gdi: gdiAmount, usdc: usdcAmount }
                    });
                    console.log('✅ Initial liquidity added successfully!\n');
                }
                
            } catch (error) {
                console.error('❌ Pool creation failed:', error.message);
                deploymentLog.steps.push({
                    step: 'pool_creation',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                deploymentLog.errors.push({
                    step: 'pool_creation',
                    error: error.message
                });
            }
        } else {
            console.log('⏭️  Skipping pool creation...\n');
            deploymentLog.steps.push({
                step: 'pool_creation',
                status: 'skipped',
                timestamp: new Date().toISOString()
            });
        }
        
        // Step 3: Revoke Authorities
        if (!skipRevoke) {
            console.log('🔒 STEP 3: Revoking Authorities for Security...');
            console.log('-'.repeat(40));
            
            try {
                await revokeAuthorities();
                deploymentLog.steps.push({
                    step: 'authority_revocation',
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Authority revocation completed successfully!\n');
            } catch (error) {
                console.error('❌ Authority revocation failed:', error.message);
                deploymentLog.steps.push({
                    step: 'authority_revocation',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                deploymentLog.errors.push({
                    step: 'authority_revocation',
                    error: error.message
                });
            }
        } else {
            console.log('⏭️  Skipping authority revocation...\n');
            deploymentLog.steps.push({
                step: 'authority_revocation',
                status: 'skipped',
                timestamp: new Date().toISOString()
            });
        }
        
        // Step 4: Final Verification
        console.log('🔍 STEP 4: Final Verification...');
        console.log('-'.repeat(40));
        
        try {
            // Check authority status
            const authorityStatus = await checkAuthorityStatus();
            
            // Check if deployment files exist
            const deploymentFiles = {
                metadata: fs.existsSync(path.join(__dirname, '../deployment-info.json')),
                pool: fs.existsSync(path.join(__dirname, '../raydium-pool-info.json')),
                revocation: fs.existsSync(path.join(__dirname, '../authority-revocation-info.json'))
            };
            
            console.log('📁 Deployment Files Status:');
            console.log('   Metadata Info:', deploymentFiles.metadata ? '✅' : '❌');
            console.log('   Pool Info:', deploymentFiles.pool ? '✅' : '❌');
            console.log('   Revocation Info:', deploymentFiles.revocation ? '✅' : '❌');
            
            if (authorityStatus) {
                console.log('\n🔒 Security Status:');
                console.log('   Mint Authority Revoked:', authorityStatus.mintAuthorityRevoked ? '✅' : '❌');
                console.log('   Freeze Authority Revoked:', authorityStatus.freezeAuthorityRevoked ? '✅' : '❌');
            }
            
            deploymentLog.steps.push({
                step: 'verification',
                status: 'success',
                timestamp: new Date().toISOString(),
                authorityStatus,
                deploymentFiles
            });
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            deploymentLog.steps.push({
                step: 'verification',
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            deploymentLog.errors.push({
                step: 'verification',
                error: error.message
            });
        }
        
        // Calculate deployment time
        const endTime = Date.now();
        const deploymentTime = (endTime - startTime) / 1000;
        
        deploymentLog.endTime = new Date().toISOString();
        deploymentLog.deploymentTimeSeconds = deploymentTime;
        deploymentLog.success = deploymentLog.errors.length === 0;
        
        // Save deployment log
        fs.writeFileSync(
            path.join(__dirname, '../deployment-log.json'),
            JSON.stringify(deploymentLog, null, 2)
        );
        
        // Final summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 GDI Token Deployment Summary');
        console.log('='.repeat(60));
        console.log(`⏱️  Total Deployment Time: ${deploymentTime.toFixed(2)} seconds`);
        console.log(`✅ Successful Steps: ${deploymentLog.steps.filter(s => s.status === 'success').length}`);
        console.log(`❌ Failed Steps: ${deploymentLog.errors.length}`);
        console.log(`⏭️  Skipped Steps: ${deploymentLog.steps.filter(s => s.status === 'skipped').length}`);
        
        if (deploymentLog.success) {
            console.log('\n🎊 DEPLOYMENT COMPLETE! GDI Token is now live and secure!');
            console.log('\n📋 Next Steps:');
            console.log('   1. Verify token on Solscan/Explorer');
            console.log('   2. Test trading on Raydium');
            console.log('   3. Update token lists and aggregators');
            console.log('   4. Monitor pool performance');
        } else {
            console.log('\n⚠️  DEPLOYMENT COMPLETED WITH ERRORS');
            console.log('Please review the errors above and retry failed steps.');
        }
        
        console.log('\n📁 Deployment logs saved to: deployment-log.json');
        
    } catch (error) {
        console.error('❌ Deployment orchestration failed:', error);
        deploymentLog.endTime = new Date().toISOString();
        deploymentLog.success = false;
        deploymentLog.errors.push({
            step: 'orchestration',
            error: error.message
        });
        
        fs.writeFileSync(
            path.join(__dirname, '../deployment-log.json'),
            JSON.stringify(deploymentLog, null, 2)
        );
        
        process.exit(1);
    }
}

// Helper function to show deployment status
function showDeploymentStatus() {
    try {
        const logPath = path.join(__dirname, '../deployment-log.json');
        if (fs.existsSync(logPath)) {
            const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            
            console.log('📊 GDI Token Deployment Status');
            console.log('='.repeat(40));
            console.log('Start Time:', log.startTime);
            console.log('End Time:', log.endTime || 'In Progress');
            console.log('Success:', log.success ? '✅' : '❌');
            console.log('Deployment Time:', log.deploymentTimeSeconds ? `${log.deploymentTimeSeconds.toFixed(2)}s` : 'N/A');
            
            console.log('\n📋 Steps:');
            log.steps.forEach((step, index) => {
                const status = step.status === 'success' ? '✅' : 
                             step.status === 'failed' ? '❌' : '⏭️';
                console.log(`   ${index + 1}. ${step.step}: ${status}`);
            });
            
            if (log.errors.length > 0) {
                console.log('\n❌ Errors:');
                log.errors.forEach((error, index) => {
                    console.log(`   ${index + 1}. ${error.step}: ${error.error}`);
                });
            }
        } else {
            console.log('❌ No deployment log found. Run deployment first.');
        }
    } catch (error) {
        console.error('❌ Error reading deployment status:', error);
    }
}

// Run if called directly
if (process.argv[1].endsWith('deploy-gdi-complete.js')) {
    const args = process.argv.slice(2);
    
    if (args.includes('--status')) {
        showDeploymentStatus();
    } else {
        deployGDIComplete();
    }
}

export { deployGDIComplete, showDeploymentStatus }; 