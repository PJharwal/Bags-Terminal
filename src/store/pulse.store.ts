import { create } from 'zustand';
import type { PulseItem, PulseState, RiskFlag } from '@/lib/types';
import type { NewTokenEvent, TradeEvent } from '@/types/socket';
import { tokenService, type Token } from '@/services/token.service';
import { SOL_PRICE_FALLBACK } from '@/lib/constants';


// Convert token service Token to PulseItem format
const convertServiceTokenToPulseItem = (token: Token): PulseItem => {
    // Estimate state based on market cap (simple heuristic)
    let state: PulseState = 'NEW';
    let bondingProgress = 0;

    if (token.marketCap >= 100000) {
        state = 'MIGRATED';
        bondingProgress = 100;
    } else if (token.marketCap >= 50000) {
        state = 'FINAL_STRETCH';
        bondingProgress = 85;
    } else {
        bondingProgress = Math.min(84, Math.floor(token.marketCap / 50000 * 85));
    }

    return {
        tokenId: token.address,
        symbol: `$${token.symbol}`,
        name: token.name,
        deployer: 'Unknown',
        deployerName: 'deployer',
        deployerLaunches: 1,
        deployerSuccessRate: 50,
        ageSeconds: 0,
        marketCap: token.marketCap,
        liquidity: token.liquidity,
        bondingProgress,
        holders: 0,
        txCount: 0,
        volume24h: token.volume24h,
        state,
        riskFlags: [],
        updatedAt: Date.now(),
        logoUrl: token.logo,
        protocolSource: 'pumpfun',
    };
};

// Convert socket NewTokenEvent to PulseItem
const convertSocketTokenToPulseItem = (token: NewTokenEvent): PulseItem => {
    // Determine state based on bonding curve status
    let state: PulseState = 'NEW';
    let bondingProgress = 0;

    if (token.status === 'migrated') {
        state = 'MIGRATED';
        bondingProgress = 100;
    } else if (token.market_cap_sol) {
        // Estimate bonding progress from market cap
        const mcSol = parseFloat(token.market_cap_sol);
        bondingProgress = Math.min(99, Math.floor(mcSol / 850 * 100)); // ~85 SOL = 100%
        if (bondingProgress >= 85) {
            state = 'FINAL_STRETCH';
        }
    }

    // Calculate market cap in USD
    const marketCap = token.market_cap_sol
        ? parseFloat(token.market_cap_sol) * SOL_PRICE_FALLBACK
        : 0;

    // Parse holder rate for concentration
    const top10Rate = parseFloat(token.top_10_holder_rate || '0');

    // Determine risk flags based on data
    const riskFlags: RiskFlag[] = [];
    if (top10Rate > 50) {
        riskFlags.push({
            type: 'INSIDER_CLUSTER',
            severity: top10Rate > 70 ? 'critical' : 'warn',
        });
    }
    if (token.creator_token_status === 'sold') {
        riskFlags.push({
            type: 'DEV_SELL',
            severity: 'warn',
        });
    }

    // Calculate age from creation timestamp
    const ageSeconds = Math.floor((Date.now() / 1000) - token.creation_timestamp);

    return {
        tokenId: token.mint,
        symbol: `$${token.symbol}`,
        name: token.name,
        deployer: token.creator?.slice(0, 4) + '...' + token.creator?.slice(-4),
        deployerName: 'deployer',
        deployerLaunches: 1,
        deployerSuccessRate: 50,
        ageSeconds: ageSeconds > 0 ? ageSeconds : 0,
        marketCap,
        liquidity: 0, // Unknown from socket feed — shown as "—"
        bondingProgress,
        holders: token.holder_count || 0,
        txCount: 0,
        volume24h: 0,
        state,
        riskFlags,
        updatedAt: Date.now(),
        // Store original data for reference
        logoUrl: token.logo_url || undefined,
        protocolSource: token.protocol_source,
    };
};

// Filter types
export type DisplayMode = 'cards' | 'compact' | 'table';
export type TierFilter = 'all' | 'high' | 'medium' | 'low';

interface PulseFilters {
    displayMode: DisplayMode;
    tierFilter: TierFilter;
    hideRisky: boolean;
    minMarketCap: number;
    bagsOnly: boolean; // Filter for BAGS tokens
}

interface PulseStore {
    items: Record<PulseState, PulseItem[]>;
    isConnected: boolean;
    lastUpdate: number;
    filters: PulseFilters;
    isInitialLoading: boolean;

    // Actions
    addItem: (item: PulseItem) => void;
    addTokenFromSocket: (token: NewTokenEvent) => void;
    updateFromTrade: (trade: TradeEvent) => void;
    updateItem: (tokenId: string, updates: Partial<PulseItem>) => void;
    transitionItem: (tokenId: string, newState: PulseState) => void;
    removeItem: (tokenId: string) => void;
    clearItems: () => void;
    getItemById: (tokenId: string) => PulseItem | undefined;
    setFilters: (filters: Partial<PulseFilters>) => void;
    getFilteredItems: (state: PulseState) => PulseItem[];
    setConnected: (connected: boolean) => void;
    loadInitialData: () => Promise<void>;
}

