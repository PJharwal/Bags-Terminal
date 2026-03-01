import { create } from 'zustand';
import { bagsService } from '@/services/bags.service';
import type {
  BagsCreatedToken,
  FeeClaimInfo,
  ClaimEvent,
  SendTransactionFn,
  SolanaConnection,
  PartnerConfig,
  PartnerClaimInfo,
  FeeShareWalletInfo,
} from '@/lib/bags-types';

interface CreatorStore {
  createdTokens: BagsCreatedToken[];
  claimableEarnings: FeeClaimInfo[];
  claimHistory: ClaimEvent[];
  isLoading: boolean;
  error: string | null;
  claimingToken: string | null;

  // Partner config
  partnerConfig: PartnerConfig | null;
  partnerClaimable: PartnerClaimInfo | null;
  isLoadingPartner: boolean;

  // Fee share wallet v2
  feeShareWalletInfo: FeeShareWalletInfo | null;

  // Actions
  loadCreatedTokens: (wallet: string) => Promise<void>;
  loadClaimableEarnings: (wallet: string) => Promise<void>;
  loadClaimHistory: (wallet: string) => Promise<void>;
  refreshAll: (wallet: string) => Promise<void>;
  claimFees: (tokenMint: string, walletAddress: string, sendTransaction: SendTransactionFn, connection: SolanaConnection) => Promise<string>;

  // Partner actions
  loadPartnerConfig: (wallet: string) => Promise<void>;
  createPartnerConfig: (walletAddress: string) => Promise<PartnerConfig>;
  claimPartnerFees: (partnerKey: string, walletAddress: string, sendTransaction: SendTransactionFn, connection: SolanaConnection) => Promise<string>;

  // Fee share wallet v2
  loadFeeShareWalletInfo: (wallet: string) => Promise<void>;
}

export const useCreatorStore = create<CreatorStore>((set, get) => ({
  createdTokens: [],
  claimableEarnings: [],
  claimHistory: [],
  isLoading: false,
  error: null,
  claimingToken: null,
  partnerConfig: null,
  partnerClaimable: null,
  isLoadingPartner: false,
  feeShareWalletInfo: null,

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
        get().loadPartnerConfig(wallet),
        get().loadFeeShareWalletInfo(wallet),
      ]);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to refresh' });
    } finally {
      set({ isLoading: false });
    }
  },

  claimFees: async (tokenMint: string, walletAddress: string, sendTransaction: SendTransactionFn, connection: SolanaConnection) => {
    set({ claimingToken: tokenMint });

    try {
      const serializedTxs = await bagsService.createClaimTransaction(tokenMint, walletAddress);
      const { Transaction, VersionedTransaction } = await import('@solana/web3.js');

      // Process all claim transactions (v2 returns Transaction[] instead of VersionedTransaction[])
      let lastSignature = '';
      for (const serializedTx of serializedTxs) {
        const txBuffer = Buffer.from(serializedTx, 'base64');
        let tx;
        try {
          tx = VersionedTransaction.deserialize(txBuffer);
        } catch {
          tx = Transaction.from(txBuffer);
        }
        lastSignature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(lastSignature, 'confirmed');
      }

      // Refresh data after claim
      await get().refreshAll(walletAddress);

      return lastSignature;
    } catch (err) {
      throw err;
    } finally {
      set({ claimingToken: null });
    }
  },

  // Partner config methods
  loadPartnerConfig: async (wallet) => {
    set({ isLoadingPartner: true });
    try {
      const config = await bagsService.getPartnerConfig(wallet);
      set({ partnerConfig: config });

      if (config?.partnerKey) {
        const claimable = await bagsService.getPartnerClaimable(config.partnerKey);
        set({ partnerClaimable: claimable });
      }
    } catch (err) {
      console.error('Failed to load partner config:', err);
    } finally {
      set({ isLoadingPartner: false });
    }
  },

  createPartnerConfig: async (walletAddress) => {
    try {
      const config = await bagsService.createPartnerConfig(walletAddress);
      set({ partnerConfig: config });
      return config;
    } catch (err) {
      throw err;
    }
  },

  claimPartnerFees: async (partnerKey: string, walletAddress: string, sendTransaction: SendTransactionFn, connection: SolanaConnection) => {
    try {
      const serializedTxs = await bagsService.createPartnerClaimTransactions(partnerKey, walletAddress);
      const { Transaction, VersionedTransaction } = await import('@solana/web3.js');

      let lastSignature = '';
      for (const serializedTx of serializedTxs) {
        const txBuffer = Buffer.from(serializedTx, 'base64');
        let tx;
        try {
          tx = VersionedTransaction.deserialize(txBuffer);
        } catch {
          tx = Transaction.from(txBuffer);
        }
        lastSignature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(lastSignature, 'confirmed');
      }

      // Refresh partner data
      await get().loadPartnerConfig(walletAddress);

      return lastSignature;
    } catch (err) {
      throw err;
    }
  },

  // Fee share wallet v2
  loadFeeShareWalletInfo: async (wallet) => {
    try {
      const info = await bagsService.getFeeShareWalletInfo(wallet);
      set({ feeShareWalletInfo: info });
    } catch (err) {
      console.error('Failed to load fee share wallet info:', err);
    }
  },
}));
