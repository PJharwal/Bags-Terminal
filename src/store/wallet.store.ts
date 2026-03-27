import { create } from 'zustand';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { TransactionRecord } from '@/lib/bags-types';

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

interface WalletStore {
  // Connection state
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  balance: number | null;
  connection: Connection;

  // Transaction history
  transactions: TransactionRecord[];

  // Actions
  setConnected: (publicKey: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setBalance: (balance: number | null) => void;
  refreshBalance: () => Promise<void>;
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  publicKey: null,
  connected: false,
  connecting: false,
  balance: null,
  connection: new Connection(RPC_URL, 'confirmed'),
  transactions: [],

  setConnected: (publicKey) => {
    set({ publicKey, connected: !!publicKey, connecting: false });
    if (publicKey) {
      get().refreshBalance();
    }
  },

  setConnecting: (connecting) => set({ connecting }),

  setBalance: (balance) => set({ balance }),

  refreshBalance: async () => {
    const { publicKey, connection } = get();
    if (!publicKey) return;

    try {
      const pk = new PublicKey(publicKey);
      const lamports = await connection.getBalance(pk);
      set({ balance: lamports / LAMPORTS_PER_SOL });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  addTransaction: (tx) => {
    const updated = [tx, ...get().transactions].slice(0, 50);
    set({ transactions: updated });
    try { localStorage.setItem('bags_transactions', JSON.stringify(updated)); } catch {}
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      ),
    }));
    try {
      localStorage.setItem('bags_transactions', JSON.stringify(get().transactions));
    } catch {}
  },

  disconnect: () => {
    set({
      publicKey: null,
      connected: false,
      connecting: false,
      balance: null,
    });
  },
}));
