// ===========================================
// SOCKET EVENT TYPES FOR CLIENT
// Ported from Omenera
// ===========================================

// ----- New Token Event (from new_tokens:all room) -----
export interface NewTokenEvent {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  creator: string;
  creator_token_status: string;
  protocol_source: "pumpfun" | "pumpfun_v2" | "bonk" | "meteora_dbc";
  launchpad?: string;
  bonding_curve: string;
  initial_token_reserves: string;
  status: "active" | "migrated" | "rugged" | "inactive";
  holder_count: number;
  top_10_holder_rate: string;
  total_supply: string;
  circulating_supply: string;
  market_cap_sol?: string;
  market_cap_usd?: string;
  logo_url: string | null;
  creation_timestamp: number;
}

// ----- Trade Event (from trades:all or token:MINT:trades room) -----
export interface TradeEvent {
  id: number;
  signature: string;
  mint: string;
  dex: "pumpfun" | "pumpswap" | "bonk" | "meteora_dbc" | "meteora_damm_v2" | "raydium_cpmm" | "raydium_clmm" | "raydium_amm_v4";
  direction: "buy" | "sell";
  token_amount: string;
  sol_amount: string;
  price_per_token: string | null;
  user_wallet: string;
  is_bot: boolean;
  is_dev_trade: boolean;
  is_sniper: boolean;
  is_bundle: boolean;
  market_cap_sol: string | null;
  market_cap_usd: string | null;
  block_time: number;
  bonding_curve_percent?: string | null;
}

// ----- Migration Event -----
export interface MigrationEvent {
  mint: string;
  name?: string;
  symbol?: string;
  logo_url?: string;
  from_protocol: "pumpfun" | "pumpfun_v2" | "bonk" | "meteora_dbc";
  to_dex: "pumpswap" | "raydium" | "raydium_amm_v4" | "meteora";
  migrated_at: number;
  final_market_cap_sol?: string;
  total_volume_sol?: string;
  holder_count?: number;
  total_trades?: number;
}

// ----- Metadata Updated Event (from metadata:all room) -----
// GMGN-shaped: keyed by `address` (the mint), with the resolved logo at
// info.data[0].logo. Emitted after a token's off-chain metadata is indexed,
// which is how logos for just-created tokens (logo_url empty at creation) arrive.
export interface MetadataEvent {
  address: string;
  chain?: string;
  info?: {
    code?: number;
    data?: Array<{
      address?: string;
      name?: string;
      symbol?: string;
      logo?: string | null;
      holder_count?: number;
    }>;
  };
}

export type SocketRoom =
  | "new_tokens:all"
  | "trades:all"
  | "migrations:all"
  | "metadata:all"
  | `trades:${string}`
  | `token:${string}:trades`;

export type SocketEventName =
  | "new_token"
  | "trade"
  | "migration"
  | "metadata_updated"
  | "pool_created"
  | "subscribed"
  | "unsubscribed"
  | "pong";
