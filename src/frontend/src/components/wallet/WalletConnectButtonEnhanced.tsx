'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PhantomWalletButton } from './PhantomWalletButton';
import { useWalletConnection } from '@/hooks/useWalletConnection';

export function WalletConnectButtonEnhanced() {
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const { connected, isEthConnected, isSolConnected, ethAddress, solanaAddress } = useWalletConnection();

  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install it from https://metamask.io/');
        return;
      }

      console.log('[WalletConnectButtonEnhanced] Connecting to MetaMask...');
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        console.log('[WalletConnectButtonEnhanced] Connected to MetaMask:', accounts[0]);
      }
    } catch (error) {
      console.error('[WalletConnectButtonEnhanced] Failed to connect to MetaMask:', error);
      if (error.code !== 4001) { // Don't show error for user rejection
        alert('Failed to connect to MetaMask. Please try again.');
      }
    }
  };

  const disconnect = async () => {
    try {
      // Disconnect Ethereum
      if (isEthConnected && window.ethereum) {
        // MetaMask doesn't have a disconnect method, but we can clear our state
        localStorage.removeItem('wagmi.store');
      }

      // Disconnect Solana
      if (isSolConnected && window.solana) {
        await window.solana.disconnect();
        localStorage.removeItem('walletName');
        localStorage.removeItem('phantomPublicKey');
      }

      // Trigger storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      console.log('[WalletConnectButtonEnhanced] Disconnected all wallets');
    } catch (error) {
      console.error('[WalletConnectButtonEnhanced] Error disconnecting:', error);
    }
  };

  if (connected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">
          {isEthConnected && ethAddress && (
            <div>ETH: {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}</div>
          )}
          {isSolConnected && solanaAddress && (
            <div>SOL: {solanaAddress.slice(0, 6)}...{solanaAddress.slice(-4)}</div>
          )}
        </div>
        <Button 
          onClick={disconnect}
          variant="outline"
          size="sm"
          className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (showWalletOptions) {
    return (
      <div className="relative">
        <Card className="absolute right-0 top-12 w-80 p-4 bg-gray-800 border-gray-700 z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
              <button 
                onClick={() => setShowWalletOptions(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {/* MetaMask */}
              <div className="p-3 border border-gray-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">MetaMask</div>
                    <div className="text-sm text-gray-400">Connect to Ethereum</div>
                  </div>
                  <Button 
                    onClick={connectMetaMask}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Connect
                  </Button>
                </div>
              </div>

              {/* Phantom */}
              <div className="p-3 border border-gray-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Phantom</div>
                    <div className="text-sm text-gray-400">Connect to Solana</div>
                  </div>
                  <PhantomWalletButton />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 text-center">
              Don't have a wallet? Install MetaMask or Phantom to get started.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => setShowWalletOptions(true)}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      Connect Wallet
    </Button>
  );
}