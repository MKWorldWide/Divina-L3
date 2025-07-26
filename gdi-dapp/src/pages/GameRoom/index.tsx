import React from 'react';
import { Box, Typography } from '@mui/material';

const GameRoom: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Game Room
      </Typography>
      <Typography>Game room content will be displayed here.</Typography>
    </Box>
  );
};

export default GameRoom;
