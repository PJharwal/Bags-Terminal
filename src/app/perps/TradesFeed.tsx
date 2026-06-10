"use client";

import { useEffect, useRef, useState } from "react";
import { fetchRecentTrades, type PerpTrade } from "@/services/hyperliquid.service";
import { fmtPx, fmtSz } from "./lib";
import { subscribeHl, useWsStatus, type WsTrade } from "./ws";

const MAX_TRADES = 36;
const POLL_MS = 3000;

export function TradesFeed({ coin, szDecimals }: { coin: string; szDecimals: number }) {
  const [trades, setTrades] = useState<PerpTrade[]>([]);
  const [failed, setFailed] = useState(false);
  const wsStatus = useWsStatus();
  const wsLiveRef = useRef(wsStatus === "live");
  wsLiveRef.current = wsStatus === "live";

  useEffect(() => {
    let alive = true;
    let hasData = false;
    setTrades([]);
    setFailed(false);
    const seen = new Set<number>();

    const unsub = subscribeHl({ type: "trades", coin }, (raw) => {
      if (!alive) return;
      const batch = raw as WsTrade[];
      // Dedupe is only needed across the snapshot/delta boundary — cap the set
      // so it doesn't grow unbounded on busy markets.
      if (seen.size > 5000) seen.clear();
      const incoming = batch
        .filter((t) => {
          if (seen.has(t.tid)) return false;
          seen.add(t.tid);
          return true;
        })
        .map((t) => ({ side: t.side, px: parseFloat(t.px), sz: parseFloat(t.sz), time: t.time }));
      if (incoming.length === 0) return;
      hasData = true;
      setTrades((prev) =>
        [...incoming, ...prev].sort((a, b) => b.time - a.time).slice(0, MAX_TRADES),
      );
    });

    const load = () =>
      fetchRecentTrades(coin, MAX_TRADES)
        .then((t) => {
          if (!alive || wsLiveRef.current) return;
          hasData = true;
          setTrades(t.sort((a, b) => b.time - a.time));
        })
        .catch(() => {
          if (alive && !hasData) setFailed(true);
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
  }, [coin]);

  if (failed && trades.length === 0)
    return (
      <div className="text-[10px] font-mono text-[#FF003C]/80 py-6 text-center">
        Trades unavailable — retrying…
      </div>
    );
  if (trades.length === 0)
    return <div className="text-[10px] font-mono text-[#555] py-6 text-center">Loading trades…</div>;

  return (
    <div className="font-mono text-[10px]">
      <div className="grid grid-cols-3 text-[9px] tracking-widest text-[#555] pb-1 border-b border-white/5">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TIME</span>
      </div>
      {trades.map((t, i) => (
        <div key={`${t.time}-${t.px}-${i}`} className="grid grid-cols-3 py-[1.5px] tabular-nums">
          <span className={t.side === "B" ? "text-[#39FF14]" : "text-[#FF003C]"}>{fmtPx(t.px)}</span>
          <span className="text-right text-[#bbb]">{fmtSz(t.sz, szDecimals)}</span>
          <span className="text-right text-[#555]">
            {new Date(t.time).toLocaleTimeString([], { hour12: false })}
          </span>
        </div>
      ))}
    </div>
  );
}
