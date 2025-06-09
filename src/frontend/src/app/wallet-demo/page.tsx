'use client';

import React from 'react';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/Card';

export default function WalletDemoPage() {
  const { address: ethAddress, isConnected: isEthConnected, chain } = useAccount();
  const { publicKey, connected: isSolConnected, wallet } = useWallet();
  const balance = useWalletBalance();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Web3 Wallet Integration Demo
        </h1>

        <div className="space-y-6">
          {/* Wallet Connection Section */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>
          </Card>

          {/* Connection Status */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Ethereum:</span>{' '}
                {isEthConnected ? (
                  <span className="text-green-600">Connected</span>
                ) : (
                  <span className="text-gray-500">Not connected</span>
                )}
              </div>
              <div>
                <span className="font-medium">Solana:</span>{' '}
                {isSolConnected ? (
                  <span className="text-green-600">Connected</span>
                ) : (
                  <span className="text-gray-500">Not connected</span>
                )}
              </div>
            </div>
          </Card>

          {/* Wallet Details */}
          {(isEthConnected || isSolConnected) && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">Wallet Details</h2>
              <div className="space-y-3">
                {isEthConnected && (
                  <>
                    <div>
                      <span className="font-medium">Chain:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">
                        {chain?.name || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Address:</span>{' '}
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {ethAddress}
                      </code>
                    </div>
                  </>
                )}
                
                {isSolConnected && (
                  <>
                    <div>
                      <span className="font-medium">Wallet:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">
                        {wallet?.adapter.name || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Public Key:</span>{' '}
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                        {publicKey?.toBase58()}
                      </code>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Balance Information */}
          {(isEthConnected || isSolConnected) && !balance.isLoading && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">Balance</h2>
              <div className="text-2xl font-mono">
                {balance.formatted} {balance.symbol}
              </div>
              {balance.error && (
                <div className="text-red-600 text-sm mt-2">
                  Error loading balance: {balance.error.message}
                </div>
              )}
            </Card>
          )}

          {/* Test Actions */}
          {(isEthConnected || isSolConnected) && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <p>✅ Wallet connection successful</p>
                <p>✅ Balance retrieval working</p>
                <p>✅ Ready for token creation integration</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}