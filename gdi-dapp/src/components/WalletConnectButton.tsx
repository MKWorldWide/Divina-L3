import React, { useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button, Box, Typography, Menu, MenuItem, Avatar, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useWalletModal } from '../contexts/WalletModalContext';

const WalletConnectButton: React.FC = () => {
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (wallet) return 'Connect';
    return 'Connect Wallet';
  }, [connecting, wallet]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (wallet) {
        setAnchorEl(event.currentTarget);
      } else {
        setVisible(!visible);
      }
    },
    [wallet, visible, setVisible]
  );

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      handleClose();
      enqueueSnackbar('Wallet disconnected', { variant: 'info' });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      enqueueSnackbar('Error disconnecting wallet', { variant: 'error' });
    }
  }, [disconnect, enqueueSnackbar]);

  const handleCopyAddress = useCallback(async () => {
    try {
      if (!base58) return;
      await navigator.clipboard.writeText(base58);
      enqueueSnackbar('Address copied to clipboard', { variant: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error copying address:', error);
      enqueueSnackbar('Error copying address', { variant: 'error' });
    }
  }, [base58, enqueueSnackbar]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Box>
      <Button
        variant="contained"
        onClick={handleClick}
        disabled={connecting}
        startIcon={
          wallet?.adapter?.icon ? (
            <img
              src={wallet.adapter.icon}
              alt={wallet.adapter.name}
              width={20}
              height={20}
              style={{ borderRadius: '4px' }}
            />
          ) : (
            <Box width={20} height={20} />
          )
        }
        endIcon={
          connecting ? (
            <CircularProgress size={16} color="inherit" />
          ) : wallet ? (
            <Box width={16} />
          ) : null
        }
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
          minWidth: '180px',
          textTransform: 'none',
          borderRadius: '12px',
          padding: '8px 16px',
          fontWeight: 500,
        }}
      >
        {wallet ? (base58 ? formatAddress(base58) : 'Connected') : content}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            marginTop: '8px',
            minWidth: '200px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {wallet && (
          <MenuItem onClick={handleCopyAddress}>
            <Box display="flex" alignItems="center" width="100%">
              <Avatar
                src={wallet.adapter?.icon}
                sx={{
                  width: 24,
                  height: 24,
                  marginRight: 1,
                }}
              />
              <Box>
                <Typography variant="body2" color="textPrimary">
                  {wallet.adapter?.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {base58 ? formatAddress(base58) : 'Connecting...'}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        )}
        <MenuItem onClick={handleDisconnect}>
          <Typography variant="body2" color="error">
            Disconnect
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WalletConnectButton;
