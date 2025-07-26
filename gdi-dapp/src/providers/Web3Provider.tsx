import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect } from '@web3-react/walletconnect';
import { initializeConnector } from '@web3-react/core';

export const [metaMask, metaMaskHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);

// Initialize WalletConnect with proper types
const [walletConnect, walletConnectHooks] = initializeConnector<WalletConnect>(
  (actions) => {
    return new WalletConnect({
      actions,
      options: {
        rpc: {
          31337: 'http://localhost:8545', // Local Hardhat network
        },
        qrcode: true,
      },
    });
  }
);

export function getLibrary(provider: any): EthersWeb3Provider {
  return new EthersWeb3Provider(provider);
}

export const Web3AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Web3ReactProvider
      connectors={[
        [metaMask, metaMaskHooks],
        [walletConnect, walletConnectHooks],
      ]}
      library={getLibrary}
    >
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
