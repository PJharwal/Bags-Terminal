// Core Types for BAGS Terminal

export type TokenStatus = 'live' | 'rugged' | 'stealth' | 'graduated' | 'new';
export type WalletType = 'deployer' | 'insider' | 'organic' | 'whale';
export type EventSeverity = 'info' | 'warning' | 'critical' | 'success';
export type EventType = 'launch' | 'funding' | 'distribution' | 'alert' | 'rug' | 'whale_entry';

export interface Token {
    id: string;
    symbol: string;
    name: string;
    deployer_wallet: string;
    launch_time: number;
    launch_score: number;
    status: TokenStatus;
    insider_pct: number;
    dev_sold: boolean;
    dev_pct: number;
    retail_pct: number;
    volume_24h: number;
    market_cap: number;
    holders: number;
    funding_type: 'fresh' | 'recycled' | 'suspicious';
}

export interface Deployer {
    wallet: string;
    name?: string;
    total_launches: number;
    success_rate: number;
    avg_score: number;
    risk_flags: string[];
    last_launch: number;
    total_volume: number;
    insider_usage_avg: number;
}

export interface Wallet {
    address: string;
    type: WalletType;
    linked_wallets: string[];
    first_seen: number;
    total_tokens: number;
    pnl: number;
}

export interface Event {
    id: string;
    type: EventType;
    severity: EventSeverity;
    related_token?: string;
    related_deployer?: string;
    timestamp: number;
    title: string;
    description: string;
}

export interface FilterPreset {
    id: string;
    name: string;
    description: string;
    filters: Partial<TokenFilters>;
}

export interface TokenFilters {
    min_launch_score: number;
    max_insider_pct: number;
    dev_sold: boolean | null;
    status: TokenStatus[];
    funding_type: string[];
    min_volume: number;
    deployer_min_score: number;
}

export interface TerminalState {
    selectedToken: Token | null;
    selectedDeployer: Deployer | null;
    activePreset: string | null;
    filters: TokenFilters;
    drawerOpen: boolean;
    drawerType: 'token' | 'deployer' | null;
}

// Pulse Lifecycle Types
export type PulseState = 'NEW' | 'FINAL_STRETCH' | 'MIGRATED';
export type RiskFlagType = 'REUSED_FUNDING' | 'INSIDER_CLUSTER' | 'DEV_SELL' | 'CLEAN';

export interface RiskFlag {
    type: RiskFlagType;
    severity: 'info' | 'warn' | 'critical';
}

export interface PulseItem {
    tokenId: string;
    symbol: string;
    name?: string;
    image?: string;
    deployer: string;
    deployerName?: string;
    deployerLaunches?: number;
    deployerSuccessRate?: number;
    ageSeconds: number;
    marketCap: number;
    liquidity: number;
    bondingProgress: number;
    holders: number;
    txCount: number;
    volume24h?: number;
    state: PulseState;
    riskFlags: RiskFlag[];
    updatedAt: number;
    // Socket data fields
    logoUrl?: string;
    protocolSource?: string;
}

// ==========================================
// Terminal Types
// ==========================================

// Fee earner info for terminal display
export interface TokenFeeEarner {
    username: string;
    pfp?: string;
    royaltyBps: number;           // Fee share in basis points (100 = 1%)
    royaltyPercent: number;       // Computed: royaltyBps / 100
    isCreator: boolean;
    wallet: string;
    provider: 'twitter' | 'kick' | 'github' | 'tiktok' | 'unknown' | null;
    providerUsername: string | null;
    totalClaimed?: number;        // SOL claimed (if available)
}

// Terminal Token Context (full detail for Terminal view)
export interface TerminalToken {
    tokenId: string;       // Solana mint address (used for GeckoTerminal)
    symbol: string;
    name: string;
    image?: string;
    deployer: string;
    deployerName?: string;
    deployerLaunches?: number;
    deployerSuccessRate?: number;
    marketCap: number;
    liquidity: number;
    supply: number;
    bondingProgress: number;
    holders: number;
    feesPaid: number;
    migrated: boolean;
    priceUsd: number;
    priceChange24h: number;
    volume24h: number;
    volume5m: number;

    // Bags Fee Data
    lifetimeFees: number;              // Total fees earned (SOL)
    feeEarners: TokenFeeEarner[];      // List of fee earners
    topEarner?: {
        username: string;
        provider: string | null;
        royaltyPercent: number;
        pfp?: string;
    };
    hasBagsFees: boolean;              // Quick check if token has Bags fee data
}

// Trade row for bottom tabs
export interface TradeRow {
    id: string;
    type: 'buy' | 'sell';
    wallet: string;
    walletLabel?: string;
    amount: number;
    priceUsd: number;
    total: number;
    timestamp: number;
}

// Holder/Trader row for bottom tabs
export interface WalletRow {
    wallet: string;
    walletLabel?: string;
    bought: number;
    sold: number;
    pnl: number;
    pnlPercent: number;
    holding: number;
    holdingPercent: number;
    lastActive: number;
}

// Terminal bottom tab types
export type TerminalBottomTab = 'trades' | 'holders' | 'top-traders' | 'dev-tokens' | 'fees';

// Trade panel state
export interface TradePanelState {
    mode: 'buy' | 'sell';
    orderType: 'market' | 'limit';
    amount: number;
    limitPrice?: number;
}

// ==========================================
// Credibility Matrix Types
// ==========================================

// Pattern flag for behavior detection
export type PatternFlagType =
    | 'WALLET_RECYCLING'
    | 'INSIDER_CLUSTER'
    | 'DEV_EARLY_SELL'
    | 'FUNDING_REUSE'
    | 'ORGANIC_GROWTH'
    | 'CLEAN_LAUNCH'
    | 'GRADUAL_DISTRIBUTION';

export interface PatternFlag {
    type: PatternFlagType;
    severity: 'info' | 'warn' | 'critical';
    explanation: string;
}

// Grade type for credibility scores
export type CredibilityGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

// Credibility Matrix - interpretive analysis
export interface CredibilityMatrix {
    tokenId: string;

    deployer: {
        score: number;  // 0-100
        grade: CredibilityGrade;
        label: 'Clean' | 'Mixed' | 'Risky';
        summary: string;
    };

    funding: {
        score: number;
        grade: CredibilityGrade;
        label: 'Fresh' | 'Reused' | 'Suspicious';
        summary: string;
    };

    distribution: {
        score: number;
        grade: CredibilityGrade;
        label: 'Organic' | 'Concentrated' | 'Insider Heavy';
        summary: string;
    };

    behaviorPatterns: PatternFlag[];

    confidenceBand: {
        range: [number, number];
        trend: 'Improving' | 'Stable' | 'Deteriorating';
    };

    overallScore: number;
    overallGrade: CredibilityGrade;

    updatedAt: number;
}

