/**
 * Unified Token Service
 * Single source of truth for token data with automatic fallback
 * Priority: GMGN -> DexScreener
 */

import { gmgnService, type GMGNTrendingToken } from './gmgn.service';
import { dexScreenerService, type DexScreenerToken } from './dexscreener.service';

// Unified token type used across the app
export interface Token {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  logo?: string;
  source: 'gmgn' | 'dexscreener';
}

// Transform GMGN token to unified format
function fromGMGN(t: GMGNTrendingToken): Token {
  return {
    address: t.address,
    symbol: t.symbol || '???',
    name: t.name || 'Unknown',
    price: t.price || 0,
    priceChange24h: t.price_change_percent || 0,
    volume24h: t.volume || t.volume_24h || 0,
    marketCap: t.market_cap || 0,
    logo: t.logo,
    liquidity: 0,
    source: 'gmgn',
  };
}

// Transform DexScreener token to unified format
function fromDexScreener(t: DexScreenerToken): Token {
  return {
    address: t.address,
    symbol: t.symbol || '???',
    name: t.name || 'Unknown',
    price: t.price || 0,
    priceChange24h: t.priceChange24h || 0,
    volume24h: t.volume24h || 0,
    marketCap: t.marketCap || 0,
    logo: t.logo,
    liquidity: t.liquidity || 0,
    source: 'dexscreener',
  };
}

export const tokenService = {
  /**
   * Get trending tokens with automatic fallback
   */
  getTrending: async (timeframe = '1h'): Promise<Token[]> => {
    // Try GMGN first
    try {
      const gmgnData = await gmgnService.getTrending(timeframe);
      if (gmgnData?.rank && gmgnData.rank.length > 0) {
        console.log('[TokenService] Using GMGN data');
        return gmgnData.rank.map(fromGMGN);
      }
    } catch (e) {
      console.log('[TokenService] GMGN failed:', e);
    }

    // Fallback to DexScreener
    console.log('[TokenService] Falling back to DexScreener');
    try {
      const dexTokens = await dexScreenerService.getTrendingSolana();
      if (dexTokens.length > 0) {
        return dexTokens.map(fromDexScreener);
      }
    } catch (e) {
      console.log('[TokenService] DexScreener failed:', e);
    }

    return [];
  },

  /**
   * Get swap ranks (short timeframes)
   */
  getSwapRanks: async (timeframe = '1m', limit = 20): Promise<Token[]> => {
    try {
      const data = await gmgnService.getSwapRanks(timeframe, limit);
      if (data?.rank && data.rank.length > 0) {
        return data.rank.map(fromGMGN);
      }
    } catch {
      // Fall through to DexScreener
    }

    const dexTokens = await dexScreenerService.getTrendingSolana();
    return dexTokens.slice(0, limit).map(fromDexScreener);
  },

  /**
   * Search for tokens
   */
  search: async (query: string): Promise<Token[]> => {
    const results = await dexScreenerService.searchTokens(query);
    return results.map(fromDexScreener);
  },

  /**
   * Get token by address
   */
  getToken: async (address: string): Promise<Token | null> => {
    const result = await dexScreenerService.getTokenPairs(address);
    return result ? fromDexScreener(result) : null;
  },
};

export default tokenService;
