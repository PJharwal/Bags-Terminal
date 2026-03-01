import { create } from 'zustand';
import { bagsService } from '@/services/bags.service';
import type {
  BagsTokenMetadata,
  FeeClaimerConfig,
  LaunchStatus,
  LaunchResult,
  SendTransactionFn,
  SolanaConnection,
  TipConfig,
} from '@/lib/bags-types';
import { MAX_FEE_CLAIMERS } from '@/lib/bags-types';

interface LaunchStore {
  // Form state
  metadata: BagsTokenMetadata;
  feeClaimers: FeeClaimerConfig[];
  initialBuyAmount: number;

  // Image source mode
  imageSourceMode: 'upload' | 'url';
  imageUrl: string; // Direct URL (skips IPFS)

  // Tip configuration
  tipEnabled: boolean;
  tipWallet: string;
  tipAmountSol: number;

  // Upload state
  uploadedImage: File | null;
  imagePreviewUrl: string | null;
  ipfsUrl: string | null;

  // Launch flow state
  configKey: string | null;
  status: LaunchStatus;
  error: string | null;
  result: LaunchResult | null;

  // Actions
  updateMetadata: (updates: Partial<BagsTokenMetadata>) => void;
  setUploadedImage: (file: File | null) => void;
  setImageSourceMode: (mode: 'upload' | 'url') => void;
  setImageUrl: (url: string) => void;
  setInitialBuyAmount: (amount: number) => void;
  setTipEnabled: (enabled: boolean) => void;
  setTipWallet: (wallet: string) => void;
  setTipAmountSol: (amount: number) => void;
  addFeeClaimer: (claimer: FeeClaimerConfig) => void;
  removeFeeClaimer: (id: string) => void;
  updateFeeClaimer: (id: string, updates: Partial<FeeClaimerConfig>) => void;

  // Async actions
  uploadImage: () => Promise<string>;
  createConfig: () => Promise<string>;
  executeLaunch: (walletAddress: string, sendTransaction: SendTransactionFn, connection: SolanaConnection) => Promise<LaunchResult>;
  reset: () => void;
}

const defaultMetadata: BagsTokenMetadata = {
  name: '',
  symbol: '',
  description: '',
  image: '',
};

