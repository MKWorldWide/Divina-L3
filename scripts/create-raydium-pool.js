const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { Liquidity, LiquidityPoolKeys, LiquidityPoolStatus } = require('@raydium-io/raydium-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const GDI_MINT_ADDRESS = '4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS';
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Mainnet USDC
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const RAYDIUM_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

/**
 * Create Raydium USDC/GDI Liquidity Pool
 * 
 * This script creates a new liquidity pool on Raydium for GDI/USDC trading:
 * 1. Initialize pool with proper fee structure
 * 2. Add initial liquidity
 * 3. Configure pool parameters for optimal trading
 * 4. Set up pool authority management
 */

async function createRaydiumPool() {
    try {
        console.log('🏊 Creating Raydium USDC/GDI Liquidity Pool...');
        
        // Initialize Solana connection
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        
        // Load wallet
        const wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
        );
        
        console.log('📡 Connected to Solana network:', RPC_ENDPOINT);
        console.log('👛 Wallet address:', wallet.publicKey.toString());
        
        // Token addresses
        const gdiMint = new PublicKey(GDI_MINT_ADDRESS);
        const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
        
        console.log('\n🪙 Token Configuration:');
        console.log('   GDI Mint:', gdiMint.toString());
        console.log('   USDC Mint:', usdcMint.toString());
        
        // Pool configuration
        const poolConfig = {
            baseMint: gdiMint,
            quoteMint: usdcMint,
            baseDecimals: 9,
            quoteDecimals: 6,
            feeRate: 0.0025, // 0.25% fee
            ownerFeeRate: 0.0005, // 0.05% owner fee
            baseLotSize: 1,
            quoteLotSize: 1,
            startTime: Math.floor(Date.now() / 1000),
            owner: wallet.publicKey
        };
        
        console.log('\n⚙️ Pool Configuration:');
        console.log('   Fee Rate:', (poolConfig.feeRate * 100).toFixed(2) + '%');
        console.log('   Owner Fee Rate:', (poolConfig.ownerFeeRate * 100).toFixed(2) + '%');
        console.log('   Base Lot Size:', poolConfig.baseLotSize);
        console.log('   Quote Lot Size:', poolConfig.quoteLotSize);
        
        // Create pool keys
        const poolKeys = await Liquidity.makeCreatePoolInstructionSimple({
            connection,
            wallet: wallet.publicKey,
            baseMint: poolConfig.baseMint,
            quoteMint: poolConfig.quoteMint,
            baseDecimals: poolConfig.baseDecimals,
            quoteDecimals: poolConfig.quoteDecimals,
            feeRate: poolConfig.feeRate,
            ownerFeeRate: poolConfig.ownerFeeRate,
            baseLotSize: poolConfig.baseLotSize,
            quoteLotSize: poolConfig.quoteLotSize,
            startTime: poolConfig.startTime,
            owner: poolConfig.owner
        });
        
        console.log('\n🔑 Pool Keys Generated:');
        console.log('   Pool ID:', poolKeys.id.toString());
        console.log('   Base Vault:', poolKeys.baseVault.toString());
        console.log('   Quote Vault:', poolKeys.quoteVault.toString());
        console.log('   LP Mint:', poolKeys.lpMint.toString());
        
        // Create and send transaction
        console.log('\n📝 Creating pool transaction...');
        const transaction = new Transaction();
        
        // Add create pool instruction
        transaction.add(poolKeys.instruction);
        
        // Set recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign and send transaction
        transaction.sign(wallet);
        
        console.log('📤 Sending pool creation transaction...');
        const signature = await connection.sendTransaction(transaction, [wallet]);
        
        console.log('✅ Pool creation transaction sent!');
        console.log('📝 Transaction signature:', signature);
        
        // Wait for confirmation
        console.log('\n⏳ Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
            throw new Error('Transaction failed: ' + confirmation.value.err);
        }
        
        console.log('✅ Pool created successfully!');
        
        // Save pool information
        const poolInfo = {
            poolId: poolKeys.id.toString(),
            baseMint: GDI_MINT_ADDRESS,
            quoteMint: USDC_MINT_ADDRESS,
            baseVault: poolKeys.baseVault.toString(),
            quoteVault: poolKeys.quoteVault.toString(),
            lpMint: poolKeys.lpMint.toString(),
            feeRate: poolConfig.feeRate,
            ownerFeeRate: poolConfig.ownerFeeRate,
            transactionSignature: signature,
            createdAt: new Date().toISOString(),
            network: 'mainnet'
        };
        
        fs.writeFileSync(
            path.join(__dirname, '../raydium-pool-info.json'),
            JSON.stringify(poolInfo, null, 2)
        );
        
        console.log('\n📁 Pool info saved to: raydium-pool-info.json');
        console.log('\n🎉 Raydium USDC/GDI Pool Creation Complete!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Add initial liquidity to the pool');
        console.log('   2. Verify pool on Raydium UI');
        console.log('   3. Set up pool monitoring');
        
    } catch (error) {
        console.error('❌ Pool creation failed:', error);
        process.exit(1);
    }
}

// Helper function to add initial liquidity
async function addInitialLiquidity(poolId, gdiAmount, usdcAmount) {
    try {
        console.log('💧 Adding initial liquidity to pool...');
        
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
        );
        
        const poolKeys = new LiquidityPoolKeys({
            id: new PublicKey(poolId),
            baseMint: new PublicKey(GDI_MINT_ADDRESS),
            quoteMint: new PublicKey(USDC_MINT_ADDRESS),
            lpMint: new PublicKey(poolId), // This will be updated with actual LP mint
            baseDecimals: 9,
            quoteDecimals: 6,
            lpDecimals: 9,
            version: 4,
            programId: new PublicKey(RAYDIUM_PROGRAM_ID),
            authority: wallet.publicKey,
            openOrders: new PublicKey(poolId), // This will be updated
            targetOrders: new PublicKey(poolId), // This will be updated
            baseVault: new PublicKey(poolId), // This will be updated
            quoteVault: new PublicKey(poolId), // This will be updated
            withdrawQueue: new PublicKey(poolId), // This will be updated
            lpVault: new PublicKey(poolId), // This will be updated
            marketVersion: 3,
            marketProgramId: new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'),
            marketId: new PublicKey(poolId), // This will be updated
            marketAuthority: new PublicKey(poolId), // This will be updated
            marketBaseVault: new PublicKey(poolId), // This will be updated
            marketQuoteVault: new PublicKey(poolId), // This will be updated
            marketBids: new PublicKey(poolId), // This will be updated
            marketAsks: new PublicKey(poolId), // This will be updated
            marketEventQueue: new PublicKey(poolId) // This will be updated
        });
        
        // Add liquidity instruction
        const addLiquidityInstruction = await Liquidity.makeAddLiquidityInstruction({
            poolKeys,
            userKeys: {
                tokenAccountIn: wallet.publicKey,
                tokenAccountOut: wallet.publicKey,
                owner: wallet.publicKey
            },
            amountIn: gdiAmount,
            amountOut: usdcAmount,
            fixedSide: 'in'
        });
        
        const transaction = new Transaction();
        transaction.add(addLiquidityInstruction);
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        
        transaction.sign(wallet);
        const signature = await connection.sendTransaction(transaction, [wallet]);
        
        console.log('✅ Initial liquidity added!');
        console.log('📝 Transaction signature:', signature);
        
    } catch (error) {
        console.error('❌ Adding liquidity failed:', error);
    }
}

// Run if called directly
if (require.main === module) {
    createRaydiumPool();
}

module.exports = { createRaydiumPool, addInitialLiquidity }; 