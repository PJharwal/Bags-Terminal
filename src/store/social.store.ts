import { create } from 'zustand';
import { bagsService } from '@/services/bags.service';
import type { SocialLink, SocialProvider } from '@/lib/bags-types';

interface SocialStore {
  linkedAccounts: SocialLink[];
  isLoading: boolean;
  error: string | null;

  loadLinkedAccounts: (wallet: string) => Promise<void>;
  linkAccount: (provider: SocialProvider, username: string, walletAddress: string) => Promise<void>;
  unlinkAccount: (provider: SocialProvider, username: string, walletAddress: string) => Promise<void>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  linkedAccounts: [],
  isLoading: false,
  error: null,

  loadLinkedAccounts: async (wallet) => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await bagsService.getSocialLinks(wallet);
      set({ linkedAccounts: accounts });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load accounts' });
    } finally {
      set({ isLoading: false });
    }
  },

  linkAccount: async (provider, username, walletAddress) => {
    set({ isLoading: true, error: null });
    try {
      await bagsService.linkSocialAccount(provider, username, walletAddress);
      await get().loadLinkedAccounts(walletAddress);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to link account' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  unlinkAccount: async (provider, username, walletAddress) => {
    set({ isLoading: true, error: null });
    try {
      await bagsService.unlinkSocialAccount(provider, username, walletAddress);
      await get().loadLinkedAccounts(walletAddress);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to unlink account' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
