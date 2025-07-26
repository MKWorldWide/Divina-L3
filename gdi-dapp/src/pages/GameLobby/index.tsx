import React from 'react';
import { Box, Typography } from '@mui/material';

const GameLobby: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Game Lobby
      </Typography>
      <Typography>Game lobby content will be displayed here.</Typography>
    </Box>
  );
};

export default GameLobby;
