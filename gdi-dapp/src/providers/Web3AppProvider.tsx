import React, { ReactNode, useMemo } from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect } from '@web3-react/walletconnect';
import { initializeConnector, Web3ReactHooks } from '@web3-react/core';

type Connector = [any, Web3ReactHooks];

// Default getLibrary implementation
export function getLibrary(provider: any): EthersWeb3Provider {
  const library = new EthersWeb3Provider(provider);
  library.pollingInterval = 12000; // 12 seconds
  return library;
}

// Web3 provider component props
interface Web3AppProviderProps {
  children: ReactNode;
  getLibrary?: (provider: any) => EthersWeb3Provider;
}

// Web3 provider component
export const Web3AppProvider: React.FC<Web3AppProviderProps> = ({
  children,
  getLibrary: getLibraryProp = getLibrary,
}) => {
  // Initialize connectors with useMemo to prevent re-creation on re-renders
  const connectors = useMemo<Connector[]>(() => {
    try {
      // Initialize MetaMask connector
      const [metaMask, metaMaskHooks] = initializeConnector<MetaMask>(
        (actions) => new MetaMask({ actions })
      );

      // Initialize WalletConnect connector
      const [walletConnect, walletConnectHooks] = initializeConnector<WalletConnect>(
        (actions) =>
          new WalletConnect({
            actions,
            options: {
              rpc: {
                1: 'https://mainnet.infura.io/v3/YOUR-INFURA-KEY',
                5: 'https://goerli.infura.io/v3/YOUR-INFURA-KEY',
                31337: 'http://localhost:8545',
              },
              qrcode: true,
            },
          })
      );

      return [
        [metaMask, metaMaskHooks],
        [walletConnect, walletConnectHooks],
      ] as Connector[];
    } catch (error) {
      console.error('Error initializing Web3 connectors:', error);
      return [];
    }
  }, []);

  // Only render the provider if we have connectors
  if (connectors.length === 0) {
    console.warn('No Web3 connectors available');
    return <>{children}</>;
  }

  return (
    <Web3ReactProvider
      connectors={connectors}
      connectorOverride={connectors[0][0]} // Default to MetaMask
      network="any"
      getLibrary={getLibraryProp}
    >
      {children}
    </Web3ReactProvider>
  );
};

// Default export
export default Web3AppProvider;
