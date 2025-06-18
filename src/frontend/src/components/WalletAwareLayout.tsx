'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ClientLayout } from './ClientLayout';

interface WalletAwareLayoutProps {
  children: React.ReactNode;
}

// Dynamically import the wallet hooks component to avoid SSR issues
const WalletStatusProvider = dynamic(
  () => import('./WalletStatusProvider'),
  { 
    ssr: false,
    loading: () => null 
  }
);

export function WalletAwareLayout({ children }: WalletAwareLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnectionChange = (isConnected: boolean) => {
    setConnected(isConnected);
  };

  return (
    <ClientLayout connected={connected}>
      {mounted && (
        <WalletStatusProvider onConnectionChange={handleConnectionChange} />
      )}
      {children}
    </ClientLayout>
  );
}