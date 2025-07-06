const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Metaplex } = require('@metaplex-foundation/js');
const fs = require('fs');
const path = require('path');

// Configuration
const GDI_MINT_ADDRESS = '4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'; // Change to devnet for testing
const LOGO_PATH = path.join(__dirname, '../assets/gdi-logo.png');
const METADATA_PATH = path.join(__dirname, '../assets/metadata.json');

/**
 * Deploy GDI Token Metadata to Arweave and Set On-Chain Metadata
 * 
 * This script handles the complete metadata deployment process:
 * 1. Upload logo to Arweave
 * 2. Upload metadata JSON to Arweave  
 * 3. Set on-chain metadata for the GDI mint
 * 4. Verify deployment success
 */

async function deployGDIMetadata() {
    try {
        console.log('🚀 Starting GDI Token Metadata Deployment...');
        
        // Initialize Solana connection
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        
        // Load wallet (you'll need to set your keypair)
        const wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
        );
        
        console.log('📡 Connected to Solana network:', RPC_ENDPOINT);
        console.log('👛 Wallet address:', wallet.publicKey.toString());
        
        // Initialize Metaplex
        const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));
        
        // Step 1: Upload logo to Arweave
        console.log('\n📤 Uploading GDI logo to Arweave...');
        const logoBuffer = fs.readFileSync(LOGO_PATH);
        const logoUri = await metaplex.nfts().upload({
            buffer: logoBuffer,
            fileName: 'gdi-logo.png',
            contentType: 'image/png'
        });
        
        console.log('✅ Logo uploaded:', logoUri);
        
        // Step 2: Prepare and upload metadata
        console.log('\n📋 Preparing metadata...');
        const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
        
        // Update metadata with actual logo URI and creator address
        metadata.image = logoUri;
        metadata.properties.files[0].uri = logoUri;
        metadata.properties.creators[0].address = wallet.publicKey.toString();
        
        // Upload metadata to Arweave
        console.log('📤 Uploading metadata to Arweave...');
        const metadataUri = await metaplex.nfts().upload({
            buffer: Buffer.from(JSON.stringify(metadata)),
            fileName: 'gdi-metadata.json',
            contentType: 'application/json'
        });
        
        console.log('✅ Metadata uploaded:', metadataUri);
        
        // Step 3: Set on-chain metadata
        console.log('\n🔗 Setting on-chain metadata...');
        const mint = new PublicKey(GDI_MINT_ADDRESS);
        
        const { response } = await metaplex.nfts().update({
            nftOrSft: await metaplex.nfts().findByMint({ mintAddress: mint }),
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0, // 0% royalty for utility token
            creators: metadata.properties.creators,
            isMutable: true // Keep mutable for future updates
        });
        
        console.log('✅ On-chain metadata set successfully!');
        console.log('📝 Transaction signature:', response.signature);
        
        // Step 4: Verify deployment
        console.log('\n🔍 Verifying deployment...');
        const updatedNft = await metaplex.nfts().findByMint({ mintAddress: mint });
        
        console.log('✅ Verification complete!');
        console.log('📊 Token Details:');
        console.log('   Name:', updatedNft.name);
        console.log('   Symbol:', updatedNft.symbol);
        console.log('   Metadata URI:', updatedNft.uri);
        console.log('   Mutable:', updatedNft.isMutable);
        
        // Save deployment info
        const deploymentInfo = {
            mintAddress: GDI_MINT_ADDRESS,
            logoUri: logoUri,
            metadataUri: metadataUri,
            transactionSignature: response.signature,
            deployedAt: new Date().toISOString(),
            network: RPC_ENDPOINT.includes('mainnet') ? 'mainnet' : 'devnet'
        };
        
        fs.writeFileSync(
            path.join(__dirname, '../deployment-info.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('\n🎉 GDI Token Metadata Deployment Complete!');
        console.log('📁 Deployment info saved to: deployment-info.json');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Helper function to create keypair identity
function keypairIdentity(keypair) {
    return {
        publicKey: keypair.publicKey,
        signMessage: async (message) => {
            return nacl.sign.detached(message, keypair.secretKey);
        },
        signTransaction: async (transaction) => {
            transaction.sign(keypair);
            return transaction;
        },
        signAllTransactions: async (transactions) => {
            transactions.forEach(transaction => transaction.sign(keypair));
            return transactions;
        }
    };
}

// Run deployment if called directly
if (require.main === module) {
    deployGDIMetadata();
}

module.exports = { deployGDIMetadata }; 