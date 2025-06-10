'use client';

import React, { useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function WalletCompleteTestPage() {
  const [solBalance, setSolBalance] = useState<string | null>(null);
  const [isLoadingSolBalance, setIsLoadingSolBalance] = useState(false);

  // Ethereum hooks
  const { address: ethAddress, isConnected: isEthConnected, chain } = useAccount();
  const { connect: connectEth, connectors, isPending: isConnectingEth } = useConnect();
  const { disconnect: disconnectEth } = useDisconnect();
  const { data: ethBalanceData, isLoading: isLoadingEthBalance, refetch: refetchEthBalance } = useBalance({
    address: ethAddress,
  });

  // Solana hooks
  const { publicKey, connected: isSolConnected, disconnect: disconnectSol, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  // Fetch Solana balance
  const fetchSolanaBalance = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoadingSolBalance(true);
    try {
      const balance = await connection.getBalance(publicKey);
      setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      setSolBalance('RPC Limited');
    } finally {
      setIsLoadingSolBalance(false);
    }
  }, [publicKey, connection]);

  // Auto-fetch Solana balance when connected
  React.useEffect(() => {
    if (isSolConnected && publicKey) {
      fetchSolanaBalance();
    } else {
      setSolBalance(null);
    }
  }, [isSolConnected, publicKey, fetchSolanaBalance]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Complete Wallet Integration Test</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ethereum Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔷 Ethereum Wallets
            </h2>

            {!isEthConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Available connectors: {connectors.length}
                </p>
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connectEth({ connector })}
                    disabled={isConnectingEth}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isConnectingEth ? 'Connecting...' : `Connect ${connector.name}`}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected to:</p>
                  <p className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {ethAddress}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Chain:</p>
                  <p>{chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Balance:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">
                      {isLoadingEthBalance ? '...' : ethBalanceData?.formatted || '0'} {ethBalanceData?.symbol || 'ETH'}
                    </p>
                    <button
                      onClick={() => refetchEthBalance()}
                      className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => disconnectEth()}
                  className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Solana Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ☀️ Solana Wallets
            </h2>

            {!isSolConnected ? (
              <div className="space-y-3">
                <button
                  onClick={() => setSolanaModalVisible(true)}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Select Solana Wallet
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Opens wallet selection modal
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wallet:</p>
                  <p>{wallet?.adapter.name || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Public Key:</p>
                  <p className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {publicKey?.toBase58()}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Balance:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">
                      {isLoadingSolBalance ? '...' : solBalance || '0'} SOL
                    </p>
                    <button
                      onClick={fetchSolanaBalance}
                      disabled={isLoadingSolBalance}
                      className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => disconnectSol()}
                  className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Integration Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">MetaMask:</p>
              <p className={connectors.find(c => c.id === 'injected') ? 'text-green-600' : 'text-red-600'}>
                {connectors.find(c => c.id === 'injected') ? '✅ Available' : '❌ Not Found'}
              </p>
            </div>
            <div>
              <p className="font-medium">WalletConnect:</p>
              <p className={connectors.find(c => c.id === 'walletConnect') ? 'text-green-600' : 'text-red-600'}>
                {connectors.find(c => c.id === 'walletConnect') ? '✅ Configured' : '❌ No Project ID'}
              </p>
            </div>
            <div>
              <p className="font-medium">Ethereum Connected:</p>
              <p className={isEthConnected ? 'text-green-600' : 'text-gray-500'}>
                {isEthConnected ? '✅ Yes' : '⚪ No'}
              </p>
            </div>
            <div>
              <p className="font-medium">Solana Connected:</p>
              <p className={isSolConnected ? 'text-green-600' : 'text-gray-500'}>
                {isSolConnected ? '✅ Yes' : '⚪ No'}
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Debug Information
          </summary>
          <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            <p>WalletConnect Project ID: {process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
            <p>Connectors: {connectors.map(c => c.name).join(', ')}</p>
            <p>Ethereum Provider: {typeof window !== 'undefined' && window.ethereum ? 'Yes' : 'No'}</p>
            <p>Solana Provider: {typeof window !== 'undefined' && 'solana' in window ? 'Yes' : 'No'}</p>
          </div>
        </details>
      </div>
    </div>
  );
}