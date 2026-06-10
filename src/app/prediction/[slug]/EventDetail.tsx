"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { PolyEvent, PolyMarket } from "@/services/polymarket.service";
import {
  formatVolume,
  getOutcomeLabels,
  getOutcomePrices,
  getTokenIds,
} from "@/lib/polymarket";
import { PriceChart } from "./PriceChart";

interface EventDetailProps {
  event: PolyEvent;
  selectedMarket: PolyMarket;
  onSelectMarket: (market: PolyMarket) => void;
}

export function EventDetail({
  event,
  selectedMarket,
  onSelectMarket,
}: EventDetailProps) {
  const router = useRouter();

  // Show chart only for the selected market. Outcome labels pass through so
  // the chart legend uses real names ("Delhi Capitals" / "Gujarat Titans")
  // instead of hardcoded Yes/No.
  const selectedIds = getTokenIds(selectedMarket);
  const selectedLabels = getOutcomeLabels(selectedMarket);

  const tagLabels = event.tags
    ?.map((t) => t.label)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex-1 min-w-0 space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={12} />
        Back to markets
      </button>

      {/* Event header */}
      <div className="min-w-0">
        {tagLabels && (
          <p className="text-[9px] text-[#555] tracking-widest uppercase mb-1.5">
            {tagLabels}
          </p>
        )}
        <h1 className="text-lg sm:text-xl font-bold text-white leading-tight font-[family-name:var(--font-display)] uppercase">
          {event.title}
        </h1>
      </div>

      {/* Volume + dates */}
      <div className="flex items-center gap-4 text-[10px] text-[#555] tracking-wider tabular-nums">
        {event.volume != null && <span>{formatVolume(event.volume)} VOL</span>}
        {event.endDate && (
          <span>
            ENDS{" "}
            {new Date(event.endDate)
              .toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()}
          </span>
        )}
      </div>

      {/* Price chart for the selected market */}
      {selectedIds[0] && (
        <PriceChart tokenId={selectedIds[0]} outcomeLabels={selectedLabels} />
      )}

      {/* Markets list — multi-market events only */}
      {event.markets && event.markets.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-[9px] text-[#555] tracking-widest uppercase font-bold">
            Markets
          </h2>
          <div className="space-y-1">
            {event.markets.map((market) => {
              const prices = getOutcomePrices(market);
              const [labelA, labelB] = getOutcomeLabels(market);
              const isSelected = market.id === selectedMarket.id;
              return (
                <button
                  key={market.id}
                  onClick={() => onSelectMarket(market)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-all border ${
                    isSelected
                      ? "border-[#00F0FF44] bg-[#00F0FF0d]"
                      : "border-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">
                      {market.question}
                    </p>
                    {market.volume != null && (
                      <p className="text-[9px] text-[#555] mt-0.5 tabular-nums">
                        {formatVolume(Number(market.volume) || 0)} VOL
                      </p>
                    )}
                  </div>
                  <div className="text-xl font-bold text-[#00F0FF] flex-shrink-0 tabular-nums">
                    {Math.round(prices[0] * 100)}%
                  </div>
                  <div className="hidden sm:flex gap-2 flex-shrink-0">
                    <span className="border border-[#39FF14]/30 bg-[#39FF14]/8 text-[#39FF14] px-2.5 py-1 text-[10px] font-bold tabular-nums whitespace-nowrap">
                      {labelA} {Math.round(prices[0] * 100)}¢
                    </span>
                    <span className="border border-[#FF003C]/30 bg-[#FF003C]/8 text-[#FF003C] px-2.5 py-1 text-[10px] font-bold tabular-nums whitespace-nowrap">
                      {labelB} {Math.round(prices[1] * 100)}¢
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
