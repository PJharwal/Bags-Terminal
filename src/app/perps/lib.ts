// Perps-page data layer extensions. Read-only Hyperliquid public info API —
// every request goes through the whitelisted /api/hyperliquid proxy.

export interface MarginTier {
  lowerBound: number; // notional USD
  maxLeverage: number;
}

export interface PerpMarketEx {
  coin: string;
  markPx: number;
  oraclePx: number;
  midPx: number;
  prevDayPx: number;
  change24hPct: number;
  premium: number; // mark vs oracle, fraction
  impactBid: number;
  impactAsk: number;
  funding: number; // hourly rate, fraction
  fundingAprPct: number;
  openInterestBase: number;
  openInterestUsd: number;
  dayVolumeUsd: number;
  dayBaseVlm: number;
  maxLeverage: number;
  szDecimals: number;
  marginTiers: MarginTier[];
}

export interface GroupedBookLevel {
  px: number;
  sz: number;
  n: number;
}

export interface GroupedBook {
  bids: GroupedBookLevel[];
  asks: GroupedBookLevel[];
}

export interface FundingPoint {
  time: number; // ms
  rate: number; // hourly rate, fraction
}

export interface PredictedVenueFunding {
  venue: string;
  rate: number; // per-interval rate, fraction
  intervalHours: number;
  nextFundingTime: number;
}

