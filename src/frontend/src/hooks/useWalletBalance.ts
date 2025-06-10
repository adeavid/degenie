'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WalletBalance {
  balance: string;
  symbol: string;
  decimals: number;
  formatted: string;
  isLoading: boolean;
  error: Error | null;
}

export function useWalletBalance() {
  const [solanaBalance, setSolanaBalance] = useState<WalletBalance>({
    balance: '0',
    symbol: 'SOL',
    decimals: 9,
    formatted: '0',
    isLoading: false,
    error: null,
  });

  // Ethereum hooks
  const { address: ethAddress } = useAccount();
  const { data: ethBalanceData, isLoading: ethLoading, error: ethError } = useBalance({
    address: ethAddress,
  });

  // Solana hooks
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Fetch Solana balance
  useEffect(() => {
    if (!publicKey) {
      setSolanaBalance(prev => ({ ...prev, balance: '0', formatted: '0' }));
      return;
    }

    const fetchBalance = async () => {
      setSolanaBalance(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const balance = await connection.getBalance(publicKey);
        const formatted = (balance / LAMPORTS_PER_SOL).toFixed(4);
        setSolanaBalance({
          balance: balance.toString(),
          symbol: 'SOL',
          decimals: 9,
          formatted,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setSolanaBalance(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        const balance = accountInfo.lamports;
        const formatted = (balance / LAMPORTS_PER_SOL).toFixed(4);
        setSolanaBalance(prev => ({
          ...prev,
          balance: balance.toString(),
          formatted,
        }));
      }
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [publicKey, connection]);

  // Return appropriate balance based on connected wallet
  if (ethAddress && ethBalanceData) {
    return {
      balance: ethBalanceData.value.toString(),
      symbol: ethBalanceData.symbol,
      decimals: ethBalanceData.decimals,
      formatted: ethBalanceData.formatted,
      isLoading: ethLoading,
      error: ethError as Error | null,
    };
  }

  if (publicKey) {
    return solanaBalance;
  }

  return {
    balance: '0',
    symbol: '',
    decimals: 0,
    formatted: '0',
    isLoading: false,
    error: null,
  };
}