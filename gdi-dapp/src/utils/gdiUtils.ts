import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, transfer } from '@solana/spl-token';

const GDI_MINT = new PublicKey('4VzHLByG3TmvDtTE9wBQomoE1kuYRVqe7hLpCU2d4LwS');
const connection = new Connection('https://api.testnet.solana.com', 'confirmed');

export { GDI_MINT };

export async function getGdiBalance(wallet: PublicKey) {
  const ata = await getAssociatedTokenAddress(GDI_MINT, wallet);
  try {
    const account = await getAccount(connection, ata);
    return Number(account.amount) / 1e9; // GDI uses 9 decimals
  } catch (e) {
    return 0;
  }
}

export async function sendGdi(recipient: string, amount: number) {
  // ⚠️ You'd use Solana CLI signing off-chain for security or load `id.json` manually
  console.warn('Signing must be done securely via CLI/off-chain for now');
}
