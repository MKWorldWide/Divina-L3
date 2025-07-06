import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { GDI_MINT } from '../utils/gdiUtils';

export default function TransferForm() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!publicKey) return alert('Connect your wallet first!');
    if (!to || !amount) return alert('Please fill in all fields!');
    
    setLoading(true);
    try {
      const recipient = new PublicKey(to);
      const fromAta = await getAssociatedTokenAddress(GDI_MINT, publicKey);
      const toAta = await getAssociatedTokenAddress(GDI_MINT, recipient);
      
      const ix = createTransferInstruction(
        fromAta,
        toAta,
        publicKey,
        amount * 1e9 // GDI uses 9 decimals
      );
      
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      
      alert(`✅ Sent ${amount} GDI to ${to}\nTransaction: https://solscan.io/tx/${sig}?cluster=testnet`);
      
      // Clear form
      setTo('');
      setAmount(0);
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-white w-full max-w-md">
      <input
        className="bg-gray-800 px-4 py-2 w-full rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="Recipient Address"
        disabled={loading}
      />
      <input
        className="bg-gray-800 px-4 py-2 w-full rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        type="number"
        step="0.000000001"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        placeholder="Amount GDI"
        disabled={loading}
      />
      <button 
        type="submit" 
        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold w-full disabled:opacity-50"
        disabled={loading || !publicKey}
      >
        {loading ? 'Sending...' : 'Send GDI'}
      </button>
    </form>
  );
} 