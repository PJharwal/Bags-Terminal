"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  BaselineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  fetchFundingHistory,
  fetchPredictedFundings,
  type FundingPoint,
  type PredictedVenueFunding,
} from "./lib";

type Mode = "1H" | "APR";
const LOOKBACK_MS = 7 * 86400_000;

export function FundingPanel({ coin }: { coin: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Baseline"> | null>(null);
  const [hist, setHist] = useState<FundingPoint[] | null>(null);
  const [histErr, setHistErr] = useState(false);
  const [mode, setMode] = useState<Mode>("1H");
  const [predicted, setPredicted] = useState<PredictedVenueFunding[] | null>(null);
  const [predErr, setPredErr] = useState(false);

  // Chart instance (once).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#777a8c",
        fontFamily: "ui-monospace, monospace",
        fontSize: 9,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      crosshair: {
        vertLine: { color: "rgba(255,215,0,0.3)", labelBackgroundColor: "#FFD700" },
        horzLine: { color: "rgba(255,215,0,0.3)", labelBackgroundColor: "#FFD700" },
      },
    });
    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: 0 },
      topLineColor: "#39FF14",
      topFillColor1: "rgba(57,255,20,0.18)",
      topFillColor2: "rgba(57,255,20,0.02)",
      bottomLineColor: "#FF003C",
      bottomFillColor1: "rgba(255,0,60,0.02)",
      bottomFillColor2: "rgba(255,0,60,0.18)",
      lineWidth: 1,
      priceFormat: { type: "custom", formatter: (v: number) => `${v.toFixed(mode === "1H" ? 4 : 1)}%` },
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Funding history per coin.
  useEffect(() => {
    let alive = true;
    setHist(null);
    setHistErr(false);
    fetchFundingHistory(coin, Date.now() - LOOKBACK_MS)
      .then((h) => alive && setHist(h))
      .catch(() => alive && setHistErr(true));
    return () => {
      alive = false;
    };
  }, [coin]);

  // Render data on history/mode change.
  useEffect(() => {
    if (!hist || !seriesRef.current) return;
    const mult = mode === "1H" ? 100 : 24 * 365 * 100;
    seriesRef.current.setData(
      hist.map((p) => ({ time: Math.floor(p.time / 1000) as UTCTimestamp, value: p.rate * mult })),
    );
    seriesRef.current.applyOptions({
      priceFormat: { type: "custom", formatter: (v: number) => `${v.toFixed(mode === "1H" ? 4 : 1)}%` },
    });
    chartRef.current?.timeScale().fitContent();
  }, [hist, mode]);

  // Predicted cross-venue funding per coin.
  useEffect(() => {
    let alive = true;
    setPredicted(null);
    setPredErr(false);
    fetchPredictedFundings()
      .then((map) => alive && setPredicted(map.get(coin) || []))
      .catch(() => alive && setPredErr(true));
    return () => {
      alive = false;
    };
  }, [coin]);

  return (
    <div className="font-mono text-[10px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] text-[#555] tracking-widest">FUNDING · LAST 7D</span>
        <div className="flex rounded border border-white/10 overflow-hidden">
          {(["1H", "APR"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-1.5 py-0.5 text-[9px] transition-colors ${
                mode === m ? "bg-[#FFD700] text-black font-bold" : "text-[#666] hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[150px] mb-3">
        <div ref={containerRef} className="absolute inset-0" />
        {!hist && !histErr && (
          <div className="absolute inset-0 flex items-center justify-center text-[#555] bg-[#050505]/60">
            Loading funding history…
          </div>
        )}
        {histErr && (
          <div className="absolute inset-0 flex items-center justify-center text-[#FF003C]/80">
            Funding history unavailable
          </div>
        )}
        {hist && hist.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[#555]">
            No funding history for this market
          </div>
        )}
      </div>

      <div className="text-[8px] text-[#555] tracking-widest mb-1">PREDICTED NEXT FUNDING · CROSS-VENUE</div>
      {predErr ? (
        <div className="py-3 text-center text-[#FF003C]/80">Predicted funding unavailable</div>
      ) : !predicted ? (
        <div className="py-3 text-center text-[#555]">Loading…</div>
      ) : predicted.length === 0 ? (
        <div className="py-3 text-center text-[#555]">No cross-venue data for {coin}</div>
      ) : (
        <>
          <div className="grid grid-cols-[1.2fr_1fr_0.9fr_0.9fr] gap-1 text-[9px] tracking-wider text-[#555] pb-1 border-b border-white/5">
            <span>VENUE</span>
            <span className="text-right">RATE</span>
            <span className="text-right">INTERVAL</span>
            <span className="text-right">APR</span>
          </div>
          {predicted.map((v) => {
            const ratePct = v.rate * 100;
            const aprPct = v.intervalHours > 0 ? (v.rate / v.intervalHours) * 24 * 365 * 100 : 0;
            const hl = v.venue === "HYPERLIQUID";
            return (
              <div
                key={v.venue}
                className={`grid grid-cols-[1.2fr_1fr_0.9fr_0.9fr] gap-1 py-[3px] border-b border-white/[0.03] ${
                  hl ? "bg-[#FFD700]/5" : ""
                }`}
              >
                <span className={`truncate ${hl ? "text-[#FFD700] font-bold" : "text-[#888]"}`}>{v.venue}</span>
                <span className={`text-right tabular-nums ${ratePct >= 0 ? "text-[#39FF14]" : "text-[#FF003C]"}`}>
                  {ratePct >= 0 ? "+" : ""}
                  {ratePct.toFixed(4)}%
                </span>
                <span className="text-right text-[#666] tabular-nums">{v.intervalHours}h</span>
                <span className={`text-right tabular-nums ${aprPct >= 0 ? "text-[#39FF14]/80" : "text-[#FF003C]/80"}`}>
                  {aprPct >= 0 ? "+" : ""}
                  {aprPct.toFixed(1)}%
                </span>
              </div>
            );
          })}
          <p className="text-[8px] text-[#555] mt-1.5 leading-relaxed">
            Predicted rates as reported by Hyperliquid&apos;s public API; intervals differ per venue.
          </p>
        </>
      )}
    </div>
  );
}
