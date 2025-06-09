'use client';

import React, { useEffect, useState } from 'react';

export default function WalletTestPage() {
  const [walletType, setWalletType] = useState<'ethereum' | 'solana' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletStatus, setWalletStatus] = useState({
    metamask: false,
    phantom: false,
    ethereum: false,
    solana: false
  });
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  useEffect(() => {
    // Check for wallets on mount
    const checkWallets = () => {
      setWalletStatus({
        metamask: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
        phantom: typeof window !== 'undefined' && 'solana' in window && (window as any).solana?.isPhantom,
        ethereum: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
        solana: typeof window !== 'undefined' && 'solana' in window
      });
    };

    checkWallets();
    // Check again after a delay in case wallets inject later
    setTimeout(checkWallets, 1000);
  }, []);

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      setIsConnecting(true);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Connected:', accounts[0]);
        setConnectedAccount(accounts[0]);
        setWalletType('ethereum');
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        alert('Failed to connect to MetaMask: ' + (error as any).message);
      }
      setIsConnecting(false);
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const connectPhantom = async () => {
    if ('solana' in window) {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        setIsConnecting(true);
        try {
          const resp = await provider.connect();
          console.log('Connected:', resp.publicKey.toString());
          setConnectedAccount(resp.publicKey.toString());
          setWalletType('solana');
        } catch (err) {
          console.error('Error connecting to Phantom:', err);
          alert('Failed to connect to Phantom: ' + (err as any).message);
        }
        setIsConnecting(false);
      }
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Wallet Test</h1>
        
        {/* Wallet Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Detection Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={walletStatus.metamask ? '✅' : '❌'}>
                MetaMask: {walletStatus.metamask ? 'Detected' : 'Not Found'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={walletStatus.phantom ? '✅' : '❌'}>
                Phantom: {walletStatus.phantom ? 'Detected' : 'Not Found'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={walletStatus.ethereum ? '✅' : '❌'}>
                Ethereum Provider: {walletStatus.ethereum ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={walletStatus.solana ? '✅' : '❌'}>
                Solana Provider: {walletStatus.solana ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Connected Account */}
        {connectedAccount && (
          <div className="bg-green-100 dark:bg-green-800 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium">Connected Account:</p>
            <p className="text-xs font-mono break-all">{connectedAccount}</p>
            <p className="text-sm mt-2">Wallet Type: {walletType}</p>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Connect your wallet</h2>
          
          <button
            onClick={connectMetaMask}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? 'Connecting...' : (
              <>
                🦊 {walletStatus.metamask ? 'Connect MetaMask' : 'Install MetaMask'}
              </>
            )}
          </button>
          
          <button
            onClick={connectPhantom}
            disabled={isConnecting}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? 'Connecting...' : (
              <>
                👻 {walletStatus.phantom ? 'Connect Phantom' : 'Install Phantom'}
              </>
            )}
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <p>Window.ethereum: {typeof window !== 'undefined' && window.ethereum ? 'Yes' : 'No'}</p>
          <p>Window.solana: {typeof window !== 'undefined' && 'solana' in window ? 'Yes' : 'No'}</p>
          <p className="mt-4">If wallets are not detected:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>Install the browser extension</li>
            <li>Refresh the page after installation</li>
            <li>Make sure the extension is enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}