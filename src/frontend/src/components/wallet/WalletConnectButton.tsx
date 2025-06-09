'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

export type WalletType = 'ethereum' | 'solana';

interface WalletConnectButtonProps {
  walletType?: WalletType;
  className?: string;
}

export function WalletConnectButton({ walletType, className }: WalletConnectButtonProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(walletType || null);
  
  // Ethereum wallet hooks
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { connect: connectEth, connectors } = useConnect();
  const { disconnect: disconnectEth } = useDisconnect();

  // Solana wallet hooks
  const { publicKey, connected: isSolConnected, disconnect: disconnectSol } = useWallet();
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  const isConnected = isEthConnected || isSolConnected;
  const walletAddress = ethAddress || publicKey?.toBase58();

  const handleConnect = () => {
    if (selectedWallet === 'ethereum') {
      const metamask = connectors.find(c => c.id === 'injected');
      const walletConnect = connectors.find(c => c.id === 'walletConnect');
      
      if (metamask) {
        connectEth({ connector: metamask });
      } else if (walletConnect) {
        connectEth({ connector: walletConnect });
      }
    } else if (selectedWallet === 'solana') {
      setSolanaModalVisible(true);
    }
  };

  const handleDisconnect = () => {
    if (isEthConnected) {
      disconnectEth();
    } else if (isSolConnected) {
      disconnectSol();
    }
    setSelectedWallet(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && walletAddress) {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <span className="text-sm text-gray-600">
          {isEthConnected ? '🔷' : '☀️'} {formatAddress(walletAddress)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (!selectedWallet && !walletType) {
    return (
      <div className={clsx('flex gap-2', className)}>
        <Button
          variant="primary"
          onClick={() => setSelectedWallet('ethereum')}
        >
          🔷 Connect Ethereum
        </Button>
        <Button
          variant="primary"
          onClick={() => setSelectedWallet('solana')}
        >
          ☀️ Connect Solana
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={handleConnect}
      className={className}
    >
      Connect Wallet
    </Button>
  );
}