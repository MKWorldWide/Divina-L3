import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Button, Typography, CircularProgress } from '@mui/material';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { Web3AppProvider } from './providers/Web3AppProvider';
import { SnackbarProvider } from 'notistack';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import GameLobby from './pages/GameLobby';
import GameRoom from './pages/GameRoom';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Marketplace from './pages/Marketplace';
import Bridge from './pages/Bridge';
import Analytics from './pages/Analytics';

// Contexts
import { GameProvider } from './contexts/GameContext';
import { AIProvider } from './contexts/AIContext';
import { WalletConnectionProvider } from './wallet/WalletConnectionProvider';
import WalletProviderWrapper from './components/WalletProviderWrapper';

// Services
import { initializeAIServices } from './services/aiService';
import { initializeBlockchainService } from './services/blockchainService';

// Styles
import './styles/App.css';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899', // Pink
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

// Web3 Provider wrapper
const getLibrary = (
  provider: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc
): EthersWeb3Provider => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

// Custom Snackbar component for notifications
const SnackbarContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={5000}
    >
      {children}
    </SnackbarProvider>
  );
};

// Loading component
const LoadingScreen: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={60} color="primary" />
    <div style={{ color: '#6366f1', fontSize: '1.2rem', fontWeight: 600 }}>
      Loading GameDin L3...
    </div>
  </Box>
);

// Main App component
const AppContent: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize any required services here
        // await initializeAIServices();
        // await initializeBlockchainService();
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize services:', err);
        setError('Failed to initialize required services. Please refresh the page to try again.');
      }
    };

    initServices();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        p={3}
        textAlign="center"
      >
        <Typography variant="h5" color="error" gutterBottom>
          Application Error
        </Typography>
        <Typography variant="body1" paragraph>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarContainer>
        <Web3AppProvider getLibrary={getLibrary}>
          <WalletConnectionProvider>
            <WalletProviderWrapper>
              <GameProvider>
                <AIProvider>
                  <Router>
                    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                      <Sidebar />
                      <Box sx={{ flexGrow: 1, overflowX: 'hidden' }}>
                        <Header />
                        <Box component="main" sx={{ p: 3 }}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/lobby" element={<GameLobby />} />
                            <Route path="/game/:id" element={<GameRoom />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                            <Route path="/marketplace" element={<Marketplace />} />
                            <Route path="/bridge" element={<Bridge />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Box>
                      </Box>
                    </Box>
                  </Router>
                </AIProvider>
              </GameProvider>
            </WalletProviderWrapper>
          </WalletConnectionProvider>
        </Web3AppProvider>
      </SnackbarContainer>
    </ThemeProvider>
  );
};

// Main App component
const App: React.FC = () => {
  return <AppContent />;
};

export default App;
