// scripts/registerGDI.js
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// === CONFIG ===
const METADATA_URI = "https://mkww.studio/metadata/gdi.json";
const TOKEN_NAME = "GameDin";
const TOKEN_SYMBOL = "GDI";
const MINT_ADDRESS = "4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS";
const WALLET_PATH = path.join(process.cwd(), 'wallet.json');

// Initialize connection to Solana mainnet
const connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');

async function registerMetadata() {
  try {
    console.log("🔍 Loading wallet...");
    
    // Check if wallet exists
    if (!fs.existsSync(WALLET_PATH)) {
      console.error("❌ Wallet file not found at:", WALLET_PATH);
      console.log("\nPlease create a wallet.json file in the project root with your private key.");
      return;
    }

    // Load wallet
    const wallet = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8')))
    );
    
    console.log("✅ Wallet loaded successfully");
    console.log("   Wallet address:", wallet.publicKey.toString());
    console.log("   Mint address:", MINT_ADDRESS);
    
    // Initialize Metaplex
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(wallet))
      .use(bundlrStorage({
        address: 'https://node1.bundlr.network',
        providerUrl: 'https://api.mainnet-beta.solana.com',
        timeout: 60000,
      }));

    console.log("\n🧬 Registering GDI metadata...");
    console.log("   Metadata URI:", METADATA_URI);
    
    // Check if metadata URI is accessible
    try {
      const metadataResponse = await fetch(METADATA_URI);
      if (!metadataResponse.ok) {
        console.warn(`⚠️  Warning: Could not access metadata at ${METADATA_URI}`);
        console.log("   Make sure the metadata JSON is publicly accessible at this URL.");
      } else {
        console.log("✅ Metadata JSON is accessible");
      }
    } catch (e) {
      console.warn("⚠️  Could not verify metadata accessibility:", e.message);
    }

    // Create metadata
    console.log("\n🚀 Creating metadata on-chain...");
    const { nft } = await metaplex.nfts().create({
      uri: METADATA_URI,
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      sellerFeeBasisPoints: 0, // 0% royalty
      isMutable: true,
      mintAddress: new PublicKey(MINT_ADDRESS),
    });

    console.log("\n✨ Metadata registered successfully!");
    console.log("   NFT address:", nft.address.toString());
    console.log("   View on Solscan: https://solscan.io/token/" + MINT_ADDRESS);
    
  } catch (error) {
    console.error("\n❌ Failed to register metadata:");
    console.error(error);
    
    // Provide helpful error messages
    if (error.message.includes("Invalid private key")) {
      console.log("\n🔑 Error: Invalid private key in wallet.json");
      console.log("   Make sure your wallet.json contains a valid private key array.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n💰 Error: Insufficient SOL for transaction");
      console.log("   Make sure your wallet has enough SOL to pay for the transaction.");
    } else if (error.message.includes("already in use")) {
      console.log("\n⚠️  Error: This mint already has metadata associated with it");
      console.log("   If you want to update the metadata, use the updateMetadata script instead.");
    }
  }
}

// Run the script
registerMetadata();
