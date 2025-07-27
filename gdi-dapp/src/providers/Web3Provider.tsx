import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider as EthersWeb3Provider, ExternalProvider } from '@ethersproject/providers';
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect } from '@web3-react/walletconnect';
import { initializeConnector, Web3ReactHooks } from '@web3-react/core';
import type { MetaMask as MetaMaskType } from '@web3-react/metamask';
import type { WalletConnect as WalletConnectType } from '@web3-react/walletconnect';

// MetaMask connector
export const [metaMask, metaMaskHooks] = initializeConnector<MetaMaskType>(
  actions => new MetaMask({ actions })
);

// WalletConnect connector
const [walletConnect, walletConnectHooks] = initializeConnector<WalletConnectType>(actions => {
  return new WalletConnect({
    actions,
    options: {
      rpc: {
        1: 'https://mainnet.infura.io/v3/YOUR-INFURA-KEY', // Mainnet
        5: 'https://goerli.infura.io/v3/YOUR-INFURA-KEY', // Goerli testnet
        31337: 'http://localhost:8545', // Local Hardhat network
      },
      qrcode: true,
    },
  });
});

// Get the Web3 provider instance
export function getLibrary(provider: ExternalProvider): EthersWeb3Provider {
  const library = new EthersWeb3Provider(provider);
  library.pollingInterval = 12000; // 12 seconds
  return library;
}

// Web3 provider component that wraps the application
interface Web3AppProviderProps {
  children: React.ReactNode;
  getLibrary?: (provider: any) => EthersWeb3Provider;
}

export const Web3AppProvider: React.FC<Web3AppProviderProps> = ({
  children,
  getLibrary: getLibraryProp,
}) => {
  const connectors: [MetaMaskType | WalletConnectType, Web3ReactHooks][] = [
    [metaMask, metaMaskHooks],
    [walletConnect, walletConnectHooks],
  ];

  // Use the provided getLibrary prop or the default one
  const libraryGetter = getLibraryProp || getLibrary;

  return (
    <Web3ReactProvider connectors={connectors} getLibrary={libraryGetter}>
      {children}
    </Web3ReactProvider>
  );
};

export const hooks = {
  metaMask: metaMaskHooks,
  walletConnect: walletConnectHooks,
};

export const connectors = {
  metaMask,
  walletConnect,
};
