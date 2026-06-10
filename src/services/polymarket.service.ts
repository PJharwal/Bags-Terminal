// omnera-polymarket REST API client (Rust backend, default http://localhost:4001),
// via config.polyBackendUrl. Trading (buy/sell/quote) flows over Socket.IO — see
// src/hooks/usePolymarketTrade.ts.

import { config } from "@/config/env";

// ── Types (matching the backend poly contract) ─────────────────────────────

export interface PolyTag {
  id: number;
  label: string;
  slug?: string;
}

export interface PolyMarket {
  id: string;
  conditionId: string;
  question: string;
  slug: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[];
  volume: string;
  volume24hr: number;
  liquidity: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  category: string;
  tags: PolyTag[];
}

export interface PolyEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  markets: PolyMarket[];
  tags: PolyTag[];
  icon?: string;
}

export interface PolyPosition {
  conditionId: string;
  asset: string;
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  curPrice: number;
  redeemable: boolean;
}

/** Price history point — t = unix seconds, p = probability 0–1 */
export interface PricePoint {
  t: number;
  p: number;
}

export interface PolyPositionsResponse {
  evm_address: string;
  positions: PolyPosition[];
}

export interface PolyWalletResponse {
  evm_address: string;
  private_key: string;
}

// ── Parsing ────────────────────────────────────────────────────────────────

/**
 * Parse Gamma API raw event into typed PolyEvent.
 *
 * Defensive: the backend can return outcomes/outcomePrices/clobTokenIds as
 * JSON strings OR arrays depending on the upstream response — handle both.
 */
export function parseEvent(raw: Record<string, unknown>): PolyEvent {
  const markets: PolyMarket[] = Array.isArray(raw.markets)
    ? (raw.markets as Record<string, unknown>[]).map((m) => {
        let outcomes: string[] = [];
        if (typeof m.outcomes === "string") {
          try { outcomes = JSON.parse(m.outcomes); } catch { outcomes = []; }
        } else if (Array.isArray(m.outcomes)) {
          outcomes = m.outcomes as string[];
        }

        let outcomePrices: string[] = [];
        if (typeof m.outcomePrices === "string") {
          try { outcomePrices = JSON.parse(m.outcomePrices); } catch { outcomePrices = []; }
        } else if (Array.isArray(m.outcomePrices)) {
          outcomePrices = (m.outcomePrices as unknown[]).map(String);
        }

        let clobTokenIds: string[] = [];
        if (typeof m.clobTokenIds === "string") {
          try { clobTokenIds = JSON.parse(m.clobTokenIds); } catch { clobTokenIds = []; }
        } else if (Array.isArray(m.clobTokenIds)) {
          clobTokenIds = m.clobTokenIds as string[];
        }

        return {
          id: String(m.id ?? ""),
          conditionId: String(m.conditionId ?? ""),
          question: String(m.question ?? ""),
          slug: String(m.slug ?? ""),
          outcomes,
          outcomePrices,
          clobTokenIds,
          volume: String(m.volume ?? "0"),
          volume24hr: Number(m.volume24hr ?? 0),
          liquidity: String(m.liquidity ?? "0"),
          endDate: String(m.endDate ?? ""),
          active: Boolean(m.active),
          closed: Boolean(m.closed),
          category: String(m.category ?? ""),
          tags: Array.isArray(m.tags)
            ? (m.tags as Record<string, unknown>[]).map((t) => ({
                id: Number(t.id ?? 0),
                label: String(t.label ?? ""),
                slug: t.slug ? String(t.slug) : undefined,
              }))
            : [],
        };
      })
    : [];

  const tags: PolyTag[] = Array.isArray(raw.tags)
    ? (raw.tags as Record<string, unknown>[]).map((t) => ({
        id: Number(t.id ?? 0),
        label: String(t.label ?? ""),
        slug: t.slug ? String(t.slug) : undefined,
      }))
    : [];

  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    slug: String(raw.slug ?? ""),
    description: String(raw.description ?? ""),
    startDate: String(raw.startDate ?? ""),
    endDate: String(raw.endDate ?? ""),
    volume: Number(raw.volume ?? 0),
    volume24hr: Number(raw.volume24hr ?? 0),
    liquidity: Number(raw.liquidity ?? 0),
    markets,
    tags,
    icon: String(raw.icon ?? raw.image ?? ""),
  };
}

// ── Fetchers ───────────────────────────────────────────────────────────────

const BASE = () => config.polyBackendUrl;

