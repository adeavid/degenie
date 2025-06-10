'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

export type WalletType = 'ethereum' | 'solana';

interface WalletConnectButtonProps {
  walletType?: WalletType;
  className?: string;
}

interface SolanaWalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
}

export function WalletConnectButtonV2({ walletType, className }: WalletConnectButtonProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(walletType || null);
  const [solanaWallet, setSolanaWallet] = useState<SolanaWalletState>({
    connected: false,
    publicKey: null,
    balance: null
  });
  const [loading, setLoading] = useState(false);
  
  // Ethereum wallet hooks
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { connect: connectEth, connectors } = useConnect();
  const { disconnect: disconnectEth } = useDisconnect();
  const { data: ethBalance } = useBalance({
    address: ethAddress,
  });
  
  // Debug connectors
  useEffect(() => {
    console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name, type: c.type })));
  }, [connectors]);

  // Solana connection
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl);

  useEffect(() => {
    // Check if Phantom is already connected
    checkSolanaConnection();
  }, []);

  const checkSolanaConnection = async () => {
    try {
      const { solana } = window as any;
      if (solana && solana.isPhantom) {
        const response = await solana.connect({ onlyIfTrusted: true });
        const pubKey = response.publicKey.toString();
        setSolanaWallet({
          connected: true,
          publicKey: pubKey,
          balance: null
        });
        setSelectedWallet('solana');
        fetchSolanaBalance(pubKey);
      }
    } catch (error) {
      // Not connected, ignore
    }
  };

  const fetchSolanaBalance = async (pubKeyString: string) => {
    try {
      const pubKey = new PublicKey(pubKeyString);
      const balance = await connection.getBalance(pubKey);
      setSolanaWallet(prev => ({
        ...prev,
        balance: balance / LAMPORTS_PER_SOL
      }));
    } catch (err) {
      console.error('Failed to fetch Solana balance:', err);
    }
  };

  const connectSolana = async () => {
    try {
      setLoading(true);
      const { solana } = window as any;
      
      if (!solana || !solana.isPhantom) {
        alert('Please install Phantom wallet!');
        return;
      }

      const response = await solana.connect();
      const pubKey = response.publicKey.toString();
      
      setSolanaWallet({
        connected: true,
        publicKey: pubKey,
        balance: null
      });
      
      fetchSolanaBalance(pubKey);
      
      // Listen for disconnect
      solana.on('disconnect', () => {
        setSolanaWallet({
          connected: false,
          publicKey: null,
          balance: null
        });
        setSelectedWallet(null);
      });
      
      // Listen for account change
      solana.on('accountChanged', (publicKey: any) => {
        if (publicKey) {
          const pubKey = publicKey.toString();
          setSolanaWallet(prev => ({
            ...prev,
            publicKey: pubKey
          }));
          fetchSolanaBalance(pubKey);
        } else {
          setSolanaWallet({
            connected: false,
            publicKey: null,
            balance: null
          });
          setSelectedWallet(null);
        }
      });
      
    } catch (err) {
      console.error('Solana connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectSolana = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
        setSolanaWallet({
          connected: false,
          publicKey: null,
          balance: null
        });
      }
    } catch (err) {
      console.error('Solana disconnect failed:', err);
    }
  };

  const handleConnect = async () => {
    if (selectedWallet === 'ethereum') {
      // Check if MetaMask is installed
      if (window.ethereum && window.ethereum.isMetaMask) {
        // Use injected connector for MetaMask
        const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
        if (injectedConnector) {
          connectEth({ connector: injectedConnector });
        }
      } else {
        // No MetaMask, try WalletConnect
        const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');
        if (walletConnectConnector) {
          connectEth({ connector: walletConnectConnector });
        } else {
          alert('Please install MetaMask!');
        }
      }
    } else if (selectedWallet === 'solana') {
      await connectSolana();
    }
  };

  const handleDisconnect = async () => {
    if (isEthConnected) {
      disconnectEth();
    } else if (solanaWallet.connected) {
      await disconnectSolana();
    }
    setSelectedWallet(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isConnected = isEthConnected || solanaWallet.connected;
  const walletAddress = ethAddress || solanaWallet.publicKey;

  if (isConnected && walletAddress) {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <span className="text-sm text-gray-600">
          {isEthConnected ? '🔷' : '☀️'} {formatAddress(walletAddress)}
          {isEthConnected && ethBalance && ` (${parseFloat(ethBalance.formatted).toFixed(4)} ${ethBalance.symbol})`}
          {solanaWallet.balance !== null && ` (${solanaWallet.balance.toFixed(4)} SOL)`}
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
          onClick={async () => {
            setSelectedWallet('ethereum');
            // Check if MetaMask is installed
            if (window.ethereum && window.ethereum.isMetaMask) {
              const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
              if (injectedConnector) {
                connectEth({ connector: injectedConnector });
              }
            } else {
              alert('Please install MetaMask to connect to Ethereum!');
              window.open('https://metamask.io/download/', '_blank');
            }
          }}
        >
          🔷 Connect Ethereum
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            setSelectedWallet('solana');
            await connectSolana();
          }}
          disabled={loading}
        >
          ☀️ {loading ? 'Connecting...' : 'Connect Solana'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={handleConnect}
      className={className}
      disabled={loading}
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}