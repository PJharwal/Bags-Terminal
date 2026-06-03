import { create } from 'zustand';
import type { PulseItem, PulseState, RiskFlag } from '@/lib/types';
import type { NewTokenEvent, TradeEvent, MetadataEvent } from '@/types/socket';
import { resolveTokenImage } from '@/lib/image';
import { tokenService, type Token } from '@/services/token.service';
import { SOL_PRICE_FALLBACK } from '@/lib/constants';
import { LAMPORTS_PER_SOL } from '@/lib/bags-types';

// Bonding curve graduates at ~85 SOL market cap. Single source of truth for
// estimating progress from market cap so the socket, trade, and REST paths
// agree (the socket path previously divided by 850 — 10x too low). Caps at 99:
// actual migration to 100% comes from a real migration event / bonding_curve
// _percent, never from a market-cap estimate.
export const BONDING_CAP_SOL = 85;
export function estimateBondingProgress(mcSol: number): number {
    if (!Number.isFinite(mcSol) || mcSol <= 0) return 0;
    return Math.min(99, Math.floor((mcSol / BONDING_CAP_SOL) * 100));
}


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

    const marketCap = Math.max(3900, token.marketCap || 0);
    const volume24h = token.volume24h || 0;
    // Honest data only — no fabricated estimates. Unknown until a real source provides it.
    const liquidity = token.liquidity || 0;
    const txCount = 0;
    const holders = 0;

    return {
        tokenId: token.address,
        symbol: `$${token.symbol}`,
        name: token.name,
        deployer: 'Unknown',
        deployerName: 'deployer',
        deployerLaunches: 0,
        deployerSuccessRate: 0,
        ageSeconds: 0,
        marketCap,
        liquidity,
        bondingProgress,
        holders,
        txCount,
        volume24h,
        state,
        riskFlags: [],
        updatedAt: Date.now(),
        logoUrl: resolveTokenImage(token.logo),
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
        // Estimate bonding progress from market cap (~85 SOL = 100%)
        const mcSol = parseFloat(token.market_cap_sol);
        bondingProgress = Math.min(99, Math.floor(mcSol / 850 * 100)); // ~85 SOL = 100%
        if (bondingProgress >= 85) {
            state = 'FINAL_STRETCH';
        }
    }

    // Calculate market cap in USD (minimum 3.9k)
    const marketCap = Math.max(3900, token.market_cap_sol
        ? parseFloat(token.market_cap_sol) * SOL_PRICE_FALLBACK
        : 0);

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
        deployerLaunches: 0,
        deployerSuccessRate: 0,
        ageSeconds: ageSeconds > 0 ? ageSeconds : 0,
        marketCap,
        liquidity: 0,
        bondingProgress,
        holders: token.holder_count || 0,
        txCount: 0,
        volume24h: 0,
        state,
        riskFlags,
        updatedAt: Date.now(),
        // Store original data for reference
        logoUrl: resolveTokenImage(token.logo_url),
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
    queueTrade: (trade: TradeEvent) => void;
    flushTrades: () => void;
    reconcileItem: (item: PulseItem) => void;
    applyMetadata: (meta: MetadataEvent) => void;
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

// --- Trade batching -------------------------------------------------------
// Coalesce the high-frequency trade firehose (250+/s) into at most one store
// update per animation frame. Additive fields (volume, tx count) accumulate so
// nothing is lost when many trades for the same token land in one frame.
interface BufferedTrade {
    marketCap?: number;
    bondingProgress?: number;
    volumeUsdDelta: number;
    txDelta: number;
}
let tradeBuffer = new Map<string, BufferedTrade>();
let flushScheduled = false;