export const useLaunchStore = create<LaunchStore>((set, get) => ({
  metadata: { ...defaultMetadata },
  feeClaimers: [],
  initialBuyAmount: 0.1,
  imageSourceMode: 'upload',
  imageUrl: '',
  tipEnabled: false,
  tipWallet: '',
  tipAmountSol: 0,
  uploadedImage: null,
  imagePreviewUrl: null,
  ipfsUrl: null,
  configKey: null,
  status: 'idle',
  error: null,
  result: null,

  updateMetadata: (updates) => set((state) => ({
    metadata: { ...state.metadata, ...updates },
  })),

  setUploadedImage: (file) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      set({ uploadedImage: file, imagePreviewUrl: previewUrl, ipfsUrl: null });
    } else {
      set({ uploadedImage: null, imagePreviewUrl: null });
    }
  },

  setImageSourceMode: (mode) => set({ imageSourceMode: mode }),

  setImageUrl: (url) => set({ imageUrl: url }),

  setInitialBuyAmount: (amount) => set({ initialBuyAmount: amount }),

  setTipEnabled: (enabled) => set({ tipEnabled: enabled }),

  setTipWallet: (wallet) => set({ tipWallet: wallet }),

  setTipAmountSol: (amount) => set({ tipAmountSol: amount }),

  addFeeClaimer: (claimer) => set((state) => {
    if (state.feeClaimers.length >= MAX_FEE_CLAIMERS) {
      return state;
    }
    return { feeClaimers: [...state.feeClaimers, claimer] };
  }),

  removeFeeClaimer: (id) => set((state) => ({
    feeClaimers: state.feeClaimers.filter((c) => c.id !== id),
  })),

  updateFeeClaimer: (id, updates) => set((state) => ({
    feeClaimers: state.feeClaimers.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),

  uploadImage: async () => {
    const { uploadedImage } = get();
    if (!uploadedImage) throw new Error('No image selected');

    set({ status: 'uploading_image', error: null });

    try {
      const result = await bagsService.uploadTokenImage(uploadedImage);
      set({ ipfsUrl: result.ipfsUrl, status: 'idle' });
      return result.ipfsUrl;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Upload failed';
      set({ status: 'error', error });
      throw err;
    }
  },

  createConfig: async () => {
    const { feeClaimers } = get();
    if (feeClaimers.length === 0) throw new Error('No fee claimers configured');

    set({ status: 'creating_config', error: null });

    try {
      const configKey = await bagsService.createFeeShareConfig(feeClaimers);
      set({ configKey, status: 'idle' });
      return configKey;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Config creation failed';
      set({ status: 'error', error });
      throw err;
    }
  },

  executeLaunch: async (walletAddress: string, sendTransaction: SendTransactionFn, connection: SolanaConnection) => {
    const state = get();

    set({ status: 'uploading_image', error: null });

    try {
      // Step 1: Resolve image URL
      let imageUrl = state.ipfsUrl;

      if (state.imageSourceMode === 'url' && state.imageUrl) {
        // Direct URL mode — skip IPFS upload entirely
        imageUrl = state.imageUrl;
      } else if (!imageUrl && state.uploadedImage) {
        // Upload to IPFS
        const uploadResult = await bagsService.uploadTokenImage(state.uploadedImage);
        imageUrl = uploadResult.ipfsUrl;
        set({ ipfsUrl: imageUrl });
      }
      if (!imageUrl) throw new Error('No image available');

      // Step 2: Create fee share config
      // For >15 claimers, lookup tables are needed
      set({ status: 'creating_config' });
      let configKey = state.configKey;
      if (!configKey && state.feeClaimers.length > 0) {
        if (state.feeClaimers.length > 15) {
          // Create lookup tables first for large claimer sets
          const lutConfig = await bagsService.getConfigLookupTableTransactions(
            walletAddress,
            state.feeClaimers.length
          );

          // Sign and send LUT creation transactions
          const { Transaction, VersionedTransaction } = await import('@solana/web3.js');
          for (const serializedTx of lutConfig.transactions) {
            const txBuffer = Buffer.from(serializedTx, 'base64');
            let tx;
            try {
              tx = VersionedTransaction.deserialize(txBuffer);
            } catch {
              tx = Transaction.from(txBuffer);
            }
            const sig = await sendTransaction(tx, connection);
            await connection.confirmTransaction(sig, 'confirmed');
          }

          // Wait for slots to pass (required between LUT creation and extension)
          await new Promise((r) => setTimeout(r, 2000));

          configKey = await bagsService.createFeeShareConfig(
            state.feeClaimers,
            [lutConfig.lookupTableAddress]
          );
        } else {
          configKey = await bagsService.createFeeShareConfig(state.feeClaimers);
        }
        set({ configKey });
      }
      if (!configKey) throw new Error('No fee share config');

      // Step 3: Create launch transaction with optional tip
      set({ status: 'generating_tx' });
      const fullMetadata: BagsTokenMetadata = {
        ...state.metadata,
        image: imageUrl,
        ...(state.imageSourceMode === 'url' && state.imageUrl ? { imageUrl: state.imageUrl } : {}),
      };

      const tip: TipConfig | undefined = state.tipEnabled && state.tipWallet && state.tipAmountSol > 0
        ? {
            tipWallet: state.tipWallet,
            tipLamports: Math.floor(state.tipAmountSol * 1_000_000_000),
          }
        : undefined;

      const launchResult = await bagsService.createTokenLaunch(
        fullMetadata,
        configKey,
        state.initialBuyAmount,
        walletAddress,
        tip
      );

      // Step 4: Sign and send
      set({ status: 'awaiting_signature' });
      const txBuffer = Buffer.from(launchResult.transaction, 'base64');
      const { Transaction, VersionedTransaction } = await import('@solana/web3.js');
      let tx;
      try {
        tx = VersionedTransaction.deserialize(txBuffer);
      } catch {
        tx = Transaction.from(txBuffer);
      }

      set({ status: 'confirming' });
      const signature = await sendTransaction(tx, connection);

      // Step 5: Confirm
      await connection.confirmTransaction(signature, 'confirmed');

      const result: LaunchResult = {
        tokenMint: launchResult.tokenMint,
        signature,
        configKey,
      };

      set({ status: 'success', result });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Launch failed';
      set({ status: 'error', error });
      throw err;
    }
  },

  reset: () => set({
    metadata: { ...defaultMetadata },
    feeClaimers: [],
    initialBuyAmount: 0.1,
    imageSourceMode: 'upload',
    imageUrl: '',
    tipEnabled: false,
    tipWallet: '',
    tipAmountSol: 0,
    uploadedImage: null,
    imagePreviewUrl: null,
    ipfsUrl: null,
    configKey: null,
    status: 'idle',
    error: null,
    result: null,
  }),
}));
