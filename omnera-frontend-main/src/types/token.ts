// Token Info Types
export interface TokenInfoResponse {
  code: number;
  message: string;
  data: TokenInfoData[];
}

export interface TokenInfoData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  price: {
    price: string;
    price_1m: string;
    price_1h: string;
    price_24h: string;
    volume_24h: string;
    market_cap?: string; // Sometimes inferred or calculated
    liquidity?: string; // From pool info
  };
  liquidity: string;
  market_cap?: string; // Explicit field if available, else calculated
  pool: {
    liquidity: string;
    base_reserve: string;
    quote_reserve: string;
    initial_liquidity: string;
    creation_timestamp: number;
  };
  dev: {
    creator_address: string;
    creator_token_status: string;
    top_10_holder_rate: string;
  };
  holder_count: number;
  creation_timestamp: number;
}

// Security Types
export interface SecurityResponse {
  address: string;
  security: {
    is_show_alert: boolean;
    top_10_holder_rate: string;
    renounced_mint: boolean;
    renounced_freeze_account: boolean;
    burn_ratio: string;
    burn_status: string;
    is_open_source: boolean | null;
    is_honeypot: boolean | null;
    is_blacklisted: boolean | null;
    buy_tax: string;
    sell_tax: string;
    is_mutable?: boolean; // Inferred
  };
  launchpad: {
    launchpad: string;
    launchpad_status: number;
  };
}

// Trader Types
export interface TraderData {
  address: string;
  wallet_tag_v2: string;
  profit: number;
  total_cost: number;
  realized_profit: number;
  unrealized_profit: number;
  buy_volume_cur: number;
  sell_volume_cur: number;
  buy_tx_count_cur: number;
  sell_tx_count_cur: number;
  is_suspicious: boolean;
  maker_token_tags: string[];
}

// Holder Types
export interface HolderData {
  address: string;
  balance: number;
  amount_percentage: number;
  usd_value: number;
  wallet_tag_v2: string;
  is_suspicious: boolean;
  maker_token_tags: string[];
}

export interface HoldersResponse {
  list: HolderData[];
}

// Enriched Token Response Types
export interface EnrichedTokenResponse {
  address: string;
  chain: string;
  info: {
    code: number;
    reason: string;
    message: string;
    data: TokenInfoData[];
  };
  stats: {
    code: number;
    reason: string;
    message: string;
    data: TokenStatsData;
  };
}

export interface TokenStatsData {
  smart_degen_count: number;
  renowned_count: number;
  fresh_wallet_count: number;
  dex_bot_count: number;
  insider_count: number;
  following_count: number;
  dev_count: number;
  bluechip_owner_count: number;
  bundler_count: number;
  sniper_count: number;
}
