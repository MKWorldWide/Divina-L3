import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { Web3AppProvider } from './providers/Web3Provider';

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
import { WalletProvider } from './contexts/WalletContext';
import { GameProvider } from './contexts/GameContext';
import { AIProvider } from './contexts/AIContext';

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
export function getLibrary(provider: any): EthersWeb3Provider {
  const library = new EthersWeb3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

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
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize services on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing GameDin L3 DApp...');
        
        // Initialize AI services
        await initializeAIServices();
        console.log('✅ AI services initialized');
        
        // Initialize blockchain service with local Hardhat node
        const providerUrl = 'http://localhost:8545';
        console.log(`🔗 Connecting to local Hardhat node at ${providerUrl}`);
        await initializeBlockchainService(providerUrl);
        console.log('✅ Blockchain service connected to local Hardhat node');
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Continue with app even if some services fail
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Web3AppProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <WalletProvider>
          <GameProvider>
            <AIProvider>
              <Router>
                <Box className="app-container">
                  <Header />
                  <Box className="app-content">
                    <Sidebar />
                    <Box className="main-content">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/lobby" element={<GameLobby />} />
                        <Route path="/game/:gameId" element={<GameRoom />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/bridge" element={<Bridge />} />
                        <Route path="/analytics" element={<Analytics />} />
                      </Routes>
                    </Box>
                  </Box>
                </Box>
              </Router>
            </AIProvider>
          </GameProvider>
        </WalletProvider>
      </ThemeProvider>
    </Web3AppProvider>
  );
};

export default App; 