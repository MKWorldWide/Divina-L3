import { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
    Token, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAccount
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GDI Token Utilities for Solana CLI + Phantom Integration
 * 
 * This utility provides comprehensive GDI token operations:
 * - Balance checking with human-readable output
 * - Token transfers using Solana CLI wallet
 * - ATA creation and management
 * - Phantom wallet compatibility
 * - Testnet operations
 */

export class GDITokenUtils {
    private connection: Connection;
    private wallet: Keypair;
    private gdiMint: PublicKey;
    private rpcEndpoint: string;

    constructor(rpcEndpoint: string = 'https://api.testnet.solana.com') {
        this.rpcEndpoint = rpcEndpoint;
        this.connection = new Connection(rpcEndpoint, 'confirmed');
        this.gdiMint = new PublicKey('4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS');
        this.wallet = this.loadSolanaCLIWallet();
    }

    /**
     * Load Solana CLI wallet from ~/.config/solana/id.json
     */
    private loadSolanaCLIWallet(): Keypair {
        try {
            const homeDir = process.env.HOME || process.env.USERPROFILE;
            const walletPath = path.join(homeDir!, '.config', 'solana', 'id.json');
            
            if (!fs.existsSync(walletPath)) {
                throw new Error(`Solana CLI wallet not found at: ${walletPath}`);
            }

            const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
            return Keypair.fromSecretKey(new Uint8Array(walletData));
        } catch (error) {
            throw new Error(`Failed to load Solana CLI wallet: ${error}`);
        }
    }

    /**
     * Get wallet information and display it
     */
    async getWalletInfo(): Promise<void> {
        console.log('🔑 Wallet Information');
        console.log('='.repeat(40));
        console.log('Public Key:', this.wallet.publicKey.toString());
        console.log('Network:', this.rpcEndpoint);
        console.log('GDI Mint:', this.gdiMint.toString());
        
        // Get SOL balance
        const solBalance = await this.connection.getBalance(this.wallet.publicKey);
        console.log('SOL Balance:', (solBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
        
        console.log('');
    }

    /**
     * Get or create Associated Token Account (ATA) for GDI
     */
    async getOrCreateATA(owner: PublicKey = this.wallet.publicKey): Promise<PublicKey> {
        try {
            const ata = await getAssociatedTokenAddress(
                this.gdiMint,
                owner,
                false,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            // Check if ATA exists
            const accountInfo = await this.connection.getAccountInfo(ata);
            
            if (accountInfo) {
                console.log('✅ ATA already exists:', ata.toString());
                return ata;
            }

            // Create ATA if it doesn't exist
            console.log('📝 Creating ATA for GDI token...');
            const transaction = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    this.wallet.publicKey,
                    ata,
                    owner,
                    this.gdiMint,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.wallet]
            );

            console.log('✅ ATA created successfully!');
            console.log('ATA Address:', ata.toString());
            console.log('Transaction:', signature);
            
            return ata;
        } catch (error) {
            throw new Error(`Failed to get/create ATA: ${error}`);
        }
    }

    /**
     * Get GDI token balance with human-readable output
     */
    async getGDIBalance(owner: PublicKey = this.wallet.publicKey): Promise<number> {
        try {
            const ata = await this.getOrCreateATA(owner);
            
            const accountInfo = await getAccount(this.connection, ata);
            const balance = Number(accountInfo.amount);
            
            // Convert to human-readable format (9 decimals for GDI)
            const humanReadableBalance = balance / Math.pow(10, 9);
            
            console.log('💰 GDI Token Balance');
            console.log('='.repeat(30));
            console.log('Raw Balance:', balance);
            console.log('Human Readable:', humanReadableBalance.toFixed(9), 'GDI');
            console.log('ATA Address:', ata.toString());
            console.log('');
            
            return humanReadableBalance;
        } catch (error) {
            throw new Error(`Failed to get GDI balance: ${error}`);
        }
    }

    /**
     * Send GDI tokens to another wallet
     */
    async sendGDI(
        recipient: string | PublicKey, 
        amount: number, 
        owner: PublicKey = this.wallet.publicKey
    ): Promise<string> {
        try {
            const recipientPubkey = typeof recipient === 'string' 
                ? new PublicKey(recipient) 
                : recipient;

            console.log('📤 Sending GDI Tokens');
            console.log('='.repeat(30));
            console.log('From:', owner.toString());
            console.log('To:', recipientPubkey.toString());
            console.log('Amount:', amount, 'GDI');
            
            // Get ATAs
            const senderATA = await this.getOrCreateATA(owner);
            const recipientATA = await this.getOrCreateATA(recipientPubkey);
            
            // Convert amount to smallest unit (9 decimals)
            const rawAmount = Math.floor(amount * Math.pow(10, 9));
            
            console.log('Raw Amount:', rawAmount);
            console.log('Sender ATA:', senderATA.toString());
            console.log('Recipient ATA:', recipientATA.toString());
            
            // Create transfer instruction
            const transferInstruction = createTransferInstruction(
                senderATA,
                recipientATA,
                owner,
                rawAmount,
                [],
                TOKEN_PROGRAM_ID
            );
            
            // Send transaction
            const transaction = new Transaction().add(transferInstruction);
            
            console.log('📝 Sending transaction...');
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.wallet]
            );
            
            console.log('✅ Transfer successful!');
            console.log('Transaction Signature:', signature);
            console.log('Solscan URL:', `https://solscan.io/tx/${signature}?cluster=testnet`);
            console.log('');
            
            return signature;
        } catch (error) {
            throw new Error(`Failed to send GDI: ${error}`);
        }
    }

    /**
     * Get detailed token information
     */
    async getTokenInfo(): Promise<void> {
        try {
            console.log('🪙 GDI Token Information');
            console.log('='.repeat(40));
            console.log('Mint Address:', this.gdiMint.toString());
            console.log('Network:', this.rpcEndpoint);
            
            // Get mint info
            const mintInfo = await this.connection.getAccountInfo(this.gdiMint);
            if (mintInfo) {
                const token = new Token(
                    this.connection,
                    this.gdiMint,
                    TOKEN_PROGRAM_ID,
                    this.wallet
                );
                
                const mintAccount = await token.getMintInfo();
                console.log('Decimals:', mintAccount.decimals);
                console.log('Supply:', mintAccount.supply.toString());
                console.log('Is Initialized:', mintAccount.isInitialized);
                console.log('Mint Authority:', mintAccount.mintAuthority?.toString() || 'None');
                console.log('Freeze Authority:', mintAccount.freezeAuthority?.toString() || 'None');
            }
            
            console.log('');
        } catch (error) {
            console.error('Failed to get token info:', error);
        }
    }

    /**
     * Display Phantom-compatible wallet info for frontend integration
     */
    async getPhantomWalletInfo(): Promise<{
        publicKey: string;
        network: string;
        gdiMint: string;
        solBalance: number;
        gdiBalance: number;
        ata: string;
    }> {
        const solBalance = await this.connection.getBalance(this.wallet.publicKey);
        const ata = await this.getOrCreateATA();
        const gdiBalance = await this.getGDIBalance();
        
        const walletInfo = {
            publicKey: this.wallet.publicKey.toString(),
            network: this.rpcEndpoint,
            gdiMint: this.gdiMint.toString(),
            solBalance: solBalance / LAMPORTS_PER_SOL,
            gdiBalance,
            ata: ata.toString()
        };
        
        console.log('👻 Phantom-Compatible Wallet Info');
        console.log('='.repeat(40));
        console.log(JSON.stringify(walletInfo, null, 2));
        console.log('');
        
        return walletInfo;
    }

    /**
     * Check if wallet has sufficient GDI balance
     */
    async hasSufficientBalance(amount: number): Promise<boolean> {
        const balance = await this.getGDIBalance();
        const hasEnough = balance >= amount;
        
        console.log(`💳 Balance Check for ${amount} GDI:`);
        console.log('Current Balance:', balance, 'GDI');
        console.log('Required Amount:', amount, 'GDI');
        console.log('Sufficient:', hasEnough ? '✅' : '❌');
        console.log('');
        
        return hasEnough;
    }

    /**
     * Get transaction history for GDI token
     */
    async getTransactionHistory(limit: number = 10): Promise<void> {
        try {
            console.log('📜 GDI Transaction History');
            console.log('='.repeat(40));
            
            const signatures = await this.connection.getSignaturesForAddress(
                this.wallet.publicKey,
                { limit }
            );
            
            for (let i = 0; i < signatures.length; i++) {
                const sig = signatures[i];
                console.log(`${i + 1}. ${sig.signature}`);
                console.log(`   Block: ${sig.blockTime}`);
                console.log(`   Solscan: https://solscan.io/tx/${sig.signature}?cluster=testnet`);
                console.log('');
            }
        } catch (error) {
            console.error('Failed to get transaction history:', error);
        }
    }
}

// Export utility functions for easy use
export const createGDITokenUtils = (rpcEndpoint?: string) => {
    return new GDITokenUtils(rpcEndpoint);
};

// Export common constants
export const GDI_MINT_ADDRESS = '4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS';
export const TESTNET_RPC = 'https://api.testnet.solana.com';
export const MAINNET_RPC = 'https://api.mainnet-beta.solana.com'; 