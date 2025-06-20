'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

interface WalletStatusProviderProps {
  onConnectionChange: (connected: boolean) => void;
}

export default function WalletStatusProvider({ onConnectionChange }: WalletStatusProviderProps) {
  const { isConnected: isEthConnected } = useAccount();
  const { connected: isSolConnected } = useWallet();
  
  useEffect(() => {
    const connected = isEthConnected || isSolConnected;
    onConnectionChange(connected);
  }, [isEthConnected, isSolConnected, onConnectionChange]);

  return null; // This component doesn't render anything, just tracks wallet state
}