import React from 'react';
import { Box, Typography } from '@mui/material';

const Leaderboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
      <Typography variant="body1">
        Leaderboard content will be displayed here.
      </Typography>
    </Box>
  );
};

export default Leaderboard;
