import { GDITokenUtils, createGDITokenUtils } from '../utils/gdi-token-utils';
import { PublicKey } from '@solana/web3.js';

/**
 * Phantom Wallet Integration Example
 * 
 * This example shows how to integrate GDI token utilities with Phantom wallet
 * for frontend applications. It demonstrates:
 * - Connecting to Phantom wallet
 * - Getting wallet information
 * - Checking GDI balance
 * - Sending GDI tokens
 * - Displaying Phantom-compatible data
 */

// Phantom wallet interface (for TypeScript)
interface PhantomProvider {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: (args: any) => void) => void;
    publicKey: PublicKey | null;
    signTransaction: (transaction: any) => Promise<any>;
    signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

// Extend window object for Phantom
declare global {
    interface Window {
        phantom?: {
            solana?: PhantomProvider;
        };
    }
}

export class PhantomGDIIntegration {
    private utils: GDITokenUtils;
    private provider: PhantomProvider | null = null;

    constructor() {
        this.utils = createGDITokenUtils();
    }

    /**
     * Connect to Phantom wallet
     */
    async connectPhantom(): Promise<PublicKey | null> {
        try {
            // Check if Phantom is installed
            if (!window.phantom?.solana?.isPhantom) {
                throw new Error('Phantom wallet is not installed!');
            }

            this.provider = window.phantom.solana!;

            // Connect to wallet
            const response = await this.provider.connect();
            const publicKey = response.publicKey;

            console.log('👻 Connected to Phantom wallet:', publicKey.toString());
            return publicKey;
        } catch (error) {
            console.error('Failed to connect to Phantom:', error);
            return null;
        }
    }

    /**
     * Disconnect from Phantom wallet
     */
    async disconnectPhantom(): Promise<void> {
        if (this.provider) {
            await this.provider.disconnect();
            this.provider = null;
            console.log('👻 Disconnected from Phantom wallet');
        }
    }

    /**
     * Get Phantom wallet information
     */
    async getPhantomWalletInfo(): Promise<any> {
        if (!this.provider?.publicKey) {
            throw new Error('Phantom wallet not connected');
        }

        const publicKey = this.provider.publicKey;
        
        // Get wallet info using our utilities
        const walletInfo = await this.utils.getPhantomWalletInfo();
        
        // Add Phantom-specific information
        const phantomInfo = {
            ...walletInfo,
            isPhantom: true,
            provider: 'Phantom',
            connected: true,
            publicKey: publicKey.toString()
        };

        console.log('👻 Phantom Wallet Info:', phantomInfo);
        return phantomInfo;
    }

    /**
     * Get GDI balance for Phantom wallet
     */
    async getPhantomGDIBalance(): Promise<number> {
        if (!this.provider?.publicKey) {
            throw new Error('Phantom wallet not connected');
        }

        const publicKey = this.provider.publicKey;
        const balance = await this.utils.getGDIBalance(publicKey);
        
        console.log(`💰 Phantom GDI Balance: ${balance} GDI`);
        return balance;
    }

    /**
     * Send GDI tokens from Phantom wallet
     * Note: This would require Phantom to sign the transaction
     */
    async sendGDIFromPhantom(recipient: string, amount: number): Promise<string | null> {
        if (!this.provider?.publicKey) {
            throw new Error('Phantom wallet not connected');
        }

        const senderPublicKey = this.provider.publicKey;
        
        // Check balance first
        const hasEnough = await this.utils.hasSufficientBalance(amount);
        if (!hasEnough) {
            throw new Error('Insufficient GDI balance');
        }

        // For actual Phantom integration, you would need to:
        // 1. Create the transaction
        // 2. Have Phantom sign it
        // 3. Send the signed transaction
        
        console.log(`📤 Would send ${amount} GDI from Phantom to ${recipient}`);
        console.log('Note: This is a demonstration. Actual implementation requires Phantom transaction signing.');
        
        return null;
    }

    /**
     * Display Phantom wallet status
     */
    async showPhantomStatus(): Promise<void> {
        console.log('👻 Phantom Wallet Status');
        console.log('='.repeat(40));
        
        if (!this.provider) {
            console.log('Status: Not connected');
            console.log('Action: Call connectPhantom() to connect');
            return;
        }

        if (!this.provider.publicKey) {
            console.log('Status: Provider available but not connected');
            console.log('Action: Call connectPhantom() to connect');
            return;
        }

        console.log('Status: Connected');
        console.log('Public Key:', this.provider.publicKey.toString());
        console.log('Is Phantom:', this.provider.isPhantom);
        
        // Get wallet info
        try {
            const walletInfo = await this.getPhantomWalletInfo();
            console.log('SOL Balance:', walletInfo.solBalance, 'SOL');
            console.log('GDI Balance:', walletInfo.gdiBalance, 'GDI');
        } catch (error) {
            console.log('Error getting wallet info:', error);
        }
    }

    /**
     * Listen for Phantom wallet events
     */
    setupPhantomEventListeners(): void {
        if (!this.provider) {
            console.log('Phantom provider not available');
            return;
        }

        // Listen for account changes
        this.provider.on('accountChanged', (publicKey: PublicKey | null) => {
            if (publicKey) {
                console.log('👻 Phantom account changed:', publicKey.toString());
            } else {
                console.log('👻 Phantom account disconnected');
            }
        });

        // Listen for connection changes
        this.provider.on('connect', () => {
            console.log('👻 Phantom wallet connected');
        });

        this.provider.on('disconnect', () => {
            console.log('👻 Phantom wallet disconnected');
        });

        console.log('✅ Phantom event listeners set up');
    }
}

/**
 * Example usage functions
 */
export const phantomExamples = {
    /**
     * Complete Phantom integration example
     */
    async runCompleteExample(): Promise<void> {
        console.log('🚀 Running Phantom Integration Example...\n');
        
        const integration = new PhantomGDIIntegration();
        
        try {
            // 1. Connect to Phantom
            console.log('1. Connecting to Phantom wallet...');
            const publicKey = await integration.connectPhantom();
            
            if (!publicKey) {
                console.log('❌ Failed to connect to Phantom');
                return;
            }
            
            // 2. Set up event listeners
            console.log('\n2. Setting up event listeners...');
            integration.setupPhantomEventListeners();
            
            // 3. Show wallet status
            console.log('\n3. Showing wallet status...');
            await integration.showPhantomStatus();
            
            // 4. Get GDI balance
            console.log('\n4. Getting GDI balance...');
            const balance = await integration.getPhantomGDIBalance();
            
            // 5. Show Phantom-compatible info
            console.log('\n5. Getting Phantom-compatible wallet info...');
            await integration.getPhantomWalletInfo();
            
            console.log('\n✅ Phantom integration example completed!');
            
        } catch (error) {
            console.error('❌ Error in Phantom integration example:', error);
        }
    },

    /**
     * Quick balance check example
     */
    async quickBalanceCheck(): Promise<void> {
        console.log('💰 Quick GDI Balance Check...\n');
        
        const integration = new PhantomGDIIntegration();
        
        try {
            const publicKey = await integration.connectPhantom();
            if (publicKey) {
                const balance = await integration.getPhantomGDIBalance();
                console.log(`Current GDI Balance: ${balance} GDI`);
            }
        } catch (error) {
            console.error('Error checking balance:', error);
        }
    }
};

// Export for use in other modules
export default PhantomGDIIntegration; 