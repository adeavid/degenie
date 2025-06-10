'use client';

import React, { ReactNode, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { wagmiConfig } from '@/lib/wagmi';
import { endpoint, wallets } from '@/lib/solana-wallets';

// Dynamically import WalletModalProvider to avoid SSR issues
const WalletModalProvider = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletModalProvider),
  { ssr: false }
);

// Import Solana wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
    },
  }));
  
  const solanaWallets = useMemo(() => wallets, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render wallet providers until client-side
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectionProvider endpoint={endpoint}>
          <SolanaWalletProvider wallets={solanaWallets} autoConnect={false}>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}