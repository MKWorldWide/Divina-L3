import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  trendValue,
  subtitle,
}) => {
  const theme = useTheme();

  const getTrendColor = () => {
    if (trend === 'up') return theme.palette.success.main;
    if (trend === 'down') return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp fontSize="small" />;
    if (trend === 'down') return <TrendingDown fontSize="small" />;
    return null;
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
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette[color].main}20, ${theme.palette[color].main}40)`,
              color: theme.palette[color].main,
            }}
          >
            {icon}
          </Box>
          {getTrendIcon() ? (
            <Chip
              label={trendValue}
              size="small"
              icon={getTrendIcon() || undefined}
              sx={{
                color: getTrendColor(),
                backgroundColor: `${getTrendColor()}20`,
                border: `1px solid ${getTrendColor()}40`,
              }}
            />
          ) : (
            <Chip
              label={trendValue}
              size="small"
              sx={{
                color: getTrendColor(),
                backgroundColor: `${getTrendColor()}20`,
                border: `1px solid ${getTrendColor()}40`,
              }}
            />
          )}
        </Box>
        
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {value}
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, fontWeight: 500 }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: 0.7 }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard; 