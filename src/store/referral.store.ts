import { create } from 'zustand';
import { config } from '@/config/env';

interface ReferralState {
  referralLink: string;
  copied: boolean;
  // statsAvailable stays false until a real data source populates stats.
  // There is no Bags endpoint for a referral count, so the UI shows a neutral
  // state rather than fabricated zeros.
  statsAvailable: boolean;
  stats: {
    tokensReferred: number;
    feesEarned: number;
  };
  generateLink: (walletAddress: string) => string;
  copyLink: () => void;
  setStats: (stats: { tokensReferred: number; feesEarned: number }) => void;
}

export const useReferralStore = create<ReferralState>((set, get) => ({
  referralLink: '',
  copied: false,
  statsAvailable: false,
  stats: {
    tokensReferred: 0,
    feesEarned: 0,
  },

  generateLink: (walletAddress: string) => {
    const link = `${config.siteUrl}/launch?ref=${walletAddress}&utm_source=referral&utm_medium=link&utm_campaign=creator_referral`;
    set({ referralLink: link });
    return link;
  },

  copyLink: () => {
    const { referralLink } = get();
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    set({ copied: true });
    setTimeout(() => set({ copied: false }), 2000);
  },

  setStats: (stats) => set({ stats, statsAvailable: true }),
}));
