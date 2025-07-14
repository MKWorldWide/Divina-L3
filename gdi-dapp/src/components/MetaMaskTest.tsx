import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  Grid
} from '@mui/material';
import {
  AccountBalanceWallet,
  CheckCircle,
  Error,
  Send,
  Refresh,
  Info,
  Token,
  Casino,
} from '@mui/icons-material';
import { MetaMaskWalletButton } from './MetaMaskWalletButton';

// Quantum Documentation: The following import previously referenced a file outside the src/ directory, which is not allowed by Create React App's build system. To resolve this, the deployed-addresses-local.json file must be moved into the src/ directory, and the import path updated accordingly. This ensures the build process can include the file and avoids runtime errors. See CRA documentation for details: https://create-react-app.dev/docs/using-json-data/
import deployedAddresses from '../deployed-addresses-local.json';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
  details?: any;
}

export const MetaMaskTest: FC = () => {
  const { account, balance, provider, chainId } = useWallet();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [contracts, setContracts] = useState<any>({});
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('0.001');

  // Add test result
  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string, details?: any) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date(), details }]);
  };

  // Initialize contracts
  useEffect(() => {
    const setupContracts = async () => {
      if (provider && account) {
        const signer = await provider.getSigner();
        const contractInstances = {
          token: new ethers.Contract(
            deployedAddresses.token,
            [
              'function balanceOf(address owner) view returns (uint256)',
              'function transfer(address to, uint256 amount) returns (bool)',
              'function name() view returns (string)',
              'function symbol() view returns (string)',
              'function decimals() view returns (uint8)'
            ],
            signer
          ),
          gamingCore: new ethers.Contract(
            deployedAddresses.gamingCore,
            [
              'function createGame(string memory gameType, uint256 entryFee) returns (uint256)',
              'function joinGame(uint256 gameId) returns (bool)',
              'function getGameInfo(uint256 gameId) view returns (address, string, uint256, bool)'
            ],
            signer
          ),
          bridge: new ethers.Contract(
            deployedAddresses.bridge,
            [
              'function bridgeTokens(address token, uint256 amount, uint256 targetChainId) returns (bool)',
              'function getBridgeInfo() view returns (uint256, uint256)'
            ],
            signer
          )
        };
        setContracts(contractInstances);
      }
    };
    setupContracts();
  }, [provider, account]);

  // Test wallet connection
  const testConnection = () => {
    if (account && provider) {
      addTestResult('Wallet Connection', 'success', `Connected: ${account.slice(0, 8)}...`, { account, chainId });
    } else {
      addTestResult('Wallet Connection', 'error', 'Not connected');
    }
  };

  // Test network connection
  const testNetwork = () => {
    if (chainId === 31337) {
      addTestResult('Network Check', 'success', 'Connected to Localhost (Hardhat)', { chainId });
    } else {
      addTestResult('Network Check', 'error', `Wrong network. Expected: 31337, Got: ${chainId}`);
    }
  };

  // Test contract deployment
  const testContractDeployment = async () => {
    if (!provider) {
      addTestResult('Contract Deployment', 'error', 'Provider not available');
      return;
    }

    try {
      const code = await provider.getCode(deployedAddresses.token);
      if (code !== '0x') {
        addTestResult('Contract Deployment', 'success', 'GDI Token contract deployed', { address: deployedAddresses.token });
      } else {
        addTestResult('Contract Deployment', 'error', 'GDI Token contract not found');
      }
    } catch (error) {
      addTestResult('Contract Deployment', 'error', `Failed: ${error}`);
    }
  };

  // Test token balance
  const testTokenBalance = async () => {
    if (!contracts.token || !account) {
      addTestResult('Token Balance', 'error', 'Token contract or account not available');
      return;
    }

    try {
      const balance = await contracts.token.balanceOf(account);
      const name = await contracts.token.name();
      const symbol = await contracts.token.symbol();
      const decimals = await contracts.token.decimals();
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      addTestResult('Token Balance', 'success', `${formattedBalance} ${symbol}`, { 
        balance: formattedBalance, 
        symbol, 
        name,
        decimals 
      });
    } catch (error) {
      addTestResult('Token Balance', 'error', `Failed: ${error}`);
    }
  };

  // Test token transfer
  const testTokenTransfer = async () => {
    if (!contracts.token || !account || !recipientAddress) {
      addTestResult('Token Transfer', 'error', 'Missing contract, account, or recipient address');
      return;
    }

    try {
      const amount = ethers.parseEther('1'); // Transfer 1 token
      const tx = await contracts.token.transfer(recipientAddress, amount);
      await tx.wait();
      
      addTestResult('Token Transfer', 'success', 'Token transfer successful', { 
        txHash: tx.hash,
        recipient: recipientAddress,
        amount: '1'
      });
    } catch (error) {
      addTestResult('Token Transfer', 'error', `Failed: ${error}`);
    }
  };

  // Test ETH transfer
  const testETHTransfer = async () => {
    if (!provider || !account || !recipientAddress) {
      addTestResult('ETH Transfer', 'error', 'Missing provider, account, or recipient address');
      return;
    }

    try {
      const signer = await provider.getSigner();
      const amount = ethers.parseEther(transferAmount);
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: amount
      });
      await tx.wait();
      
      addTestResult('ETH Transfer', 'success', `ETH transfer successful`, { 
        txHash: tx.hash,
        recipient: recipientAddress,
        amount: transferAmount
      });
    } catch (error) {
      addTestResult('ETH Transfer', 'error', `Failed: ${error}`);
    }
  };

  // Test gaming operations
  const testGamingOperations = async () => {
    if (!contracts.gamingCore || !account) {
      addTestResult('Gaming Operations', 'error', 'Gaming contract or account not available');
      return;
    }

    try {
      // Create a game
      const createTx = await contracts.gamingCore.createGame('Test Game', ethers.parseEther('0.01'));
      await createTx.wait();
      
      // Get game info
      const gameInfo = await contracts.gamingCore.getGameInfo(0);
      
      addTestResult('Gaming Operations', 'success', 'Game created successfully', { 
        gameId: 0,
        gameType: gameInfo[1],
        entryFee: ethers.formatEther(gameInfo[2])
      });
    } catch (error) {
      addTestResult('Gaming Operations', 'error', `Failed: ${error}`);
    }
  };

  // Test bridge operations
  const testBridgeOperations = async () => {
    if (!contracts.bridge || !account) {
      addTestResult('Bridge Operations', 'error', 'Bridge contract or account not available');
      return;
    }

    try {
      const bridgeInfo = await contracts.bridge.getBridgeInfo();
      addTestResult('Bridge Operations', 'success', 'Bridge info retrieved', { 
        bridgeInfo: bridgeInfo.toString()
      });
    } catch (error) {
      addTestResult('Bridge Operations', 'error', `Failed: ${error}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults([]);
    setLoading(true);
    
    try {
      testConnection();
      testNetwork();
      await testContractDeployment();
      await testTokenBalance();
      await testGamingOperations();
      await testBridgeOperations();
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        🦊 MetaMask Integration Test - GameDin L3
      </Typography>

      <Grid container spacing={3}>
        {/* Wallet Connection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Wallet Connection
              </Typography>
              <MetaMaskWalletButton
                onConnect={(address) => {
                  addTestResult('Wallet Connection', 'success', `Connected: ${address.slice(0, 8)}...`);
                }}
                onDisconnect={() => {
                  addTestResult('Wallet Connection', 'error', 'Disconnected');
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Transfer Controls */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transfer Controls
              </Typography>
              <TextField
                fullWidth
                label="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Transfer Amount (ETH)"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                type="number"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={testETHTransfer}
                disabled={!account || !recipientAddress}
                startIcon={<Send />}
                fullWidth
              >
                Send ETH
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Controls
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={runAllTests}
              startIcon={<CheckCircle />}
              disabled={!account || loading}
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button
              variant="outlined"
              onClick={testConnection}
              disabled={!account}
            >
              Test Connection
            </Button>
            <Button
              variant="outlined"
              onClick={testNetwork}
              disabled={!account}
            >
              Test Network
            </Button>
            <Button
              variant="outlined"
              onClick={testTokenBalance}
              disabled={!account}
              startIcon={<Token />}
            >
              Test Token Balance
            </Button>
            <Button
              variant="outlined"
              onClick={testGamingOperations}
              disabled={!account}
              startIcon={<Casino />}
            >
              Test Gaming
            </Button>
            <Button
              variant="outlined"
              onClick={testBridgeOperations}
              disabled={!account}
              startIcon={<AccountBalanceWallet />}
            >
              Test Bridge
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          {testResults.length === 0 ? (
            <Alert severity="info" icon={<Info />}>
              No tests run yet. Connect your MetaMask wallet and run tests to see results.
            </Alert>
          ) : (
            <List>
              {testResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {result.status === 'success' ? (
                        <CheckCircle color="success" />
                      ) : result.status === 'error' ? (
                        <Error color="error" />
                      ) : (
                        <CircularProgress size={20} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.test}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {result.message}
                          </Typography>
                          {result.details && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {JSON.stringify(result.details, null, 2)}
                            </Typography>
                          )}
                          <Chip
                            label={result.timestamp.toLocaleTimeString()}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < testResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}; 