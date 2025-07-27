import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WalletName } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';

export interface WalletModalContextType {
  visible: boolean;
  setVisible: (open: boolean) => void;
  publicKey: string | null;
  wallet: any; // Wallet from useWallet
  connect: (walletName?: WalletName) => Promise<void>;
  connecting: boolean;
  connected: boolean;
  disconnect: () => Promise<void>;
}

const defaultContext: WalletModalContextType = {
  visible: false,
  setVisible: () => {},
  publicKey: null,
  wallet: null,
  connect: async () => {},
  connecting: false,
  connected: false,
  disconnect: async () => {},
};

export const WalletModalContext = createContext<WalletModalContextType>(defaultContext);

export const useWalletModal = (): WalletModalContextType => {
  const context = useContext(WalletModalContext);
  if (!context) {
    throw new Error('useWalletModal must be used within a WalletModalProvider');
  }
  return context;
};

export const WalletModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, wallet, connect, connecting, connected, disconnect } = useWallet();
  const [visible, setVisible] = useState(false);

  const handleConnect = useCallback(
    async (walletName?: WalletName) => {
      try {
        await connect(walletName);
        setVisible(false);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      }
    },
    [connect]
  );

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }, [disconnect]);

  return (
    <WalletModalContext.Provider
      value={{
        visible,
        setVisible,
        publicKey: publicKey?.toString() || null,
        wallet,
        connect: handleConnect,
        connecting,
        connected,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletModalContext.Provider>
  );
};

export default WalletModalProvider;
