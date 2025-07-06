import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletConnectionProvider } from './wallet/WalletConnectionProvider';
import Balance from './components/Balance';
import TransferForm from './components/TransferForm';

function App() {
  return (
    <WalletConnectionProvider>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 p-8">
        <h1 className="text-4xl text-white font-bold">GDI Token DApp</h1>
        <WalletMultiButton />
        <Balance />
        <TransferForm />
      </div>
    </WalletConnectionProvider>
  );
}

export default App; 