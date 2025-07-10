import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { PhantomWalletTest } from '../components/PhantomWalletTest';

export const PhantomTestPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 3 }}>
          🦊 Phantom Wallet Integration Testing
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Test the Phantom wallet integration with GameDin L3. This page allows you to connect your Phantom wallet,
          check balances, sign messages, and verify transaction capabilities.
        </Typography>
      </Paper>

      <PhantomWalletTest />

      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Testing Instructions:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Make sure you have Phantom wallet installed in your browser
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Click "Connect Phantom" to establish a connection
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Once connected, your wallet address and balance will be displayed
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Use the test controls to verify message signing and transaction capabilities
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Monitor the test results section for detailed feedback
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}; 