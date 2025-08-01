# GDI Token Metadata Registration

This guide explains how to register the GDI token metadata on the Solana blockchain using the provided scripts.

## Prerequisites

1. Node.js (v14 or later) and npm installed
2. A Solana wallet with:
   - The private key for the wallet that has mint authority over the GDI token
   - At least 0.05 SOL for the transaction fee

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @metaplex-foundation/js @solana/web3.js
```

### 2. Prepare Your Wallet

1. Copy the `wallet.template.json` to `wallet.json` in the project root:
   ```bash
   cp wallet.template.json wallet.json
   ```

2. Open `wallet.json` and replace the array with your wallet's private key (as a Uint8Array).
   - **Important**: Never commit this file to version control.
   - Add `wallet.json` to your `.gitignore` file.

### 3. Verify Metadata Files

Ensure your metadata files are accessible at these URLs:
- `https://mkww.studio/metadata/gdi.json` (metadata JSON)
- `https://mkww.studio/assets/gdi.png` (token icon)

### 4. Run the Registration Script

```bash
node scripts/registerGDI.js
```

The script will:
1. Connect to the Solana mainnet
2. Verify your wallet and balance
3. Register the metadata for your GDI token
4. Provide a success message with a link to view the token on Solscan

## Troubleshooting

### Common Issues

1. **Wallet not found**
   - Ensure `wallet.json` exists in the project root
   - Verify the file contains a valid private key array

2. **Insufficient SOL**
   - Your wallet needs SOL to pay for the transaction
   - Fund your wallet with at least 0.05 SOL

3. **Metadata URI not accessible**
   - The script will warn you if it can't access your metadata JSON
   - Make sure the URL is correct and publicly accessible

4. **Mint already has metadata**
   - If the mint already has metadata, you'll need to update it instead
   - Use the `updateMetadata.js` script for updates

## Next Steps

After successful registration:
1. Your token will appear with its proper name and icon in wallets like Phantom
2. You can verify the metadata on Solscan by searching for your token mint address
3. The token will be recognized by all Solana applications and DEXs

## Security Notes

- Never share your private key or `wallet.json` file
- Consider using a dedicated wallet for deployment with limited funds
- Always verify transaction details before signing
