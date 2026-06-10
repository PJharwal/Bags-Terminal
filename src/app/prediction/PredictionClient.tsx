"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  fetchPolyEvents,
  fetchPolyTags,
  searchPolyEvents,
  type PolyEvent,
  type PolyTag,
} from "@/services/polymarket.service";
import {
  compareEventsByTradability,
  computeHotEventIds,
} from "@/lib/polymarket";
import { usePolymarketFeed } from "@/hooks/usePolymarketFeed";
import { EventCard, SkeletonCard } from "./EventCard";

const SEARCH_DEBOUNCE_MS = 300;

/** Cache events by slug so /prediction/[slug] paints instantly on click. */
function cacheEvents(events: PolyEvent[]) {
  try {
    for (const e of events) {
      sessionStorage.setItem(`poly_event_${e.slug}`, JSON.stringify(e));
    }
  } catch { /* quota exceeded — ignore */ }
}

export default function PredictionClient() {
  const { events: feedEvents, connected, totalCount } = usePolymarketFeed();

  // Honest unreachable state: if the prediction backend hasn't delivered
  // anything after a grace period, say so instead of skeleton-ing forever.
  const [backendTimedOut, setBackendTimedOut] = useState(false);
  useEffect(() => {
    if (connected || feedEvents.length > 0) {
      setBackendTimedOut(false);
      return;
    }
    const t = setTimeout(() => setBackendTimedOut(true), 12_000);
    return () => clearTimeout(t);
  }, [connected, feedEvents.length]);

  // ── Search (debounced) ──
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PolyEvent[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchSeq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      try {
        const results = (await searchPolyEvents(q)).sort(compareEventsByTradability);
        if (seq !== searchSeq.current) return; // stale response
        cacheEvents(results);
        setSearchResults(results);
      } catch {
        if (seq === searchSeq.current) setSearchResults([]);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // ── Tags ──
  const [tags, setTags] = useState<PolyTag[]>([]);
  const [activeTag, setActiveTag] = useState<string>("ALL");
  const [tagEvents, setTagEvents] = useState<PolyEvent[] | null>(null);
  const [tagLoading, setTagLoading] = useState(false);
  const tagSeq = useRef(0);

  useEffect(() => {
    fetchPolyTags()
      .then(setTags)
      .catch(() => {}); // tags are a filter nicety — degrade silently
  }, []);

  const selectTag = (tag: string) => {
    setActiveTag(tag);
    if (tag === "ALL") {
      setTagEvents(null);
      setTagLoading(false);
      return;
    }
    setTagLoading(true);
    const seq = ++tagSeq.current;
    fetchPolyEvents({ tag })
      .then((evts) => {
        if (seq !== tagSeq.current) return;
        const sorted = evts.sort(compareEventsByTradability);
        cacheEvents(sorted);
        setTagEvents(sorted);
      })
      .catch(() => {
        if (seq === tagSeq.current) setTagEvents([]);
      })
      .finally(() => {
        if (seq === tagSeq.current) setTagLoading(false);
      });
  };

  // ── Display list: search > tag > live feed ──
  const isSearchMode = query.trim().length > 0;
  const displayed = useMemo(
    () =>
      isSearchMode
        ? searchResults ?? []
        : activeTag !== "ALL"
          ? tagEvents ?? []
          : feedEvents,
    [isSearchMode, searchResults, activeTag, tagEvents, feedEvents],
  );

  const loading =
    (isSearchMode && (searching || searchResults === null)) ||
    (!isSearchMode && activeTag !== "ALL" && tagLoading) ||
    (!isSearchMode && activeTag === "ALL" && feedEvents.length === 0 && !connected);

  const firstFetchPending =
    !isSearchMode && activeTag === "ALL" && feedEvents.length === 0;

  const hotIds = useMemo(() => computeHotEventIds(displayed), [displayed]);

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] p-3 sm:p-4 font-mono">
      <div className="max-w-[1500px] mx-auto">
        {/* ------------ Header ------------ */}
        {/* <div className="card px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
          <h1 className="text-base sm:text-lg font-bold text-white font-[family-name:var(--font-display)] uppercase tracking-tight">
            Prediction <span className="text-[#00F0FF]">Markets</span>
          </h1>
          {connected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/8 text-[9px] font-bold tracking-[0.14em] text-[#00F0FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              LIVE · POLYMARKET
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#FF003C]/30 bg-[#FF003C]/8 text-[9px] font-bold tracking-[0.14em] text-[#FF003C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C]" />
              DISCONNECTED
            </span>
          )}
          <span className="ml-auto text-[9px] text-[#555] tracking-widest tabular-nums whitespace-nowrap hidden sm:block">
            {totalCount} EVENTS · SOLANA IN, SOLANA OUT
          </span>
        </div> */}

        {/* ------------ Controls: search + tags ------------ */}
        <div className="card p-0 overflow-hidden mb-3">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Search size={12} className="text-[#555] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets…"
              className="bg-transparent text-[11px] font-mono text-white outline-none flex-1 placeholder:text-[#333]"
            />
            {isSearchMode && (
              <button
                onClick={() => setQuery("")}
                className="text-[9px] text-[#555] hover:text-white tracking-widest transition-colors"
              >
                CLEAR
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto">
            <button
              onClick={() => selectTag("ALL")}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider whitespace-nowrap transition-colors ${
                activeTag === "ALL"
                  ? "bg-[#00F0FF] text-black"
                  : "text-[#666] hover:text-white border border-white/8"
              }`}
            >
              ALL
            </button>
            {tags.map((t) => {
              const value = t.slug ?? t.label;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTag(value)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider whitespace-nowrap uppercase transition-colors ${
                    activeTag === value
                      ? "bg-[#00F0FF] text-black"
                      : "text-[#666] hover:text-white border border-white/8"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------ Card grid ------------ */}
        {backendTimedOut && firstFetchPending && !isSearchMode ? (
          <div className="py-20 text-center">
            <p className="text-[#FFB020] text-xs font-mono mb-2">
              Prediction backend unreachable
            </p>
            <p className="text-[#555] text-[10px] font-mono mb-4 max-w-md mx-auto leading-relaxed">
              Live Polymarket data flows through the prediction backend
              (NEXT_PUBLIC_POLY_BACKEND). It isn&apos;t responding — markets will
              appear as soon as it&apos;s online.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-ghost px-4 py-2 text-[10px] font-mono uppercase tracking-widest"
            >
              Retry
            </button>
          </div>
        ) : loading || firstFetchPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center text-[#555] text-[11px]">
            {isSearchMode
              ? "No markets found for this search."
              : "No markets found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayed.map((event) => (
              <EventCard key={event.id} event={event} hot={hotIds.has(event.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
