import React, { FC, useCallback, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button, Box, Typography, Chip, Alert } from '@mui/material';
import { AccountBalanceWallet, CheckCircle, Error, Refresh } from '@mui/icons-material';

interface MetaMaskWalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const MetaMaskWalletButton: FC<MetaMaskWalletButtonProps> = ({
  onConnect,
  onDisconnect
}) => {
  const { account, balance, connect, disconnect, chainId } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await connect();
      if (account && onConnect) {
        onConnect(account);
      }
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [connect, account, onConnect]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect MetaMask:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  }, [disconnect, onDisconnect]);

  const getConnectionStatus = () => {
    if (isConnecting) return { status: 'connecting', color: 'warning', text: 'Connecting...' };
    if (account) return { status: 'connected', color: 'success', text: 'Connected' };
    return { status: 'disconnected', color: 'default', text: 'Not Connected' };
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 31337: return 'Localhost (Hardhat)';
      case 11155111: return 'Sepolia Testnet';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      default: return `Chain ID: ${chainId}`;
    }
  };

  const { status, color, text } = getConnectionStatus();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      {/* Status Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={status === 'connected' ? <CheckCircle /> : status === 'connecting' ? <Error /> : <AccountBalanceWallet />}
          label={text}
          color={color as any}
          variant="outlined"
        />
      </Box>

      {/* Network Information */}
      {account && chainId && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Network: {getNetworkName(chainId)}
          </Typography>
        </Box>
      )}

      {/* Wallet Address Display */}
      {account && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Wallet Address:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </Typography>
        </Box>
      )}

      {/* Balance Display */}
      {account && balance !== null && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Balance:
          </Typography>
          <Typography variant="h6" color="primary">
            {balance.toFixed(4)} ETH
          </Typography>
        </Box>
      )}

      {/* Connection Buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {!account ? (
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={isConnecting}
            startIcon={<AccountBalanceWallet />}
            sx={{
              background: 'linear-gradient(45deg, #f6851b 30%, #ff6b35 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #e67e22 30%, #e55a2b 90%)',
              }
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={handleDisconnect}
            color="error"
          >
            Disconnect
          </Button>
        )}
      </Box>

      {/* Refresh Balance Button */}
      {account && (
        <Button
          variant="text"
          onClick={() => window.location.reload()}
          startIcon={<Refresh />}
          size="small"
        >
          Refresh
        </Button>
      )}
    </Box>
  );
}; 