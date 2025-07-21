import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
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
  Chip
} from '@mui/material';
import {
  AccountBalanceWallet,
  CheckCircle,
  Error,
  Send,
  Refresh,
  Info
} from '@mui/icons-material';
import { PhantomWalletButton } from './PhantomWalletButton';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

export const PhantomWalletTest: FC = () => {
  const { publicKey, connected, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Add test result
  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  // Fetch balance
  const fetchBalance = async () => {
    if (!publicKey || !connected) return;
    
    try {
      setLoading(true);
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
      addTestResult('Balance Check', 'success', `Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      addTestResult('Balance Check', 'error', `Failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Test wallet connection
  const testConnection = () => {
    if (connected && publicKey) {
      addTestResult('Wallet Connection', 'success', `Connected: ${publicKey.toString().slice(0, 8)}...`);
    } else {
      addTestResult('Wallet Connection', 'error', 'Not connected');
    }
  };

  // Test message signing
  const testMessageSigning = async () => {
    if (!connected || !signMessage) {
      addTestResult('Message Signing', 'error', 'Wallet not connected or signing not supported');
      return;
    }

    try {
      const message = new TextEncoder().encode('GameDin L3 Test Message');
      const signature = await signMessage(message);
      addTestResult('Message Signing', 'success', `Signature: ${signature.slice(0, 16)}...`);
    } catch (error) {
      addTestResult('Message Signing', 'error', `Failed: ${error}`);
    }
  };

  // Test transaction signing
  const testTransactionSigning = async () => {
    if (!connected || !signTransaction) {
      addTestResult('Transaction Signing', 'error', 'Wallet not connected or transaction signing not supported');
      return;
    }

    try {
      // Create a simple transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: publicKey!, // for test, send to self
          lamports: 1,
        })
      );
      transaction.recentBlockhash = '11111111111111111111111111111111';
      transaction.feePayer = publicKey!;
      const signedTx = await signTransaction(transaction);
      addTestResult('Transaction Signing', 'success', 'Transaction signed successfully');
    } catch (error) {
      addTestResult('Transaction Signing', 'error', `Failed: ${error}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults([]);
    testConnection();
    await fetchBalance();
    await testMessageSigning();
    await testTransactionSigning();
  };

  // Auto-run tests when wallet connects
  useEffect(() => {
    if (connected) {
      runAllTests();
    }
  }, [connected]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        🦊 Phantom Wallet Integration Test
      </Typography>

      {/* Wallet Connection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Wallet Connection
          </Typography>
          <PhantomWalletButton
            onConnect={(publicKey) => {
              addTestResult('Wallet Connection', 'success', `Connected: ${publicKey.slice(0, 8)}...`);
            }}
            onDisconnect={() => {
              addTestResult('Wallet Connection', 'error', 'Disconnected');
            }}
          />
        </CardContent>
      </Card>

      {/* Balance Display */}
      {connected && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Wallet Balance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h5" color="primary">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : 'N/A'}
                </Typography>
              )}
              <Button
                startIcon={<Refresh />}
                onClick={fetchBalance}
                disabled={loading}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

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
              disabled={!connected}
            >
              Run All Tests
            </Button>
            <Button
              variant="outlined"
              onClick={testConnection}
              disabled={!connected}
            >
              Test Connection
            </Button>
            <Button
              variant="outlined"
              onClick={testMessageSigning}
              disabled={!connected}
            >
              Test Message Signing
            </Button>
            <Button
              variant="outlined"
              onClick={testTransactionSigning}
              disabled={!connected}
            >
              Test Transaction Signing
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
              No tests run yet. Connect your wallet and run tests to see results.
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