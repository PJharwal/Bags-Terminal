"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiEqualizer3Line,
  RiRefreshLine,
  RiArrowDownSLine,
  RiCheckLine,
} from "@remixicon/react";
import { SolanaLogo } from "@/components/ui/SolanaLogo";
import type { PulseFilters, TierFilter } from "@/store/pulse.store";

interface AxiomPulseToolbarProps {
  activeTab?: "live" | "bags";
  onTabChange?: (tab: "live" | "bags") => void;
  filters: PulseFilters;
  onFilterChange: (partial: Partial<PulseFilters>) => void;
  feedStatus?: "live" | "polling" | "offline";
  totalTokens?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TIERS: { id: TierFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "high", label: "High" },
  { id: "medium", label: "Mid" },
  { id: "low", label: "Low" },
];

const FEED_DOT: Record<string, string> = {
  live: "#14f195",
  polling: "#fbbf24",
  offline: "#6b6b7a",
};

const activeFilterCount = (f: PulseFilters): number =>
  (f.tierFilter !== "all" ? 1 : 0) + (f.hideRisky ? 1 : 0);

function FilterDropdown({
  filters,
  onFilterChange,
}: {
  filters: PulseFilters;
  onFilterChange: (partial: Partial<PulseFilters>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const count = activeFilterCount(filters);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap border ${
          count > 0
            ? "bg-[#14f195]/10 border-[#14f195]/40 text-[#14f195]"
            : "bg-[#22242d] border-[#27272a] hover:border-[#3f3f46] text-white"
        }`}
      >
        <RiEqualizer3Line className="w-3.5 h-3.5" />
        <span className="mr-0.5">Filter</span>
        {count > 0 && (
          <span className="px-1 rounded-full bg-[#14f195] text-black text-[9px]">
            {count}
          </span>
        )}
        <RiArrowDownSLine className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[230px] bg-[#101114] border border-[#2a2a38] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-3 flex flex-col gap-3">
          {/* Market cap tier */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777a8c]">
              Market Cap
            </span>
            <div className="flex items-center gap-1 bg-[#06070b] p-0.5 rounded-lg border border-[#1d1f26]">
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onFilterChange({ tierFilter: t.id })}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer border-none ${
                    filters.tierFilter === t.id
                      ? "bg-[#14f195] text-black"
                      : "text-neutral-400 hover:text-white bg-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-[#52525b]">
              High ≥ $500K · Mid $100K–500K · Low &lt; $100K
            </span>
          </div>

          {/* Hide risky */}
          <button
            onClick={() => onFilterChange({ hideRisky: !filters.hideRisky })}
            className="flex items-center justify-between cursor-pointer bg-none border-none p-0"
          >
            <span className="text-[11px] font-semibold text-white">
              Hide risky tokens
            </span>
            <span
              className={`w-4 h-4 rounded flex items-center justify-center border ${
                filters.hideRisky
                  ? "bg-[#14f195] border-[#14f195]"
                  : "bg-transparent border-[#3f3f46]"
              }`}
            >
              {filters.hideRisky && (
                <RiCheckLine className="w-3 h-3 text-black" />
              )}
            </span>
          </button>

          {count > 0 && (
            <button
              onClick={() =>
                onFilterChange({ tierFilter: "all", hideRisky: false })
              }
              className="text-[10px] font-bold text-[#777a8c] hover:text-white transition-colors cursor-pointer bg-none border-none p-0 text-left"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AxiomPulseToolbar({
  activeTab = "live",
  onTabChange,
  filters,
  onFilterChange,
  feedStatus = "offline",
  totalTokens = 0,
  isLoading = false,
  onRefresh,
}: AxiomPulseToolbarProps) {
  const Tabs = (
    <div className="flex items-center gap-1 bg-[#101114] p-0.5 rounded-full border border-[#1d1f26]">
      <button
        onClick={() => onTabChange?.("live")}
        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
          activeTab === "live"
            ? "bg-[#14f195] text-black shadow-[0_0_8px_rgba(20,241,149,0.3)]"
            : "text-neutral-400 hover:text-white bg-transparent"
        }`}
      >
        Live Feed
      </button>
      <button
        onClick={() => onTabChange?.("bags")}
        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
          activeTab === "bags"
            ? "bg-[#14f195] text-black shadow-[0_0_8px_rgba(20,241,149,0.3)]"
            : "text-neutral-400 hover:text-white bg-transparent"
        }`}
      >
        BAGS Creations
      </button>
    </div>
  );

  const RightControls = (
    <div className="flex items-center gap-2.5 shrink-0">
      {/* Live token count + feed status dot (real, derived from socket) */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#101114] border border-[#1d1f26]">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: FEED_DOT[feedStatus] }}
        />
        <span className="text-[10px] font-bold tabular-nums text-white">
          {totalTokens}
        </span>
      </div>

      <FilterDropdown filters={filters} onFilterChange={onFilterChange} />

      <button
        onClick={() => onRefresh?.()}
        disabled={isLoading}
        aria-label="Refresh"
        className="w-7 h-7 flex items-center justify-center bg-[#22242d] border border-[#27272a] hover:border-[#3f3f46] rounded-full text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
      >
        <RiRefreshLine
          className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-[#06070b] border-b border-[#1a1b23]">
      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-between px-4 lg:px-5 py-2.5 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[15px] font-semibold text-white tracking-wide">
            Pulse
          </span>
          <div className="flex items-center gap-[5px] h-[28px] pl-[8px] pr-[10px] border-[1.5px] border-[#2a2a38] rounded-full text-[12px] text-white font-semibold">
            <SolanaLogo size={14} />
            <span className="font-semibold text-white">SOL</span>
          </div>
          {Tabs}
        </div>
        {RightControls}
      </div>

      {/* Mobile */}
      <div className="flex lg:hidden items-center justify-between px-2 py-1.5 w-full gap-2">
        <div className="flex items-center gap-[4px] h-[24px] pl-[6px] pr-[8px] border-[1.5px] border-[#2a2a38] rounded-full text-[10px] text-white font-semibold shrink-0">
          <SolanaLogo size={10} />
          <span className="font-semibold text-white">SOL</span>
        </div>
        <div className="flex-1 overflow-x-auto min-w-0" style={{ scrollbarWidth: "none" }}>
          {Tabs}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <FilterDropdown filters={filters} onFilterChange={onFilterChange} />
          <button
            onClick={() => onRefresh?.()}
            disabled={isLoading}
            aria-label="Refresh"
            className="w-7 h-7 flex items-center justify-center bg-[#22242d] border border-[#27272a] rounded-full text-white disabled:opacity-50"
          >
            <RiRefreshLine
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
