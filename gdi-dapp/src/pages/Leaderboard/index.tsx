import React from 'react';
import { Box, Typography } from '@mui/material';

const Leaderboard: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
      <Typography>
        Leaderboard content will be displayed here.
      </Typography>
    </Box>
  );
};

export default Leaderboard;
