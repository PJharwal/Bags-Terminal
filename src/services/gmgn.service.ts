/**
 * GMGN API Service
 * Connects to the local GMGN server for token data, market data, and wallet analysis
 */

// Use the Next.js API proxy to avoid CORS issues
const GMGN_BASE = '/api/gmgn';

// Types for GMGN responses
export interface GMGNTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
  price: number;
  price_change_1h?: number;
  price_change_24h?: number;
  volume_24h?: number;
  market_cap?: number;
  liquidity?: number;
  holder_count?: number;
  creation_timestamp?: number;
  creator?: string;
  creator_token_status?: string;
  top_10_holder_rate?: number;
}

export interface GMGNSecurityData {
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
}

export interface GMGNTokenStats {
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

export interface GMGNHolder {
  address: string;
  balance: number;
  amount_percentage: number;
  usd_value: number;
  wallet_tag_v2?: string;
  is_suspicious: boolean;
  maker_token_tags?: string[];
}

export interface GMGNTrader {
  address: string;
  wallet_tag_v2?: string;
  profit: number;
  total_cost: number;
  realized_profit: number;
  unrealized_profit: number;
  buy_volume_cur: number;
  sell_volume_cur: number;
  buy_tx_count_cur: number;
  sell_tx_count_cur: number;
  is_suspicious: boolean;
  maker_token_tags?: string[];
}

export interface GMGNTrendingToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  price_change_percent?: number;
  volume?: number;
  volume_24h?: number;
  market_cap?: number;
  logo?: string;
}

export interface GMGNWalletDistribution {
  address: string;
  period: string;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  realized_profit: number;
  unrealized_profit: number;
}

// Helper to handle API responses
async function fetchGMGN<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${GMGN_BASE}${endpoint}`);
    if (!response.ok) {
      console.error(`GMGN API error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    // Handle wrapped responses with code/data structure
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data as T;
    }
    return data as T;
  } catch (error) {
    console.error(`GMGN API fetch error for ${endpoint}:`, error);
    return null;
  }
}

export const gmgnService = {
  // Token data
  getTokenInfo: (address: string) =>
    fetchGMGN<GMGNTokenInfo>(`/token/${address}/info`),

  getTokenPrice: (address: string) =>
    fetchGMGN<{ price: number }>(`/token/${address}/price`),

  getTokenSecurity: (address: string) =>
    fetchGMGN<{ security: GMGNSecurityData }>(`/token/${address}/security?chain=sol`),

  getTokenStats: (address: string) =>
    fetchGMGN<GMGNTokenStats>(`/token/${address}/stats?chain=sol`),

  getTokenEnriched: (address: string) =>
    fetchGMGN<{ info: GMGNTokenInfo; stats: GMGNTokenStats }>(`/token/${address}/enriched?chain=sol`),

  getTokenHolders: (address: string, limit = 50) =>
    fetchGMGN<{ list: GMGNHolder[] }>(`/token/${address}/holders?limit=${limit}`),

  getTokenTraders: (address: string, limit = 50) =>
    fetchGMGN<{ list: GMGNTrader[] }>(`/token/${address}/traders?limit=${limit}`),

  getTokenBuyers: (address: string, limit = 50) =>
    fetchGMGN<{ list: GMGNTrader[] }>(`/token/${address}/buyers?limit=${limit}`),

  // Market data
  getTrending: (timeframe = '1h') =>
    fetchGMGN<{ rank: GMGNTrendingToken[] }>(`/tokens/trending?timeframe=${timeframe}`),

  getSwapRanks: (timeframe = '1m', limit = 20) =>
    fetchGMGN<{ rank: GMGNTrendingToken[] }>(`/ranks/swaps?chain=sol&timeframe=${timeframe}&limit=${limit}`),

  getPumpRanks: (timeframe = '1h', limit = 20) =>
    fetchGMGN<{ rank: GMGNTrendingToken[] }>(`/ranks/pump?chain=sol&timeframe=${timeframe}&limit=${limit}`),

  getNewPairs: (limit = 50) =>
    fetchGMGN<{ pairs: GMGNTrendingToken[] }>(`/pairs/new?limit=${limit}`),

  // Wallet data
  getWalletDistribution: (address: string, period = '7d') =>
    fetchGMGN<GMGNWalletDistribution>(`/wallet/${address}/distribution?period=${period}`),
};

// Combined fetch for terminal token loading
export async function fetchTerminalTokenData(tokenId: string) {
  const [tokenInfo, security, holders, traders] = await Promise.all([
    gmgnService.getTokenEnriched(tokenId),
    gmgnService.getTokenSecurity(tokenId),
    gmgnService.getTokenHolders(tokenId, 50),
    gmgnService.getTokenTraders(tokenId, 50),
  ]);

  return {
    tokenInfo,
    security,
    holders: holders?.list || [],
    traders: traders?.list || [],
  };
}

export default gmgnService;
