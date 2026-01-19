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
import { generateCredibilityMatrix } from '@/lib/credibility';

// Mock data generators
const MOCK_WALLETS = [
    { wallet: '7Xa3...f2e1', label: 'whale_1' },
    { wallet: '3Bb2...a4c8', label: 'degen_trader' },
    { wallet: '9Cc4...b3d2', label: 'smart_money' },
    { wallet: '2Ee6...c1a4', label: null },
    { wallet: '8Ff1...d2b5', label: 'insider_1' },
    { wallet: '4Gg3...e5f6', label: null },
    { wallet: '1Hh8...a9b0', label: 'dev_wallet' },
];

const generateMockTrades = (count: number): TradeRow[] => {
    return Array.from({ length: count }, (_, i) => {
        const wallet = MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];
        const isBuy = Math.random() > 0.45;
        const amount = Math.floor(Math.random() * 50000) + 100;
        const price = Math.random() * 0.001 + 0.0001;
        return {
            id: `trade-${Date.now()}-${i}`,
            type: (isBuy ? 'buy' : 'sell') as 'buy' | 'sell',
            wallet: wallet.wallet,
            walletLabel: wallet.label || undefined,
            amount,
            priceUsd: price,
            total: amount * price,
            timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        };
    }).sort((a, b) => b.timestamp - a.timestamp);
};

const generateMockHolders = (count: number): WalletRow[] => {
    return Array.from({ length: count }, (_, i) => {
        const wallet = MOCK_WALLETS[i % MOCK_WALLETS.length];
        const bought = Math.floor(Math.random() * 100000) + 1000;
        const sold = Math.floor(Math.random() * bought * 0.7);
        const holding = bought - sold;
        const pnl = (Math.random() - 0.3) * 5000;
        return {
            wallet: wallet.wallet,
            walletLabel: wallet.label || undefined,
            bought,
            sold,
            pnl,
            pnlPercent: (pnl / (bought * 0.0005)) * 100,
            holding,
            holdingPercent: Math.random() * 15 + 0.1,
            lastActive: Date.now() - Math.floor(Math.random() * 86400000),
        };
    }).sort((a, b) => b.holding - a.holding);
};

const generateMockToken = (tokenId: string): TerminalToken => ({
    tokenId,
    symbol: '$MOCK',
    name: 'Mock Token',
    image: undefined,
    deployer: '7Xa3...f2e1',
    deployerName: 'alpha_dev',
    deployerLaunches: 8,
    deployerSuccessRate: 75,
    marketCap: Math.floor(Math.random() * 2000000) + 50000,
    liquidity: Math.floor(Math.random() * 500000) + 10000,
    supply: 1000000000,
    bondingProgress: Math.floor(Math.random() * 40) + 60,
    holders: Math.floor(Math.random() * 2000) + 100,
    feesPaid: Math.floor(Math.random() * 5000) + 100,
    migrated: false,
    priceUsd: Math.random() * 0.01,
    priceChange24h: (Math.random() - 0.5) * 100,
    volume24h: Math.floor(Math.random() * 500000) + 10000,
    volume5m: Math.floor(Math.random() * 50000) + 1000,
});

interface TerminalStore {
    // Token context
    activeToken: TerminalToken | null;
    credibilityMatrix: CredibilityMatrix | null;
    isLoading: boolean;

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
    loadToken: (tokenId: string) => void;
    setActiveBottomTab: (tab: TerminalBottomTab) => void;
    setTradePanelMode: (mode: 'buy' | 'sell') => void;
    setTradePanelOrderType: (orderType: 'market' | 'limit') => void;
    setTradePanelAmount: (amount: number) => void;
    selectWallet: (wallet: string | null) => void;
    openDrawer: (type: 'token' | 'deployer' | 'wallet') => void;
    closeDrawer: () => void;
    simulateTrade: () => void;

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

    // Load token data
    loadToken: (tokenId) => {
        set({ isLoading: true });

        // Simulate API delay
        setTimeout(() => {
            const token = generateMockToken(tokenId);
            const trades = generateMockTrades(50);
            const holders = generateMockHolders(20);
            const topTraders = generateMockHolders(15).sort((a, b) => b.pnl - a.pnl);
            const credibilityMatrix = generateCredibilityMatrix(tokenId);

            set({
                activeToken: token,
                credibilityMatrix,
                trades,
                holders,
                topTraders,
                isLoading: false,
            });
        }, 300);
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

    simulateTrade: () => {
        const { trades, activeToken } = get();
        if (!activeToken) return;

        const wallet = MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];
        const isBuy = Math.random() > 0.45;
        const amount = Math.floor(Math.random() * 20000) + 100;
        const price = activeToken.priceUsd * (1 + (Math.random() - 0.5) * 0.1);

        const newTrade: TradeRow = {
            id: `trade-${Date.now()}`,
            type: (isBuy ? 'buy' : 'sell') as 'buy' | 'sell',
            wallet: wallet.wallet,
            walletLabel: wallet.label || undefined,
            amount,
            priceUsd: price,
            total: amount * price,
            timestamp: Date.now(),
        };

        set({
            trades: [newTrade, ...trades].slice(0, 100),
        });
    },

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
