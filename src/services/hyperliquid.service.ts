// Hyperliquid public info API client (read-only market data), via /api/hyperliquid.

export interface MarginTier {
  lowerBound: number; // notional USD lower bound for this tier
  maxLeverage: number;
}

export interface PerpMarket {
  coin: string;
  markPx: number;
  prevDayPx: number;
  change24hPct: number;
  funding: number; // hourly rate
  fundingAprPct: number;
  openInterestUsd: number;
  openInterest: number; // base units
  dayVolumeUsd: number;
  dayBaseVlm: number; // 24h volume in base units
  maxLeverage: number;
  oraclePx: number;
  midPx: number;
  premium: number; // mark vs oracle, fractional (e.g. -0.0006)
  impactPxs: [number, number] | null; // [impact bid, impact ask]
  szDecimals: number; // lot size = 10^-szDecimals
  marginTiers: MarginTier[];
}

export interface BookLevel {
  px: number;
  sz: number;
  n: number;
}

export interface L2Book {
  bids: BookLevel[];
  asks: BookLevel[];
}

interface HlAssetMeta {
  name: string;
  maxLeverage: number;
  szDecimals: number;
  marginTableId?: number;
  isDelisted?: boolean;
}

interface HlMarginTable {
  description: string;
  marginTiers: Array<{ lowerBound: string; maxLeverage: number }>;
}

interface HlMeta {
  universe: HlAssetMeta[];
  marginTables?: Array<[number, HlMarginTable]>;
}

