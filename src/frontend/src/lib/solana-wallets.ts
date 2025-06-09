import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export const network = WalletAdapterNetwork.Mainnet;
export const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

// Lazy load wallets to avoid SSR issues
export const wallets = typeof window !== 'undefined' ? (() => {
  const {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    CoinbaseWalletAdapter,
    TrustWalletAdapter,
  } = require('@solana/wallet-adapter-wallets');
  
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TrustWalletAdapter(),
  ];
})() : [];