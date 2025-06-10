'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface Chain {
  id: string;
  name: string;
  icon: string;
  wallets: Wallet[];
}

interface Wallet {
  id: string;
  name: string;
  icon: string;
  installed?: boolean;
  downloadUrl?: string;
}

const chains: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: '🔷',
    wallets: [
      { id: 'metamask', name: 'MetaMask', icon: '🦊', installed: true },
      { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', installed: true },
      { id: 'coinbase', name: 'Coinbase Wallet', icon: '🪙', installed: false, downloadUrl: 'https://www.coinbase.com/wallet' },
    ]
  },
  {
    id: 'solana',
    name: 'Solana',
    icon: '☀️',
    wallets: [
      { id: 'phantom', name: 'Phantom', icon: '👻', installed: true },
      { id: 'solflare', name: 'Solflare', icon: '🔥', installed: false, downloadUrl: 'https://solflare.com' },
      { id: 'backpack', name: 'Backpack', icon: '🎒', installed: false, downloadUrl: 'https://backpack.app' },
    ]
  },
  {
    id: 'base',
    name: 'Base',
    icon: '🔵',
    wallets: [
      { id: 'metamask', name: 'MetaMask', icon: '🦊', installed: true },
      { id: 'coinbase', name: 'Coinbase Wallet', icon: '🪙', installed: false, downloadUrl: 'https://www.coinbase.com/wallet' },
    ]
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    icon: '🔺',
    wallets: [
      { id: 'metamask', name: 'MetaMask', icon: '🦊', installed: true },
      { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', installed: true },
    ]
  }
];

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (chainId: string, walletId: string) => void;
}

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const handleWalletClick = (wallet: Wallet, chainId: string) => {
    if (wallet.installed) {
      try {
        onConnect(chainId, wallet.id);
        onClose();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        // Add user-friendly error handling
      }
    } else if (wallet.downloadUrl) {
      window.open(wallet.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBack = () => {
    setSelectedChain(null);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {selectedChain ? 'Select Wallet' : 'Select Network'}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                {!selectedChain ? (
                  <div className="grid grid-cols-2 gap-3">
                    {chains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => setSelectedChain(chain.id)}
                        className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      >
                        <span className="text-3xl mb-2">{chain.icon}</span>
                        <span className="text-sm font-medium">{chain.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleBack}
                      className="text-sm text-blue-600 hover:text-blue-700 mb-4"
                    >
                      ← Back to networks
                    </button>
                    <div className="space-y-3">
                      {chains
                        .find(c => c.id === selectedChain)
                        ?.wallets.map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => handleWalletClick(wallet, selectedChain)}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                          >
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{wallet.icon}</span>
                              <span className="font-medium">{wallet.name}</span>
                            </div>
                            {!wallet.installed && (
                              <span className="text-xs text-gray-500">Install</span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500 text-center">
                  By connecting, you agree to our{' '}
                  <a
                    href="/terms"
                    className="text-blue-600 hover:text-blue-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </a>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}