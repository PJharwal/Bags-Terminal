// ===========================================
// SOCKET EVENT TYPES FOR CLIENT
// Updated to match new backend socket event formats
// ===========================================

// ----- New Token Event (from new_tokens:all room) -----
export interface NewTokenEvent {
  mint: string;

  // Basic Info
  name: string;
  symbol: string;
  uri: string;
  decimals: number;

  // Creator Info
  creator: string;
  creator_token_balance: string | null;
  creator_token_status: string; // "sold" | "held" etc.

  // Protocol Info
  protocol_source: "pumpfun" | "pumpfun_v2" | "bonk" | "meteora_dbc";
  bonding_curve: string;
  pool_address: string | null;

  // Fund Raising Constants
  initial_token_reserves: string;
  migration_threshold: string | null;
  total_quote_fund_raising: string | null;

  // Status
  status: "active" | "migrated" | "rugged" | "inactive";
  is_migrated: boolean;
  migrated_at: number | null;
  migrated_to_dex: string | null;
  migrated_pool: string | null;

  // Holder Summary (from enrichment API)
  holder_count: number;
  top_10_holder_rate: string;

  // Supply Info
  total_supply: string;
  circulating_supply: string;
  max_supply: string | null;

  // External Links (from enrichment API)
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  discord: string | null;

  // Dev Analysis
  twitter_name_change_count: number;
  twitter_create_token_count: number;
  cto_flag: boolean;

  // Timestamps
  creation_timestamp: number;
  open_timestamp: number | null;
  created_at: string | null;
  updated_at: string | null;

  // Creation signature
  creation_signature: string;
}

// ----- Trade Event (from trades:all or token:MINT:trades room) -----
export interface TradeEvent {
  id: number;

  // Transaction Info
  signature: string;
  mint: string;

  // Trade Details
  dex: "pumpfun" | "pumpswap" | "bonk" | "meteora_dbc" | "meteora_damm_v2" | "raydium_cpmm" | "raydium_clmm" | "raydium_amm_v4";
  direction: "buy" | "sell";

  // Amounts (raw integers - lamports/raw token units)
  token_amount: string;
  sol_amount: string;
  price_per_token: string | null;

  // Quote token (for non-SOL pairs)
  quote_mint: string | null;
  quote_amount: string | null;

  // User Info
  user_wallet: string;
  user_token_account: string | null;

  // Fees
  total_fee: string;
  protocol_fee: string | null;
  creator_fee: string | null;
  lp_fee: string | null;

  // Pool State After Trade
  pool_address: string | null;
  virtual_token_reserves: string | null;
  virtual_sol_reserves: string | null;
  real_token_reserves: string | null;
  real_sol_reserves: string | null;
  quote_reserve_amount: string | null;

  // Bonding Curve Progress (launchpad only)
  bonding_curve_percent: string | null; // 0-100, null for DEX trades

  // Trade Classification
  is_bot: boolean;
  is_dev_trade: boolean;
  is_sniper: boolean;
  is_bundle: boolean;

  // USD Value (may be null/0)
  sol_price_usd: number | null;
  trade_value_usd: number | null;

  // Real-time metrics (Socket.IO only)
  market_cap_sol: string | null;      // Normalized SOL
  market_cap_usd: string | null;      // USD value (often 0)
  volume_1m_sol: string | null;       // Lamports
  volume_total_sol: string | null;    // Lamports

  // Blockchain Metadata
  slot: number;
  block_time: number;
  transaction_index: number | null;

  // Timestamps
  created_at: string | null;
}

// ----- Migration Event -----
export interface MigrationEvent {
  mint: string;
  from_protocol: "pumpfun" | "pumpfun_v2" | "bonk" | "meteora_dbc";
  to_dex: "pumpswap" | "raydium" | "raydium_amm_v4" | "meteora";
  pool_address: string;
  slot: number;
  signature: string;
  migrated_at: number;

  // Token metadata
  name?: string;
  symbol?: string;
  logo_url?: string;
  creator?: string;

  // Final metrics at graduation
  final_market_cap_sol?: string;
  final_market_cap_usd?: string;
  total_volume_sol?: string;
  total_trades?: number;
  holder_count?: number;
  bonding_curve_percent?: string;
}

// ----- Pool Created Event -----
export interface PoolCreatedEvent {
  address: string;
  token_mint: string;
  quote_mint: string;
  dex: "pumpswap" | "meteora_damm_v2" | "raydium_cpmm" | "raydium_clmm" | "raydium_amm_v4";
  creator: string;
  slot: number;
  signature: string;
  created_at: number;
}

// ===========================================
// SOCKET ROOM NAMES
// ===========================================
export type SocketRoom =
  | "new_tokens:all"
  | "trades:all"
  | `trades:${string}`           // trades:pumpfun, trades:pumpswap, etc.
  | `token:${string}:trades`;    // token:MINT:trades

// ===========================================
// SOCKET EVENT NAMES
// ===========================================
export type SocketEventName =
  | "new_token"
  | "trade"
  | "migration"
  | "pool_created"
  | "subscribed"
  | "unsubscribed"
  | "pong";

// ===========================================
// LEGACY TYPES (for backward compatibility with API responses)
// ===========================================

