import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Using Mainnet since the QuickNode RPC is for mainnet
export const network = WalletAdapterNetwork.Mainnet;
export const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

// Function to get wallets - properly initialized
export const getWallets = () => {
  console.log('[solana-wallets] Initializing wallet adapters...');
  
  const walletInstances = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(), 
    new CoinbaseWalletAdapter(),
    new TrustWalletAdapter(),
  ];
  
  console.log('[solana-wallets] Initialized wallets:', walletInstances.map(w => w.name));
  return walletInstances;
};

// Only initialize wallets on client side
export const wallets = typeof window !== 'undefined' ? getWallets() : [];