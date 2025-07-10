import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';

// Types
interface WalletContextType {
  account: string | null;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  chainId: number | null;
  provider: ethers.Provider | null;
}

interface WalletProviderProps {
  children: ReactNode;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Connectors
const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 31337], // Add localhost chain ID
});

const walletconnect = new WalletConnectConnector({
  rpc: {
    1: process.env.REACT_APP_RPC_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
    31337: 'http://localhost:8545', // Localhost
  },
  qrcode: true,
});

// Provider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { account, library, chainId, activate, deactivate } = useWeb3React();
  const [balance, setBalance] = useState<number>(0);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);

  // Update provider when library changes
  useEffect(() => {
    if (library) {
      setProvider(library);
    }
  }, [library]);

  // Update balance when account or provider changes
  useEffect(() => {
    if (account && provider) {
      const fetchBalance = async () => {
        try {
          const balanceWei = await provider.getBalance(account);
          const balanceEth = parseFloat(ethers.formatEther(balanceWei));
          setBalance(balanceEth);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      };

      fetchBalance();
      const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [account, provider]);

  const connect = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Failed to connect:', error);
      // Fallback to WalletConnect
      try {
        await activate(walletconnect);
      } catch (wcError) {
        console.error('Failed to connect with WalletConnect:', wcError);
      }
    }
  };

  const disconnect = () => {
    deactivate();
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    account,
    balance,
    connect,
    disconnect,
    sendTransaction,
    signMessage,
    chainId,
    provider,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 