async function info<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/hyperliquid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid request failed (${res.status})`);
  return res.json();
}

interface HlAssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  marginTableId?: number;
  isDelisted?: boolean;
}

interface HlMarginTable {
  marginTiers: Array<{ lowerBound: string; maxLeverage: number }>;
}

interface HlAssetCtxEx {
  markPx: string;
  prevDayPx: string;
  funding: string;
  openInterest: string;
  dayNtlVlm: string;
  premium: string | null;
  oraclePx: string;
  midPx: string | null;
  impactPxs: [string, string] | null;
  dayBaseVlm: string;
}

export async function fetchPerpMarketsEx(): Promise<PerpMarketEx[]> {
  const [meta, ctxs] = await info<
    [{ universe: HlAssetMeta[]; marginTables?: Array<[number, HlMarginTable]> }, HlAssetCtxEx[]]
  >({ type: "metaAndAssetCtxs" });

  const tables = new Map<number, MarginTier[]>();
  for (const [id, t] of meta.marginTables || []) {
    tables.set(
      id,
      (t.marginTiers || []).map((tier) => ({
        lowerBound: parseFloat(tier.lowerBound) || 0,
        maxLeverage: tier.maxLeverage,
      })),
    );
  }

  const markets: PerpMarketEx[] = [];
  meta.universe.forEach((u, i) => {
    const c = ctxs[i];
    if (!c || u.isDelisted) return;
    const markPx = parseFloat(c.markPx) || 0;
    if (markPx <= 0) return;
    const prevDayPx = parseFloat(c.prevDayPx) || 0;
    const funding = parseFloat(c.funding) || 0;
    const oiBase = parseFloat(c.openInterest) || 0;
    markets.push({
      coin: u.name,
      markPx,
      oraclePx: parseFloat(c.oraclePx) || 0,
      midPx: parseFloat(c.midPx || "") || 0,
      prevDayPx,
      change24hPct: prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0,
      premium: parseFloat(c.premium || "") || 0,
      impactBid: c.impactPxs ? parseFloat(c.impactPxs[0]) || 0 : 0,
      impactAsk: c.impactPxs ? parseFloat(c.impactPxs[1]) || 0 : 0,
      funding,
      fundingAprPct: funding * 24 * 365 * 100,
      openInterestBase: oiBase,
      openInterestUsd: oiBase * markPx,
      dayVolumeUsd: parseFloat(c.dayNtlVlm) || 0,
      dayBaseVlm: parseFloat(c.dayBaseVlm) || 0,
      maxLeverage: u.maxLeverage,
      szDecimals: u.szDecimals ?? 0,
      marginTiers:
        (u.marginTableId !== undefined && tables.get(u.marginTableId)) || [
          { lowerBound: 0, maxLeverage: u.maxLeverage },
        ],
    });
  });
  return markets;
}

// l2Book with optional server-side tick grouping (nSigFigs 2–5; null = full precision).
export async function fetchL2BookGrouped(coin: string, nSigFigs: number | null): Promise<GroupedBook> {
  const body: Record<string, unknown> = { type: "l2Book", coin };
  if (nSigFigs !== null) body.nSigFigs = nSigFigs;
  const data = await info<{
    levels: [Array<{ px: string; sz: string; n: number }>, Array<{ px: string; sz: string; n: number }>];
  }>(body);
  const map = (l: { px: string; sz: string; n: number }): GroupedBookLevel => ({
    px: parseFloat(l.px),
    sz: parseFloat(l.sz),
    n: l.n,
  });
  return {
    bids: (data.levels?.[0] || []).map(map),
    asks: (data.levels?.[1] || []).map(map),
  };
}

export async function fetchFundingHistory(coin: string, startTime: number): Promise<FundingPoint[]> {
  const raw = await info<Array<{ fundingRate: string; time: number }>>({
    type: "fundingHistory",
    coin,
    startTime,
  });
  return (raw || [])
    .map((r) => ({ time: r.time, rate: parseFloat(r.fundingRate) || 0 }))
    .sort((a, b) => a.time - b.time);
}

const VENUE_NAMES: Record<string, string> = {
  HlPerp: "HYPERLIQUID",
  BinPerp: "BINANCE",
  BybitPerp: "BYBIT",
};

export async function fetchPredictedFundings(): Promise<Map<string, PredictedVenueFunding[]>> {
  const raw = await info<
    Array<[string, Array<[string, { fundingRate: string; nextFundingTime: number; fundingIntervalHours?: number } | null]>]>
  >({ type: "predictedFundings" });
  const out = new Map<string, PredictedVenueFunding[]>();
  for (const [coin, venues] of raw || []) {
    const list: PredictedVenueFunding[] = [];
    for (const [venue, v] of venues || []) {
      if (!v) continue;
      list.push({
        venue: VENUE_NAMES[venue] || venue,
        rate: parseFloat(v.fundingRate) || 0,
        intervalHours: v.fundingIntervalHours ?? 8,
        nextFundingTime: v.nextFundingTime,
      });
    }
    if (list.length) out.set(coin, list);
  }
  return out;
}

export async function fetchOiCapCoins(): Promise<Set<string>> {
  const raw = await info<string[]>({ type: "perpsAtOpenInterestCap" });
  return new Set(raw || []);
}

/* ------------------------------ Formatting ----------------------------- */

export function fmtPx(px: number): string {
  if (!isFinite(px)) return "—";
  if (px >= 1000) return px.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (px >= 1) return px.toFixed(3);
  if (px >= 0.001) return px.toFixed(5);
  return px.toPrecision(3);
}

export function fmtSz(sz: number, szDecimals = 3): string {
  return sz.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(szDecimals, 4),
    maximumFractionDigits: Math.min(szDecimals, 4),
  });
}

// Tick size produced by an nSigFigs grouping at a given price.
export function tickForSigFigs(px: number, nSigFigs: number): number {
  if (px <= 0) return 0;
  return Math.pow(10, Math.floor(Math.log10(px)) - nSigFigs + 1);
}

export function fmtTick(tick: number): string {
  if (tick >= 1) return tick.toLocaleString();
  return tick.toFixed(Math.max(0, -Math.floor(Math.log10(tick))));
}

/* --------------------------- Market categories -------------------------- */
// Hyperliquid's perpCategories info type only annotates builder-dex assets, so
// main-dex markets get a small curated category map (metadata curation, not
// market data). Unknown coins simply only appear under ALL.

export const CATEGORY_LIST = ["AI", "MEME", "L1", "L2", "DEFI"] as const;
export type MarketCategory = (typeof CATEGORY_LIST)[number];

const CAT: Record<MarketCategory, string[]> = {
  AI: [
    "TAO", "FET", "RENDER", "WLD", "AI16Z", "AIXBT", "VIRTUAL", "GRASS", "IO",
    "PROMPT", "KAITO", "ARC", "SWARMS", "GRIFFAIN", "ZEREBRO", "AI", "ANIME",
  ],
  MEME: [
    "DOGE", "WIF", "kPEPE", "kSHIB", "kBONK", "kFLOKI", "kNEIRO", "kDOGS",
    "POPCAT", "MEW", "BRETT", "MOODENG", "PNUT", "GOAT", "FARTCOIN", "TRUMP",
    "MELANIA", "SPX", "PURR", "BOME", "MEME", "TURBO", "CHILLGUY", "HIPPO",
    "PENGU", "MOG", "SLERF", "MYRO", "WOJAK", "BAN",
  ],
  L1: [
    "BTC", "ETH", "SOL", "BNB", "AVAX", "ADA", "DOT", "ATOM", "NEAR", "APT",
    "SUI", "SEI", "TIA", "TON", "TRX", "INJ", "KAS", "HBAR", "ALGO", "ICP",
    "HYPE", "S", "BERA", "XRP", "LTC", "BCH", "ETC", "XLM", "MOVE", "FTM",
    "EGLD", "MINA", "CELO", "ZEN", "NTRN", "DYM", "SAGA",
  ],
  L2: [
    "ARB", "OP", "STRK", "ZK", "BLAST", "MANTA", "MNT", "POL", "MATIC", "IMX",
    "METIS", "SCR", "TAIKO", "LINEA", "ZRO", "BASE",
  ],
  DEFI: [
    "UNI", "AAVE", "LINK", "MKR", "CRV", "LDO", "SNX", "COMP", "SUSHI", "GMX",
    "DYDX", "JUP", "RAY", "PENDLE", "ENA", "ETHFI", "EIGEN", "MORPHO", "AERO",
    "CAKE", "RUNE", "JTO", "KMNO", "ONDO", "USUAL", "1INCH", "BAL", "YFI",
    "STG", "FXS", "LISTA", "RDNT", "VELO",
  ],
};

export const COIN_CATEGORY: Record<string, MarketCategory> = {};
for (const cat of CATEGORY_LIST) for (const c of CAT[cat]) COIN_CATEGORY[c] = cat;
