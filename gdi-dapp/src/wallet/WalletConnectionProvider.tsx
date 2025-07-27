import { FC, useMemo, useCallback, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider as ReactUIWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { WalletModalContext, WalletModalContextType } from '../contexts/WalletModalContext';
import { useSnackbar } from 'notistack';
import { CircularProgress, Backdrop, Box, Typography } from '@mui/material';

// Import styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Custom Wallet Modal Provider with enhanced UI
const WalletModalProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { publicKey, wallet, connect, connecting, connected, disconnect } = useSolanaWallet();
  
  const handleConnect = useCallback(async () => {
    try {
      await connect();
      enqueueSnackbar('Wallet connected successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(`Error connecting wallet: ${error.message}`, { variant: 'error' });
      console.error('Error connecting wallet:', error);
    }
  }, [connect, enqueueSnackbar]);

  const contextValue: WalletModalContextType = {
    visible,
    setVisible,
    publicKey: publicKey?.toString(),
    wallet,
    connect: handleConnect,
    connecting,
    connected,
    disconnect,
  };

  return (
    <WalletModalContext.Provider value={contextValue}>
      <ReactUIWalletModalProvider>
        {children}
      </ReactUIWalletModalProvider>
    </WalletModalContext.Provider>
  );
};

// Connection Wrapper with Error Boundary and Loading State
const ConnectionWrapper: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection } = useSolanaWallet();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (connection) {
          const version = await connection.getVersion();
          console.log('Connected to Solana cluster:', version);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error connecting to Solana:', error);
        enqueueSnackbar('Failed to connect to Solana network', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [connection, enqueueSnackbar]);

  if (isLoading) {
    return (
      <Backdrop open={true} style={{ zIndex: 1300, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <Box textAlign="center" color="white">
          <CircularProgress color="inherit" />
          <Typography variant="h6" style={{ marginTop: '1rem' }}>
            Connecting to Solana network...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  if (!isConnected) {
    return (
      <Backdrop open={true} style={{ zIndex: 1300, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <Box textAlign="center" color="white" p={4} maxWidth="500px">
          <Typography variant="h5" gutterBottom>
            Connection Error
          </Typography>
          <Typography paragraph>
            Unable to connect to the Solana network. Please check your internet connection and try again.
          </Typography>
          <Typography variant="body2">
            If the problem persists, you can try switching to a different RPC endpoint in the settings.
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  return <>{children}</>;
};

export const WalletConnectionProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork || WalletAdapterNetwork.Devnet;
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    return process.env.REACT_APP_SOLANA_RPC_URL || clusterApiUrl(network);
  }, [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SlopeWalletAdapter(),
    ],
    [network]
  );

  // Configure the connection with a custom RPC endpoint
  const connection = useMemo(
    () => new Connection(endpoint, 'confirmed'),
    [endpoint]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ConnectionWrapper>
            {children}
          </ConnectionWrapper>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectionProvider;
