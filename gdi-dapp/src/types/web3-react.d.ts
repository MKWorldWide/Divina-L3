// Type definitions for @web3-react packages
declare module '@web3-react/metamask' {
  import { Connector } from '@web3-react/types';
  export class MetaMask extends Connector {
    constructor(actions: any, options?: any);
  }
}

declare module '@web3-react/walletconnect' {
  import { Connector } from '@web3-react/types';
  export class WalletConnect extends Connector {
    constructor(actions: any, options: any);
  }
}
