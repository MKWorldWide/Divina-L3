import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Chip,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Notifications,
  Settings,
  Logout,
  Person,
  Dashboard,
  Games,
  Store,
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { useGame } from '../contexts/GameContext';
import { useAI } from '../contexts/AIContext';

const Header: React.FC = () => {
  const theme = useTheme();
  const { account, connect, disconnect, balance } = useWallet();
  const { activeGames, notifications } = useGame();
  const { aiStatus } = useAI();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleDisconnect = () => {
    disconnect();
    handleMenuClose();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    return `${balance.toFixed(4)} GDI`;
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar>
        {/* Logo and Brand */}
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="GameDin L3"
            sx={{ height: 40, width: 40, mr: 2 }}
          />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            GameDin L3
          </Typography>
          <Chip 
            label="AI-Powered Gaming" 
            size="small" 
            color="secondary"
            sx={{ ml: 2 }}
          />
        </Box>

        {/* AI Status Indicator */}
        <Box sx={{ mr: 2 }}>
          <Chip
            label={aiStatus.isOnline ? 'AI Online' : 'AI Offline'}
            color={aiStatus.isOnline ? 'success' : 'error'}
            size="small"
            icon={aiStatus.isOnline ? <Dashboard /> : <Settings />}
          />
        </Box>

        {/* Active Games Badge */}
        {activeGames.length > 0 && (
          <Box sx={{ mr: 2 }}>
            <Chip
              label={`${activeGames.length} Active`}
              color="primary"
              size="small"
              icon={<Games />}
            />
          </Box>
        )}

        {/* Notifications */}
        <IconButton
          color="inherit"
          onClick={handleNotificationMenuOpen}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={notifications.length} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Wallet Connection */}
        {!account ? (
          <Button
            variant="contained"
            startIcon={<AccountBalanceWallet />}
            onClick={connect}
            sx={{
              background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
              borderRadius: 2,
              px: 3,
            }}
          >
            Connect Wallet
          </Button>
        ) : (
          <Box display="flex" alignItems="center" gap={1}>
            {/* Balance Display */}
            <Chip
              label={formatBalance(balance)}
              color="primary"
              variant="outlined"
              size="small"
            />
            
            {/* User Avatar and Menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                <Person />
              </Avatar>
            </IconButton>
          </Box>
        )}

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              mt: 1,
            }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Person sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Store sx={{ mr: 1 }} />
            Marketplace
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Settings sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleDisconnect}>
            <Logout sx={{ mr: 1 }} />
            Disconnect
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              mt: 1,
              minWidth: 300,
            }
          }}
        >
          {notifications.length === 0 ? (
            <MenuItem>
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </MenuItem>
          ) : (
            notifications.map((notification, index) => (
              <MenuItem key={index} onClick={handleNotificationMenuClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {notification.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 