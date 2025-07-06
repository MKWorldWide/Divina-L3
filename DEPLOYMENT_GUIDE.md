# 🚀 GDI Token Deployment Guide

**Step-by-step guide to deploy GameDin (GDI) token metadata and create Raydium liquidity pool**

## 📋 Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] Node.js 16+ installed
- [ ] Solana CLI tools installed
- [ ] Metaplex CLI installed
- [ ] Wallet with sufficient SOL (recommended: 0.1 SOL)
- [ ] GDI tokens for initial liquidity
- [ ] GDI logo image (PNG format, recommended: 512x512px)

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify installation
node --version
npm --version
```

### 2. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env
```

**Required .env variables:**
```env
WALLET_PRIVATE_KEY=[your-wallet-private-key-array]
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
GDI_MINT_ADDRESS=4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS
```

### 3. Add GDI Logo

```bash
# Place your GDI logo in the assets folder
cp /path/to/your/gdi-logo.png assets/gdi-logo.png
```

## 🎯 Deployment Steps

### Step 1: Deploy Metadata (Required)

This step uploads your token metadata to Arweave and sets it on-chain.

```bash
# Deploy metadata only
npm run deploy:metadata
```

**Expected Output:**
```
🚀 Starting GDI Token Metadata Deployment...
📡 Connected to Solana network: https://api.mainnet-beta.solana.com
👛 Wallet address: [your-wallet-address]
📤 Uploading GDI logo to Arweave...
✅ Logo uploaded: https://arweave.net/[logo-hash]
📋 Preparing metadata...
📤 Uploading metadata to Arweave...
✅ Metadata uploaded: https://arweave.net/[metadata-hash]
🔗 Setting on-chain metadata...
✅ On-chain metadata set successfully!
📝 Transaction signature: [tx-signature]
```

### Step 2: Create Raydium Pool (Required)

This step creates the USDC/GDI trading pair on Raydium.

```bash
# Create Raydium pool
npm run deploy:pool
```

**Expected Output:**
```
🏊 Creating Raydium USDC/GDI Liquidity Pool...
📡 Connected to Solana network: https://api.mainnet-beta.solana.com
👛 Wallet address: [your-wallet-address]
🪙 Token Configuration:
   GDI Mint: 4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS
   USDC Mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
⚙️ Pool Configuration:
   Fee Rate: 0.25%
   Owner Fee Rate: 0.05%
🔑 Pool Keys Generated:
   Pool ID: [pool-id]
   Base Vault: [base-vault]
   Quote Vault: [quote-vault]
   LP Mint: [lp-mint]
✅ Pool created successfully!
```

### Step 3: Add Initial Liquidity (Recommended)

Add initial liquidity to make the pool tradeable.

```bash
# The pool creation script will automatically add initial liquidity
# If you need to add more liquidity manually, edit the amounts in:
# scripts/create-raydium-pool.js
```

### Step 4: Revoke Authorities (Security)

Revoke mint and freeze authorities for maximum security.

```bash
# Revoke authorities
npm run revoke
```

**Expected Output:**
```
🔒 Revoking GDI Token Authorities for Security...
⚠️  WARNING: This action is irreversible!
📊 Current Mint Information:
   Mint Authority: [authority-address]
   Freeze Authority: [authority-address]
🔓 Revoking mint authority...
🔓 Revoking freeze authority...
✅ Authorities revoked successfully!
🔒 Security Status:
   ✅ Mint Authority: REVOKED
   ✅ Freeze Authority: REVOKED
   ✅ Token Supply: LOCKED
```

## 🔍 Verification Steps

### 1. Check Deployment Status

```bash
npm run status
```

### 2. Verify on Block Explorers

- **Solscan**: https://solscan.io/token/4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS
- **Solana Explorer**: https://explorer.solana.com/address/4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS

### 3. Check Authority Status

```bash
npm run check-authorities
```

### 4. Test on Raydium

1. Go to https://raydium.io/swap
2. Search for "GDI" or paste the mint address
3. Verify the token appears with correct metadata
4. Test a small swap (if liquidity is available)

## 🚨 Troubleshooting

### Common Issues

**1. Insufficient SOL Balance**
```bash
# Check balance
solana balance [your-wallet-address]

# If on devnet, airdrop SOL
solana airdrop 2 [your-wallet-address] --url devnet
```

**2. Transaction Failures**
- Check network congestion
- Verify wallet has sufficient SOL
- Ensure all dependencies are installed correctly

**3. Metadata Upload Failures**
- Verify Arweave connectivity
- Check logo file size (should be < 5MB)
- Ensure logo is PNG format

**4. Pool Creation Failures**
- Verify both tokens exist and are initialized
- Check wallet has sufficient tokens for initial liquidity
- Ensure Raydium program is accessible

### Error Recovery

**If metadata deployment fails:**
```bash
# Retry metadata deployment
npm run deploy:metadata
```

**If pool creation fails:**
```bash
# Retry pool creation
npm run deploy:pool
```

**If authority revocation fails:**
```bash
# Check current status
npm run check-authorities

# Retry revocation
npm run revoke
```

## 📊 Post-Deployment Checklist

After successful deployment, verify:

- [ ] Token metadata appears correctly on block explorers
- [ ] Token is visible on Raydium with correct logo and info
- [ ] Authorities are properly revoked
- [ ] Pool has sufficient liquidity for trading
- [ ] All transaction signatures are recorded
- [ ] Deployment logs are saved

## 🔗 Useful Commands

```bash
# Complete deployment (all steps)
npm run deploy

# Individual steps
npm run deploy:metadata    # Deploy metadata only
npm run deploy:pool        # Create pool only
npm run revoke            # Revoke authorities only

# Status and verification
npm run status            # Check deployment status
npm run check-authorities # Check authority status

# Custom deployment
npm run deploy -- --skip-metadata  # Skip metadata
npm run deploy -- --skip-pool      # Skip pool creation
npm run deploy -- --skip-revoke    # Skip authority revocation
```

## 📞 Support

If you encounter issues:

1. Check the deployment logs in `deployment-log.json`
2. Verify all environment variables are set correctly
3. Test on devnet first
4. Review Solana network status
5. Check Raydium documentation

## ⚠️ Important Notes

- **Always test on devnet first** before deploying to mainnet
- **Keep your wallet private key secure** and never share it
- **Authority revocation is irreversible** - ensure you're ready
- **Monitor the pool** after deployment for any issues
- **Save all transaction signatures** for future reference

---

**🎉 Congratulations!** Your GDI token is now deployed and ready for trading on Raydium! 