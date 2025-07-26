import React from 'react';
import { Box, Typography } from '@mui/material';

const Marketplace: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Marketplace
      </Typography>
      <Typography>
        Marketplace content will be displayed here.
      </Typography>
    </Box>
  );
};

export default Marketplace;
