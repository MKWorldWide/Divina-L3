# GDI Token DApp

A React TypeScript DApp for interacting with the GameDin (GDI) token on Solana testnet.

## 🚀 Features

- **Phantom Wallet Integration**: Connect and interact with Phantom wallet
- **GDI Token Balance**: View your GDI token balance
- **Token Transfers**: Send GDI tokens to other wallets
- **Testnet Support**: Built for Solana testnet
- **Modern UI**: Clean, responsive interface with Tailwind CSS

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Solana Web3.js** for blockchain interaction
- **@solana/wallet-adapter-react** for wallet integration
- **@solana/spl-token** for token operations
- **Tailwind CSS** for styling

## 📦 Installation

1. **Clone and navigate to the project:**
   ```bash
   cd gdi-dapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_SOLANA_RPC=https://api.testnet.solana.com
```

### GDI Token Details

- **Mint Address**: `4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS`
- **Network**: Solana Testnet
- **Decimals**: 9

## 🎯 Usage

1. **Connect Wallet**: Click the "Connect Wallet" button and select Phantom
2. **View Balance**: Your GDI balance will be displayed automatically
3. **Send Tokens**: Enter recipient address and amount, then click "Send GDI"

## 📁 Project Structure

```
gdi-dapp/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx                 # Main app component
│   ├── index.tsx               # App entry point
│   ├── index.css               # Global styles with Tailwind
│   ├── wallet/
│   │   └── WalletConnectionProvider.tsx  # Phantom wallet integration
│   ├── components/
│   │   ├── Balance.tsx         # GDI balance display
│   │   └── TransferForm.tsx    # Token transfer form
│   └── utils/
│       └── gdiUtils.ts         # GDI token utilities
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔗 Links

- **GDI Token**: `4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS`
- **Solana Explorer**: https://explorer.solana.com/?cluster=testnet
- **Solscan**: https://solscan.io/?cluster=testnet

## 🚨 Important Notes

- This DApp runs on **Solana Testnet**
- You need **testnet SOL** for transaction fees
- **Phantom wallet** must be installed and configured for testnet
- GDI tokens must be available in your wallet for transfers

## 🐛 Troubleshooting

### Common Issues

1. **"Connect your wallet first!"**
   - Make sure Phantom is installed and connected
   - Ensure you're on testnet in Phantom settings

2. **"Insufficient balance"**
   - Check your GDI token balance
   - Ensure you have testnet SOL for transaction fees

3. **Transaction failures**
   - Verify recipient address is valid
   - Check network connectivity
   - Ensure sufficient SOL for fees

## 📄 License

MIT License - see LICENSE file for details

---

**🎮 GameDin Token DApp** - Built for the future of gaming on Solana! 