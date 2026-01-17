import { create } from 'zustand';
import type { PulseItem, PulseState, RiskFlag } from '@/lib/types';

// Token name pools for realistic mock data
const TOKEN_NAMES = [
    { symbol: 'PEPE', name: 'Pepe' },
    { symbol: 'DOGE', name: 'Doge AI' },
    { symbol: 'WOJAK', name: 'Wojak' },
    { symbol: 'CHAD', name: 'GigaChad' },
    { symbol: 'MFER', name: 'mfers' },
    { symbol: 'BOBO', name: 'Bobo Bear' },
    { symbol: 'SMOL', name: 'SmolBrain' },
    { symbol: 'BONK', name: 'Bonk Inu' },
    { symbol: 'MOON', name: 'MoonRocket' },
    { symbol: 'APE', name: 'ApeDAO' },
    { symbol: 'FREN', name: 'Frens' },
    { symbol: 'WAGMI', name: 'WAGMI Token' },
    { symbol: 'NGMI', name: 'NGMI Coin' },
    { symbol: 'HODL', name: 'Hodler' },
    { symbol: 'YOLO', name: 'YoloSwap' },
];

const DEPLOYER_NAMES = [
    { wallet: '7Xa3...f2e1', name: 'whale_dev', launches: 12, successRate: 83 },
    { wallet: '3Bb2...a4c8', name: 'alpha_chad', launches: 8, successRate: 75 },
    { wallet: '9Cc4...b3d2', name: 'degen_anon', launches: 24, successRate: 42 },
    { wallet: '2Ee6...c1a4', name: 'stealth_king', launches: 3, successRate: 66 },
    { wallet: '8Ff1...d2b5', name: 'pump_master', launches: 15, successRate: 55 },
    { wallet: '4Gg3...e5f6', name: 'based_dev', launches: 6, successRate: 90 },
    { wallet: '1Hh8...a9b0', name: 'new_deployer', launches: 1, successRate: 100 },
];

// Generate realistic mock pulse item
const generatePulseItem = (state: PulseState, index: number): PulseItem => {
    const token = TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)];
    const deployer = DEPLOYER_NAMES[Math.floor(Math.random() * DEPLOYER_NAMES.length)];
    const uniqueSuffix = Math.floor(Math.random() * 999);

    const bondingProgress = state === 'NEW'
        ? Math.floor(Math.random() * 60) + 10
        : state === 'FINAL_STRETCH'
            ? Math.floor(Math.random() * 14) + 85
            : 100;

    const riskTypes: Array<'REUSED_FUNDING' | 'INSIDER_CLUSTER' | 'DEV_SELL' | 'CLEAN'> =
        ['REUSED_FUNDING', 'INSIDER_CLUSTER', 'DEV_SELL', 'CLEAN'];

    const riskFlags: RiskFlag[] = [];
    const riskChance = Math.random();

    if (riskChance > 0.7) {
        // Add one or two risk flags
        const riskType = riskTypes[Math.floor(Math.random() * 3)] as 'REUSED_FUNDING' | 'INSIDER_CLUSTER' | 'DEV_SELL';
        riskFlags.push({
            type: riskType,
            severity: riskChance > 0.9 ? 'critical' : 'warn',
        });
    }

    const ageSeconds = state === 'NEW'
        ? Math.floor(Math.random() * 7200) + 60 // 1min - 2hrs
        : state === 'FINAL_STRETCH'
            ? Math.floor(Math.random() * 14400) + 7200 // 2hrs - 6hrs
            : Math.floor(Math.random() * 86400) + 14400; // 4hrs - 1day

    return {
        tokenId: `${state}-${index}-${Date.now()}-${uniqueSuffix}`,
        symbol: `$${token.symbol}${uniqueSuffix}`,
        name: token.name,
        deployer: deployer.wallet,
        deployerName: deployer.name,
        deployerLaunches: deployer.launches,
        deployerSuccessRate: deployer.successRate,
        ageSeconds,
        marketCap: Math.floor(Math.random() * 2000000) + 20000,
        liquidity: Math.floor(Math.random() * 300000) + 5000,
        bondingProgress,
        holders: Math.floor(Math.random() * 1500) + 20,
        txCount: Math.floor(Math.random() * 3000) + 50,
        volume24h: Math.floor(Math.random() * 500000) + 10000,
        state,
        riskFlags,
        updatedAt: Date.now(),
    };
};

// Initial mock data with more items
const generateInitialData = (): Record<PulseState, PulseItem[]> => ({
    NEW: Array.from({ length: 12 }, (_, i) => generatePulseItem('NEW', i)),
    FINAL_STRETCH: Array.from({ length: 5 }, (_, i) => generatePulseItem('FINAL_STRETCH', i)),
    MIGRATED: Array.from({ length: 8 }, (_, i) => generatePulseItem('MIGRATED', i)),
});

// Filter types
export type DisplayMode = 'cards' | 'compact' | 'table';
export type TierFilter = 'all' | 'high' | 'medium' | 'low';

interface PulseFilters {
    displayMode: DisplayMode;
    tierFilter: TierFilter;
    hideRisky: boolean;
    minMarketCap: number;
}

interface PulseStore {
    items: Record<PulseState, PulseItem[]>;
    isConnected: boolean;
    lastUpdate: number;
    filters: PulseFilters;

    // Actions
    addItem: (item: PulseItem) => void;
    updateItem: (tokenId: string, updates: Partial<PulseItem>) => void;
    transitionItem: (tokenId: string, newState: PulseState) => void;
    removeItem: (tokenId: string) => void;
    simulateRealtime: () => void;
    getItemById: (tokenId: string) => PulseItem | undefined;
    setFilters: (filters: Partial<PulseFilters>) => void;
    getFilteredItems: (state: PulseState) => PulseItem[];
}

