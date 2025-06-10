'use client';

import React, { useState, useEffect } from 'react';
import { WalletConnectButtonV2 } from './WalletConnectButtonV2';
import { Button } from '@/components/ui/Button';

interface WalletConnectButtonV2WrapperProps {
  className?: string;
}

export function WalletConnectButtonV2Wrapper(props: WalletConnectButtonV2WrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="primary" disabled className={props.className}>
        Connect Wallet
      </Button>
    );
  }

  return <WalletConnectButtonV2 {...props} />;
}