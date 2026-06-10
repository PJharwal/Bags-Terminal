/**
 * Pure-logic helpers for Polymarket events — tradability classification,
 * ranking, hot detection, adaptive polling cadence, and display formatting.
 *
 * Consumed by:
 *   - usePolymarketFeed (powering /prediction)
 *   - PredictionClient (cards, badges)
 *   - EventDetail / TradingSidebar (status-aware buy/sell guardrails)
 *
 * Keeping it in one file means every surface agrees about what "tradable"
 * means — change a constant here and every page updates.
 *
 * No React, no fetch — pure functions only.
 */

import type { PolyEvent, PolyMarket } from "@/services/polymarket.service";

// ─── Tunable thresholds ────────────────────────────────────────────────────

/**
 * Volume floor for "Active" status. Below this we consider the market thin
 * because the FOK at +5% slippage may not fill cleanly. Tuned for the free
 * Polymarket tier — bump higher if false positives slip through.
 */
export const ACTIVE_VOLUME_24HR = 5_000;

/**
 * Liquidity floor for "Active" status (when the API actually populates it —
 * Polymarket frequently reports liquidity: 0 even on busy markets, which is
 * why we use OR semantics with volume below).
 */
export const ACTIVE_LIQUIDITY = 1_000;

/**
 * Floor below which we consider a market completely cold. No trades, no pool.
 * Triggers the "No activity" badge and the confirmation step on buy.
 */
export const NO_ACTIVITY_VOLUME_24HR = 0;
export const NO_ACTIVITY_LIQUIDITY = 100;

// ─── Status taxonomy ───────────────────────────────────────────────────────

export type EventStatus = "closed" | "no-activity" | "thin" | "active";

export interface StatusMeta {
  label: string;
  /** Bags badge utility class for the status pill */
  badgeClass: string;
  /** One-line explanation shown in tooltips and warnings */
  description: string;
}

export const STATUS_META: Record<EventStatus, StatusMeta> = {
  closed: {
    label: "Closed",
    badgeClass: "badge badge-red",
    description: "This market has resolved and is no longer tradable.",
  },
  "no-activity": {
    label: "No activity",
    badgeClass: "badge badge-muted",
    description: "No recent trades. Your order may not fill.",
  },
  thin: {
    label: "Thin",
    badgeClass: "badge badge-yellow",
    description: "Limited liquidity — slippage may apply on large orders.",
  },
  active: {
    label: "Active",
    badgeClass: "badge badge-green",
    description: "Healthy book — orders should fill instantly at quoted price.",
  },
};

// ─── Status detection ──────────────────────────────────────────────────────

/**
 * Roll up event-level signals from the children when the event-level fields
 * are missing. Polymarket's Gamma API frequently reports `event.liquidity = 0`
 * and `event.volume24hr = 0` even when the child markets have $millions in
 * activity. When the parent is empty we synthesize stats from the children.
 */
function effectiveVolume24hr(event: PolyEvent): number {
  if (event.volume24hr && event.volume24hr > 0) return event.volume24hr;
  if (!event.markets || event.markets.length === 0) return 0;
  return event.markets.reduce((sum, m) => sum + (m.volume24hr ?? 0), 0);
}

function effectiveLiquidity(event: PolyEvent): number {
  if (event.liquidity && event.liquidity > 0) return event.liquidity;
  if (!event.markets || event.markets.length === 0) return 0;
  // Sum children's liquidity (parsed from string in PolyMarket)
  return event.markets.reduce((sum, m) => {
    const liq = parseFloat(m.liquidity ?? "0") || 0;
    return sum + liq;
  }, 0);
}

/**
 * Is this event past its end date or marked closed?
 *
 * Defensive against Polymarket's `closed=false` filter on the Gamma API not
 * always being honored — we re-check both the explicit flag and the date.
 */
export function isEventClosed(event: PolyEvent): boolean {
  // Explicit closed flag from API (when set, always honor it)
  // Note: PolyEvent doesn't carry `closed` directly; check the first market.
  const market = event.markets?.[0];
  if (market?.closed === true) return true;
  if (market && market.active === false) return true;
  // End date in the past
  if (event.endDate) {
    const end = new Date(event.endDate).getTime();
    if (Number.isFinite(end) && end < Date.now()) return true;
  }
  return false;
}

/**
 * Classify an event into one of the 4 status states.
 *
 * Order of checks matters:
 *   1. Closed wins over everything (a closed market with $1M volume is still closed)
 *   2. No-activity if both volume and liquidity are at floor
 *   3. Active if either volume OR liquidity passes the threshold
 *   4. Thin otherwise (the in-between band)
 */
export function getEventStatus(event: PolyEvent): EventStatus {
  if (isEventClosed(event)) return "closed";

  const volume = effectiveVolume24hr(event);
  const liquidity = effectiveLiquidity(event);

  if (volume <= NO_ACTIVITY_VOLUME_24HR && liquidity <= NO_ACTIVITY_LIQUIDITY) {
    return "no-activity";
  }

  if (volume >= ACTIVE_VOLUME_24HR || liquidity >= ACTIVE_LIQUIDITY) {
    return "active";
  }

  return "thin";
}

/**
 * Same status but for a single market (used by TradingSidebar where the user
 * has selected one specific market within an event). Falls back to event-level
 * status when market-level data is sparse.
 */