// Pure filter used by both the store selector and the pulse page. Kept as a
// single source of truth so filtering can't diverge between call sites.
export function filterPulseItems(
    list: PulseItem[],
    filters: PulseFilters,
): PulseItem[] {
    let filtered = [...list];

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

    addItem: (item) => {
        // Idempotent: never insert a token that already lives in any column.
        // Prevents duplicate React keys (and the same token showing up in two
        // columns) when REST polling and socket events race to add it. Bail
        // before set() so a duplicate is a true no-op (no re-render).
        const { items } = get();
        const isDuplicate = (Object.keys(items) as PulseState[]).some(
            (key) => items[key].some((i) => i.tokenId === item.tokenId),
        );
        if (isDuplicate) return;

        set((state) => ({
            items: {
                ...state.items,
                [item.state]: [item, ...state.items[item.state]].slice(0, 20),
            },
            lastUpdate: Date.now(),
        }));
    },

    // Reconcile a REST-fetched token: add it if missing, or move it to the
    // column the server now says it belongs to. Used by the silent 30s Final
    // Stretch / Migrated re-sync. Store-based idempotency means no duplicates,
    // and a token evicted by the 20-cap can be re-added.
    reconcileItem: (item) => {
        const { getItemById, addItem, transitionItem } = get();
        const existing = getItemById(item.tokenId);
        if (!existing) {
            addItem(item);
        } else if (existing.state !== item.state) {
            transitionItem(item.tokenId, item.state);
        }
    },

    // Backfill an existing card from a metadata_updated event — the logo for a
    // just-created token (logo_url empty at creation) arrives here moments later.
    applyMetadata: (meta: MetadataEvent) => {
        const row = meta.info?.data?.[0];
        const mint = meta.address || row?.address;
        if (!row || !mint) return;
        const existing = get().getItemById(mint);
        if (!existing) return;

        const updates: Partial<PulseItem> = {};
        const logo = resolveTokenImage(row.logo);
        if (logo) updates.logoUrl = logo;
        if (row.name && (!existing.name || existing.name === 'Unknown')) {
            updates.name = row.name;
        }
        if (typeof row.holder_count === 'number' && row.holder_count > existing.holders) {
            updates.holders = row.holder_count;
        }
        if (Object.keys(updates).length > 0) {
            get().updateItem(mint, updates);
        }
    },

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

    // Queue a trade for the next animation-frame flush. Trades for tokens that
    // aren't currently shown are ignored at flush time (update-only policy).
    queueTrade: (trade: TradeEvent) => {
        const buf: BufferedTrade =
            tradeBuffer.get(trade.mint) ?? { volumeUsdDelta: 0, txDelta: 0 };
        if (trade.market_cap_sol) {
            const mcSol = parseFloat(trade.market_cap_sol);
            if (Number.isFinite(mcSol)) {
                buf.marketCap = mcSol * SOL_PRICE_FALLBACK;
                // M2: derive progress from market cap when the trade omits
                // bonding_curve_percent, so tokens still advance NEW->FINAL_STRETCH.
                if (!trade.bonding_curve_percent) {
                    buf.bondingProgress = estimateBondingProgress(mcSol);
                }
            }
        }
        if (trade.bonding_curve_percent) {
            const pct = parseFloat(trade.bonding_curve_percent);
            if (Number.isFinite(pct)) buf.bondingProgress = pct;
        }
        // sol_amount is in lamports (1 SOL = 1e9 lamports) — convert to SOL
        // before pricing, otherwise one small trade reads as billions.
        const solAmount = parseFloat(trade.sol_amount || '0') / LAMPORTS_PER_SOL;
        if (Number.isFinite(solAmount)) {
            buf.volumeUsdDelta += solAmount * SOL_PRICE_FALLBACK;
        }
        buf.txDelta += 1;
        tradeBuffer.set(trade.mint, buf);

        if (!flushScheduled) {
            flushScheduled = true;
            const run = () => {
                flushScheduled = false;
                get().flushTrades();
            };
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(run);
            } else {
                setTimeout(run, 16);
            }
        }
    },

    // Apply all buffered trades in a single store update. Only the columns that
    // actually change get a new array reference, so untouched columns (and
    // their memoized React subtrees) don't re-render.
    flushTrades: () => {
        if (tradeBuffer.size === 0) return;
        const buffer = tradeBuffer;
        tradeBuffer = new Map();

        set((state) => {
            const keys: PulseState[] = ['NEW', 'FINAL_STRETCH', 'MIGRATED'];
            const working: Record<PulseState, PulseItem[]> = {
                NEW: state.items.NEW,
                FINAL_STRETCH: state.items.FINAL_STRETCH,
                MIGRATED: state.items.MIGRATED,
            };
            const changed = new Set<PulseState>();
            const cloneCol = (k: PulseState) => {
                if (!changed.has(k)) {
                    working[k] = working[k].slice();
                    changed.add(k);
                }
            };

            buffer.forEach((buf, mint) => {
                // Locate the token (update-only: skip if not currently shown).
                let col: PulseState | null = null;
                let idx = -1;
                for (const k of keys) {
                    const i = working[k].findIndex((it) => it.tokenId === mint);
                    if (i !== -1) {
                        col = k;
                        idx = i;
                        break;
                    }
                }
                if (col === null) return;

                const prev = working[col][idx];
                const marketCap = buf.marketCap ?? prev.marketCap;
                const bondingProgress = buf.bondingProgress ?? prev.bondingProgress;
                const updated: PulseItem = {
                    ...prev,
                    marketCap,
                    bondingProgress,
                    volume24h: (prev.volume24h || 0) + buf.volumeUsdDelta,
                    liquidity: prev.liquidity || 0,
                    holders: prev.holders || 0,
                    txCount: prev.txCount + buf.txDelta,
                    updatedAt: Date.now(),
                };

                // Determine target column from bonding progress.
                let target: PulseState = col;
                if (bondingProgress >= 100 && col !== 'MIGRATED') target = 'MIGRATED';
                else if (bondingProgress >= 85 && col === 'NEW') target = 'FINAL_STRETCH';

                if (target === col) {
                    cloneCol(col);
                    working[col][idx] = updated;
                } else {
                    cloneCol(col);
                    working[col].splice(idx, 1);
                    cloneCol(target);
                    const moved: PulseItem = {
                        ...updated,
                        state: target,
                        ...(target === 'MIGRATED' ? { bondingProgress: 100 } : {}),
                    };
                    working[target] = [moved, ...working[target]].slice(0, 20);
                }
            });

            if (changed.size === 0) return state;
            return { items: working, lastUpdate: Date.now() };
        });
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
            newItems[newState] = [updatedItem, ...newItems[newState]].slice(0, 20);
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
        return filterPulseItems(items[state], filters);
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

