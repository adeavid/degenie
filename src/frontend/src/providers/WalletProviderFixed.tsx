'use client';

import React, { ReactNode, useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { wagmiConfig } from '@/lib/wagmi';
import { endpoint, getWallets } from '@/lib/solana-wallets';

// Import Solana wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

export function WalletProviderFixed({ children }: WalletProviderProps) {
  const wallets = useMemo(() => {
    console.log('[WalletProviderFixed] Getting wallets...');
    const walletList = getWallets();
    console.log('[WalletProviderFixed] Got wallets:', walletList.length);
    return walletList;
  }, []);

  console.log('[WalletProviderFixed] RPC endpoint:', endpoint);

  const onError = (error: Error) => {
    console.error('[WalletProviderFixed] Wallet error:', error);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectionProvider endpoint={endpoint}>
          <SolanaWalletProvider 
            wallets={wallets} 
            autoConnect={false}
            onError={onError}
          >
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}