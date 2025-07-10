// Quantum-detailed ESM migration for verify-setup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify GDI Token Deployment Setup
 * 
 * This script checks all prerequisites before deployment:
 * 1. Logo file exists and is valid
 * 2. Environment variables are configured
 * 3. Dependencies are installed
 * 4. Metadata file is properly formatted
 */

async function verifySetup() {
    console.log('🔍 Verifying GDI Token Deployment Setup...');
    console.log('='.repeat(50));
    
    let allChecksPassed = true;
    
    // Check 1: Logo file
    console.log('\n📸 Checking GDI logo file...');
    const logoPath = path.join(__dirname, '../assets/gdi-logo.png');
    
    if (fs.existsSync(logoPath)) {
        const stats = fs.statSync(logoPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('   ✅ Logo file found:', logoPath);
        console.log('   📏 File size:', fileSizeMB, 'MB');
        
        if (stats.size > 5 * 1024 * 1024) {
            console.log('   ⚠️  Warning: Logo file is larger than 5MB (recommended < 5MB)');
        } else {
            console.log('   ✅ File size is within recommended limits');
        }
    } else {
        console.log('   ❌ Logo file not found:', logoPath);
        console.log('   💡 Please add your GDI logo to assets/gdi-logo.png');
        allChecksPassed = false;
    }
    
    // Check 2: Metadata file
    console.log('\n📋 Checking metadata configuration...');
    const metadataPath = path.join(__dirname, '../assets/metadata.json');
    
    if (fs.existsSync(metadataPath)) {
        try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            console.log('   ✅ Metadata file found and valid JSON');
            console.log('   🏷️  Token Name:', metadata.name);
            console.log('   💎 Token Symbol:', metadata.symbol);
            console.log('   📝 Description length:', metadata.description.length, 'characters');
            
            // Check required fields
            const requiredFields = ['name', 'symbol', 'description', 'image', 'external_url'];
            const missingFields = requiredFields.filter(field => !metadata[field]);
            
            if (missingFields.length === 0) {
                console.log('   ✅ All required metadata fields present');
            } else {
                console.log('   ❌ Missing required fields:', missingFields.join(', '));
                allChecksPassed = false;
            }
            
        } catch (error) {
            console.log('   ❌ Invalid JSON in metadata file:', error.message);
            allChecksPassed = false;
        }
    } else {
        console.log('   ❌ Metadata file not found:', metadataPath);
        allChecksPassed = false;
    }
    
    // Check 3: Environment variables
    console.log('\n⚙️  Checking environment configuration...');
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        console.log('   ✅ .env file found');
        
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check for required environment variables
        const requiredEnvVars = [
            'WALLET_PRIVATE_KEY',
            'RPC_ENDPOINT',
            'GDI_MINT_ADDRESS'
        ];
        
        const missingEnvVars = requiredEnvVars.filter(varName => {
            return !envContent.includes(`${varName}=`);
        });
        
        if (missingEnvVars.length === 0) {
            console.log('   ✅ All required environment variables configured');
        } else {
            console.log('   ❌ Missing environment variables:', missingEnvVars.join(', '));
            console.log('   💡 Please configure these in your .env file');
            allChecksPassed = false;
        }
        
        // Check if wallet private key is configured
        if (envContent.includes('WALLET_PRIVATE_KEY=[]')) {
            console.log('   ⚠️  Warning: Wallet private key is empty array');
            console.log('   💡 Please add your wallet private key to .env');
            allChecksPassed = false;
        }
        
    } else {
        console.log('   ❌ .env file not found');
        console.log('   💡 Please copy env.example to .env and configure');
        allChecksPassed = false;
    }
    
    // Check 4: Dependencies
    console.log('\n📦 Checking dependencies...');
    const packageJsonPath = path.join(__dirname, '../package.json');
    
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            console.log('   ✅ package.json found');
            console.log('   📦 Project name:', packageJson.name);
            console.log('   🏷️  Version:', packageJson.version);
            
            // Check for required dependencies
            const requiredDeps = [
                '@metaplex-foundation/js',
                '@raydium-io/raydium-sdk',
                '@solana/spl-token',
                '@solana/web3.js'
            ];
            
            const missingDeps = requiredDeps.filter(dep => {
                return !packageJson.dependencies || !packageJson.dependencies[dep];
            });
            
            if (missingDeps.length === 0) {
                console.log('   ✅ All required dependencies listed in package.json');
            } else {
                console.log('   ❌ Missing dependencies:', missingDeps.join(', '));
                allChecksPassed = false;
            }
            
        } catch (error) {
            console.log('   ❌ Invalid package.json:', error.message);
            allChecksPassed = false;
        }
    } else {
        console.log('   ❌ package.json not found');
        allChecksPassed = false;
    }
    
    // Check 5: Node modules (if installed)
    console.log('\n🔧 Checking installed dependencies...');
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    
    if (fs.existsSync(nodeModulesPath)) {
        console.log('   ✅ node_modules directory found');
        
        // Check for key dependencies
        const keyDeps = [
            'node_modules/@solana/web3.js',
            'node_modules/@metaplex-foundation/js',
            'node_modules/@raydium-io/raydium-sdk'
        ];
        
        const missingKeyDeps = keyDeps.filter(depPath => {
            return !fs.existsSync(path.join(__dirname, '..', depPath));
        });
        
        if (missingKeyDeps.length === 0) {
            console.log('   ✅ Key dependencies installed');
        } else {
            console.log('   ⚠️  Some dependencies may not be installed');
            console.log('   💡 Run: npm install');
        }
        
    } else {
        console.log('   ⚠️  node_modules not found');
        console.log('   💡 Run: npm install');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Setup Verification Summary');
    console.log('='.repeat(50));
    
    if (allChecksPassed) {
        console.log('🎉 All checks passed! Your setup is ready for deployment.');
        console.log('\n📋 Next steps:');
        console.log('   1. Ensure your wallet has sufficient SOL for fees');
        console.log('   2. Test on devnet first: npm run deploy');
        console.log('   3. Deploy to mainnet when ready');
    } else {
        console.log('❌ Some checks failed. Please fix the issues above before deployment.');
        console.log('\n🔧 Common fixes:');
        console.log('   - Run: npm install');
        console.log('   - Copy env.example to .env and configure');
        console.log('   - Add your GDI logo to assets/gdi-logo.png');
    }
    
    return allChecksPassed;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifySetup();
}

export { verifySetup }; 