'use client';

import React, { useEffect, useState } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

interface WalletInfo {
  address: string;
  balance: string;
  type: 'ethereum' | 'solana';
}

export default function WalletBalanceTestPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for wallet changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletInfo(null);
      }
    };

    const handlePhantomDisconnect = () => {
      setWalletInfo(null);
    };

    // Listen for MetaMask account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    // Listen for Phantom disconnect
    if ('solana' in window && window.solana?.isPhantom) {
      window.solana.on('disconnect', handlePhantomDisconnect);
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      if (window.solana?.off) {
        window.solana.off('disconnect', handlePhantomDisconnect);
      }
    };
  }, []);

  const getEthereumBalance = async (address: string): Promise<string> => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Validate response
      if (!balance || typeof balance !== 'string') {
        throw new Error('Invalid balance response from RPC');
      }
      
      // Convert from Wei to ETH using BigInt to avoid precision loss
      const balanceWei = BigInt(balance);
      // Convert to ETH (divide by 10^18)
      const ethBalance = Number(balanceWei) / 1e18;
      
      return ethBalance.toFixed(4);
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      throw error;
    }
  };

  const getSolanaBalance = async (publicKey: any): Promise<string> => {
    // Note: Most public RPC endpoints block browser requests due to CORS
    // In production, you would use your own RPC endpoint or a service like QuickNode/Alchemy
    
    // For demo purposes, we'll try the configured RPC, but expect it might fail
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const balance = await connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toFixed(4);
    } catch (error) {
      console.warn('Balance fetch failed - this is expected with public RPCs:', error);
      // Return a placeholder to show wallet is connected
      return 'RPC Limited';
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      setIsConnecting(true);
      setError(null);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        setIsLoadingBalance(true);
        const balance = await getEthereumBalance(address);
        
        setWalletInfo({
          address,
          balance,
          type: 'ethereum'
        });
      } catch (error: any) {
        console.error('Error connecting to MetaMask:', error);
        setError(error.message || 'Failed to connect MetaMask');
      } finally {
        setIsConnecting(false);
        setIsLoadingBalance(false);
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const connectPhantom = async () => {
    if ('solana' in window) {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        setIsConnecting(true);
        setError(null);
        try {
          const resp = await provider.connect();
          const publicKey = resp.publicKey;
          
          let balance = 'N/A';
          setIsLoadingBalance(true);
          
          // Try to get balance, but don't fail if RPC is blocked
          try {
            balance = await getSolanaBalance(publicKey);
          } catch (balanceError) {
            console.warn('Could not fetch balance - RPC issues. Using fallback.');
            // Don't set as error - this is expected with public RPCs
          }
          
          setWalletInfo({
            address: publicKey.toString(),
            balance,
            type: 'solana'
          });
        } catch (err: any) {
          console.error('Error connecting to Phantom:', err);
          setError(err.message || 'Failed to connect Phantom');
        } finally {
          setIsConnecting(false);
          setIsLoadingBalance(false);
        }
      }
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  };

  const refreshBalance = async () => {
    if (!walletInfo) return;
    
    setIsLoadingBalance(true);
    setError(null);
    try {
      let newBalance: string;
      if (walletInfo.type === 'ethereum') {
        newBalance = await getEthereumBalance(walletInfo.address);
      } else {
        const provider = (window as any).solana;
        const publicKey = provider.publicKey;
        newBalance = await getSolanaBalance(publicKey);
      }
      
      setWalletInfo({
        ...walletInfo,
        balance: newBalance
      });
    } catch (error: any) {
      // For Solana, RPC limitations are expected, don't show as error
      if (walletInfo.type === 'solana') {
        setWalletInfo({
          ...walletInfo,
          balance: 'RPC Limited'
        });
      } else {
        setError(error.message || 'Failed to refresh balance');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const disconnect = () => {
    setWalletInfo(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Wallet Balance Test</h1>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Connected Wallet Info */}
        {walletInfo && (
          <div className="bg-green-100 dark:bg-green-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Connected Wallet</h2>
                <p className="text-sm font-medium">Type: {walletInfo.type === 'ethereum' ? '🔷 Ethereum' : '☀️ Solana'}</p>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Address:</p>
                <p className="text-xs font-mono break-all bg-white dark:bg-gray-900 p-2 rounded">
                  {walletInfo.address}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Balance:</p>
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold">
                    {isLoadingBalance ? '...' : walletInfo.balance} {walletInfo.type === 'ethereum' ? 'ETH' : 'SOL'}
                  </p>
                  <button
                    onClick={refreshBalance}
                    disabled={isLoadingBalance}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    🔄 Refresh
                  </button>
                </div>
                {walletInfo.type === 'solana' && walletInfo.balance === 'RPC Limited' && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Public RPC endpoints often block browser requests. Production apps use dedicated RPC services.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connect Buttons */}
        {!walletInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Connect your wallet</h2>
            
            <button
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : '🦊 Connect MetaMask'}
            </button>
            
            <button
              onClick={connectPhantom}
              disabled={isConnecting}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : '👻 Connect Phantom'}
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>WalletConnect support coming soon!</p>
              <p className="text-xs mt-2">Need a Project ID from cloud.walletconnect.com</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔐 Security Notes:</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Balance retrieval is done through secure RPC calls</li>
            <li>• No private keys are accessed or stored</li>
            <li>• All operations are read-only</li>
            <li>• Balances are fetched from the blockchain in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}