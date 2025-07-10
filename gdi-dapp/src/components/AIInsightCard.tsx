import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import * as GamingTypes from '../../../src/types/gaming';

interface AIInsight {
  id: string;
  type: 'fraud-detection' | 'behavior-analysis' | 'prediction' | 'optimization' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  data?: any;
}

interface AIInsightCardProps {
  insight: AIInsight;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight }) => {
  const theme = useTheme();

  const getInsightIcon = () => {
    switch (insight.type) {
      case 'fraud-detection':
        return <Warning />;
      case 'behavior-analysis':
        return <Psychology />;
      case 'prediction':
        return <TrendingUp />;
      case 'optimization':
        return <CheckCircle />;
      case 'recommendation':
        return <Info />;
      default:
        return <Psychology />;
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case 'fraud-detection':
        return theme.palette.error.main;
      case 'behavior-analysis':
        return theme.palette.info.main;
      case 'prediction':
        return theme.palette.success.main;
      case 'optimization':
        return theme.palette.warning.main;
      case 'recommendation':
        return theme.palette.primary.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      case 'neutral':
        return theme.palette.text.secondary;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getPriorityColor = () => {
    switch (insight.priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: `1px solid ${getInsightColor()}30`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${getInsightColor()}20`,
        },
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${getInsightColor()}20, ${getInsightColor()}40)`,
              color: getInsightColor(),
            }}
          >
            {getInsightIcon()}
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
            <Chip
              label={insight.priority}
              size="small"
              sx={{
                backgroundColor: `${getPriorityColor()}20`,
                color: getPriorityColor(),
                border: `1px solid ${getPriorityColor()}40`,
                textTransform: 'capitalize',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(insight.timestamp)}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            color: 'white',
          }}
        >
          {insight.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, lineHeight: 1.5 }}
        >
          {insight.description}
        </Typography>

        {/* Confidence Bar */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="caption" color="text.secondary">
              Confidence
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {Math.round(insight.confidence * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={insight.confidence * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: `${getInsightColor()}20`,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${getInsightColor()}, ${getInsightColor()}dd)`,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Impact Indicator */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={`${insight.impact} impact`}
            size="small"
            sx={{
              backgroundColor: `${getImpactColor()}20`,
              color: getImpactColor(),
              border: `1px solid ${getImpactColor()}40`,
              textTransform: 'capitalize',
            }}
          />
          
          <Chip
            label={insight.type.replace('-', ' ')}
            size="small"
            variant="outlined"
            sx={{
              borderColor: `${getInsightColor()}40`,
              color: getInsightColor(),
              textTransform: 'capitalize',
            }}
          />
        </Box>

        {/* Additional Data */}
        {insight.data && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Additional Data:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {JSON.stringify(insight.data, null, 2)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightCard; 