export const usePulseStore = create<PulseStore>((set, get) => ({
    // Start with empty state - will be populated by socket or initial load
    items: {
        NEW: [],
        FINAL_STRETCH: [],
        MIGRATED: [],
    },
    isConnected: false,
    isInitialLoading: false,
    lastUpdate: Date.now(),
    filters: {
        displayMode: 'compact',
        tierFilter: 'all',
        hideRisky: false,
        minMarketCap: 0,
        bagsOnly: false, // Show all tokens, fee data will show for BAGS tokens
    },

    addItem: (item) => set((state) => ({
        items: {
            ...state.items,
            [item.state]: [item, ...state.items[item.state]].slice(0, 50),
        },
        lastUpdate: Date.now(),
    })),

    // Add token from socket event
    addTokenFromSocket: (token: NewTokenEvent) => {
        const { addItem, updateItem } = get();

        // Check if token already exists
        const existing = get().getItemById(token.mint);
        if (existing) {
            // Update existing token
            updateItem(token.mint, {
                holders: token.holder_count || existing.holders,
                updatedAt: Date.now(),
            });
            return;
        }

        // Convert and add new token
        const pulseItem = convertSocketTokenToPulseItem(token);
        addItem(pulseItem);
        console.log('Added token:', token.symbol, token.mint);
    },

    // Update token from trade event
    updateFromTrade: (trade: TradeEvent) => {
        const { getItemById, updateItem, transitionItem } = get();

        const existing = getItemById(trade.mint);
        if (!existing) return;

        // Calculate new market cap
        const marketCap = trade.market_cap_sol
            ? parseFloat(trade.market_cap_sol) * SOL_PRICE_FALLBACK
            : existing.marketCap;

        // Calculate bonding progress
        let bondingProgress = existing.bondingProgress;
        if (trade.bonding_curve_percent) {
            bondingProgress = parseFloat(trade.bonding_curve_percent);
        }

        updateItem(trade.mint, {
            marketCap,
            bondingProgress,
            txCount: existing.txCount + 1,
            updatedAt: Date.now(),
        });

        // Handle state transitions
        if (bondingProgress >= 100 && existing.state !== 'MIGRATED') {
            transitionItem(trade.mint, 'MIGRATED');
        } else if (bondingProgress >= 85 && existing.state === 'NEW') {
            transitionItem(trade.mint, 'FINAL_STRETCH');
        }
    },

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

        for (const stateKey of Object.keys(newItems) as PulseState[]) {
            const idx = newItems[stateKey].findIndex((item) => item.tokenId === tokenId);
            if (idx !== -1) {
                [itemToMove] = newItems[stateKey].splice(idx, 1);
                break;
            }
        }

        if (itemToMove) {
            const updatedItem = { ...itemToMove, state: newState, updatedAt: Date.now(), ...(newState === 'MIGRATED' ? { bondingProgress: 100 } : {}) };
            newItems[newState] = [updatedItem, ...newItems[newState]];
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

    clearItems: () => set({
        items: { NEW: [], FINAL_STRETCH: [], MIGRATED: [] },
        lastUpdate: Date.now(),
    }),

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

        // BAGS-only filter
        if (filters.bagsOnly) {
            filtered = filtered.filter(item => item.tokenId.toLowerCase().endsWith('bags'));
        }

        return filtered;
    },

    setConnected: (connected) => set({ isConnected: connected }),

    // Load initial data from GMGN/DexScreener
    loadInitialData: async () => {
        const { items, addItem, getItemById } = get();

        // Only load if we don't have data yet
        const totalItems = items.NEW.length + items.FINAL_STRETCH.length + items.MIGRATED.length;
        if (get().isInitialLoading || totalItems > 0) {
            return;
        }

        set({ isInitialLoading: true });

        try {
            console.log('Loading initial token data from GMGN/DexScreener...');
            const tokens = await tokenService.getTrending('1h');

            if (tokens && tokens.length > 0) {
                console.log(`Loaded ${tokens.length} tokens from service`);

                tokens.forEach((token) => {
                    // Skip if already exists (from socket)
                    if (getItemById(token.address)) return;

                    const pulseItem = convertServiceTokenToPulseItem(token);
                    addItem(pulseItem);
                });
            }
        } catch (error) {
            console.error('Failed to load initial token data:', error);
        } finally {
            set({ isInitialLoading: false });
        }
    },
}));

// Column config
export const PULSE_COLUMNS: { state: PulseState; label: string; description: string }[] = [
    { state: 'NEW', label: 'New Creations', description: 'Bonding active' },
    { state: 'FINAL_STRETCH', label: 'Final Stretch', description: 'Near migration' },
    { state: 'MIGRATED', label: 'Migrated', description: 'LP live' },
];

