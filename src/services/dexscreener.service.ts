/**
 * DexScreener API Service
 * Free public API for Solana token data - used as fallback when GMGN is not available
 * Docs: https://docs.dexscreener.com/api/reference
 */

// Use the Next.js API proxy to avoid CORS issues
const DEXSCREENER_BASE = '/api/dexscreener';

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

export interface DexScreenerToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  logo?: string;
  pairAddress: string;
  createdAt?: number;
}

// Transform DexScreener pair to our token format
function transformPair(pair: DexScreenerPair): DexScreenerToken {
  return {
    address: pair.baseToken.address,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    price: parseFloat(pair.priceUsd) || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    volume24h: pair.volume?.h24 || 0,
    marketCap: pair.marketCap || pair.fdv || 0,
    liquidity: pair.liquidity?.usd || 0,
    logo: pair.info?.imageUrl,
    pairAddress: pair.pairAddress,
    createdAt: pair.pairCreatedAt,
  };
}

// Helper to fetch from DexScreener
async function fetchDexScreener<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${DEXSCREENER_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`DexScreener fetch error:`, error);
    return null;
  }
}

export const dexScreenerService = {
  /**
   * Get latest token profiles (boosted/trending tokens)
   */
  getLatestProfiles: async (): Promise<DexScreenerToken[]> => {
    const data = await fetchDexScreener<DexScreenerPair[]>('/token-profiles/latest/v1');
    if (!data) return [];
    // Filter for Solana only
    return data
      .filter(p => p.chainId === 'solana')
      .map(transformPair)
      .slice(0, 50);
  },

  /**
   * Get boosted tokens (promoted tokens)
   */
  getBoostedTokens: async (): Promise<DexScreenerToken[]> => {
    const data = await fetchDexScreener<DexScreenerPair[]>('/token-boosts/latest/v1');
    if (!data) return [];
    return data
      .filter(p => p.chainId === 'solana')
      .map(transformPair)
      .slice(0, 50);
  },

  /**
   * Search for tokens by query
   */
  searchTokens: async (query: string): Promise<DexScreenerToken[]> => {
    const data = await fetchDexScreener<{ pairs: DexScreenerPair[] }>(`/latest/dex/search?q=${encodeURIComponent(query)}`);
    if (!data?.pairs) return [];
    return data.pairs
      .filter(p => p.chainId === 'solana')
      .map(transformPair);
  },

  /**
   * Get token pairs by address
   */
  getTokenPairs: async (address: string): Promise<DexScreenerToken | null> => {
    const data = await fetchDexScreener<{ pairs: DexScreenerPair[] }>(`/latest/dex/tokens/${address}`);
    if (!data?.pairs || data.pairs.length === 0) return null;
    // Return the pair with highest liquidity
    const solanaPairs = data.pairs.filter(p => p.chainId === 'solana');
    if (solanaPairs.length === 0) return null;
    const bestPair = solanaPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    return transformPair(bestPair);
  },

  /**
   * Get new/trending pairs on Solana
   * Uses search API as the pairs listing endpoint isn't available
   */
  getNewSolanaPairs: async (): Promise<DexScreenerToken[]> => {
    // Search for meme coin terms that often represent new launches
    const searches = ['pump', 'pepe', 'doge', 'cat', 'ai', 'trump'];
    const results: DexScreenerToken[] = [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const query of searches) {
      try {
        const data = await fetchDexScreener<{ pairs: DexScreenerPair[] }>(`/latest/dex/search?q=${query}`);
        if (data?.pairs) {
          const recentPairs = data.pairs
            .filter(p => p.chainId === 'solana' && p.pairCreatedAt && p.pairCreatedAt > oneDayAgo)
            .slice(0, 10)
            .map(transformPair);
          results.push(...recentPairs);
        }
      } catch {
        // Continue with other searches
      }
    }

    // Deduplicate by address and sort by volume
    const unique = Array.from(
      new Map(results.map(t => [t.address, t])).values()
    );

    return unique
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, 50);
  },

  /**
   * Get trending/top Solana tokens by searching popular tokens
   */
  getTrendingSolana: async (): Promise<DexScreenerToken[]> => {
    // Search for multiple popular tokens in parallel
    const searches = ['BONK', 'WIF', 'JUP', 'PEPE', 'TRUMP', 'AI'];

    const searchPromises = searches.map(query =>
      fetchDexScreener<{ pairs: DexScreenerPair[] }>(`/latest/dex/search?q=${query}`)
        .catch(() => null)
    );

    const results = await Promise.all(searchPromises);
    const allPairs: DexScreenerToken[] = [];

    for (const data of results) {
      if (data?.pairs) {
        const solanaPairs = data.pairs
          .filter(p => p.chainId === 'solana')
          .slice(0, 8)
          .map(transformPair);
        allPairs.push(...solanaPairs);
      }
    }

    // Deduplicate by address and sort by volume
    const unique = Array.from(
      new Map(allPairs.map(t => [t.address, t])).values()
    );

    return unique
      .filter(t => t.marketCap > 10000 && t.volume24h > 1000)
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 50);
  },
};

export default dexScreenerService;