// ----- Token Stats (Security Metrics) -----
export interface TokenStats {
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

// ===========================================
// INTERNAL PULSE DATA TYPE (for UI rendering)
// ===========================================
export interface PulseTokenData {
  mint: string;
  name: string;
  symbol: string;
  image_uri: string;
  market_cap: number;
  volume_24h: number;
  tx_count: number;
  price_change_1h: number;
  price_change_5m: number;
  created_at: number; // timestamp
  bonding_curve_progress?: number;
  is_bonded?: boolean;
  // Enriched fields
  holder_count?: number;
  liquidity?: number;
  total_supply?: string;
  max_supply?: string;
  banner?: string;
  logo?: string;
  // Protocol info
  protocol_source?: string;
  // Stats (Security Metrics)
  stats?: TokenStats;
}

// Legacy types kept for API compatibility
export interface TokenPool {
  address: string;
  pool_address: string;
  quote_address: string;
  quote_symbol: string;
  liquidity: string;
  base_reserve: string;
  quote_reserve: string;
  initial_liquidity: string;
  initial_base_reserve: string;
  initial_quote_reserve: string;
  creation_timestamp: number;
  base_reserve_value: string;
  quote_reserve_value: string;
  quote_vault_address: string;
  base_vault_address: string;
  creator: string;
  exchange: string;
  token0_address: string;
  token1_address: string;
  base_address: string;
  fee_ratio: string;
}

export interface TokenTPool {
  exchange: string;
  pool_address: string;
  base_address: string;
  quote_address: string;
  launch_type: string;
}

export interface TokenDev {
  address: string;
  creator_address: string;
  creator_token_balance: string;
  creator_token_status: string;
  twitter_name_change_history: any[];
  top_10_holder_rate: string;
  dexscr_ad: number;
  dexscr_update_link: number;
  cto_flag: number;
  dexscr_boost_fee: number;
  dexscr_trending_bar: number;
  dexscr_ad_ts: number;
  dexscr_update_link_ts: number;
  dexscr_boost_ts: number;
  dexscr_trending_bar_ts: number;
  twitter_del_post_token_count: number;
  twitter_create_token_count: number;
  fund_from: string;
  fund_from_ts: number;
  creator_open_count: number;
  offchain: boolean;
}

export interface TokenPrice {
  address: string;
  price: string;
  price_1m: string;
  price_5m: string;
  price_1h: string;
  price_6h: string;
  price_24h: string;
  buys_1m: number;
  buys_5m: number;
  buys_1h: number;
  buys_6h: number;
  buys_24h: number;
  sells_1m: number;
  sells_5m: number;
  sells_1h: number;
  sells_6h: number;
  sells_24h: number;
  volume_1m: string;
  volume_5m: string;
  volume_1h: string;
  volume_6h: string;
  volume_24h: string;
  buy_volume_1m: string;
  buy_volume_5m: string;
  buy_volume_1h: string;
  buy_volume_6h: string;
  buy_volume_24h: string;
  sell_volume_1m: string;
  sell_volume_5m: string;
  sell_volume_1h: string;
  sell_volume_6h: string;
  sell_volume_24h: string;
  swaps_1m: number;
  swaps_5m: number;
  swaps_1h: number;
  swaps_6h: number;
  swaps_24h: number;
  hot_level: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  banner: string;
  biggest_pool_address: string;
  open_timestamp: number;
  migrated_timestamp: number;
  holder_count: number;
  circulating_supply: string;
  total_supply: string;
  max_supply: string;
  liquidity: string;
  creation_timestamp: number;
  pool: TokenPool;
  tpool: TokenTPool;
  dev: TokenDev;
  price: TokenPrice;
  standard: string;
  priority_fee: string;
  tip_fee: string;
  trade_fee: string;
  total_fee: string;
  og: boolean;
  image_dup_count: number;
  creation_tool: string;
  trans_symbol: string;
  trans_name: string;
  trans_symbol_zhcn: string;
  trans_name_zhcn: string;
  offchain: boolean;
  tcid: string;
}

export interface EnrichedTokenData {
  info: TokenInfo | null;
  stats: TokenStats | null;
}

export interface RealTimeMetrics {
  volume: number;
  buys: number;
  sells: number;
  swaps: number;
  price: number;
  marketCap: number;
}

// Legacy event payloads (kept for backward compatibility)
export interface TokenEventPayload {
  mint: string;
  name?: string;
  symbol?: string;
  uri?: string;
  creator?: string;
  bondingCurve?: string;
  timestamp?: string;
  signature?: string;
  slot?: number;
  enriched: EnrichedTokenData;
}

export interface TradeEventPayload {
  mint: string;
  type: 'BUY' | 'SELL';
  user: string;
  tokenAmount: number;
  solAmount: number;
  price?: number;
  marketCap?: number;
  curveProgress?: number;
  virtualSolReserves?: string;
  virtualTokenReserves?: string;
  realSolReserves?: string;
  realTokenReserves?: string;
  timestamp: string;
  signature: string;
  slot: number;
  metrics: RealTimeMetrics;
}

export interface FeedUpdatePayload {
  channel: string;
  data: TokenEventPayload | TradeEventPayload;
}
