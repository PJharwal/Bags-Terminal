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
}

