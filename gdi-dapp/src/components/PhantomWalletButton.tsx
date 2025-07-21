import React, { FC, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button, Box, Typography, Chip } from '@mui/material';
import { AccountBalanceWallet, CheckCircle, Error } from '@mui/icons-material';
import { WalletName } from '@solana/wallet-adapter-base';

interface PhantomWalletButtonProps {
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
}

export const PhantomWalletButton: FC<PhantomWalletButtonProps> = ({
  onConnect,
  onDisconnect
}) => {
  const { publicKey, connected, connecting, disconnect, select, wallet } = useWallet();

  const handleConnect = useCallback(async () => {
    try {
      await select('phantom' as WalletName);
      if (publicKey && onConnect) {
        onConnect(publicKey.toString());
      }
    } catch (error) {
      console.error('Failed to connect Phantom wallet:', error);
    }
  }, [select, publicKey, onConnect]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect Phantom wallet:', error);
    }
  }, [disconnect, onDisconnect]);

  const getConnectionStatus = () => {
    if (connecting) return { status: 'connecting', color: 'warning', text: 'Connecting...' };
    if (connected) return { status: 'connected', color: 'success', text: 'Connected' };
    return { status: 'disconnected', color: 'default', text: 'Not Connected' };
  };

  const { status, color, text } = getConnectionStatus();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      {/* Status Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={status === 'connected' ? <CheckCircle /> : status === 'connecting' ? <Error /> : <AccountBalanceWallet />}
          label={text}
          color={color as any}
          variant="outlined"
        />
      </Box>

      {/* Wallet Address Display */}
      {connected && publicKey && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Wallet Address:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </Typography>
        </Box>
      )}

      {/* Connection Buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {!connected ? (
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={connecting}
            startIcon={<AccountBalanceWallet />}
            sx={{
              background: 'linear-gradient(45deg, #9945FF 30%, #14F195 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7B3FCC 30%, #12D884 90%)',
              }
            }}
          >
            {connecting ? 'Connecting...' : 'Connect Phantom'}
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

      {/* Alternative: Use Solana Wallet Adapter Button */}
      <Box sx={{ mt: 2 }}>
        <WalletMultiButton 
          style={{
            background: 'linear-gradient(45deg, #9945FF 30%, #14F195 90%)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        />
      </Box>
    </Box>
  );
}; 