export const usePulseStore = create<PulseStore>((set, get) => ({
    items: generateInitialData(),
    isConnected: true,
    lastUpdate: Date.now(),
    filters: {
        displayMode: 'compact',
        tierFilter: 'all',
        hideRisky: false,
        minMarketCap: 0,
    },

    addItem: (item) => set((state) => ({
        items: {
            ...state.items,
            [item.state]: [item, ...state.items[item.state]].slice(0, 50), // Limit to 50 per column
        },
        lastUpdate: Date.now(),
    })),

    updateItem: (tokenId, updates) => set((state) => {
        const newItems = { ...state.items };
        for (const stateKey of Object.keys(newItems) as PulseState[]) {
            newItems[stateKey] = newItems[stateKey].map((item) =>
                item.tokenId === tokenId ? { ...item, ...updates, updatedAt: Date.now() } : item
            );
        }
        return { items: newItems, lastUpdate: Date.now() };
    }),

    transitionItem: (tokenId, newState) => set((state) => {
        const newItems = { ...state.items };
        let itemToMove: PulseItem | null = null;

        // Find and remove from current state
        for (const stateKey of Object.keys(newItems) as PulseState[]) {
            const idx = newItems[stateKey].findIndex((item) => item.tokenId === tokenId);
            if (idx !== -1) {
                [itemToMove] = newItems[stateKey].splice(idx, 1);
                break;
            }
        }

        // Add to new state at top
        if (itemToMove) {
            itemToMove.state = newState;
            itemToMove.updatedAt = Date.now();
            if (newState === 'FINAL_STRETCH') {
                itemToMove.bondingProgress = Math.floor(Math.random() * 14) + 85;
            } else if (newState === 'MIGRATED') {
                itemToMove.bondingProgress = 100;
            }
            newItems[newState] = [itemToMove, ...newItems[newState]];
        }

        return { items: newItems, lastUpdate: Date.now() };
    }),

    removeItem: (tokenId) => set((state) => {
        const newItems = { ...state.items };
        for (const stateKey of Object.keys(newItems) as PulseState[]) {
            newItems[stateKey] = newItems[stateKey].filter((item) => item.tokenId !== tokenId);
        }
        return { items: newItems, lastUpdate: Date.now() };
    }),

    simulateRealtime: () => {
        const { items, addItem, transitionItem, updateItem } = get();

        // Randomly add new token (30% chance)
        if (Math.random() > 0.7) {
            const newItem = generatePulseItem('NEW', Date.now());
            addItem(newItem);
        }

        // Randomly transition NEW -> FINAL_STRETCH (15% chance per item)
        if (items.NEW.length > 2 && Math.random() > 0.85) {
            const item = items.NEW.find(i => i.bondingProgress >= 70);
            if (item) {
                transitionItem(item.tokenId, 'FINAL_STRETCH');
            }
        }

        // Randomly transition FINAL_STRETCH -> MIGRATED (10% chance)
        if (items.FINAL_STRETCH.length > 0 && Math.random() > 0.9) {
            const item = items.FINAL_STRETCH[0];
            if (item) {
                transitionItem(item.tokenId, 'MIGRATED');
            }
        }

        // Update random NEW items' bonding progress
        items.NEW.forEach((item) => {
            if (Math.random() > 0.7 && item.bondingProgress < 84) {
                updateItem(item.tokenId, {
                    bondingProgress: Math.min(84, item.bondingProgress + Math.floor(Math.random() * 3) + 1),
                    txCount: item.txCount + Math.floor(Math.random() * 15),
                    holders: item.holders + Math.floor(Math.random() * 8),
                    ageSeconds: item.ageSeconds + 3,
                });
            }
        });

        // Update FINAL_STRETCH items' bonding
        items.FINAL_STRETCH.forEach((item) => {
            if (Math.random() > 0.6 && item.bondingProgress < 99) {
                updateItem(item.tokenId, {
                    bondingProgress: Math.min(99, item.bondingProgress + Math.floor(Math.random() * 2) + 1),
                    txCount: item.txCount + Math.floor(Math.random() * 20),
                    holders: item.holders + Math.floor(Math.random() * 12),
                    ageSeconds: item.ageSeconds + 3,
                });
            }
        });
    },

    getItemById: (tokenId) => {
        const { items } = get();
        for (const stateKey of Object.keys(items) as PulseState[]) {
            const found = items[stateKey].find((item) => item.tokenId === tokenId);
            if (found) return found;
        }
        return undefined;
    },

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
    })),

    getFilteredItems: (state) => {
        const { items, filters } = get();
        let filtered = [...items[state]];

        // Apply tier filter
        if (filters.tierFilter !== 'all') {
            filtered = filtered.filter(item => {
                if (filters.tierFilter === 'high') return item.marketCap >= 500000;
                if (filters.tierFilter === 'medium') return item.marketCap >= 100000 && item.marketCap < 500000;
                return item.marketCap < 100000;
            });
        }

        // Hide risky tokens
        if (filters.hideRisky) {
            filtered = filtered.filter(item =>
                !item.riskFlags.some(f => f.severity === 'critical')
            );
        }

        // Min market cap filter
        if (filters.minMarketCap > 0) {
            filtered = filtered.filter(item => item.marketCap >= filters.minMarketCap);
        }

        return filtered;
    },
}));

// Column config
export const PULSE_COLUMNS: { state: PulseState; label: string; description: string }[] = [
    { state: 'NEW', label: 'New Creations', description: 'Bonding active' },
    { state: 'FINAL_STRETCH', label: 'Final Stretch', description: 'Near migration' },
    { state: 'MIGRATED', label: 'Migrated', description: 'LP live' },
];
