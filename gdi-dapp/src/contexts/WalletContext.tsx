import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';
// ethers v6: use BrowserProvider for browser wallets
import { BrowserProvider } from 'ethers';

// Types
interface WalletContextType {
  account: string | null;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  chainId: number | null;
  provider: BrowserProvider | null;
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
  const { account, chainId, provider } = useWeb3React();
  const [balance, setBalance] = useState<number>(0);
  const [providerState, setProviderState] = useState<BrowserProvider | null>(null);

  // Update provider when library changes
  useEffect(() => {
    if (window.ethereum) {
      setProviderState(new BrowserProvider(window.ethereum));
    } else {
      setProviderState(null);
    }
  }, []);

  // Update balance when account or provider changes
  useEffect(() => {
    if (account && providerState) {
      const fetchBalance = async () => {
        try {
          const balanceWei = await providerState.getBalance(account);
          const balanceEth = parseFloat(ethers.formatEther(balanceWei));
          setBalance(balanceEth);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      };
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [account, providerState]);

  const connect = async () => {
    try {
      await injected.activate();
    } catch (error) {
      console.error('Failed to connect:', error);
      // Fallback to WalletConnect
      try {
        await walletconnect.activate();
      } catch (wcError) {
        console.error('Failed to connect with WalletConnect:', wcError);
      }
    }
  };

  const disconnect = () => {
    injected.deactivate();
    walletconnect.deactivate();
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!providerState || !account) {
      throw new Error('Wallet not connected');
    }
    try {
      const signer = await providerState.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
      const receipt = await tx.wait();
      if (receipt && receipt.hash) {
        return receipt.hash;
      } else {
        throw new Error('Transaction failed: no receipt');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!providerState || !account) {
      throw new Error('Wallet not connected');
    }
    try {
      const signer = await providerState.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  };

  // In value, ensure account and chainId are null if undefined
  const value: WalletContextType = {
    account: account ?? null,
    balance,
    connect,
    disconnect,
    sendTransaction,
    signMessage,
    chainId: chainId ?? null,
    provider: providerState,
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