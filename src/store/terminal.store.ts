import { create } from 'zustand';
import type {
    Token,
    Deployer,
    TokenFilters,
    TerminalToken,
    TradeRow,
    WalletRow,
    TerminalBottomTab,
    TradePanelState,
    CredibilityMatrix
} from '@/lib/types';
import { generateCredibilityMatrix, type RealTokenData } from '@/lib/credibility';
import { fetchTerminalTokenData, type GMGNHolder, type GMGNTrader } from '@/services/gmgn.service';

// SOL price constant (per user spec)
const SOL_PRICE = 140;

// Transform GMGN holder data to WalletRow
const transformHolder = (holder: GMGNHolder): WalletRow => ({
    wallet: holder.address.slice(0, 4) + '...' + holder.address.slice(-4),
    walletLabel: holder.wallet_tag_v2 || undefined,
    bought: holder.usd_value || 0,
    sold: 0,
    pnl: 0,
    pnlPercent: 0,
    holding: holder.balance,
    holdingPercent: holder.amount_percentage * 100,
    lastActive: Date.now(),
});

// Transform GMGN trader data to WalletRow
const transformTrader = (trader: GMGNTrader): WalletRow => ({
    wallet: trader.address.slice(0, 4) + '...' + trader.address.slice(-4),
    walletLabel: trader.wallet_tag_v2 || undefined,
    bought: trader.buy_volume_cur,
    sold: trader.sell_volume_cur,
    pnl: trader.profit,
    pnlPercent: trader.total_cost > 0 ? (trader.profit / trader.total_cost) * 100 : 0,
    holding: trader.buy_volume_cur - trader.sell_volume_cur,
    holdingPercent: 0,
    lastActive: Date.now(),
});

interface TerminalStore {
    // Token context
    activeToken: TerminalToken | null;
    credibilityMatrix: CredibilityMatrix | null;
    isLoading: boolean;
    error: string | null;

    // Data tables
    trades: TradeRow[];
    holders: WalletRow[];
    topTraders: WalletRow[];

    // UI state
    activeBottomTab: TerminalBottomTab;
    tradePanel: TradePanelState;
    drawerOpen: boolean;
    drawerType: 'token' | 'deployer' | 'wallet' | null;
    selectedWallet: string | null;

    // Legacy filters (kept for compatibility)
    filters: TokenFilters;
    activePreset: string | null;
    selectedToken: Token | null;
    selectedDeployer: Deployer | null;

    // Actions
    loadToken: (tokenId: string) => Promise<void>;
    addTrade: (trade: TradeRow) => void;
    setActiveBottomTab: (tab: TerminalBottomTab) => void;
    setTradePanelMode: (mode: 'buy' | 'sell') => void;
    setTradePanelOrderType: (orderType: 'market' | 'limit') => void;
    setTradePanelAmount: (amount: number) => void;
    selectWallet: (wallet: string | null) => void;
    openDrawer: (type: 'token' | 'deployer' | 'wallet') => void;
    closeDrawer: () => void;

    // Legacy actions (kept for compatibility)
    selectToken: (token: Token | null) => void;
    selectDeployer: (deployer: Deployer | null) => void;
    setActivePreset: (presetId: string | null) => void;
    setFilters: (filters: Partial<TokenFilters>) => void;
    resetFilters: () => void;
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

const defaultTradePanel: TradePanelState = {
    mode: 'buy',
    orderType: 'market',
    amount: 0.1,
};

export const useTerminalStore = create<TerminalStore>((set, get) => ({
    // Initial state
    activeToken: null,
    credibilityMatrix: null,
    isLoading: false,
    error: null,
    trades: [],
    holders: [],
    topTraders: [],
    activeBottomTab: 'trades',
    tradePanel: defaultTradePanel,
    drawerOpen: false,
    drawerType: null,
    selectedWallet: null,

    // Legacy state
    selectedToken: null,
    selectedDeployer: null,
    activePreset: null,
    filters: defaultFilters,

    // Load token data from GMGN API
    loadToken: async (tokenId) => {
        set({ isLoading: true, error: null });

        try {
            console.log('Loading token data for:', tokenId);
            const { tokenInfo, security, holders, traders } = await fetchTerminalTokenData(tokenId);

            if (!tokenInfo) {
                throw new Error('Failed to fetch token info from GMGN');
            }

            // Extract data from enriched response
            const info = tokenInfo.info;
            const stats = tokenInfo.stats;

            // Build TerminalToken from GMGN data
            const token: TerminalToken = {
                tokenId,
                symbol: info?.symbol ? `$${info.symbol}` : '$UNK',
                name: info?.name || 'Unknown Token',
                image: info?.logo || undefined,
                deployer: info?.creator ? info.creator.slice(0, 4) + '...' + info.creator.slice(-4) : 'unknown',
                deployerName: undefined,
                deployerLaunches: undefined,
                deployerSuccessRate: undefined,
                marketCap: info?.market_cap || 0,
                liquidity: info?.liquidity || 0,
                supply: 1000000000, // Default supply
                bondingProgress: 100, // Assume migrated if in GMGN
                holders: info?.holder_count || 0,
                feesPaid: 0,
                migrated: true,
                priceUsd: info?.price || 0,
                priceChange24h: info?.price_change_24h || 0,
                volume24h: info?.volume_24h || 0,
                volume5m: 0,
            };

            // Transform holders and traders
            const transformedHolders = holders.map(transformHolder);
            const transformedTraders = traders.map(transformTrader).sort((a, b) => b.pnl - a.pnl);

            // Calculate real credibility data
            const realData: RealTokenData = {
                holders: holders.map(h => ({
                    address: h.address,
                    percentage: h.amount_percentage * 100,
                    isSuspicious: h.is_suspicious,
                    tags: h.maker_token_tags || [],
                })),
                stats: stats || undefined,
                security: security?.security || undefined,
                holderCount: info?.holder_count || 0,
                top10Rate: info?.top_10_holder_rate || 0,
                devStatus: info?.creator_token_status || 'unknown',
            };

            const credibilityMatrix = generateCredibilityMatrix(tokenId, realData);

            set({
                activeToken: token,
                credibilityMatrix,
                holders: transformedHolders,
                topTraders: transformedTraders,
                trades: [], // Trades will come from socket
                isLoading: false,
            });

            console.log('Token loaded successfully:', token.symbol);
        } catch (error) {
            console.error('Failed to load token:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load token',
                isLoading: false,
            });
        }
    },

    // Add a trade from socket event
    addTrade: (trade) => {
        const { trades } = get();
        set({
            trades: [trade, ...trades].slice(0, 100),
        });
    },

    setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),

    setTradePanelMode: (mode) => set((state) => ({
        tradePanel: { ...state.tradePanel, mode }
    })),

    setTradePanelOrderType: (orderType) => set((state) => ({
        tradePanel: { ...state.tradePanel, orderType }
    })),

    setTradePanelAmount: (amount) => set((state) => ({
        tradePanel: { ...state.tradePanel, amount }
    })),

    selectWallet: (wallet) => set({
        selectedWallet: wallet,
        drawerOpen: wallet !== null,
        drawerType: wallet ? 'wallet' : null,
    }),

    openDrawer: (type) => set({
        drawerOpen: true,
        drawerType: type
    }),

    closeDrawer: () => set({
        drawerOpen: false,
        drawerType: null,
        selectedWallet: null,
    }),

    // Legacy actions
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
        activePreset: null,
    })),

    resetFilters: () => set({
        filters: defaultFilters,
        activePreset: null
    }),
}));

// Preset definitions (legacy)
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
