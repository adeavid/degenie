import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Using Mainnet since the QuickNode RPC is for mainnet
export const network = WalletAdapterNetwork.Mainnet;
export const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

// Function to get wallets - will be called inside components
export const getWallets = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  console.log('[solana-wallets] Loading wallet adapters...');
  const {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    CoinbaseWalletAdapter,
    TrustWalletAdapter,
  } = require('@solana/wallet-adapter-wallets');
  
  const walletInstances = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TrustWalletAdapter(),
  ];
  
  console.log('[solana-wallets] Loaded wallets:', walletInstances.map(w => w.name));
  return walletInstances;
};