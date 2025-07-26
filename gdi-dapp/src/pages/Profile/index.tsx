import React from 'react';
import { Box, Typography } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Typography>User profile content will be displayed here.</Typography>
    </Box>
  );
};

export default Profile;
