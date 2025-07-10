import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { WalletConnectionProvider } from './wallet/WalletConnectionProvider';
import { Dashboard } from './pages/Dashboard';
import { PhantomTestPage } from './pages/PhantomTestPage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9945FF',
    },
    secondary: {
      main: '#14F195',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletConnectionProvider>
        <Router>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                GameDin L3
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button color="inherit" component={Link} to="/">
                  Dashboard
                </Button>
                <Button color="inherit" component={Link} to="/phantom-test">
                  Phantom Test
                </Button>
              </Box>
            </Toolbar>
          </AppBar>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/phantom-test" element={<PhantomTestPage />} />
          </Routes>
        </Router>
      </WalletConnectionProvider>
    </ThemeProvider>
  );
}

export default App; 