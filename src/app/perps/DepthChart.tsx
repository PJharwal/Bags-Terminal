"use client";

import { useEffect, useState } from "react";
import { fetchL2BookGrouped, fmtPx, type GroupedBook } from "./lib";
import { formatNumber } from "@/lib/format";

// REST polling only (no WS): the order book already holds a WS l2Book sub for
// the selected coin, and l2Book messages can't be disambiguated by nSigFigs.
const POLL_MS = 2500;
const W = 800;
const H = 300;

interface CumPoint {
  px: number;
  cum: number;
}

function buildCum(levels: { px: number; sz: number }[]): CumPoint[] {
  let cum = 0;
  return levels.map((l) => {
    cum += l.sz;
    return { px: l.px, cum };
  });
}

// Step-path for cumulative depth, anchored to the mid (x0) at depth 0.
function stepPath(points: CumPoint[], x: (px: number) => number, y: (c: number) => number, x0: number): string {
  if (points.length === 0) return "";
  let d = `M ${x0} ${y(0)}`;
  let prevY = y(0);
  for (const p of points) {
    d += ` L ${x(p.px)} ${prevY} L ${x(p.px)} ${y(p.cum)}`;
    prevY = y(p.cum);
  }
  const lastX = x(points[points.length - 1].px);
  d += ` L ${lastX} ${H} L ${x0} ${H} Z`;
  return d;
}

export function DepthChart({ coin }: { coin: string }) {
  const [book, setBook] = useState<GroupedBook | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let hasBook = false;
    setBook(null);
    setFailed(false);

    const load = () =>
      fetchL2BookGrouped(coin, 4)
        .then((b) => {
          if (!alive) return;
          hasBook = true;
          setBook(b);
        })
        .catch(() => {
          if (alive && !hasBook) setFailed(true);
        });

    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [coin]);

  if (failed && !book)
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono text-[#FF003C]/80">
        Depth unavailable — retrying…
      </div>
    );
  if (!book || book.bids.length === 0 || book.asks.length === 0)
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono text-[#555]">
        {book ? "Not enough depth to draw" : "Loading depth…"}
      </div>
    );

  const bids = buildCum(book.bids); // sorted best→worse (desc px)
  const asks = buildCum(book.asks); // asc px
  const mid = (book.bids[0].px + book.asks[0].px) / 2;
  const lo = bids[bids.length - 1].px;
  const hi = asks[asks.length - 1].px;
  // Symmetric price window around mid so the view doesn't skew.
  const span = Math.max(mid - lo, hi - mid) || 1;
  const maxCum = Math.max(bids[bids.length - 1].cum, asks[asks.length - 1].cum) || 1;

  const x = (px: number) => ((px - (mid - span)) / (2 * span)) * W;
  const y = (c: number) => H - (c / maxCum) * (H - 18);

  return (
    <div className="relative h-full font-mono">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,215,0,0.25)" strokeDasharray="3 4" />
        <path d={stepPath(bids, x, y, W / 2)} fill="rgba(57,255,20,0.14)" stroke="#39FF14" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        <path d={stepPath(asks, x, y, W / 2)} fill="rgba(255,0,60,0.14)" stroke="#FF003C" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* HTML labels (immune to preserveAspectRatio distortion) */}
      <div className="absolute top-2 left-3 text-[9px] tabular-nums text-[#39FF14]/90">
        BID DEPTH {formatNumber(bids[bids.length - 1].cum)} {coin}
      </div>
      <div className="absolute top-2 right-3 text-[9px] tabular-nums text-[#FF003C]/90 text-right">
        ASK DEPTH {formatNumber(asks[asks.length - 1].cum)} {coin}
      </div>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] tabular-nums text-[#FFD700]/90">
        MID {fmtPx(mid)}
      </div>
      <div className="absolute bottom-1 left-3 text-[9px] tabular-nums text-[#555]">{fmtPx(mid - span)}</div>
      <div className="absolute bottom-1 right-3 text-[9px] tabular-nums text-[#555]">{fmtPx(mid + span)}</div>
    </div>
  );
}
