"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchL2BookGrouped,
  fmtPx,
  fmtSz,
  fmtTick,
  tickForSigFigs,
  type GroupedBook,
  type GroupedBookLevel,
} from "./lib";
import { subscribeHl, useWsStatus, type WsL2Book } from "./ws";
import { formatCurrency } from "@/lib/format";

const LEVELS = 11;
const POLL_MS = 3000;
const USD_KEY = "bags-perp-book-usd";
const SIGFIG_OPTIONS = [5, 4, 3, 2] as const;

interface Row extends GroupedBookLevel {
  total: number; // cumulative size (base units)
  totalUsd: number; // cumulative notional
}

function cumulate(levels: GroupedBookLevel[]): Row[] {
  let total = 0;
  let totalUsd = 0;
  return levels.slice(0, LEVELS).map((l) => {
    total += l.sz;
    totalUsd += l.sz * l.px;
    return { ...l, total, totalUsd };
  });
}

export function OrderBook({ coin, szDecimals }: { coin: string; szDecimals: number }) {
  const [book, setBook] = useState<GroupedBook | null>(null);
  const [failed, setFailed] = useState(false);
  const [sigFigs, setSigFigs] = useState<number>(5);
  const [usd, setUsd] = useState(false);
  const wsStatus = useWsStatus();
  const wsLive = wsStatus === "live";
  const wsLiveRef = useRef(wsLive);
  wsLiveRef.current = wsLive;

  useEffect(() => {
    try {
      if (localStorage.getItem(USD_KEY) === "1") setUsd(true);
    } catch {}
  }, []);

  const toggleUsd = () => {
    setUsd((u) => {
      try {
        localStorage.setItem(USD_KEY, u ? "0" : "1");
      } catch {}
      return !u;
    });
  };

  // WS subscription (primary) + REST polling (initial paint / fallback).
  useEffect(() => {
    let alive = true;
    let hasBook = false;
    let wsGotBook = false; // don't let a late REST response overwrite fresher WS data
    setBook(null);
    setFailed(false);

    const unsub = subscribeHl({ type: "l2Book", coin, nSigFigs: sigFigs }, (raw) => {
      if (!alive) return;
      const d = raw as WsL2Book;
      hasBook = true;
      wsGotBook = true;
      setBook({
        bids: (d.levels?.[0] || []).map((l) => ({ px: parseFloat(l.px), sz: parseFloat(l.sz), n: l.n })),
        asks: (d.levels?.[1] || []).map((l) => ({ px: parseFloat(l.px), sz: parseFloat(l.sz), n: l.n })),
      });
      setFailed(false);
    });

    const load = () =>
      fetchL2BookGrouped(coin, sigFigs)
        .then((b) => {
          if (!alive || (wsGotBook && wsLiveRef.current)) return;
          hasBook = true;
          setBook(b);
          setFailed(false);
        })
        .catch(() => {
          if (alive && !hasBook) setFailed(true);
        });

    load();
    const t = setInterval(() => {
      if (!wsLiveRef.current) load();
    }, POLL_MS);

    return () => {
      alive = false;
      unsub();
      clearInterval(t);
    };
  }, [coin, sigFigs]);

  if (failed && !book)
    return (
      <div className="text-[10px] font-mono text-[#FF003C]/80 py-6 text-center">
        Book unavailable — retrying…
      </div>
    );
  if (!book)
    return <div className="text-[10px] font-mono text-[#555] py-6 text-center">Loading book…</div>;
  if (book.bids.length === 0 && book.asks.length === 0)
    return <div className="text-[10px] font-mono text-[#555] py-6 text-center">Empty book</div>;

  const asks = cumulate(book.asks);
  const bids = cumulate(book.bids);
  const bestAsk = book.asks[0]?.px ?? 0;
  const bestBid = book.bids[0]?.px ?? 0;
  const mid = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk || bestBid;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = mid > 0 ? (spread / mid) * 100 : 0;
  const maxTotal = Math.max(
    asks.length ? asks[asks.length - 1][usd ? "totalUsd" : "total"] : 0,
    bids.length ? bids[bids.length - 1][usd ? "totalUsd" : "total"] : 0,
    1,
  );
  const bidNtl = bids.length ? bids[bids.length - 1].totalUsd : 0;
  const askNtl = asks.length ? asks[asks.length - 1].totalUsd : 0;
  const bidShare = bidNtl + askNtl > 0 ? (bidNtl / (bidNtl + askNtl)) * 100 : 50;

  const tick = mid > 0 ? tickForSigFigs(mid, sigFigs) : 0;
  const cycleGroup = () => {
    const i = SIGFIG_OPTIONS.indexOf(sigFigs as (typeof SIGFIG_OPTIONS)[number]);
    setSigFigs(SIGFIG_OPTIONS[(i + 1) % SIGFIG_OPTIONS.length]);
  };

  const val = (r: Row) => (usd ? formatCurrency(r.px * r.sz).slice(1) : fmtSz(r.sz, szDecimals));
  const tot = (r: Row) => (usd ? formatCurrency(r.totalUsd).slice(1) : fmtSz(r.total, szDecimals));

  const RowEl = ({ r, side }: { r: Row; side: "bid" | "ask" }) => (
    <div className="relative grid grid-cols-3 py-[1.5px]">
      <div
        className={`absolute inset-y-0 right-0 ${side === "ask" ? "bg-[#FF003C]/10" : "bg-[#39FF14]/10"}`}
        style={{ width: `${((usd ? r.totalUsd : r.total) / maxTotal) * 100}%` }}
      />
      <span className={`relative tabular-nums ${side === "ask" ? "text-[#FF003C]" : "text-[#39FF14]"}`}>
        {fmtPx(r.px)}
      </span>
      <span className="relative text-right text-[#bbb] tabular-nums">{val(r)}</span>
      <span className="relative text-right text-[#777] tabular-nums">{tot(r)}</span>
    </div>
  );

  return (
    <div className="font-mono text-[10px]">
      <div className="flex items-center justify-between pb-1.5">
        <button
          onClick={cycleGroup}
          title="Cycle price grouping"
          className="px-1.5 py-0.5 rounded border border-white/10 text-[9px] tabular-nums text-[#888] hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-colors"
        >
          GRP {tick > 0 ? fmtTick(tick) : sigFigs}
        </button>
        <div className="flex rounded border border-white/10 overflow-hidden">
          {(["SIZE", "USD"] as const).map((m) => (
            <button
              key={m}
              onClick={() => (m === "USD") !== usd && toggleUsd()}
              className={`px-1.5 py-0.5 text-[9px] transition-colors ${
                (m === "USD") === usd ? "bg-[#FFD700] text-black font-bold" : "text-[#666] hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 text-[9px] tracking-widest text-[#555] pb-1 border-b border-white/5">
        <span>PRICE</span>
        <span className="text-right">{usd ? "USD" : "SIZE"}</span>
        <span className="text-right">TOTAL</span>
      </div>

      {[...asks].reverse().map((r, i) => (
        <RowEl key={`a${i}`} r={r} side="ask" />
      ))}

      <div className="flex items-center justify-between py-1.5 my-0.5 border-y border-white/8 text-[9px]">
        <span className="text-[#888] tabular-nums">MID {fmtPx(mid)}</span>
        <span className="text-[#555] tabular-nums">
          SPREAD {spread > 0 ? `${fmtPx(spread)} · ${spreadPct.toFixed(3)}%` : "—"}
        </span>
      </div>

      {bids.map((r, i) => (
        <RowEl key={`b${i}`} r={r} side="bid" />
      ))}

      {/* Buy/sell pressure (displayed depth, notional) */}
      <div className="mt-2">
        <div className="flex h-[5px] rounded-full overflow-hidden bg-white/5">
          <div className="bg-[#39FF14]/70" style={{ width: `${bidShare}%` }} />
          <div className="bg-[#FF003C]/70" style={{ width: `${100 - bidShare}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[9px] tabular-nums">
          <span className="text-[#39FF14]/80">B {bidShare.toFixed(0)}%</span>
          <span className="text-[#FF003C]/80">{(100 - bidShare).toFixed(0)}% S</span>
        </div>
      </div>
    </div>
  );
}
