#!/usr/bin/env node

import { GDITokenUtils, createGDITokenUtils } from '../utils/gdi-token-utils';
import { PublicKey } from '@solana/web3.js';

/**
 * GDI Token CLI - Command Line Interface
 * 
 * Usage examples:
 *   npm run gdi:balance
 *   npm run gdi:send <recipient> <amount>
 *   npm run gdi:info
 *   npm run gdi:phantom
 *   npm run gdi:history
 */

class GDICLI {
    private utils: GDITokenUtils;

    constructor() {
        this.utils = createGDITokenUtils();
    }

    /**
     * Main CLI entry point
     */
    async run(): Promise<void> {
        const args = process.argv.slice(2);
        const command = args[0];

        try {
            switch (command) {
                case 'balance':
                    await this.showBalance();
                    break;
                case 'send':
                    await this.sendTokens(args[1], parseFloat(args[2]));
                    break;
                case 'info':
                    await this.showInfo();
                    break;
                case 'phantom':
                    await this.showPhantomInfo();
                    break;
                case 'history':
                    await this.showHistory(parseInt(args[1]) || 10);
                    break;
                case 'check':
                    await this.checkBalance(parseFloat(args[1]));
                    break;
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('❌ Error:', error);
            process.exit(1);
        }
    }

    /**
     * Show GDI token balance
     */
    async showBalance(): Promise<void> {
        console.log('🔍 Checking GDI Token Balance...\n');
        await this.utils.getWalletInfo();
        await this.utils.getGDIBalance();
    }

    /**
     * Send GDI tokens
     */
    async sendTokens(recipient: string, amount: number): Promise<void> {
        if (!recipient || !amount || amount <= 0) {
            console.error('❌ Invalid arguments. Usage: npm run gdi:send <recipient> <amount>');
            process.exit(1);
        }

        console.log('📤 Sending GDI Tokens...\n');
        
        // Validate recipient address
        try {
            new PublicKey(recipient);
        } catch (error) {
            console.error('❌ Invalid recipient address:', recipient);
            process.exit(1);
        }

        // Check balance before sending
        const hasEnough = await this.utils.hasSufficientBalance(amount);
        if (!hasEnough) {
            console.error('❌ Insufficient GDI balance for transfer');
            process.exit(1);
        }

        // Send tokens
        await this.utils.sendGDI(recipient, amount);
    }

    /**
     * Show wallet and token information
     */
    async showInfo(): Promise<void> {
        console.log('📊 Wallet & Token Information...\n');
        await this.utils.getWalletInfo();
        await this.utils.getTokenInfo();
    }

    /**
     * Show Phantom-compatible wallet information
     */
    async showPhantomInfo(): Promise<void> {
        console.log('👻 Phantom Wallet Information...\n');
        await this.utils.getPhantomWalletInfo();
    }

    /**
     * Show transaction history
     */
    async showHistory(limit: number): Promise<void> {
        console.log(`📜 Transaction History (Last ${limit} transactions)...\n`);
        await this.utils.getTransactionHistory(limit);
    }

    /**
     * Check if wallet has sufficient balance
     */
    async checkBalance(amount: number): Promise<void> {
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount. Usage: npm run gdi:check <amount>');
            process.exit(1);
        }

        console.log(`💳 Checking balance for ${amount} GDI...\n`);
        await this.utils.hasSufficientBalance(amount);
    }

    /**
     * Show help information
     */
    showHelp(): void {
        console.log('🪙 GDI Token CLI - Command Line Interface');
        console.log('='.repeat(50));
        console.log('');
        console.log('Available Commands:');
        console.log('');
        console.log('  npm run gdi:balance');
        console.log('    Show GDI token balance and wallet info');
        console.log('');
        console.log('  npm run gdi:send <recipient> <amount>');
        console.log('    Send GDI tokens to another wallet');
        console.log('    Example: npm run gdi:send 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 10.5');
        console.log('');
        console.log('  npm run gdi:info');
        console.log('    Show detailed wallet and token information');
        console.log('');
        console.log('  npm run gdi:phantom');
        console.log('    Show Phantom-compatible wallet information');
        console.log('');
        console.log('  npm run gdi:history [limit]');
        console.log('    Show transaction history (default: 10 transactions)');
        console.log('    Example: npm run gdi:history 20');
        console.log('');
        console.log('  npm run gdi:check <amount>');
        console.log('    Check if wallet has sufficient GDI balance');
        console.log('    Example: npm run gdi:check 100');
        console.log('');
        console.log('  npm run gdi:help');
        console.log('    Show this help information');
        console.log('');
        console.log('Configuration:');
        console.log('  - Uses Solana CLI wallet: ~/.config/solana/id.json');
        console.log('  - Network: Testnet (https://api.testnet.solana.com)');
        console.log('  - GDI Mint: 4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS');
        console.log('');
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new GDICLI();
    cli.run().catch(console.error);
}

export { GDICLI }; 