import React from 'react';
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  color,
  action,
}) => {
  const theme = useTheme();

  return (
    <Card
      onClick={action}
      sx={{
        background: `linear-gradient(135deg, ${color}10, ${color}20)`,
        border: `1px solid ${color}30`,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 30px ${color}30`,
          border: `1px solid ${color}50`,
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            color: 'white',
            mb: 2,
            display: 'inline-flex',
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            color: 'white',
          }}
        >
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default QuickActionCard;
