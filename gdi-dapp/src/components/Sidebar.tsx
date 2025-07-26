import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Games,
  Leaderboard,
  Store,
  AccountBalanceWallet,
  Analytics,
  Settings,
  ExpandLess,
  ExpandMore,
  Casino,
  SportsEsports,
  Extension,
  EmojiEvents,
  TrendingUp,
  Psychology,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAI } from '../contexts/AIContext';

const DRAWER_WIDTH = 280;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeGames, gameStats } = useGame();
  const { aiFeatures } = useAI();

  const [expandedItems, setExpandedItems] = useState<string[]>(['games']);

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
    },
    {
      id: 'games',
      label: 'Games',
      icon: <Games />,
      path: '/lobby',
      children: [
        {
          id: 'casino',
          label: 'Casino Games',
          icon: <Casino />,
          path: '/lobby?category=casino',
          badge: 'Hot',
        },
        {
          id: 'esports',
          label: 'Esports',
          icon: <SportsEsports />,
          path: '/lobby?category=esports',
          badge: 'New',
        },
        {
          id: 'puzzle',
          label: 'Puzzle Games',
          icon: <Extension />,
          path: '/lobby?category=puzzle',
        },
        {
          id: 'tournaments',
          label: 'Tournaments',
          icon: <EmojiEvents />,
          path: '/lobby?category=tournaments',
          badge: 'Live',
        },
      ],
    },
    {
      id: 'ai-features',
      label: 'AI Features',
      icon: <Psychology />,
      path: '/ai-features',
      children: [
        {
          id: 'ai-analytics',
          label: 'AI Analytics',
          icon: <TrendingUp />,
          path: '/analytics',
        },
        {
          id: 'ai-assistant',
          label: 'AI Assistant',
          icon: <AutoAwesome />,
          path: '/ai-assistant',
        },
      ],
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: <Leaderboard />,
      path: '/leaderboard',
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: <Store />,
      path: '/marketplace',
    },
    {
      id: 'bridge',
      label: 'Bridge',
      icon: <AccountBalanceWallet />,
      path: '/bridge',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <Analytics />,
      path: '/analytics',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings />,
      path: '/settings',
    },
  ];

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <Box key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleExpandClick(item.id);
              } else {
                handleItemClick(item.path);
              }
            }}
            sx={{
              pl: 2 + level * 2,
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderRight: isActive ? `3px solid ${theme.palette.primary.main}` : 'none',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? theme.palette.primary.main : 'inherit',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? theme.palette.primary.main : 'inherit',
                    }}
                  >
                    {item.label}
                  </Typography>
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color="secondary"
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </Box>
              }
            />
            {hasChildren && <Box>{isExpanded ? <ExpandLess /> : <ExpandMore />}</Box>}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          mt: '64px', // Account for header height
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: 'calc(100vh - 64px)' }}>
        {/* Quick Stats */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Quick Stats
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Active Games:
              </Typography>
              <Chip label={activeGames.length} size="small" color="primary" variant="outlined" />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total Wins:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gameStats.totalWins}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                AI Features:
              </Typography>
              <Chip label={aiFeatures.length} size="small" color="secondary" variant="outlined" />
            </Box>
          </Box>
        </Box>

        {/* Navigation Menu */}
        <List sx={{ pt: 1 }}>{menuItems.map(item => renderMenuItem(item))}</List>

        {/* AI Status */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            AI Services Status
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption">NovaSanctum</Typography>
              <Chip label="Online" size="small" color="success" sx={{ height: 16 }} />
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption">AthenaMist</Typography>
              <Chip label="Online" size="small" color="success" sx={{ height: 16 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
