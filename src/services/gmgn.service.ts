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

// Helper to handle API responses — fails fast with 5s timeout
async function fetchGMGN<T>(endpoint: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${GMGN_BASE}${endpoint}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data as T;
    }
    return data as T;
  } catch {
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
// Falls back to DexScreener if GMGN is unavailable
export async function fetchTerminalTokenData(tokenId: string) {
  // Try GMGN first
  const [tokenInfo, security, holders, traders] = await Promise.all([
    gmgnService.getTokenEnriched(tokenId),
    gmgnService.getTokenSecurity(tokenId),
    gmgnService.getTokenHolders(tokenId, 50),
    gmgnService.getTokenTraders(tokenId, 50),
  ]);

  if (tokenInfo) {
    return {
      tokenInfo,
      security,
      holders: holders?.list || [],
      traders: traders?.list || [],
      source: 'gmgn' as const,
    };
  }

  // GMGN failed — fall back to DexScreener
  console.log('GMGN unavailable, falling back to DexScreener for', tokenId);
  const { dexScreenerService } = await import('./dexscreener.service');
  const dexData = await dexScreenerService.getTokenPairs(tokenId);

  if (!dexData) {
    return { tokenInfo: null, security: null, holders: [], traders: [], source: 'none' as const };
  }

  // Transform DexScreener data into the shape the terminal expects
  const syntheticTokenInfo = {
    info: {
      address: dexData.address,
      symbol: dexData.symbol,
      name: dexData.name,
      decimals: 9,
      price: dexData.price,
      price_change_24h: dexData.priceChange24h,
      volume_24h: dexData.volume24h,
      market_cap: dexData.marketCap,
      liquidity: dexData.liquidity,
      logo: dexData.logo,
      holder_count: 0,
      creation_timestamp: dexData.createdAt ? Math.floor(dexData.createdAt / 1000) : undefined,
    } as GMGNTokenInfo,
    stats: {
      smart_degen_count: 0,
      renowned_count: 0,
      fresh_wallet_count: 0,
      dex_bot_count: 0,
      insider_count: 0,
      following_count: 0,
      dev_count: 0,
      bluechip_owner_count: 0,
      bundler_count: 0,
      sniper_count: 0,
    } as GMGNTokenStats,
  };

  return {
    tokenInfo: syntheticTokenInfo,
    security: null,
    holders: [],
    traders: [],
    source: 'dexscreener' as const,
  };
}

export default gmgnService;
