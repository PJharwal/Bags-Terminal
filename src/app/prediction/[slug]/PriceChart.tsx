"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { fetchPriceHistory } from "@/services/polymarket.service";

const TIME_RANGES = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "ALL", value: "max" },
] as const;

interface PriceChartProps {
  tokenId: string;
  outcomeLabels: [string, string];
}

export function PriceChart({ tokenId, outcomeLabels }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [range, setRange] = useState<string>("max");
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [lastProb, setLastProb] = useState<number | null>(null);

  // Create chart once (lightweight-charts v5: addSeries(LineSeries, ...)).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#888",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      crosshair: {
        vertLine: { color: "rgba(0,240,255,0.3)", labelBackgroundColor: "#00F0FF" },
        horzLine: { color: "rgba(0,240,255,0.3)", labelBackgroundColor: "#00F0FF" },
      },
    });
    const line = chart.addSeries(LineSeries, {
      color: "#00F0FF",
      lineWidth: 2,
      priceLineVisible: false,
      priceFormat: {
        type: "custom",
        formatter: (v: number) => `${v.toFixed(0)}%`,
        minMove: 0.1,
      },
    });

    chartRef.current = chart;
    lineRef.current = line;
    return () => {
      chart.remove();
      chartRef.current = null;
      lineRef.current = null;
    };
  }, []);

  // Load price history per token/range.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setEmpty(false);

    fetchPriceHistory(tokenId, range)
      .then((points) => {
        if (!alive || !lineRef.current) return;
        // lightweight-charts requires strictly-ascending unique timestamps —
        // sort and dedupe defensively before setData.
        const seen = new Set<number>();
        const data = points
          .slice()
          .sort((a, b) => a.t - b.t)
          .filter((pt) => {
            if (!Number.isFinite(pt.t) || !Number.isFinite(pt.p)) return false;
            if (seen.has(pt.t)) return false;
            seen.add(pt.t);
            return true;
          })
          .map((pt) => ({
            time: pt.t as UTCTimestamp,
            value: pt.p * 100, // probability %
          }));
        lineRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
        setLastProb(data.length > 0 ? data[data.length - 1].value : null);
        setEmpty(data.length === 0);
      })
      .catch(() => {
        if (alive) setEmpty(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tokenId, range]);

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      {/* Legend + time-range selector */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 gap-2 flex-wrap">
        <div className="text-[10px] text-[#888] tabular-nums">
          <span className="font-bold text-[#00F0FF]">{outcomeLabels[0]}</span>
          {lastProb != null && (
            <>
              {" "}
              <span className="font-bold text-white">{Math.round(lastProb)}%</span>
              <span className="text-[#555]">
                {" "}· {outcomeLabels[1]} {Math.round(100 - lastProb)}%
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setRange(tr.value)}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                range === tr.value
                  ? "bg-[#00F0FF] text-black"
                  : "text-[#666] hover:text-white"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[300px]">
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#555] bg-[#050505]/60">
            Loading chart…
          </div>
        )}
        {!loading && empty && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#555]">
            No price data available
          </div>
        )}
      </div>
    </div>
  );
}
