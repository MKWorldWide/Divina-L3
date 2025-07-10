import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { WalletProvider } from './contexts/WalletContext';
import { GameProvider } from './contexts/GameContext';
import { AIProvider } from './contexts/AIContext';
import { Dashboard } from './pages/Dashboard';
import { MetaMaskTestPage } from './pages/MetaMaskTestPage';

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

// Web3 Provider wrapper
function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <WalletProvider>
          <GameProvider>
            <AIProvider>
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
                      <Button color="inherit" component={Link} to="/metamask-test">
                        MetaMask Test
                      </Button>
                    </Box>
                  </Toolbar>
                </AppBar>
                
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/metamask-test" element={<MetaMaskTestPage />} />
                </Routes>
              </Router>
            </AIProvider>
          </GameProvider>
        </WalletProvider>
      </ThemeProvider>
    </Web3ReactProvider>
  );
}

export default App; 