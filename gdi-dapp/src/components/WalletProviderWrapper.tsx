import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnectionModal from './WalletConnectionModal';
import WalletConnectionStatus from './WalletConnectionStatus';
import { Button, Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';

export const WalletProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected, publicKey, wallet, connect, connecting, select } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // Auto-connect to the wallet if it was previously connected
  useEffect(() => {
    if (!isInitialized && wallet?.adapter?.connected) {
      const reconnect = async () => {
        try {
          await connect();
          enqueueSnackbar('Wallet reconnected', { variant: 'success' });
        } catch (error) {
          console.error('Error reconnecting wallet:', error);
          enqueueSnackbar('Failed to reconnect wallet', { variant: 'error' });
        } finally {
          setIsInitialized(true);
        }
      };
      
      reconnect();
    } else {
      setIsInitialized(true);
    }
  }, [connect, enqueueSnackbar, isInitialized, wallet]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleConnectClick = useCallback(() => {
    if (wallet) {
      // If we have a wallet but it's not connected, try to connect
      if (!connected && !connecting) {
        connect().catch(error => {
          console.error('Error connecting wallet:', error);
          enqueueSnackbar('Failed to connect wallet', { variant: 'error' });
        });
      }
    } else {
      // No wallet selected, open the modal to select one
      handleOpenModal();
    }
  }, [wallet, connected, connecting, connect, enqueueSnackbar, handleOpenModal]);

  const handleDisconnect = useCallback(() => {
    // The actual disconnect will be handled by the WalletConnectionStatus component
    enqueueSnackbar('Wallet disconnected', { variant: 'info' });
  }, [enqueueSnackbar]);

  // If we're still initializing, show a loading state
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          p: 3,
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Initializing Wallet...
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center">
          Please wait while we connect to your wallet
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {connected && publicKey && wallet ? (
        // Show wallet status when connected
        <WalletConnectionStatus onDisconnect={handleDisconnect} />
      ) : (
        // Show connect button when not connected
        <Button
          variant="contained"
          color="primary"
          onClick={handleConnectClick}
          disabled={connecting}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'medium',
            px: 3,
            py: 1,
          }}
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}

      {/* Wallet Connection Modal */}
      <WalletConnectionModal open={isModalOpen} onClose={handleCloseModal} />

      {/* Render children */}
      {children}
    </>
  );
};

export default WalletProviderWrapper;
