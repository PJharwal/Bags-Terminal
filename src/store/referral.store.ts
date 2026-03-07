import { create } from 'zustand';

interface ReferralState {
  referralLink: string;
  copied: boolean;
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
  stats: {
    tokensReferred: 0,
    feesEarned: 0,
  },

  generateLink: (walletAddress: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/launch?ref=${walletAddress}`;
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

  setStats: (stats) => set({ stats }),
}));
