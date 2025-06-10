'use client';

import React, { ReactNode } from 'react';
import { WalletProvider } from '@/providers/WalletProvider';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}