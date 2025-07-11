# Quick Start Guide

Get up and running with GameDin L3 Gaming Blockchain in under 10 minutes!

## 🚀 One-Command Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/gamedin/gamedin-l3-gaming-blockchain.git
cd gamedin-l3-gaming-blockchain

# Run the complete setup
./GameDin_AthenaMist_Complete_Launch.sh development
```

This will:
- ✅ Install all dependencies
- ✅ Setup local blockchain
- ✅ Deploy smart contracts
- ✅ Start all services
- ✅ Launch the frontend

## 🛠️ Manual Setup

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version
- **MetaMask**: Browser extension

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/gamedin/gamedin-l3-gaming-blockchain.git
cd gamedin-l3-gaming-blockchain

# Install dependencies
npm install
```

### Step 2: Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
# (See Environment Variables section below)
```

### Step 3: Start Local Blockchain

```bash
# Start local Hardhat node
npm run start:node
```

### Step 4: Deploy Contracts

```bash
# In a new terminal, deploy contracts
npm run deploy:local
```

### Step 5: Start Services

```bash
# Start all services
npm run start:all
```

### Step 6: Access Your Application

- **Frontend**: http://localhost:3000
- **Blockchain RPC**: http://localhost:8545
- **Gaming WebSocket**: ws://localhost:9546
- **Monitoring**: http://localhost:3001

## 🔧 Environment Variables

### Required Variables

```bash
# Blockchain Configuration
PRIVATE_KEY=your_private_key_here
RPC_URL=http://localhost:8545
CHAIN_ID=31337

# AI Services (Optional)
ATHENAMIST_API_KEY=your_athenamist_key
NOVASANCTUM_API_KEY=your_novasanctum_key
ENABLE_UNIFIED_AI=true

# Database (Optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/gamedin
REDIS_URL=redis://localhost:6379
```

### Optional Variables

```bash
# Monitoring
ENABLE_MONITORING=true
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# External Services
ETHERSCAN_API_KEY=your_etherscan_key
ALCHEMY_API_KEY=your_alchemy_key
```

## 🎮 Testing Your Setup

### 1. Connect MetaMask

1. Install MetaMask browser extension
2. Add localhost:8545 to networks
3. Import test account with private key from deployment
4. Connect to the application

### 2. Test Basic Functions

```bash
# Check token balance
npm run gdi:balance

# Send test transaction
npm run gdi:send

# Check system status
npm run gdi:info
```

### 3. Test Gaming Features

1. Navigate to http://localhost:3000
2. Connect your wallet
3. Try token operations
4. Test gaming features
5. Check AI insights

## 📱 Frontend Features

### Dashboard
- Real-time token balance
- Transaction history
- Gaming statistics
- AI-powered insights

### Gaming
- Token transfers
- NFT marketplace
- Tournament participation
- Achievement system

### Analytics
- Player behavior analysis
- Performance metrics
- Fraud detection alerts
- Predictive insights

## 🔗 Integration Examples

### Unity Integration

```csharp
// Connect to GameDin L3
using GameDinSDK;

public class GameDinManager : MonoBehaviour
{
    private GameDinClient client;
    
    void Start()
    {
        client = new GameDinClient("ws://localhost:9546");
        client.Connect();
    }
    
    public async void SendTransaction(string to, decimal amount)
    {
        var result = await client.SendToken(to, amount);
        Debug.Log($"Transaction: {result.Hash}");
    }
}
```

### React Integration

```javascript
import { useGameDin } from '@gamedin/react-sdk';

function GameComponent() {
    const { connect, sendTransaction, balance } = useGameDin();
    
    const handleTransfer = async () => {
        await sendTransaction('0x...', '100');
    };
    
    return (
        <div>
            <p>Balance: {balance} GDI</p>
            <button onClick={handleTransfer}>Send Tokens</button>
        </div>
    );
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes using ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8545 | xargs kill -9
```

#### 2. Contract Deployment Fails
```bash
# Reset local blockchain
npm run start:node -- --reset
npm run deploy:local
```

#### 3. Frontend Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

#### 4. MetaMask Connection Issues
- Ensure localhost:8545 is added to networks
- Check that Chain ID is 31337
- Import correct private key

### Getting Help

- **Documentation**: [Full Documentation](README.md)
- **Issues**: [GitHub Issues](https://github.com/gamedin/gamedin-l3-gaming-blockchain/issues)
- **Discord**: [Community Support](https://discord.gg/gamedin)
- **Email**: support@gamedin.com

## 🚀 Next Steps

### For Developers
1. **Explore the Codebase**: Check out the smart contracts and frontend
2. **Run Tests**: `npm run test`
3. **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md)
4. **Build Games**: Use the SDK to create games

### For Operators
1. **Production Deployment**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Monitoring Setup**: Configure Grafana and Prometheus
3. **Security Audit**: Review security best practices
4. **Performance Tuning**: Optimize for your use case

### For Business
1. **Market Analysis**: Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. **Economic Model**: Understand tokenomics and revenue
3. **Partnership**: Contact business@gamedin.com
4. **Integration**: Plan your game integration

## 📚 Additional Resources

- **[API Reference](docs/API_REFERENCE.md)**: Complete API documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)**: System design overview
- **[Security Guide](SECURITY.md)**: Security best practices
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Production deployment

---

**🎮 Ready to build the future of gaming? Let's go! 🚀** 