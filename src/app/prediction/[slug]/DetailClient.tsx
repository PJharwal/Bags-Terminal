"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  fetchPolyEvent,
  type PolyEvent,
  type PolyMarket,
} from "@/services/polymarket.service";
import { EventDetail } from "./EventDetail";
import { TradingSidebar } from "./TradingSidebar";

interface Props {
  slug: string;
}

function readCachedEvent(slug: string): PolyEvent | null {
  try {
    const raw = sessionStorage.getItem(`poly_event_${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.markets) return parsed;
  } catch { /* ignore */ }
  return null;
}

function DetailSkeleton() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono">
      <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        {/* Left column skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-5 w-32 bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-white/5 animate-pulse" />
            <div className="h-6 w-72 bg-white/5 animate-pulse" />
          </div>
          <div className="h-[300px] bg-white/5 animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-8 w-20 bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Right column skeleton */}
        <div className="w-full lg:w-[340px] space-y-3">
          <div className="h-10 bg-white/5 animate-pulse" />
          <div className="h-32 bg-white/5 animate-pulse" />
          <div className="h-12 bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function DetailClient({ slug }: Props) {
  const [event, setEvent] = useState<PolyEvent | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<PolyMarket | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from the sessionStorage cache written by the feed for instant
  // paint, then fetch fresh data. (Cache read lives in an effect — not a lazy
  // useState initializer — because client components SSR in Next and
  // sessionStorage-dependent initial state would cause a hydration mismatch.)
  useEffect(() => {
    const cached = readCachedEvent(slug);
    if (cached) {
      setEvent(cached);
      setSelectedMarket((prev) => prev ?? cached.markets?.[0] ?? null);
      setLoading(false);
    }

    fetchPolyEvent(slug)
      .then((fresh) => {
        if (fresh) {
          setEvent(fresh);
          setSelectedMarket((prev) => prev ?? fresh.markets?.[0] ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSelectMarket = useCallback((market: PolyMarket) => {
    setSelectedMarket(market);
  }, []);

  if (loading && !event) {
    return <DetailSkeleton />;
  }

  if (!event || !selectedMarket) {
    return (
      <div className="min-h-[calc(100vh-92px)] bg-[#050505] font-mono flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#555]">Event not found</p>
        <Link
          href="/prediction"
          className="text-sm text-[#00F0FF] hover:text-white transition-colors"
        >
          Back to Prediction Markets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono">
      <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        <EventDetail
          event={event}
          selectedMarket={selectedMarket}
          onSelectMarket={handleSelectMarket}
        />
        <TradingSidebar market={selectedMarket} event={event} />
      </div>
    </div>
  );
}
