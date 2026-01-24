import { create } from 'zustand';
import { bagsService } from '@/services/bags.service';
import type {
  BagsTokenMetadata,
  FeeClaimerConfig,
  LaunchStatus,
  LaunchResult,
  SendTransactionFn,
  SolanaConnection,
} from '@/lib/bags-types';

interface LaunchStore {
  // Form state
  metadata: BagsTokenMetadata;
  feeClaimers: FeeClaimerConfig[];
  initialBuyAmount: number;

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
  setInitialBuyAmount: (amount: number) => void;
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

  setInitialBuyAmount: (amount) => set({ initialBuyAmount: amount }),

  addFeeClaimer: (claimer) => set((state) => ({
    feeClaimers: [...state.feeClaimers, claimer],
  })),

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
      // Step 1: Upload image if needed
      let imageUrl = state.ipfsUrl;
      if (!imageUrl && state.uploadedImage) {
        const uploadResult = await bagsService.uploadTokenImage(state.uploadedImage);
        imageUrl = uploadResult.ipfsUrl;
        set({ ipfsUrl: imageUrl });
      }
      if (!imageUrl) throw new Error('No image available');

      // Step 2: Create fee share config if needed
      set({ status: 'creating_config' });
      let configKey = state.configKey;
      if (!configKey && state.feeClaimers.length > 0) {
        configKey = await bagsService.createFeeShareConfig(state.feeClaimers);
        set({ configKey });
      }
      if (!configKey) throw new Error('No fee share config');

      // Step 3: Create launch transaction
      set({ status: 'generating_tx' });
      const fullMetadata: BagsTokenMetadata = {
        ...state.metadata,
        image: imageUrl,
      };
      const launchResult = await bagsService.createTokenLaunch(
        fullMetadata,
        configKey,
        state.initialBuyAmount,
        walletAddress
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
    uploadedImage: null,
    imagePreviewUrl: null,
    ipfsUrl: null,
    configKey: null,
    status: 'idle',
    error: null,
    result: null,
  }),
}));
