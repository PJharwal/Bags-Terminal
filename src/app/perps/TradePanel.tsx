"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { fetchL2BookGrouped, fmtPx, type GroupedBook, type PerpMarketEx } from "./lib";

const BOOK_POLL_MS = 5000;
const TAKER_FEE = 0.00045; // HL base-tier taker fee 0.045%
const PRESETS = [100, 500, 1000];

// Walk book levels with a USD notional → average fill price (null if the
// visible book can't absorb it).
function walkBook(levels: { px: number; sz: number }[], notional: number): number | null {
  let remaining = notional;
  let baseQty = 0;
  for (const l of levels) {
    const levelNtl = l.px * l.sz;
    const take = Math.min(remaining, levelNtl);
    baseQty += take / l.px;
    remaining -= take;
    if (remaining <= 0) break;
  }
  if (remaining > 0 || baseQty <= 0) return null;
  return notional / baseQty;
}

export function TradePanel({ market }: { market: PerpMarketEx }) {
  const [side, setSide] = useState<"long" | "short">("long");
  const [size, setSize] = useState("");
  const [lev, setLev] = useState(5);
  const [book, setBook] = useState<GroupedBook | null>(null);

  const maxLev = Math.max(1, market.maxLeverage);
  const margin = parseFloat(size) || 0;
  const notional = margin * lev;
  const entry = market.markPx;

  // Lazily poll the (ungrouped) book only while an estimate is needed.
  useEffect(() => {
    if (notional <= 0) return;
    let alive = true;
    const load = () =>
      fetchL2BookGrouped(market.coin, null)
        .then((b) => alive && setBook(b))
        .catch(() => {});
    load();
    const t = setInterval(load, BOOK_POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [market.coin, notional > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setBook(null);
  }, [market.coin]);

  // Estimated liquidation: HL maintenance margin ≈ half the initial margin at max leverage.
  const mmr = 1 / (2 * maxLev);
  const liqPx =
    margin > 0
      ? side === "long"
        ? entry * (1 - 1 / lev + mmr)
        : entry * (1 + 1 / lev - mmr)
      : 0;

  // Impact: walk asks for longs, bids for shorts, vs mid.
  let fillPx: number | null = null;
  let impactPct: number | null = null;
  let exceedsDepth = false;
  if (notional > 0 && book) {
    const levels = side === "long" ? book.asks : book.bids;
    const mid =
      book.asks[0] && book.bids[0] ? (book.asks[0].px + book.bids[0].px) / 2 : entry;
    fillPx = walkBook(levels, notional);
    if (fillPx === null) exceedsDepth = true;
    else if (mid > 0) impactPct = Math.abs((fillPx - mid) / mid) * 100;
  }
  const takerFee = notional > 0 ? notional * TAKER_FEE : 0;

  return (
    <div className="card p-4">
      <div className="flex mb-3 border border-white/8 rounded overflow-hidden">
        {(["long", "short"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-2 text-[11px] font-mono font-bold uppercase transition-colors ${
              side === s
                ? s === "long"
                  ? "bg-[#39FF14] text-black"
                  : "bg-[#FF003C] text-white"
                : "text-[#666] hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="block text-[9px] font-mono text-[#666] uppercase tracking-widest mb-1">
        Margin (USDC)
      </label>
      <input
        value={size}
        onChange={(e) => setSize(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="0.00"
        className="w-full bg-[#0A0A0A] border border-white/8 rounded px-3 py-2 text-sm font-mono text-white tabular-nums mb-2 focus:border-[#FFD700]/40 outline-none"
      />
      <div className="flex gap-1.5 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setSize(String(p))}
            className={`flex-1 py-1 rounded border text-[9px] font-mono transition-colors ${
              margin === p
                ? "border-[#FFD700]/60 text-[#FFD700]"
                : "border-white/8 text-[#666] hover:text-white hover:border-white/20"
            }`}
          >
            ${p >= 1000 ? `${p / 1000}K` : p}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-[#666] uppercase tracking-widest">Leverage</span>
        <span className="text-[11px] font-mono font-bold text-[#FFD700] tabular-nums">{lev}×</span>
      </div>
      <input
        type="range"
        min={1}
        max={maxLev}
        value={Math.min(lev, maxLev)}
        onChange={(e) => setLev(Number(e.target.value))}
        className="w-full accent-[#FFD700] mb-3"
      />

      <div className="space-y-1 text-[10px] font-mono tabular-nums mb-4">
        <div className="flex justify-between text-[#888]">
          <span>Mark price</span>
          <span className="text-white">${fmtPx(entry)}</span>
        </div>
        <div className="flex justify-between text-[#888]">
          <span>Notional</span>
          <span className="text-white">{notional > 0 ? formatCurrency(notional) : "—"}</span>
        </div>
        <div className="flex justify-between text-[#888]">
          <span>Est. fill price</span>
          <span className="text-white">
            {notional <= 0 ? "—" : exceedsDepth ? "exceeds depth" : fillPx ? `$${fmtPx(fillPx)}` : "…"}
          </span>
        </div>
        <div className="flex justify-between text-[#888]">
          <span>Est. impact</span>
          <span
            className={
              exceedsDepth
                ? "text-[#FF003C]"
                : impactPct !== null && impactPct > 0.5
                  ? "text-[#FFB020]"
                  : "text-white"
            }
          >
            {notional <= 0
              ? "—"
              : exceedsDepth
                ? "exceeds depth"
                : impactPct !== null
                  ? `${impactPct.toFixed(3)}%`
                  : "…"}
          </span>
        </div>
        <div className="flex justify-between text-[#888]">
          <span>Est. taker fee (base tier)</span>
          <span className="text-white">{takerFee > 0 ? `$${takerFee.toFixed(2)}` : "—"}</span>
        </div>
        <div className="flex justify-between text-[#888]">
          <span>Est. liq. price</span>
          <span className={liqPx > 0 ? "text-[#FFB020]" : "text-white"}>
            {liqPx > 0 ? `$${fmtPx(liqPx)}` : "—"}
          </span>
        </div>
      </div>

      <button
        disabled
        className="w-full py-2.5 rounded font-mono text-[11px] font-bold uppercase tracking-widest bg-white/5 text-[#555] cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock size={12} />
        Execution coming soon
      </button>
      <p className="text-[9px] font-mono text-[#555] leading-relaxed mt-2">
        Live Hyperliquid market data. Fill, impact, fee, and liquidation figures
        are estimates. Order execution is not available yet.
      </p>
    </div>
  );
}
