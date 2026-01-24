'use client';

import { useCallback, useEffect } from 'react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/store/wallet.store';

export function useBagsWallet() {
  const {
    publicKey,
    connected,
    connecting,
    disconnect: adapterDisconnect,
    sendTransaction,
    signTransaction,
    wallet,
  } = useSolanaWallet();

  const store = useWalletStore();

  // Sync adapter state with store
  useEffect(() => {
    if (connected && publicKey) {
      store.setConnected(publicKey.toBase58());
    } else if (!connected && !connecting) {
      store.setConnected(null);
    }
  }, [connected, publicKey, connecting]);

  useEffect(() => {
    store.setConnecting(connecting);
  }, [connecting]);

  // Auto-refresh balance every 30s when connected
  useEffect(() => {
    if (!store.connected) return;

    const interval = setInterval(() => {
      store.refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [store.connected]);

  const disconnect = useCallback(async () => {
    await adapterDisconnect();
    store.disconnect();
  }, [adapterDisconnect]);

  const shortenedAddress = store.publicKey
    ? `${store.publicKey.slice(0, 4)}...${store.publicKey.slice(-4)}`
    : null;

  return {
    publicKey: store.publicKey,
    connected: store.connected,
    connecting: store.connecting,
    balance: store.balance,
    shortenedAddress,
    wallet,
    disconnect,
    sendTransaction,
    signTransaction,
    refreshBalance: store.refreshBalance,
    connection: store.connection,
    transactions: store.transactions,
    addTransaction: store.addTransaction,
    updateTransaction: store.updateTransaction,
  };
}
