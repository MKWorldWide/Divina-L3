import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getGdiBalance } from '../utils/gdiUtils';

export default function Balance() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (publicKey) {
      getGdiBalance(publicKey).then(setBalance);
    }
  }, [publicKey]);

  return (
    <div className="text-white text-xl">
      GDI Balance: <span className="font-bold">{balance.toLocaleString()} GDI</span>
    </div>
  );
} 