/** GET /api/polymarket/events — live event feed (15s server cache) */
export async function fetchPolyEvents(opts?: {
  limit?: number;
  offset?: number;
  tag?: string;
}): Promise<PolyEvent[]> {
  const params = new URLSearchParams();
  params.set("limit", String(opts?.limit ?? 100));
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset));
  if (opts?.tag) params.set("tag", opts.tag);
  const res = await fetch(`${BASE()}/api/polymarket/events?${params}`);
  if (!res.ok) throw new Error(`Polymarket events request failed (${res.status})`);
  const json = await res.json();
  const rawEvents = json.events ?? json;
  return Array.isArray(rawEvents) ? rawEvents.map(parseEvent) : [];
}

/** GET /api/polymarket/search?q= */
export async function searchPolyEvents(q: string): Promise<PolyEvent[]> {
  const res = await fetch(
    `${BASE()}/api/polymarket/search?q=${encodeURIComponent(q)}`,
  );
  if (!res.ok) throw new Error(`Polymarket search request failed (${res.status})`);
  const json = await res.json();
  const rawEvents = json.events ?? json;
  return Array.isArray(rawEvents) ? rawEvents.map(parseEvent) : [];
}

/** GET /api/polymarket/event/:slug */
export async function fetchPolyEvent(slug: string): Promise<PolyEvent | null> {
  const res = await fetch(
    `${BASE()}/api/polymarket/event/${encodeURIComponent(slug)}`,
  );
  if (!res.ok) throw new Error(`Polymarket event request failed (${res.status})`);
  const json = await res.json();
  const raw = json.event ?? json;
  return raw ? parseEvent(raw as Record<string, unknown>) : null;
}

/** GET /api/polymarket/tags */
export async function fetchPolyTags(): Promise<PolyTag[]> {
  const res = await fetch(`${BASE()}/api/polymarket/tags`);
  if (!res.ok) throw new Error(`Polymarket tags request failed (${res.status})`);
  const json = await res.json();
  const raw = json.tags ?? json;
  return Array.isArray(raw)
    ? (raw as Record<string, unknown>[]).map((t) => ({
        id: Number(t.id ?? 0),
        label: String(t.label ?? ""),
        slug: t.slug ? String(t.slug) : undefined,
      }))
    : [];
}

/**
 * GET /api/polymarket/price-history?market=<clobTokenId>&interval&fidelity
 * interval values: 1h / 6h / 1d / 1w / 1m / max
 */
export async function fetchPriceHistory(
  tokenId: string,
  interval = "1d",
  fidelity = 60,
): Promise<PricePoint[]> {
  const res = await fetch(
    `${BASE()}/api/polymarket/price-history?market=${encodeURIComponent(tokenId)}&interval=${interval}&fidelity=${fidelity}`,
  );
  if (!res.ok) throw new Error(`Polymarket price-history request failed (${res.status})`);
  const json = await res.json();
  return ((json.history ?? []) as Array<{ t: number; p: number }>).map(
    (pt) => ({ t: Number(pt.t), p: Number(pt.p) }),
  );
}

/** GET /api/polymarket/positions/:phantom_address */
export async function fetchPolyPositions(
  phantomAddress: string,
): Promise<PolyPositionsResponse> {
  const res = await fetch(
    `${BASE()}/api/polymarket/positions/${encodeURIComponent(phantomAddress)}`,
  );
  if (!res.ok) throw new Error(`Polymarket positions request failed (${res.status})`);
  const json = await res.json();
  return {
    evm_address: String(json.evm_address ?? ""),
    positions: Array.isArray(json.positions) ? json.positions : [],
  };
}

/**
 * GET /api/polymarket/wallet/:phantom_address
 *
 * SECURITY: returns the raw EVM private key. Service function only — must
 * NEVER be imported by UI components or rendered anywhere (D-07).
 */
export async function fetchPolyWallet(
  phantomAddress: string,
): Promise<PolyWalletResponse> {
  const res = await fetch(
    `${BASE()}/api/polymarket/wallet/${encodeURIComponent(phantomAddress)}`,
  );
  if (!res.ok) throw new Error(`Polymarket wallet request failed (${res.status})`);
  return res.json();
}

/** POST /api/polymarket/recover/:phantom_address — recover stranded Polygon USDC */
export async function recoverPolyFunds(
  phantomAddress: string,
): Promise<unknown> {
  const res = await fetch(
    `${BASE()}/api/polymarket/recover/${encodeURIComponent(phantomAddress)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Polymarket recover request failed (${res.status})`);
  return res.json();
}
