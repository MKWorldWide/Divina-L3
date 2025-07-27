import React from 'react';
import { Box, Typography } from '@mui/material';

const GameRoom: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Game Room
      </Typography>
      <Typography variant="body1">
        Game room content will be displayed here.
      </Typography>
    </Box>
  );
};

export default GameRoom;