export function getMarketStatus(
  market: PolyMarket | undefined,
  event?: PolyEvent,
): EventStatus {
  if (!market) return event ? getEventStatus(event) : "no-activity";
  if (market.closed === true) return "closed";
  if (market.active === false) return "closed";
  if (market.endDate) {
    const end = new Date(market.endDate).getTime();
    if (Number.isFinite(end) && end < Date.now()) return "closed";
  }

  const volume = market.volume24hr ?? 0;
  const liquidity = parseFloat(market.liquidity ?? "0") || 0;

  if (volume <= NO_ACTIVITY_VOLUME_24HR && liquidity <= NO_ACTIVITY_LIQUIDITY) {
    return "no-activity";
  }
  if (volume >= ACTIVE_VOLUME_24HR || liquidity >= ACTIVE_LIQUIDITY) {
    return "active";
  }
  return "thin";
}

// ─── Ranking ───────────────────────────────────────────────────────────────

/**
 * Composite tradability score: rewards both depth AND current activity, with
 * log-scaled liquidity so a single deep-but-stale market can't dominate.
 *
 *   score = volume24hr × log10(liquidity + 100)
 *
 * The `+100` (rather than +10) prevents `log10(0) = -∞` from zeroing out
 * markets that have real volume but missing liquidity data.
 */
export function tradabilityScore(event: PolyEvent): number {
  const volume = effectiveVolume24hr(event);
  const liquidity = effectiveLiquidity(event);
  return volume * Math.log10(liquidity + 100);
}

/**
 * Stable sort comparator that puts the most-tradable events first AND sinks
 * closed markets to the bottom regardless of their historical volume.
 */
export function compareEventsByTradability(a: PolyEvent, b: PolyEvent): number {
  const aClosed = isEventClosed(a);
  const bClosed = isEventClosed(b);

  // Closed always loses, even if it has more volume
  if (aClosed !== bClosed) return aClosed ? 1 : -1;

  return tradabilityScore(b) - tradabilityScore(a);
}

// ─── Hot detection ─────────────────────────────────────────────────────────

/**
 * Mark the top N% of events as "hot" so they get special visual treatment.
 * Returns a Set of event IDs that should display the hot flair.
 *
 * Hot is only applied to "active" events — a thin or closed market never
 * becomes hot regardless of its absolute score.
 */
export function computeHotEventIds(
  events: PolyEvent[],
  topPercent = 0.05,
): Set<string> {
  const active = events.filter((e) => getEventStatus(e) === "active");
  if (active.length === 0) return new Set();

  // Take top N% by score, minimum 1
  const count = Math.max(1, Math.ceil(active.length * topPercent));
  const sorted = [...active].sort(
    (a, b) => tradabilityScore(b) - tradabilityScore(a),
  );
  return new Set(sorted.slice(0, count).map((e) => e.id));
}

// ─── Adaptive polling cadence ──────────────────────────────────────────────

/**
 * The poll interval the feed should use right now. Drops to 5s if any event
 * is ending in the next 5 minutes (e.g. BTC 5-min markets), otherwise stays
 * at the default 20s to avoid hammering Polymarket's free API tier.
 */
export const FAST_POLL_MS = 5_000;
export const NORMAL_POLL_MS = 20_000;
export const FAST_POLL_THRESHOLD_MS = 5 * 60_000; // events ending in <5min trigger fast mode

export function getPollInterval(events: PolyEvent[]): number {
  const now = Date.now();
  for (const event of events) {
    if (!event.endDate) continue;
    const end = new Date(event.endDate).getTime();
    if (!Number.isFinite(end)) continue;
    const remaining = end - now;
    if (remaining > 0 && remaining < FAST_POLL_THRESHOLD_MS) {
      return FAST_POLL_MS;
    }
  }
  return NORMAL_POLL_MS;
}

// ─── Display formatting ────────────────────────────────────────────────────

export function formatVolume(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

export function formatTimeLeft(endDate: string): string {
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return ""; // missing/invalid end date — show nothing, not "NaNm"
  const diff = end - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m left`;
}

export function formatConsensus(
  outcomePrices: string[] | null | undefined,
): string {
  if (!outcomePrices?.length) return "50%";
  const first = outcomePrices[0];
  if (first == null) return "50%";
  const yes = Math.round(parseFloat(first) * 100);
  return Number.isFinite(yes) ? `${yes}%` : "50%";
}

// ─── Market field helpers (shared by detail components) ────────────────────

/**
 * Defensive parse — the backend can hand back JSON strings or real arrays
 * for outcomes/outcomePrices/clobTokenIds depending on the upstream shape.
 */
export function parseJsonOrArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

export function getOutcomePrices(market: PolyMarket): [number, number] {
  const prices = parseJsonOrArray(market.outcomePrices);
  return [parseFloat(String(prices[0])) || 0, parseFloat(String(prices[1])) || 0];
}

/**
 * Display labels for the two sides of a market — read directly from
 * market.outcomes (Polymarket already labels each side correctly per market;
 * binary markets get ["Yes", "No"], sports get team names, etc).
 * Falls back to ["Yes", "No"] if the field is missing.
 */
export function getOutcomeLabels(market: PolyMarket): [string, string] {
  const labels = parseJsonOrArray(market.outcomes);
  return [
    labels[0] ? String(labels[0]) : "Yes",
    labels[1] ? String(labels[1]) : "No",
  ];
}

export function getTokenIds(market: PolyMarket): [string, string] {
  const ids = parseJsonOrArray(market.clobTokenIds);
  return [String(ids[0] || ""), String(ids[1] || "")];
}
