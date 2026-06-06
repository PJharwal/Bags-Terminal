export interface TimeframeMetrics {
  buys: number;
  sells: number;
  volume_sol: number;
  unique_kols: number;
}

export interface KolHolder {
  wallet: string;
  name: string;
  twitter?: string;
  image_url?: string;
  rank?: number;
  holding: number;
  last_action: 'buy' | 'sell';
  last_action_time: number;
  total_bought_sol: number;
  total_sold_sol: number;
}

export interface KolTrendingToken {
  mint: string;
  name?: string;
  symbol?: string;
  logo_url?: string;
  created_at: number;
  token_age_minutes: number;
  price_sol: number;
  market_cap_usd: number;
  kol_metrics: {
    '5m': TimeframeMetrics;
    '1h': TimeframeMetrics;
    '6h': TimeframeMetrics;
    '24h': TimeframeMetrics;
  };
  current_holders: {
    kol_count: number;
    kol_percent: number;
  };
  kols: KolHolder[];
}

export interface KolsApiResponse {
  timeframe: string;
  sort: string;
  count: number;
  tokens: KolTrendingToken[];
}

// Enhanced KOL Token for UI
export interface EnhancedKolToken {
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  createdAt: number;
  tokenAgeMinutes: number;
  price: number;
  marketCap: number;
  kolMetrics: {
    '5m': TimeframeMetrics;
    '1h': TimeframeMetrics;
    '6h': TimeframeMetrics;
    '24h': TimeframeMetrics;
  };
  kolCount: number;
  kolPercent: number;
  kols: KolHolder[];
}
