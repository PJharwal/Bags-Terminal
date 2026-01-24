import { create } from 'zustand';
import { bagsService } from '@/services/bags.service';
import type { BagsCreatedToken, FeeClaimInfo, ClaimEvent } from '@/lib/bags-types';

interface CreatorStore {
  createdTokens: BagsCreatedToken[];
  claimableEarnings: FeeClaimInfo[];
  claimHistory: ClaimEvent[];
  isLoading: boolean;
  error: string | null;
  claimingToken: string | null;

  // Actions
  loadCreatedTokens: (wallet: string) => Promise<void>;
  loadClaimableEarnings: (wallet: string) => Promise<void>;
  loadClaimHistory: (wallet: string) => Promise<void>;
  refreshAll: (wallet: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  claimFees: (tokenMint: string, walletAddress: string, sendTransaction: (...args: any[]) => Promise<string>, connection: any) => Promise<string>;
}

export const useCreatorStore = create<CreatorStore>((set, get) => ({
  createdTokens: [],
  claimableEarnings: [],
  claimHistory: [],
  isLoading: false,
  error: null,
  claimingToken: null,

  loadCreatedTokens: async (wallet) => {
    try {
      const tokens = await bagsService.getCreatedTokens(wallet);
      set({ createdTokens: tokens });
    } catch (err) {
      console.error('Failed to load created tokens:', err);
    }
  },

  loadClaimableEarnings: async (wallet) => {
    try {
      const earnings = await bagsService.getClaimableFees(wallet);
      set({ claimableEarnings: earnings });
    } catch (err) {
      console.error('Failed to load claimable earnings:', err);
    }
  },

  loadClaimHistory: async (wallet) => {
    try {
      const history = await bagsService.getClaimHistory(wallet);
      set({ claimHistory: history });
    } catch (err) {
      console.error('Failed to load claim history:', err);
    }
  },

  refreshAll: async (wallet) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().loadCreatedTokens(wallet),
        get().loadClaimableEarnings(wallet),
        get().loadClaimHistory(wallet),
      ]);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to refresh' });
    } finally {
      set({ isLoading: false });
    }
  },

  claimFees: async (tokenMint: string, walletAddress: string, sendTransaction: (...args: any[]) => Promise<string>, connection: any) => {
    set({ claimingToken: tokenMint });

    try {
      const serializedTx = await bagsService.createClaimTransaction(tokenMint, walletAddress);
      const txBuffer = Buffer.from(serializedTx, 'base64');
      const { Transaction, VersionedTransaction } = await import('@solana/web3.js');

      let tx;
      try {
        tx = VersionedTransaction.deserialize(txBuffer);
      } catch {
        tx = Transaction.from(txBuffer);
      }

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // Refresh data after claim
      await get().refreshAll(walletAddress);

      return signature;
    } catch (err) {
      throw err;
    } finally {
      set({ claimingToken: null });
    }
  },
}));
