import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Casino,
  SportsEsports,
  Extension,
  EmojiEvents,
  Psychology,
  PlayArrow,
  AccountBalanceWallet,
  Notifications as NotificationsIcon,
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

interface Game {
  id: string;
  title: string;
  name: string;
  type: string;
  status: string;
  players: number;
  maxPlayers: number;
  result?: string;
  earnings?: number;
  startTime?: string;
  endTime?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { balance, account } = useWallet();
  const { gameStats } = useGame();
  const { aiFeatures } = useAI();

  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiStatus, setAiStatus] = useState({
    services: {
      novaSanctum: false,
      athenaMist: false,
    },
    responseTime: 0,
  });

  // Mock data for development
  const mockActiveGames: Game[] = [
    {
      id: '1',
      title: 'Blackjack Tournament',
      name: 'Blackjack',
      type: 'casino',
      status: 'active',
      players: 3,
      maxPlayers: 6,
      startTime: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Fortnite Battle',
      name: 'Fortnite',
      type: 'esports',
      status: 'active',
      players: 8,
      maxPlayers: 10,
      startTime: new Date().toISOString(),
    },
  ];

  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Game Invitation',
      message: 'You have been invited to a Blackjack game',
      timestamp: new Date().toISOString(),
      type: 'info',
      read: false,
    },
    {
      id: '2',
      title: 'Tournament Starting',
      message: 'Your Fortnite tournament starts in 5 minutes',
      timestamp: new Date().toISOString(),
      type: 'warning',
      read: false,
    },
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Set mock data for now
        setActiveGames(mockActiveGames);
        setNotifications(mockNotifications);
        setAiStatus({
          services: {
            novaSanctum: true,
            athenaMist: true,
          },
          responseTime: 42, // ms
        });

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
        // Fallback to mock data if API fails
        setRecentGames([
          {
            id: '1',
            title: 'Blackjack',
            name: 'Blackjack',
            type: 'casino',
            status: 'completed',
            players: 4,
            maxPlayers: 6,
            result: 'Won',
            earnings: 50,
            startTime: new Date(Date.now() - 3600000).toISOString(),
            endTime: new Date().toISOString(),
          },
        ]);
      }
    };

    loadDashboardData();
  }, []);

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
      icon: <Extension />,
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Box>
          <StatsCard
            title="Total Balance"
            value={`${balance.toFixed(4)} GDI`}
            icon={<AccountBalanceWallet />}
            color={getBalanceColor(balance)}
            trend={balance > 0 ? 'up' : 'down'}
            trendValue={`${balance > 0 ? '+' : ''}${balance.toFixed(2)}`}
          />
        </Box>
        <Box>
          <StatsCard
            title="Win Rate"
            value={`${gameStats.winRate}%`}
            icon={<EmojiEvents color="primary" />}
            color={gameStats.winRate > 50 ? 'success' : 'error'}
            trend={gameStats.winRate > 50 ? 'up' : 'down'}
            trendValue={`${gameStats.winRate > 50 ? '+' : ''}${gameStats.winRate}%`}
          />
        </Box>
        <Box>
          <StatsCard
            title="Active Games"
            value={activeGames.length.toString()}
            icon={<SportsEsports color="primary" />}
            color={activeGames.length > 0 ? 'info' : 'warning'}
            trend={activeGames.length > 0 ? 'up' : 'neutral'}
            trendValue={`${activeGames.length} running`}
          />
        </Box>
        <Box>
          <StatsCard
            title="AI Services"
            value={aiFeatures.filter(f => f.isEnabled).length.toString()}
            icon={<Psychology color="primary" />}
            color="success"
            trend="up"
            trendValue={`${aiFeatures.filter(f => f.isEnabled).length} active`}
          />
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {quickActions.map((action, index) => (
          <Box key={index}>
            <QuickActionCard {...action} />
          </Box>
        ))}
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Left Column */}
        <Box>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {activeGames.slice(0, 4).map((game) => (
                    <Box key={game.id}>
                      <GameCard game={game} />
                    </Box>
                  ))}
                </Box>
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
                        {game.type === 'puzzle' && <Extension />}
                        {game.type === 'tournament' && <EmojiEvents />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={game.name}
                      secondary={`${game.result || 'In Progress'} • ${game.earnings ? `${game.earnings > 0 ? '+' : ''}${game.earnings} GDI` : 'In Progress'}`}
                    />
                    {game.result && (
                      <Chip
                        label={game.result}
                        color={game.result === 'Won' ? 'success' : 'default'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
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
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {aiInsights.slice(0, 3).map((insight, index) => (
                  <Box key={index}>
                    <AIInsightCard insight={insight} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right Column */}
        <Box>
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
                        <NotificationsIcon />
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
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 