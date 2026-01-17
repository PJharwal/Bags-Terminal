import { create } from 'zustand';
import type { Token, Deployer, TokenFilters, TerminalState } from '@/lib/types';

interface TerminalStore extends TerminalState {
    // Actions
    selectToken: (token: Token | null) => void;
    selectDeployer: (deployer: Deployer | null) => void;
    setActivePreset: (presetId: string | null) => void;
    setFilters: (filters: Partial<TokenFilters>) => void;
    resetFilters: () => void;
    openDrawer: (type: 'token' | 'deployer') => void;
    closeDrawer: () => void;
}

const defaultFilters: TokenFilters = {
    min_launch_score: 0,
    max_insider_pct: 100,
    dev_sold: null,
    status: [],
    funding_type: [],
    min_volume: 0,
    deployer_min_score: 0,
};

export const useTerminalStore = create<TerminalStore>((set) => ({
    // Initial state
    selectedToken: null,
    selectedDeployer: null,
    activePreset: null,
    filters: defaultFilters,
    drawerOpen: false,
    drawerType: null,

    // Actions
    selectToken: (token) => set({
        selectedToken: token,
        drawerOpen: token !== null,
        drawerType: token ? 'token' : null
    }),

    selectDeployer: (deployer) => set({
        selectedDeployer: deployer,
        drawerOpen: deployer !== null,
        drawerType: deployer ? 'deployer' : null
    }),

    setActivePreset: (presetId) => set({ activePreset: presetId }),

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        activePreset: null, // Clear preset when manually filtering
    })),

    resetFilters: () => set({
        filters: defaultFilters,
        activePreset: null
    }),

    openDrawer: (type) => set({
        drawerOpen: true,
        drawerType: type
    }),

    closeDrawer: () => set({
        drawerOpen: false,
        drawerType: null
    }),
}));

// Preset definitions
export const FILTER_PRESETS = [
    {
        id: 'clean',
        name: 'Clean Launches',
        description: 'High score, low insider activity',
        filters: {
            min_launch_score: 80,
            max_insider_pct: 10,
            dev_sold: false,
        },
    },
    {
        id: 'high-rep',
        name: 'High Rep Deployers',
        description: 'Trusted deployers with track record',
        filters: {
            deployer_min_score: 75,
            min_launch_score: 60,
        },
    },
    {
        id: 'insider-heavy',
        name: 'Insider-Heavy (Risk)',
        description: 'High insider concentration',
        filters: {
            max_insider_pct: 100,
            min_launch_score: 0,
        },
    },
    {
        id: 'fresh-wallet',
        name: 'Fresh Wallet Only',
        description: 'New deployer wallets',
        filters: {
            funding_type: ['fresh'],
        },
    },
] as const;
