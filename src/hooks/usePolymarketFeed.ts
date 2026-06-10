"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchPolyEvents, type PolyEvent } from "@/services/polymarket.service";
import {
  compareEventsByTradability,
  getPollInterval,
  NORMAL_POLL_MS,
} from "@/lib/polymarket";

/**
 * Live Polymarket event feed with adaptive polling.
 *
 * - Sorts by composite tradability (closed events sink to the bottom).
 * - Polls every 20s normally, dropping to 5s when any visible event ends in
 *   <5 minutes (e.g. BTC 5-min markets) so we never show a resolved market.
 * - Caches each event in sessionStorage (`poly_event_${slug}`) so the detail
 *   page at /prediction/[slug] paints instantly on card click.
 */
export function usePolymarketFeed() {
  const [events, setEvents] = useState<PolyEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  // Ref mirror of events so the polling timer callback can read the latest
  // state without resubscribing on every render (which would reset the
  // interval and prevent fast-mode from ever activating).
  const eventsRef = useRef<PolyEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch a larger pool so we have meaningful headroom to rank
      const parsed = (await fetchPolyEvents({ limit: 100 })).sort(
        compareEventsByTradability,
      );

      // No filtering — display all markets and badge them by status.
      // The shared comparator sinks closed markets to the bottom and
      // ranks the rest by composite tradability (volume × log liquidity),
      // so BTC 5-min markets and other high-volume events surface first.
      eventsRef.current = parsed;
      setEvents(parsed);
      setConnected(true);
      // Cache events by slug for instant detail page load
      try {
        for (const e of parsed) {
          sessionStorage.setItem(`poly_event_${e.slug}`, JSON.stringify(e));
        }
      } catch { /* quota exceeded — ignore */ }
    } catch {
      setConnected(false);
    }
  }, []);

  // Adaptive polling — when any visible event is ending in <5 min (e.g.
  // BTC 5-min markets), drop the interval from 20s to 5s so we don't show
  // a market that has already resolved. Reverts to the slow cadence as
  // soon as the short-duration markets cycle out, sparing API budget.
  // We read the latest events via eventsRef to avoid stale-closure bugs.
  useEffect(() => {
    fetchEvents();
    let currentInterval = NORMAL_POLL_MS;
    const startTimer = (interval: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(async () => {
        await fetchEvents();
        const desired = getPollInterval(eventsRef.current);
        if (desired !== currentInterval) {
          currentInterval = desired;
          startTimer(desired);
        }
      }, interval);
    };
    startTimer(currentInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchEvents]);

  return { events, connected, totalCount: events.length };
}
