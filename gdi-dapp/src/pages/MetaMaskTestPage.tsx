import React from 'react';
import { Box, Container, Typography, Paper, Alert } from '@mui/material';
import { MetaMaskTest } from '../components/MetaMaskTest';

export const MetaMaskTestPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 3 }}>
          🦊 MetaMask Integration Testing - GameDin L3
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Test the MetaMask wallet integration with GameDin L3 smart contracts. This page allows you to connect your MetaMask wallet,
          interact with deployed contracts, and verify all gaming platform functionality.
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Prerequisites:</strong> Make sure you have MetaMask installed and connected to localhost:8545 (Hardhat network).
          The local blockchain node should be running with our deployed contracts.
        </Typography>
      </Alert>

      <MetaMaskTest />

      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Testing Instructions:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Install MetaMask:</strong> Download and install MetaMask browser extension from metamask.io
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Add Localhost Network:</strong> In MetaMask, add network: localhost:8545, Chain ID: 31337
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Import Test Account:</strong> Import the Hardhat test account with private key from the deployment logs
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Connect Wallet:</strong> Click "Connect MetaMask" to establish connection
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Run Tests:</strong> Use "Run All Tests" to verify all functionality
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Test Features:</strong> Test wallet connection, token operations, gaming, and bridge functionality
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Deployed Contract Addresses:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
            <strong>GDI Token:</strong> 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
            <strong>Gaming Core:</strong> 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
            <strong>Bridge:</strong> 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
            <strong>NFT Marketplace:</strong> 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Test Account Details:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
            <strong>Address:</strong> 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
            <strong>Private Key:</strong> 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Balance:</strong> 10,000 ETH (test tokens)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}; 