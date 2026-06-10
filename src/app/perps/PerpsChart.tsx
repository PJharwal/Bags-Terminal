"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { fetchCandles, type CandleInterval } from "@/services/hyperliquid.service";
import { subscribeHl, useWsStatus, type WsCandle } from "./ws";
import { DepthChart } from "./DepthChart";

const INTERVALS: CandleInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
const REFRESH_MS = 10_000;

type View = "candles" | "depth";

export function PerpsChart({ coin }: { coin: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval_, setInterval_] = useState<CandleInterval>("15m");
  const [view, setView] = useState<View>("candles");
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const wsStatus = useWsStatus();
  const wsLiveRef = useRef(wsStatus === "live");
  wsLiveRef.current = wsStatus === "live";

  // Create chart once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#777a8c",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      crosshair: {
        vertLine: { color: "rgba(255,215,0,0.3)", labelBackgroundColor: "#FFD700" },
        horzLine: { color: "rgba(255,215,0,0.3)", labelBackgroundColor: "#FFD700" },
      },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#39FF14",
      downColor: "#FF003C",
      borderUpColor: "#39FF14",
      borderDownColor: "#FF003C",
      wickUpColor: "#39FF1480",
      wickDownColor: "#FF003C80",
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // Load candles per coin/interval; WS streams the live candle, REST polls as fallback.
  useEffect(() => {
    let alive = true;
    let loaded = false;
    setLoading(true);
    setEmpty(false);

    const load = async (first: boolean) => {
      try {
        const data = await fetchCandles(coin, interval_);
        if (!alive || !candleRef.current || !volumeRef.current) return;
        loaded = true;
        candleRef.current.setData(
          data.map((c) => ({
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );
        volumeRef.current.setData(
          data.map((c) => ({
            time: c.time as UTCTimestamp,
            value: c.volume,
            color: c.close >= c.open ? "rgba(57,255,20,0.25)" : "rgba(255,0,60,0.25)",
          })),
        );
        if (first) chartRef.current?.timeScale().fitContent();
        setEmpty(data.length === 0);
      } catch {
        if (alive && !loaded) setEmpty(true);
      } finally {
        if (alive) setLoading(false);
      }
    };

    const unsub = subscribeHl({ type: "candle", coin, interval: interval_ }, (raw) => {
      if (!alive || !loaded || !candleRef.current || !volumeRef.current) return;
      const k = raw as WsCandle;
      const time = Math.floor(k.t / 1000) as UTCTimestamp;
      const open = parseFloat(k.o);
      const close = parseFloat(k.c);
      candleRef.current.update({
        time,
        open,
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close,
      });
      volumeRef.current.update({
        time,
        value: parseFloat(k.v),
        color: close >= open ? "rgba(57,255,20,0.25)" : "rgba(255,0,60,0.25)",
      });
      setEmpty(false);
    });

    load(true);
    const t = setInterval(() => {
      if (!wsLiveRef.current || !loaded) load(false);
    }, REFRESH_MS);
    return () => {
      alive = false;
      unsub();
      clearInterval(t);
    };
  }, [coin, interval_]);

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 gap-2 flex-wrap">
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => {
                setInterval_(iv);
                setView("candles");
              }}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                interval_ === iv && view === "candles"
                  ? "bg-[#FFD700] text-black"
                  : "text-[#666] hover:text-white"
              }`}
            >
              {iv.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded border border-white/10 overflow-hidden">
            {(["candles", "depth"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 py-1 text-[9px] font-mono font-bold uppercase transition-colors ${
                  view === v ? "bg-[#FFD700] text-black" : "text-[#666] hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="hidden sm:block text-[9px] font-mono text-[#555] tracking-widest">
            {coin}-PERP · HYPERLIQUID
          </span>
        </div>
      </div>
      <div className="relative h-[380px]">
        {/* Candle chart stays mounted (instance preserved) while depth is shown. */}
        <div ref={containerRef} className={`absolute inset-0 ${view === "depth" ? "invisible" : ""}`} />
        {view === "depth" && (
          <div className="absolute inset-0 bg-[#050505]">
            <DepthChart coin={coin} />
          </div>
        )}
        {view === "candles" && loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#555] bg-[#050505]/60">
            Loading chart…
          </div>
        )}
        {view === "candles" && !loading && empty && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#555]">
            No candle data for this market
          </div>
        )}
      </div>
    </div>
  );
}
