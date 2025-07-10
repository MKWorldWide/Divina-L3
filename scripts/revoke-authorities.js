// Quantum-detailed ESM migration for revoke-authorities
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Configuration
const GDI_MINT_ADDRESS = '4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

/**
 * Revoke Authorities for GDI Token Security
 * 
 * This script safely revokes mint and pool authorities after deployment:
 * 1. Revoke mint authority (prevents future token minting)
 * 2. Revoke freeze authority (prevents token freezing)
 * 3. Verify authorities are properly revoked
 * 4. Save revocation confirmation
 * 
 * ⚠️ WARNING: This action is irreversible!
 */

async function revokeAuthorities() {
    try {
        console.log('🔒 Revoking GDI Token Authorities for Security...');
        console.log('⚠️  WARNING: This action is irreversible!');
        
        // Initialize Solana connection
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        
        // Load wallet
        const wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
        );
        
        console.log('📡 Connected to Solana network:', RPC_ENDPOINT);
        console.log('👛 Wallet address:', wallet.publicKey.toString());
        
        const mint = new PublicKey(GDI_MINT_ADDRESS);
        
        // Get current mint info
        console.log('\n📊 Current Mint Information:');
        const mintInfo = await connection.getAccountInfo(mint);
        if (!mintInfo) {
            throw new Error('Mint account not found');
        }
        
        const mintData = Token.getMintLayout().decode(mintInfo.data);
        console.log('   Mint Authority:', mintData.mintAuthority?.toString() || 'None');
        console.log('   Freeze Authority:', mintData.freezeAuthority?.toString() || 'None');
        console.log('   Supply:', mintData.supply.toString());
        console.log('   Decimals:', mintData.decimals);
        console.log('   Is Initialized:', mintData.isInitialized);
        
        // Check if authorities are already revoked
        if (!mintData.mintAuthority && !mintData.freezeAuthority) {
            console.log('\n✅ Authorities already revoked!');
            return;
        }
        
        // Create transaction for authority revocation
        console.log('\n📝 Creating authority revocation transaction...');
        const transaction = new Transaction();
        
        // Revoke mint authority if it exists
        if (mintData.mintAuthority) {
            console.log('🔓 Revoking mint authority...');
            const revokeMintAuthorityInstruction = Token.createSetAuthorityInstruction(
                TOKEN_PROGRAM_ID,
                mint,
                null, // New authority (null = revoke)
                0, // Authority type (0 = mint authority)
                wallet.publicKey,
                []
            );
            transaction.add(revokeMintAuthorityInstruction);
        }
        
        // Revoke freeze authority if it exists
        if (mintData.freezeAuthority) {
            console.log('🔓 Revoking freeze authority...');
            const revokeFreezeAuthorityInstruction = Token.createSetAuthorityInstruction(
                TOKEN_PROGRAM_ID,
                mint,
                null, // New authority (null = revoke)
                2, // Authority type (2 = freeze authority)
                wallet.publicKey,
                []
            );
            transaction.add(revokeFreezeAuthorityInstruction);
        }
        
        // Set recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign and send transaction
        transaction.sign(wallet);
        
        console.log('📤 Sending authority revocation transaction...');
        const signature = await connection.sendTransaction(transaction, [wallet]);
        
        console.log('✅ Authority revocation transaction sent!');
        console.log('📝 Transaction signature:', signature);
        
        // Wait for confirmation
        console.log('\n⏳ Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
            throw new Error('Transaction failed: ' + confirmation.value.err);
        }
        
        console.log('✅ Authorities revoked successfully!');
        
        // Verify revocation
        console.log('\n🔍 Verifying authority revocation...');
        const updatedMintInfo = await connection.getAccountInfo(mint);
        const updatedMintData = Token.getMintLayout().decode(updatedMintInfo.data);
        
        console.log('📊 Updated Mint Information:');
        console.log('   Mint Authority:', updatedMintData.mintAuthority?.toString() || 'None ✅');
        console.log('   Freeze Authority:', updatedMintData.freezeAuthority?.toString() || 'None ✅');
        console.log('   Supply:', updatedMintData.supply.toString());
        console.log('   Decimals:', updatedMintData.decimals);
        
        // Verify authorities are actually revoked
        if (updatedMintData.mintAuthority || updatedMintData.freezeAuthority) {
            throw new Error('Authority revocation verification failed');
        }
        
        console.log('\n✅ Authority revocation verified successfully!');
        
        // Save revocation info
        const revocationInfo = {
            mintAddress: GDI_MINT_ADDRESS,
            revokedAt: new Date().toISOString(),
            transactionSignature: signature,
            revokedAuthorities: {
                mintAuthority: mintData.mintAuthority?.toString() || null,
                freezeAuthority: mintData.freezeAuthority?.toString() || null
            },
            network: 'mainnet',
            verified: true
        };
        
        fs.writeFileSync(
            path.join(__dirname, '../authority-revocation-info.json'),
            JSON.stringify(revocationInfo, null, 2)
        );
        
        console.log('\n📁 Revocation info saved to: authority-revocation-info.json');
        console.log('\n🎉 GDI Token Authority Revocation Complete!');
        console.log('\n🔒 Security Status:');
        console.log('   ✅ Mint Authority: REVOKED');
        console.log('   ✅ Freeze Authority: REVOKED');
        console.log('   ✅ Token Supply: LOCKED');
        console.log('   ✅ Future Minting: DISABLED');
        
    } catch (error) {
        console.error('❌ Authority revocation failed:', error);
        process.exit(1);
    }
}

// Helper function to check authority status
async function checkAuthorityStatus() {
    try {
        console.log('🔍 Checking GDI Token Authority Status...');
        
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const mint = new PublicKey(GDI_MINT_ADDRESS);
        
        const mintInfo = await connection.getAccountInfo(mint);
        if (!mintInfo) {
            throw new Error('Mint account not found');
        }
        
        const mintData = Token.getMintLayout().decode(mintInfo.data);
        
        console.log('\n📊 Current Authority Status:');
        console.log('   Mint Authority:', mintData.mintAuthority?.toString() || 'None (Revoked)');
        console.log('   Freeze Authority:', mintData.freezeAuthority?.toString() || 'None (Revoked)');
        console.log('   Supply:', mintData.supply.toString());
        console.log('   Decimals:', mintData.decimals);
        console.log('   Is Initialized:', mintData.isInitialized);
        
        const status = {
            mintAuthorityRevoked: !mintData.mintAuthority,
            freezeAuthorityRevoked: !mintData.freezeAuthority,
            supply: mintData.supply.toString(),
            decimals: mintData.decimals
        };
        
        console.log('\n🔒 Security Assessment:');
        console.log('   Mint Authority Revoked:', status.mintAuthorityRevoked ? '✅' : '❌');
        console.log('   Freeze Authority Revoked:', status.freezeAuthorityRevoked ? '✅' : '❌');
        console.log('   Overall Security:', (status.mintAuthorityRevoked && status.freezeAuthorityRevoked) ? '🔒 SECURE' : '⚠️  INSECURE');
        
        return status;
        
    } catch (error) {
        console.error('❌ Authority status check failed:', error);
        return null;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    if (args.includes('--check')) {
        checkAuthorityStatus();
    } else {
        revokeAuthorities();
    }
}

export { revokeAuthorities, checkAuthorityStatus }; 