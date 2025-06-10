'use client';

import React, { useState, useEffect } from 'react';
import { WalletConnectButton } from './WalletConnectButton';
import { Button } from '@/components/ui/Button';

export interface WalletConnectButtonWrapperProps {
  className?: string;
  walletType?: 'ethereum' | 'solana';
}

export function WalletConnectButtonWrapper(props: WalletConnectButtonWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a placeholder button during SSR and initial mount
  if (!mounted) {
    return (
      <Button variant="primary" disabled className={props.className}>
        Connect Wallet
      </Button>
    );
  }

  // Once mounted, render the actual wallet button
  return <WalletConnectButton {...props} />;
}