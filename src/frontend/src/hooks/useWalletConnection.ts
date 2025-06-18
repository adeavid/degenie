'use client';

import { useState, useEffect } from 'react';

interface WalletConnectionState {
  connected: boolean;
  address: string | null;
  isEthConnected: boolean;
  isSolConnected: boolean;
  ethAddress: string | null;
  solanaAddress: string | null;
  publicKey: { toString: () => string } | null;
  connectWallet: () => Promise<void>;
}

export function useWalletConnection(): WalletConnectionState {
  const [state, setState] = useState<WalletConnectionState>({
    connected: false,
    address: null,
    isEthConnected: false,
    isSolConnected: false,
    ethAddress: null,
    solanaAddress: null,
    publicKey: null,
    connectWallet: async () => {},
  });

  useEffect(() => {
    const checkWalletConnection = () => {
      try {
        // Check Ethereum/MetaMask connection
        const ethAddress = window.ethereum?.selectedAddress;
        const isEthConnected = !!ethAddress;

        // Check Solana/Phantom connection more thoroughly
        let isSolConnected = false;
        let solanaAddress = null;

        // Multiple checks for Phantom connection
        if (window.solana && window.solana.isPhantom) {
          // Primary check: isConnected and publicKey
          if (window.solana.isConnected && window.solana.publicKey) {
            isSolConnected = true;
            solanaAddress = window.solana.publicKey.toString();
            console.log('[useWalletConnection] Phantom connected via isConnected:', solanaAddress);
          }
          // Fallback check: publicKey exists (even if isConnected is false)
          else if (window.solana.publicKey) {
            isSolConnected = true;
            solanaAddress = window.solana.publicKey.toString();
            console.log('[useWalletConnection] Phantom connected via publicKey fallback:', solanaAddress);
          }
        }

        // Also check localStorage for previous connections
        const storedWalletName = localStorage.getItem('walletName');
        const storedPhantomKey = localStorage.getItem('phantomPublicKey');
        if (storedWalletName === 'Phantom' && storedPhantomKey && !isSolConnected) {
          isSolConnected = true;
          solanaAddress = storedPhantomKey;
          console.log('[useWalletConnection] Phantom connected via localStorage fallback:', solanaAddress);
        }

        const connected = isEthConnected || isSolConnected;
        const address = ethAddress || solanaAddress || null;
        const publicKey = solanaAddress ? { toString: () => solanaAddress } : null;

        setState({
          connected,
          address,
          isEthConnected,
          isSolConnected,
          ethAddress,
          solanaAddress,
          publicKey,
          connectWallet: async () => {
            if (window.solana && window.solana.connect) {
              await window.solana.connect();
              checkWalletConnection();
            }
          },
        });

        console.log('[useWalletConnection] State updated:', {
          connected,
          isEthConnected,
          isSolConnected,
          ethAddress: ethAddress ? ethAddress.slice(0, 6) + '...' : null,
          solanaAddress: solanaAddress ? solanaAddress.slice(0, 6) + '...' : null,
        });

      } catch (error) {
        console.error('[useWalletConnection] Error checking wallet state:', error);
      }
    };

    // Initial check
    checkWalletConnection();

    // Listen for Ethereum account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('[useWalletConnection] Ethereum accounts changed:', accounts);
        checkWalletConnection();
      });
    }

    // Listen for Phantom wallet changes
    if (window.solana && window.solana.isPhantom) {
      window.solana.on('connect', (publicKey: any) => {
        console.log('[useWalletConnection] Phantom connected:', publicKey.toString());
        checkWalletConnection();
      });

      window.solana.on('disconnect', () => {
        console.log('[useWalletConnection] Phantom disconnected');
        checkWalletConnection();
      });

      window.solana.on('accountChanged', (publicKey: any) => {
        console.log('[useWalletConnection] Phantom account changed:', publicKey?.toString());
        checkWalletConnection();
      });
    }

    // Listen for storage changes (other wallet connections)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletName' || e.key === 'wagmi.store') {
        console.log('[useWalletConnection] Storage changed:', e.key);
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for Phantom connection every 5 seconds as fallback
    const pollInterval = setInterval(() => {
      if (window.solana && window.solana.isPhantom) {
        checkWalletConnection();
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
      
      if (window.ethereum) {
        window.ethereum.removeAllListeners?.('accountsChanged');
      }
      
      if (window.solana) {
        window.solana.removeAllListeners?.('connect');
        window.solana.removeAllListeners?.('disconnect');
        window.solana.removeAllListeners?.('accountChanged');
      }
    };
  }, []);

  return state;
}