interface HlAssetCtx {
  markPx: string;
  prevDayPx: string;
  funding: string;
  openInterest: string;
  dayNtlVlm: string;
  dayBaseVlm?: string;
  oraclePx?: string;
  midPx?: string;
  premium?: string | null;
  impactPxs?: [string, string] | null;
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

export async function fetchPerpMarkets(): Promise<PerpMarket[]> {
  const [meta, ctxs] = await info<[HlMeta, HlAssetCtx[]]>({
    type: "metaAndAssetCtxs",
  });

  const marginTables = new Map<number, MarginTier[]>();
  for (const [id, table] of meta.marginTables ?? []) {
    marginTables.set(
      id,
      table.marginTiers.map((t) => ({
        lowerBound: parseFloat(t.lowerBound) || 0,
        maxLeverage: t.maxLeverage,
      })),
    );
  }

  const markets: PerpMarket[] = [];
  meta.universe.forEach((u, i) => {
    const c = ctxs[i];
    if (!c || u.isDelisted) return;
    const markPx = parseFloat(c.markPx) || 0;
    const prevDayPx = parseFloat(c.prevDayPx) || 0;
    const funding = parseFloat(c.funding) || 0;
    const oi = parseFloat(c.openInterest) || 0;
    const dayVolumeUsd = parseFloat(c.dayNtlVlm) || 0;
    if (markPx <= 0) return;
    const impactBid = c.impactPxs ? parseFloat(c.impactPxs[0]) : NaN;
    const impactAsk = c.impactPxs ? parseFloat(c.impactPxs[1]) : NaN;
    markets.push({
      coin: u.name,
      markPx,
      prevDayPx,
      change24hPct: prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0,
      funding,
      fundingAprPct: funding * 24 * 365 * 100,
      openInterestUsd: oi * markPx,
      openInterest: oi,
      dayVolumeUsd,
      dayBaseVlm: c.dayBaseVlm ? parseFloat(c.dayBaseVlm) || 0 : 0,
      maxLeverage: u.maxLeverage,
      oraclePx: c.oraclePx ? parseFloat(c.oraclePx) || 0 : 0,
      midPx: c.midPx ? parseFloat(c.midPx) || 0 : 0,
      premium: c.premium ? parseFloat(c.premium) || 0 : 0,
      impactPxs:
        Number.isFinite(impactBid) && Number.isFinite(impactAsk)
          ? [impactBid, impactAsk]
          : null,
      szDecimals: u.szDecimals,
      marginTiers:
        (u.marginTableId !== undefined && marginTables.get(u.marginTableId)) || [],
    });
  });
  return markets;
}

export interface Candle {
  time: number; // unix seconds (open time)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PerpTrade {
  side: "B" | "A";
  px: number;
  sz: number;
  time: number; // ms
}

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

const LOOKBACK_MS: Record<CandleInterval, number> = {
  "1m": 6 * 3600_000,
  "5m": 24 * 3600_000,
  "15m": 3 * 86400_000,
  "1h": 7 * 86400_000,
  "4h": 30 * 86400_000,
  "1d": 180 * 86400_000,
};

export async function fetchCandles(coin: string, interval: CandleInterval): Promise<Candle[]> {
  const endTime = Date.now();
  const startTime = endTime - LOOKBACK_MS[interval];
  const raw = await info<Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>>({
    type: "candleSnapshot",
    req: { coin, interval, startTime, endTime },
  });
  return (raw || []).map((k) => ({
    time: Math.floor(k.t / 1000),
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
    volume: parseFloat(k.v),
  }));
}

export async function fetchRecentTrades(coin: string, limit = 30): Promise<PerpTrade[]> {
  const raw = await info<Array<{ side: "B" | "A"; px: string; sz: string; time: number }>>({
    type: "recentTrades",
    coin,
  });
  return (raw || [])
    .slice(0, limit)
    .map((t) => ({ side: t.side, px: parseFloat(t.px), sz: parseFloat(t.sz), time: t.time }));
}

// nSigFigs: 2–5 aggregates price levels (5 = finest grouping); omit for full precision.
// Hyperliquid returns at most 20 levels per side.
export async function fetchL2Book(coin: string, depth = 10, nSigFigs?: number): Promise<L2Book> {
  const body: Record<string, unknown> = { type: "l2Book", coin };
  if (nSigFigs !== undefined) body.nSigFigs = nSigFigs;
  const data = await info<{ levels: [Array<{ px: string; sz: string; n: number }>, Array<{ px: string; sz: string; n: number }>] }>(
    body,
  );
  const map = (l: { px: string; sz: string; n: number }): BookLevel => ({
    px: parseFloat(l.px),
    sz: parseFloat(l.sz),
    n: l.n,
  });
  return {
    bids: (data.levels?.[0] || []).slice(0, depth).map(map),
    asks: (data.levels?.[1] || []).slice(0, depth).map(map),
  };
}

// Coins currently at their open-interest cap (e.g. ["CANTO","FTM"]).
export async function fetchPerpsAtOiCap(): Promise<Set<string>> {
  const raw = await info<string[]>({ type: "perpsAtOpenInterestCap" });
  return new Set(raw || []);
}

// coin -> category (e.g. "crypto", "stocks", "commodities", "indices", "FX").
// NOTE: as of June 2026 the API only categorizes HIP-3 builder-dex assets
// (names like "flx:BTC", "km:NVDA"); main-universe coins (BTC, ETH, …) are
// absent. Returns whatever the API provides — do not invent categories.
export async function fetchPerpCategories(): Promise<Record<string, string>> {
  const raw = await info<Array<[string, string]>>({ type: "perpCategories" });
  const out: Record<string, string> = {};
  for (const [coin, category] of raw || []) out[coin] = category;
  return out;
}

export interface FundingHistoryPoint {
  time: number; // ms
  fundingRate: number; // hourly rate, fractional
  premium: number;
}

const FUNDING_LOOKBACK_MS = 7 * 86400_000;

export async function fetchFundingHistory(
  coin: string,
  startTime?: number,
  endTime?: number,
): Promise<FundingHistoryPoint[]> {
  const body: Record<string, unknown> = {
    type: "fundingHistory",
    coin,
    startTime: startTime ?? Date.now() - FUNDING_LOOKBACK_MS,
  };
  if (endTime !== undefined) body.endTime = endTime;
  const raw = await info<Array<{ coin: string; fundingRate: string; premium: string; time: number }>>(
    body,
  );
  return (raw || []).map((p) => ({
    time: p.time,
    fundingRate: parseFloat(p.fundingRate) || 0,
    premium: parseFloat(p.premium) || 0,
  }));
}

export interface PredictedVenueFunding {
  venue: string; // raw venue key, e.g. "HlPerp" | "BinPerp" | "BybitPerp"
  fundingRate: number; // fractional, per fundingIntervalHours
  nextFundingTime: number; // ms
  fundingIntervalHours: number;
}

export const FUNDING_VENUE_LABELS: Record<string, string> = {
  HlPerp: "HYPERLIQUID",
  BinPerp: "BINANCE",
  BybitPerp: "BYBIT",
};

// coin -> predicted next funding per venue. Venues without data are omitted.
export async function fetchPredictedFundings(): Promise<Record<string, PredictedVenueFunding[]>> {
  const raw = await info<
    Array<[
      string,
      Array<[
        string,
        { fundingRate: string; nextFundingTime: number; fundingIntervalHours?: number } | null,
      ]>,
    ]>
  >({ type: "predictedFundings" });

  const out: Record<string, PredictedVenueFunding[]> = {};
  for (const [coin, venues] of raw || []) {
    const list: PredictedVenueFunding[] = [];
    for (const [venue, data] of venues || []) {
      if (!data) continue;
      list.push({
        venue,
        fundingRate: parseFloat(data.fundingRate) || 0,
        nextFundingTime: data.nextFundingTime,
        fundingIntervalHours: data.fundingIntervalHours ?? 8,
      });
    }
    if (list.length) out[coin] = list;
  }
  return out;
}
