import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { initializeConnector, useWeb3React } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect } from '@web3-react/walletconnect';
import { ethers } from 'ethers';

// Add type for the wallet connect options
type WalletConnectOptions = {
  rpc: {
    [chainId: number]: string;
  };
  qrcode?: boolean;
};

// Types
interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  balance: number;
  connect: (connector?: 'injected' | 'walletconnect') => Promise<void>;
  disconnect: () => void;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  error?: Error;
}

interface WalletProviderProps {
  children: ReactNode;
}

// Initialize connectors with proper types
const [metaMask] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);

const [walletConnect] = initializeConnector<WalletConnect>(
  (actions) => {
    const options: WalletConnectOptions = {
      rpc: {
        1: process.env.REACT_APP_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
        56: 'https://bsc-dataseed.binance.org/',
        137: 'https://polygon-rpc.com/',
      },
      qrcode: true,
    };
    return new WalletConnect(actions, options);
  }
);

// Context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider Component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { account, provider: web3Provider, chainId } = useWeb3React();
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  // Update provider when web3Provider changes
  useEffect(() => {
    if (web3Provider) {
      const ethersProvider = new ethers.providers.Web3Provider(web3Provider as any);
      setProvider(ethersProvider);
    }
  }, [web3Provider]);

  // Update balance when account or provider changes
  useEffect(() => {
    const updateBalance = async () => {
      if (account && provider) {
        try {
          const balanceWei = await provider.getBalance(account);
          const balanceEth = parseFloat(ethers.utils.formatEther(balanceWei));
          setBalance(balanceEth);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setBalance(0);
        }
      } else {
        setBalance(0);
      }
    };

    updateBalance();
    
    // Set up balance polling
    const interval = setInterval(updateBalance, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [account, provider]);

  const connect = useCallback(async (connector: 'injected' | 'walletconnect' = 'injected') => {
    try {
      setError(undefined);
      if (connector === 'injected') {
        await metaMask.activate();
      } else {
        await walletConnect.activate();
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      metaMask.deactivate?.();
      walletConnect.deactivate?.();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      setError(err instanceof Error ? err : new Error('Error disconnecting wallet'));
    }
  }, []);

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!account || !provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount),
      });

      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error('Transaction failed. Please check your balance and try again.');
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!account || !provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message. Please try again.');
    }
  };

  const value = {
    account: account || null,
    isConnected: !!account,
    balance,
    connect,
    disconnect,
    sendTransaction,
    signMessage,
    chainId: chainId || null,
    provider,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 