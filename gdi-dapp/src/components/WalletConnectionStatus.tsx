import React, { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Box, Typography, Chip, Avatar, Tooltip, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useSnackbar } from 'notistack';

interface WalletConnectionStatusProps {
  onDisconnect?: () => void;
  showFullAddress?: boolean;
}

const WalletConnectionStatus: React.FC<WalletConnectionStatusProps> = ({
  onDisconnect,
  showFullAddress = false,
}) => {
  const { publicKey, wallet, disconnect } = useWallet();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const formattedAddress = useMemo(() => {
    if (!publicKey) return '';
    const address = publicKey.toBase58();
    return showFullAddress 
      ? address 
      : `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [publicKey, showFullAddress]);

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      enqueueSnackbar('Wallet address copied to clipboard', { variant: 'success' });
    } catch (error) {
      console.error('Failed to copy address:', error);
      enqueueSnackbar('Failed to copy address', { variant: 'error' });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onDisconnect?.();
      enqueueSnackbar('Wallet disconnected', { variant: 'info' });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      enqueueSnackbar('Error disconnecting wallet', { variant: 'error' });
    }
  };

  if (!wallet || !publicKey) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Avatar
        src={wallet.adapter?.icon}
        alt={wallet.adapter?.name}
        sx={{ width: 32, height: 32 }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {wallet.adapter?.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon
            fontSize="small"
            color="success"
            sx={{ width: 16, height: 16 }}
          />
          <Tooltip title={publicKey.toBase58()}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontFamily: 'monospace',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              onClick={handleCopyAddress}
            >
              {formattedAddress}
            </Typography>
          </Tooltip>
          <IconButton
            size="small"
            onClick={handleCopyAddress}
            sx={{ ml: 0.5, p: 0.5 }}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Box>
      </Box>
      <Tooltip title="Disconnect">
        <IconButton
          size="small"
          onClick={handleDisconnect}
          color="inherit"
          sx={{ color: theme.palette.error.main }}
        >
          <PowerSettingsNewIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default WalletConnectionStatus;
