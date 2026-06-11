"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import type { PolyEvent, PolyMarket } from "@/services/polymarket.service";
import {
  STATUS_META,
  formatTimeLeft,
  formatVolume,
  getEventStatus,
  getOutcomeLabels,
  getOutcomePrices,
} from "@/lib/polymarket";

/* Skeleton mirrors the card layout row-for-row. */
export function SkeletonCard() {
  return (
    <div className="card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-full bg-white/5 animate-pulse rounded" />
          <div className="h-3.5 w-2/3 bg-white/5 animate-pulse rounded" />
        </div>
      </div>
      <div className="h-9 w-28 bg-white/5 animate-pulse rounded" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-8 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-8 bg-white/5 animate-pulse rounded-lg" />
      </div>
      <div className="h-3 w-full bg-white/5 animate-pulse rounded" />
    </div>
  );
}

/* Yes price of a market as 0–1, or null when no real price exists. */
function yesPrice(m: PolyMarket): number | null {
  const p = parseFloat(m.outcomePrices?.[0] ?? "");
  return Number.isFinite(p) ? p : null;
}

export function EventCard({ event, hot }: { event: PolyEvent; hot: boolean }) {
  const [iconFailed, setIconFailed] = useState(false);
  const status = getEventStatus(event);
  const meta = STATUS_META[status];
  const marketCount = event.markets?.length ?? 0;
  const isMulti = marketCount > 1;
  const firstMarket = event.markets?.[0];
  const timeLeft = formatTimeLeft(event.endDate);

  // Urgency: real end date within 24h and still open.
  const msLeft = new Date(event.endDate).getTime() - Date.now();
  const endingSoon = status === "active" && Number.isFinite(msLeft) && msLeft > 0 && msLeft < 24 * 3600_000;

  // Binary market data — honest: no real prices → no hero, chips show "—".
  const hasPrices = (firstMarket?.outcomePrices?.length ?? 0) >= 2;
  const prices = firstMarket ? getOutcomePrices(firstMarket) : ([0, 0] as const);
  const labels = firstMarket ? getOutcomeLabels(firstMarket) : (["Yes", "No"] as const);
  const yesPct = hasPrices ? Math.round(prices[0] * 100) : null;
  const leanColor = yesPct !== null && yesPct >= 50 ? "#39FF14" : "#FF003C";

  // Multi-outcome: top 3 markets by Yes price.
  const topMarkets = isMulti
    ? [...event.markets]
        .map((m) => ({ m, p: yesPrice(m) }))
        .sort((a, b) => (b.p ?? -1) - (a.p ?? -1))
        .slice(0, 3)
    : [];

  return (
    <Link
      href={`/prediction/${event.slug}`}
      className="card rounded-xl overflow-hidden p-4 flex flex-col gap-3 group hover:border-white/15"
    >
      {/* Row 1: icon + title + badges */}
      <div className="flex items-start gap-2.5">
        {event.icon && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.icon}
            alt=""
            onError={() => setIconFailed(true)}
            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
          />
        )}
        <h3 className="flex-1 text-[12px] font-bold text-white leading-snug line-clamp-2 min-h-[2.1rem] group-hover:text-[#00F0FF] transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {endingSoon ? (
            <span
              className="px-1.5 py-0.5 text-[8px] font-bold rounded-md border border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700] animate-pulse"
              title="Market closes within 24 hours"
            >
              ENDING SOON
            </span>
          ) : (
            <span className={`${meta.badgeClass} px-1.5 py-0.5 text-[8px] rounded-md`} title={meta.description}>
              {meta.label}
            </span>
          )}
          {hot && (
            <span
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-bold rounded-md border border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]"
              title="Top tradability right now"
            >
              <Flame size={9} />
              HOT
            </span>
          )}
        </div>
      </div>

      {isMulti ? (
        /* Multi-outcome: top-3 rows with cyan % + progress bar */
        <div className="flex flex-col gap-1.5 min-h-[5.5rem]">
          {topMarkets.map(({ m, p }, i) => (
            <div key={m.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className={`truncate ${i === 0 ? "text-white font-bold" : "text-[#999]"}`}>
                  {i === 0 && p !== null && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00F0FF] mr-1.5 align-middle shadow-[0_0_6px_#00F0FF]" />
                  )}
                  {m.question || m.slug}
                </span>
                <span
                  className={`font-bold tabular-nums shrink-0 ${i === 0 ? "text-[#00F0FF] text-[11px]" : "text-[#00F0FF]/70"}`}
                  style={i === 0 ? { textShadow: "0 0 10px #00F0FF40" } : undefined}
                >
                  {p !== null ? `${Math.round(p * 100)}%` : "—"}
                </span>
              </div>
              <div className="h-[2px] rounded bg-white/5 overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-500 ${
                    i === 0 ? "bg-gradient-to-r from-[#00F0FF]/80 to-[#39FF14]/80" : "bg-[#00F0FF]/40"
                  }`}
                  style={{ width: `${p !== null ? Math.round(p * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
          {marketCount > 3 && (
            <span className="text-[9px] text-[#555] tracking-wider">+{marketCount - 3} more</span>
          )}
        </div>
      ) : (
        /* Binary: % hero + Yes/No chips */
        <>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl font-bold tabular-nums leading-none"
              style={
                yesPct !== null
                  ? { color: leanColor, textShadow: `0 0 18px ${leanColor}40` }
                  : { color: "#555" }
              }
            >
              {yesPct !== null ? `${yesPct}%` : "—"}
            </span>
            <span className="text-[8px] text-[#555] tracking-[0.18em] uppercase">Chance</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#39FF14]/20 bg-[#39FF14]/10 group-hover:bg-[#39FF14]/15 hover:!bg-[#39FF14]/25 hover:border-[#39FF14]/50 transition-all"
              title={hasPrices && prices[0] > 0 ? `${labels[0]} pays $1 — ${(1 / prices[0]).toFixed(2)}x` : undefined}
            >
              <span className="text-[9px] text-[#39FF14]/70 font-bold uppercase truncate">{labels[0]}</span>
              <span className="text-[11px] text-[#39FF14] font-bold tabular-nums">
                {hasPrices ? `${Math.round(prices[0] * 100)}¢` : "—"}
              </span>
            </div>
            <div
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#FF003C]/20 bg-[#FF003C]/10 group-hover:bg-[#FF003C]/15 hover:!bg-[#FF003C]/25 hover:border-[#FF003C]/50 transition-all"
              title={hasPrices && prices[1] > 0 ? `${labels[1]} pays $1 — ${(1 / prices[1]).toFixed(2)}x` : undefined}
            >
              <span className="text-[9px] text-[#FF003C]/70 font-bold uppercase truncate">{labels[1]}</span>
              <span className="text-[11px] text-[#FF003C] font-bold tabular-nums">
                {hasPrices ? `${Math.round(prices[1] * 100)}¢` : "—"}
              </span>
            </div>
          </div>
          {/* Probability split bar — instant YES/NO visual anchor */}
          {yesPct !== null && (
            <div className="flex h-[3px] rounded-full overflow-hidden bg-white/5">
              <div
                className="bg-[#39FF14]/70 transition-[width] duration-500"
                style={{ width: `${yesPct}%` }}
              />
              <div
                className="bg-[#FF003C]/50 transition-[width] duration-500"
                style={{ width: `${100 - yesPct}%` }}
              />
            </div>
          )}
        </>
      )}

      {/* Footer metrics */}
      <div className="flex items-center gap-3 text-[9px] text-[#555] tracking-wider pt-2 border-t border-white/5 tabular-nums mt-auto">
        <span>{formatVolume(event.volume)} VOL</span>
        {event.volume24hr > 0 && <span>{formatVolume(event.volume24hr)} 24H</span>}
        <span className="ml-auto whitespace-nowrap">{timeLeft}</span>
        {marketCount > 1 && <span className="text-[#888]">{marketCount} MARKETS</span>}
      </div>
    </Link>
  );
}
