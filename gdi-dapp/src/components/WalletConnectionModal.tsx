import React, { useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useWallet, WalletName } from '@solana/wallet-adapter-react';
import { WalletAdapter } from '@solana/wallet-adapter-base';
import { useSnackbar } from 'notistack';

interface WalletConnectionModalProps {
  open: boolean;
  onClose: () => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { wallets, select, publicKey, connected, connect, disconnect } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const [isConnecting, setIsConnecting] = useState<WalletName | null>(null);

  useEffect(() => {
    if (connected) {
      onClose();
      setIsConnecting(null);
    }
  }, [connected, onClose]);

  const handleWalletSelect = useCallback(
    async (walletName: WalletName) => {
      try {
        setIsConnecting(walletName);
        select(walletName);
        await connect();
        enqueueSnackbar('Wallet connected successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error connecting wallet:', error);
        enqueueSnackbar('Failed to connect wallet', { variant: 'error' });
        setIsConnecting(null);
      }
    },
    [connect, enqueueSnackbar, select]
  );

  const handleCopyAddress = useCallback(async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      enqueueSnackbar('Wallet address copied to clipboard', { variant: 'success' });
    } catch (error) {
      console.error('Failed to copy address:', error);
      enqueueSnackbar('Failed to copy address', { variant: 'error' });
    }
  }, [publicKey, enqueueSnackbar]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      enqueueSnackbar('Wallet disconnected', { variant: 'info' });
      onClose();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      enqueueSnackbar('Error disconnecting wallet', { variant: 'error' });
    }
  }, [disconnect, enqueueSnackbar, onClose]);

  const handleViewOnExplorer = useCallback(() => {
    if (!publicKey) return;
    const explorerUrl = `https://explorer.solana.com/address/${publicKey.toBase58()}`;
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  }, [publicKey]);

  const renderWalletList = () => (
    <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      {wallets.map((wallet) => {
        const adapter = wallet.adapter;
        const isConnectingToThisWallet = isConnecting === adapter.name;
        
        return (
          <React.Fragment key={adapter.name}>
            <ListItem
              button
              onClick={() => handleWalletSelect(adapter.name as WalletName)}
              disabled={isConnecting !== null}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon>
                {isConnectingToThisWallet ? (
                  <CircularProgress size={24} />
                ) : (
                  <img
                    src={adapter.icon}
                    alt={adapter.name}
                    style={{ width: 24, height: 24, borderRadius: 4 }}
                  />
                )}
              </ListItemIcon>
              <ListItemText
                primary={adapter.name}
                primaryTypographyProps={{
                  fontWeight: isConnectingToThisWallet ? 'medium' : 'regular',
                }}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        );
      })}
    </List>
  );

  const renderConnectedContent = () => {
    if (!publicKey) return null;

    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <CheckCircleIcon
          color="success"
          sx={{ fontSize: 64, mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          Wallet Connected
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 3,
            p: 2,
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" fontFamily="monospace">
            {`${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`}
          </Typography>
          <Tooltip title="Copy address">
            <IconButton size="small" onClick={handleCopyAddress}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View on explorer">
            <IconButton size="small" onClick={handleViewOnExplorer}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDisconnect}
          fullWidth
          sx={{ mt: 2 }}
        >
          Disconnect Wallet
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">
            {connected ? 'Wallet Connected' : 'Connect a Wallet'}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {connected ? renderConnectedContent() : renderWalletList()}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletConnectionModal;
