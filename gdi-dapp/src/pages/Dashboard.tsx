import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Casino,
  SportsEsports,
  Puzzle,
  EmojiEvents,
  Psychology,
  AutoAwesome,
  PlayArrow,
  AccountBalanceWallet,
  Analytics,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useGame } from '../contexts/GameContext';
import { useAI } from '../contexts/AIContext';

// Components
import GameCard from '../components/GameCard';
import AIInsightCard from '../components/AIInsightCard';
import StatsCard from '../components/StatsCard';
import QuickActionCard from '../components/QuickActionCard';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { account, balance, isConnected } = useWallet();
  const { activeGames, gameStats, notifications } = useGame();
  const { aiStatus, aiFeatures, currentAnalysis } = useAI();

  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent games
      const gamesResponse = await fetch(`${process.env.REACT_APP_API_URL}/games/recent`);
      const games = await gamesResponse.json();
      setRecentGames(games);

      // Load top players
      const playersResponse = await fetch(`${process.env.REACT_APP_API_URL}/players/top`);
      const players = await playersResponse.json();
      setTopPlayers(players);

      // Load AI insights
      const insightsResponse = await fetch(`${process.env.REACT_APP_API_URL}/ai/insights`);
      const insights = await insightsResponse.json();
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'success';
    if (winRate >= 50) return 'warning';
    return 'error';
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 1000) return 'success';
    if (balance > 100) return 'warning';
    return 'error';
  };

  const quickActions = [
    {
      title: 'Join Casino Game',
      description: 'Play slots, poker, or blackjack',
      icon: <Casino />,
      color: '#6366f1',
      action: () => navigate('/lobby?category=casino'),
    },
    {
      title: 'Esports Tournament',
      description: 'Compete in esports events',
      icon: <SportsEsports />,
      color: '#ec4899',
      action: () => navigate('/lobby?category=esports'),
    },
    {
      title: 'Puzzle Challenge',
      description: 'Solve brain teasers',
      icon: <Puzzle />,
      color: '#10b981',
      action: () => navigate('/lobby?category=puzzle'),
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered insights',
      icon: <Psychology />,
      color: '#f59e0b',
      action: () => navigate('/ai-assistant'),
    },
  ];

  return (
    <Box sx={{ p: 3, pt: 10 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back{account ? `, ${account.slice(0, 6)}...${account.slice(-4)}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ready to dominate the GameDin L3 ecosystem with AI-powered gaming?
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Balance"
            value={`${balance.toFixed(4)} GDI`}
            icon={<AccountBalanceWallet />}
            color={getBalanceColor(balance)}
            trend={balance > 0 ? 'up' : 'down'}
            trendValue={`${balance > 0 ? '+' : ''}${balance.toFixed(2)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Win Rate"
            value={`${gameStats.winRate}%`}
            icon={<TrendingUp />}
            color={getWinRateColor(gameStats.winRate)}
            trend={gameStats.winRate > 50 ? 'up' : 'down'}
            trendValue={`${gameStats.winRate > 50 ? '+' : ''}${gameStats.winRate}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Games"
            value={activeGames.length.toString()}
            icon={<PlayArrow />}
            color="primary"
            trend="up"
            trendValue={`${activeGames.length} running`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="AI Services"
            value={aiFeatures.filter(f => f.isEnabled).length.toString()}
            icon={<AutoAwesome />}
            color={aiStatus.isOnline ? 'success' : 'error'}
            trend={aiStatus.isOnline ? 'up' : 'down'}
            trendValue={aiStatus.isOnline ? 'Online' : 'Offline'}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <QuickActionCard {...action} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Active Games */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Active Games
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/lobby')}
                >
                  View All
                </Button>
              </Box>
              
              {activeGames.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No active games
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => navigate('/lobby')}
                  >
                    Find a Game
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {activeGames.slice(0, 4).map((game) => (
                    <Grid item xs={12} sm={6} key={game.id}>
                      <GameCard game={game} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Games
              </Typography>
              
              <List>
                {recentGames.slice(0, 5).map((game, index) => (
                  <ListItem key={index} divider={index < recentGames.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {game.type === 'casino' && <Casino />}
                        {game.type === 'esports' && <SportsEsports />}
                        {game.type === 'puzzle' && <Puzzle />}
                        {game.type === 'tournament' && <EmojiEvents />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={game.name}
                      secondary={`${game.result} • ${game.earnings > 0 ? '+' : ''}${game.earnings} GDI`}
                    />
                    <Chip
                      label={game.result}
                      color={game.result === 'Won' ? 'success' : game.result === 'Lost' ? 'error' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                AI Insights
              </Typography>
              
              <Grid container spacing={2}>
                {aiInsights.slice(0, 3).map((insight, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <AIInsightCard insight={insight} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Top Players */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Top Players
              </Typography>
              
              <List>
                {topPlayers.slice(0, 5).map((player, index) => (
                  <ListItem key={index} divider={index < topPlayers.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={player.username}
                      secondary={`${player.totalWins} wins • ${player.winRate}% win rate`}
                    />
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      {player.totalEarnings} GDI
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* AI Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                AI Services Status
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">NovaSanctum AI</Typography>
                  <Chip
                    label={aiStatus.services.novaSanctum ? 'Online' : 'Offline'}
                    color={aiStatus.services.novaSanctum ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={aiStatus.services.novaSanctum ? 100 : 0}
                  color={aiStatus.services.novaSanctum ? 'success' : 'error'}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">AthenaMist AI</Typography>
                  <Chip
                    label={aiStatus.services.athenaMist ? 'Online' : 'Offline'}
                    color={aiStatus.services.athenaMist ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={aiStatus.services.athenaMist ? 100 : 0}
                  color={aiStatus.services.athenaMist ? 'success' : 'error'}
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Response time: {aiStatus.responseTime}ms
              </Typography>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Notifications
              </Typography>
              
              <List>
                {notifications.slice(0, 3).map((notification, index) => (
                  <ListItem key={index} divider={index < notifications.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <Notifications />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={notification.title}
                      secondary={notification.message}
                    />
                    <Chip
                      label={notification.type}
                      color={notification.type === 'success' ? 'success' : 
                             notification.type === 'warning' ? 'warning' : 
                             notification.type === 'error' ? 'error' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 