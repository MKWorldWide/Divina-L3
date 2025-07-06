import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  useTheme,
} from '@mui/material';
import {
  Casino,
  SportsEsports,
  Puzzle,
  EmojiEvents,
  PlayArrow,
  People,
  Timer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Game {
  id: string;
  name: string;
  type: 'casino' | 'esports' | 'puzzle' | 'tournament';
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  players: any[];
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  currentBet: number;
  startTime: Date;
  endTime?: Date;
  winner?: any;
  aiAnalysis?: any;
}

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const getGameIcon = () => {
    switch (game.type) {
      case 'casino':
        return <Casino />;
      case 'esports':
        return <SportsEsports />;
      case 'puzzle':
        return <Puzzle />;
      case 'tournament':
        return <EmojiEvents />;
      default:
        return <PlayArrow />;
    }
  };

  const getStatusColor = () => {
    switch (game.status) {
      case 'waiting':
        return 'warning';
      case 'active':
        return 'success';
      case 'finished':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (game.status) {
      case 'waiting':
        return 'Waiting';
      case 'active':
        return 'Active';
      case 'finished':
        return 'Finished';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getGameTypeColor = () => {
    switch (game.type) {
      case 'casino':
        return '#6366f1';
      case 'esports':
        return '#ec4899';
      case 'puzzle':
        return '#10b981';
      case 'tournament':
        return '#f59e0b';
      default:
        return theme.palette.primary.main;
    }
  };

  const handleJoinGame = () => {
    navigate(`/game/${game.id}`);
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${getGameTypeColor()}20, ${getGameTypeColor()}40)`,
                color: getGameTypeColor(),
              }}
            >
              {getGameIcon()}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {game.name}
              </Typography>
              <Chip
                label={game.type}
                size="small"
                sx={{
                  backgroundColor: `${getGameTypeColor()}20`,
                  color: getGameTypeColor(),
                  border: `1px solid ${getGameTypeColor()}40`,
                }}
              />
            </Box>
          </Box>
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Game Info */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Players
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                {game.players.map((player, index) => (
                  <Avatar key={index} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {player.username?.charAt(0) || 'P'}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary">
                {game.players.length}/{game.maxPlayers}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Bet Range
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {game.minBet} - {game.maxBet} GDI
            </Typography>
          </Box>

          {game.currentBet > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Current Bet
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                {game.currentBet} GDI
              </Typography>
            </Box>
          )}
        </Box>

        {/* AI Analysis Indicator */}
        {game.aiAnalysis && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label="AI Analysis Available"
              size="small"
              color="secondary"
              variant="outlined"
              icon={<Timer />}
            />
          </Box>
        )}

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<PlayArrow />}
          onClick={handleJoinGame}
          disabled={game.status !== 'waiting' && game.status !== 'active'}
          sx={{
            background: `linear-gradient(45deg, ${getGameTypeColor()}, ${getGameTypeColor()}dd)`,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {game.status === 'waiting' ? 'Join Game' : 
           game.status === 'active' ? 'Continue' : 
           game.status === 'finished' ? 'View Results' : 'Game Ended'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GameCard; 