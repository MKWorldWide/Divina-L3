import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAI } from '../contexts/AIContext';
import { useWallet } from '../contexts/WalletContext';
import GameCard from '../components/GameCard';
// Temporarily comment out missing components - they'll need to be created or fixed
// import AIIntegrationStatus from '../components/AIIntegrationStatus';
// import AIIntegrationToggle from '../components/AIIntegrationToggle';
// import QuickActionCard from '../components/QuickActionCard';
// import AIInsightCard from '../components/AIInsightCard';
// import StatsCard from '../components/StatsCard';
import { 
  Game, 
  GamePlayer, 
  GameAIAnalysis, 
  AIAnalysis,
  AIInsight, 
  TopPlayer, 
  Notification,
  Player
} from '../types';

// MUI Components
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Grid,
  Paper,
  Stack,
  Skeleton,
  Container,
  ListItemSecondaryAction
} from '@mui/material';

// MUI Icons
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Casino as CasinoIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  LocalFireDepartment as HotStreakIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Pause as PauseIcon,
  People as PlayersIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Timeline as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  SportsEsports as SportsEsportsIcon,
  Extension as ExtensionIcon,
  GroupAdd as GroupAddIcon,
  BarChart as BarChartIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { balance, account } = useWallet();
  const { gameStats } = useGame();
  const { aiFeatures } = useAI();

  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    services: {
      novaSanctum: false,
      quantumOracle: false,
      chronosEngine: false,
      aegisShield: false
    },
    lastUpdated: new Date()
  });

  // Mock data for development
  // Mock QuickActionCard component for temporary use
  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    color = 'primary' 
  }: { 
    title: string; 
    description: string; 
    icon: React.ElementType; 
    onClick: () => void; 
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  }) => (
    <Card 
      onClick={onClick} 
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Icon color={color} style={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="textSecondary">{description}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Mock StatsCard component for temporary use
  const StatsCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'primary',
    trend,
    trendValue
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Icon style={{ fontSize: 40 }} color={color} />
        </Box>
      </CardContent>
    </Card>
  );

  // Mock AIInsightCard component for temporary use
  const AIInsightCard = ({ insight }: { insight: AIInsight }) => (
    <Card>
      <CardContent>
        <Typography variant="h6">{insight.title}</Typography>
        <Typography>{insight.description}</Typography>
      </CardContent>
    </Card>
  );

  const mockActiveGames: Game[] = [
    {
      id: '1',
      name: 'Poker Night',
      type: 'poker',
      status: 'waiting',
      players: [
        { 
          id: 'player1', 
          name: 'Player 1', 
          avatar: '', 
          betAmount: 10,
          status: 'waiting',
          joinedAt: new Date('2023-05-15T18:30:00'),
          position: 1
        },
        { 
          id: 'player2', 
          name: 'Player 2', 
          avatar: '', 
          betAmount: 15,
          status: 'waiting',
          joinedAt: new Date('2023-05-15T18:35:00'),
          position: 2
        },
        { 
          id: 'player3', 
          name: 'Player 3', 
          avatar: '', 
          betAmount: 20,
          status: 'waiting',
          joinedAt: new Date('2023-05-15T18:40:00'),
          position: 3
        }
      ],
      playersCount: 3,
      maxPlayers: 6,
      minBet: 5,
      maxBet: 100,
      currentBet: 10,
      startTime: new Date('2023-05-15T19:00:00'),
      endTime: new Date('2023-05-15T20:00:00'),
      createdAt: new Date('2023-05-10T10:00:00'),
      updatedAt: new Date('2023-05-10T10:00:00'),
      createdBy: 'player1',
      result: null,
      earnings: 0,
      aiAnalysis: {
        confidence: 0.85,
        strategy: 'Aggressive',
        riskLevel: 'High',
        notes: 'Player 2 is likely to fold under pressure',
        timestamp: new Date('2023-05-15T19:30:00')
      }
    } as unknown as Game,
    {
      id: '2',
      name: 'Fortnite',
      title: 'Fortnite Battle',
      type: 'esports',
      status: 'active',
      players: Array(8).fill(0).map((_, i) => ({
        id: `player${i+1}`,
        name: `Player ${i+1}`,
        avatar: '',
        betAmount: Math.floor(Math.random() * 50) + 10,
        status: 'active',
        joinedAt: new Date(),
        position: i + 1
      })),
      playersCount: 8,
      maxPlayers: 10,
      minBet: 10,
      maxBet: 200,
      currentBet: 25,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7200000), // 2 hours from now
      aiAnalysis: {
        confidence: 0.85,
        prediction: 'High chance of competitive match',
        recommendations: ['Watch for early game aggression', 'Focus on resource control'],
        playerId: 'player1',
        gameId: '2',
        fraudScore: 0.1,
        behaviorPattern: 'aggressive',
        riskLevel: 'medium',
        timestamp: new Date()
      }
    }
  ] as Game[];

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

  const mockTopPlayers: TopPlayer[] = [
    {
      id: '1',
      username: 'Player1',
      avatar: '',
      score: 1500,
      gamesPlayed: 42,
      winRate: 0.75,
      totalWins: 32,
      totalEarnings: 1500,
      rank: 1,
      status: 'active',
      joinedAt: new Date(),
      position: 1,
      betAmount: 0,
      isOnline: true,
      lastActive: new Date()
    } as unknown as TopPlayer,
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Set mock data for now
        setActiveGames(mockActiveGames);
        setNotifications(mockNotifications);
        setTopPlayers(mockTopPlayers);
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

  const getWinRateColor = (winRate: number): 'success' | 'error' | 'warning' => {
    if (winRate >= 70) return 'success';
    if (winRate >= 50) return 'warning';
    return 'error';
  };

  const getBalanceColor = (balance: number): 'success' | 'error' | 'warning' => {
    if (balance > 0) return 'success';
    if (balance < 0) return 'error';
    return 'warning';
  };

  const statsCards = [
    {
      title: 'Total Balance',
      value: `${balance.toFixed(4)} GDI`,
      icon: AccountBalanceWalletIcon,
      color: getBalanceColor(balance) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning',
      trend: balance > 0 ? 'up' : 'down',
      trendValue: `${balance > 0 ? '+' : ''}${balance.toFixed(2)}`,
    },
    {
      title: 'Win Rate',
      value: `${gameStats.winRate}%`,
      icon: EmojiEventsIcon,
      color: gameStats.winRate > 50 ? 'success' : 'error',
      trend: gameStats.winRate > 50 ? 'up' : 'down',
      trendValue: `${gameStats.winRate > 50 ? '+' : ''}${gameStats.winRate}%`,
    },
    {
      title: 'Active Games',
      value: activeGames.length.toString(),
      icon: SportsEsportsIcon,
      color: activeGames.length > 0 ? 'info' : 'warning',
      trend: activeGames.length > 0 ? 'up' : 'neutral',
      trendValue: `${activeGames.length} running`,
    },
    {
      title: 'AI Services',
      value: aiFeatures.filter(f => f.isEnabled).length.toString(),
      icon: PsychologyIcon,
      color: 'success',
      trend: 'up',
      trendValue: `${aiFeatures.filter(f => f.isEnabled).length} active`,
    },
  ];

  const quickActions = [
    {
      title: 'New Game',
      description: 'Start a new game',
      icon: PlayArrowIcon,
      color: 'primary' as const,
      onClick: () => navigate('/new-game')
    },
    {
      title: 'Join Game',
      description: 'Join an existing game',
      icon: GroupAddIcon,
      color: 'secondary' as const,
      onClick: () => navigate('/join-game')
    },
    {
      title: 'View Stats',
      description: 'Check your statistics',
      icon: BarChartIcon,
      color: 'info' as const,
      onClick: () => navigate('/stats')
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: SettingsIcon,
      color: 'warning' as const,
      onClick: () => navigate('/settings')
    }
  ];

  // Mock data for game types
  const gameTypes = [
    { id: 'casino', name: 'Casino', icon: CasinoIcon, color: '#6366f1' as const },
    { id: 'esports', name: 'eSports', icon: SportsEsportsIcon, color: '#ec4899' as const },
    { id: 'puzzle', name: 'Puzzle', icon: ExtensionIcon, color: '#10b981' as const },
    { id: 'tournament', name: 'Tournament', icon: EmojiEventsIcon, color: '#f59e0b' as const },
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {statsCards.map((statsCard, index) => (
          <Box key={index}>
            <StatsCard {...statsCard} />
          </Box>
        ))}
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
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
                <Button variant="outlined" size="small" onClick={() => navigate('/lobby')}>
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
                    startIcon={<PlayArrowIcon />}
                    onClick={() => navigate('/lobby')}
                  >
                    Find a Game
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  {activeGames.slice(0, 4).map(game => (
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
                        {game.type === 'casino' && <CasinoIcon />}
                        {game.type === 'esports' && <SportsEsportsIcon />}
                        {game.type === 'puzzle' && <ExtensionIcon />}
                        {game.type === 'tournament' && <EmojiEventsIcon />}
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

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                  gap: 2,
                }}
              >
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
                      <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>{index + 1}</Avatar>
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
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
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
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
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
                    <ListItemText primary={notification.title} secondary={notification.message} />
                    <Chip
                      label={notification.type}
                      color={
                        notification.type === 'success'
                          ? 'success'
                          : notification.type === 'warning'
                            ? 'warning'
                            : notification.type === 'error'
                              ? 'error'
                              : 'default'
                      }
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
