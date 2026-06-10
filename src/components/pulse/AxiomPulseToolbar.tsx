"use client";

import { useState } from "react";
import {
  RiSettings4Line,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiEqualizer3Line,
  RiListCheck,
} from "@remixicon/react";
import { SolanaLogo } from "@/components/ui/SolanaLogo";
import { usePulseStore } from "@/store/pulse.store";

interface AxiomPulseToolbarProps {
  activeTab?: "live" | "bags";
  onTabChange?: (tab: "live" | "bags") => void;
  activeChain?: "solana" | "base" | "ethereum";
  onChainChange?: (chain: "solana" | "base" | "ethereum") => void;
  feedStatus?: "live" | "polling" | "offline";
  totalTokens?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const PULSE_TABS = [
  { id: "newPairs" as const, label: "New Pairs" },
  { id: "finalStretch" as const, label: "Final Stretch" },
  { id: "migrated" as const, label: "Migrated" },
];

export function AxiomPulseToolbar({
  activeTab = "live",
  onTabChange,
  activeChain = "solana",
  onChainChange,
  feedStatus = "offline",
  totalTokens = 0,
  isLoading = false,
  onRefresh,
}: AxiomPulseToolbarProps) {
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const { filters, setFiltersAll } = usePulseStore();

  return (
    <div className="bg-[#06070b] border-b border-[#1a1b23]">
      {/* Desktop toolbar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-4 lg:px-5 py-2 overflow-visible gap-4 mt-2">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[15px] font-semibold text-white tracking-wide">
              Pulse
            </span>
            {/* Chain selector */}
            <div className="flex items-center gap-0.5 ml-1">
              <div
                className="flex items-center gap-[5px] h-[28px] pl-[8px] pr-[10px] border-[1.5px] border-[#2a2a38] rounded-full text-[12px] text-white font-semibold"
              >
                <SolanaLogo size={14} />
                <span className="font-semibold text-white">SOL</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#101114] p-0.5 rounded-full border border-[#1d1f26] ml-3">
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
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Launchpad filters */}
            <div className="flex items-center gap-1 bg-[#101114] p-0.5 rounded-full border border-[#1d1f26]">
              <button
                onClick={() => setFiltersAll({ launchpad: "all" })}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "all"
                    ? "bg-[#22242d] text-white"
                    : "text-neutral-500 hover:text-white bg-transparent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFiltersAll({ launchpad: "pumpfun" })}
                className={`w-7 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "pumpfun"
                    ? "bg-[#22242d]"
                    : "bg-transparent hover:bg-[#16161e]"
                }`}
                title="Pump.fun"
              >
                <img src="/pump.fun.svg" alt="Pump.fun" className="w-4 h-4 opacity-80 hover:opacity-100" />
              </button>
              <button
                onClick={() => setFiltersAll({ launchpad: "letsbonk" })}
                className={`w-7 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "letsbonk"
                    ? "bg-[#22242d]"
                    : "bg-transparent hover:bg-[#16161e]"
                }`}
                title="LetsBonk"
              >
                <img src="/letsbonk.fun.svg" alt="LetsBonk" className="w-4 h-4 opacity-80 hover:opacity-100" />
              </button>
              <button
                onClick={() => setFiltersAll({ launchpad: "bags" })}
                className={`w-7 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "bags"
                    ? "bg-[#22242d]"
                    : "bg-transparent hover:bg-[#16161e]"
                }`}
                title="Bags"
              >
                <img src="/bags-logo.svg" alt="Bags" className="w-4 h-4 opacity-80 hover:opacity-100" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  showDisplayDropdown || filters.NEW.hideRisky || filters.NEW.minMarketCap > 0
                    ? "bg-[#14f195] text-black border-[#14f195]"
                    : "bg-[#22242d] border-[#27272a] hover:border-[#3f3f46] text-white"
                }`}
              >
                <RiListCheck className="w-3.5 h-3.5" />
                <span className="mr-1">Display</span>
                <RiArrowDownSLine className="w-3.5 h-3.5" />
              </button>

              {showDisplayDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#101114] border border-[#1d1f26] shadow-lg z-50 p-3 flex flex-col gap-3">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Filters</div>
                  
                  {/* Hide Risky Toggle */}
                  <label className="flex items-center justify-between cursor-pointer text-xs text-white">
                    <span>Hide Risky Pairs</span>
                    <input 
                      type="checkbox"
                      checked={filters.NEW.hideRisky}
                      onChange={(e) => setFiltersAll({ hideRisky: e.target.checked })}
                      className="accent-[#14f195] cursor-pointer"
                    />
                  </label>
                  
                  <div className="w-full h-[1px] bg-[#1d1f26]" />
                  
                  {/* Min Market Cap selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-neutral-400">Min Market Cap</span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: "All", value: 0 },
                        { label: "> $50K", value: 50000 },
                        { label: "> $100K", value: 100000 },
                        { label: "> $500K", value: 500000 },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFiltersAll({ minMarketCap: opt.value })}
                          className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                            filters.NEW.minMarketCap === opt.value
                              ? "bg-[#14f195] text-black border-[#14f195] font-semibold"
                              : "bg-[#16161e] text-white border-[#27272a] hover:border-neutral-500"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-[#1d1f26]" />

                  {/* Tier selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-neutral-400">Tier</span>
                    <div className="grid grid-cols-4 gap-1">
                      {([["All", "all"], ["High", "high"], ["Med", "medium"], ["Low", "low"]] as const).map(([label, value]) => (
                        <button
                          key={value}
                          onClick={() => setFiltersAll({ tierFilter: value })}
                          className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                            filters.NEW.tierFilter === value
                              ? "bg-[#14f195] text-black border-[#14f195] font-semibold"
                              : "bg-[#16161e] text-white border-[#27272a] hover:border-neutral-500"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-[#1d1f26]" />

                  {/* Reset Button */}
                  <button
                    onClick={() => setFiltersAll({ hideRisky: false, minMarketCap: 0, tierFilter: "all", launchpad: "all" })}
                    className="w-full py-1 text-[10px] font-bold bg-[#ef4444] text-white rounded hover:bg-red-600 transition-colors border-none cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile toolbar */}
      <div className="flex flex-col lg:hidden w-full">
        <div className="flex items-center justify-between px-2 py-1 w-full gap-2">
          {/* Chain selector mobile */}
          <div className="flex items-center gap-0.5">
            <div
              className="flex items-center gap-[4px] h-[24px] pl-[6px] pr-[8px] border-[1.5px] border-[#2a2a38] rounded-full text-[10px] text-white font-semibold"
            >
              <SolanaLogo size={10} />
              <span className="font-semibold text-white">SOL</span>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto min-w-0" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-1 bg-[#101114] p-0.5 rounded-full border border-[#1d1f26]">
              <button
                onClick={() => onTabChange?.("live")}
                className={`h-6 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center justify-center border-none ${
                  activeTab === "live"
                    ? "bg-[#14f195] text-black"
                    : "text-[#6b6b7a] hover:text-white bg-transparent"
                }`}
              >
                Live Feed
              </button>
              <button
                onClick={() => onTabChange?.("bags")}
                className={`h-6 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center justify-center border-none ${
                  activeTab === "bags"
                    ? "bg-[#14f195] text-black"
                    : "text-[#6b6b7a] hover:text-white bg-transparent"
                }`}
              >
                BAGS Creations
              </button>
            </div>
            
            {/* Launchpad filters mobile */}
            <div className="flex-shrink-0 flex items-center gap-1 bg-[#101114] p-0.5 rounded-full border border-[#1d1f26]">
              <button
                onClick={() => setFiltersAll({ launchpad: "all" })}
                className={`h-6 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none flex items-center justify-center ${
                  filters.NEW.launchpad === "all"
                    ? "bg-[#22242d] text-white"
                    : "text-neutral-500 hover:text-white bg-transparent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFiltersAll({ launchpad: "pumpfun" })}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "pumpfun"
                    ? "bg-[#22242d]"
                    : "bg-transparent"
                }`}
              >
                <img src="/pump.fun.svg" alt="Pump.fun" className="w-3.5 h-3.5 opacity-80" />
              </button>
              <button
                onClick={() => setFiltersAll({ launchpad: "letsbonk" })}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "letsbonk"
                    ? "bg-[#22242d]"
                    : "bg-transparent"
                }`}
              >
                <img src="/letsbonk.fun.svg" alt="LetsBonk" className="w-3.5 h-3.5 opacity-80" />
              </button>
              <button
                onClick={() => setFiltersAll({ launchpad: "bags" })}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border-none ${
                  filters.NEW.launchpad === "bags"
                    ? "bg-[#22242d]"
                    : "bg-transparent"
                }`}
              >
                <img src="/bags-logo.svg" alt="Bags" className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowMobileSettings(!showMobileSettings)}
            aria-label="Toggle Mobile Settings"
            className={`flex items-center gap-1.5 py-0.5 bg-[#16161e] rounded-full border border-[#2a2a38] shrink-0 ${
              showMobileSettings ? "px-1.5" : "pl-2 pr-1.5"
            }`}
          >
            {!showMobileSettings && (
              <span className="text-[11px] text-white font-medium">
                {filters.NEW.tierFilter === "all" ? "All" : filters.NEW.tierFilter === "high" ? "High" : filters.NEW.tierFilter === "medium" ? "Med" : "Low"}
              </span>
            )}
            {showMobileSettings ? (
              <RiArrowUpSLine className="w-3.5 h-3.5 text-[#526fff]" />
            ) : (
              <RiSettings4Line className="w-3.5 h-3.5 text-[#526fff]" />
            )}
          </button>
        </div>

        {showMobileSettings && (
          <div className="flex flex-col gap-2 px-2 pb-2 w-full">
            <div className="flex items-center justify-end w-full">
              <button
                onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
                className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full border cursor-pointer transition-colors ${
                  showDisplayDropdown || filters.NEW.hideRisky || filters.NEW.minMarketCap > 0
                    ? "bg-[#14f195] text-black border-[#14f195]"
                    : "bg-[#22242d] border-[#2a2a38] text-white"
                }`}
              >
                <RiEqualizer3Line className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Filter</span>
                <RiArrowDownSLine className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-end w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div
                onClick={() => {
                  const order = ["all", "low", "medium", "high"] as const;
                  const next = order[(order.indexOf(filters.NEW.tierFilter) + 1) % 4];
                  setFiltersAll({ tierFilter: next });
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#16161e] rounded-full border border-[#2a2a38] cursor-pointer"
              >
                <span className="text-[10px] text-white font-medium">
                  {filters.NEW.tierFilter === "all" ? "All" : filters.NEW.tierFilter === "high" ? "High" : filters.NEW.tierFilter === "medium" ? "Med" : "Low"}
                </span>
                <RiArrowDownSLine className="w-2.5 h-2.5 text-[#6b6b7a]" />
              </div>
            </div>

            {showDisplayDropdown && (
              <div className="mt-2 w-full rounded-md bg-[#101114] border border-[#1d1f26] p-3 flex flex-col gap-3">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Filters</div>
                
                {/* Hide Risky Toggle */}
                <label className="flex items-center justify-between cursor-pointer text-xs text-white">
                  <span>Hide Risky Pairs</span>
                  <input 
                    type="checkbox"
                    checked={filters.NEW.hideRisky}
                    onChange={(e) => setFiltersAll({ hideRisky: e.target.checked })}
                    className="accent-[#14f195] cursor-pointer"
                  />
                </label>
                
                <div className="w-full h-[1px] bg-[#1d1f26]" />
                
                {/* Min Market Cap selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-neutral-400">Min Market Cap</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: "All", value: 0 },
                      { label: "> $50K", value: 50000 },
                      { label: "> $100K", value: 100000 },
                      { label: "> $500K", value: 500000 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFiltersAll({ minMarketCap: opt.value })}
                        className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                          filters.NEW.minMarketCap === opt.value
                            ? "bg-[#14f195] text-black border-[#14f195] font-semibold"
                            : "bg-[#16161e] text-white border-[#27272a] hover:border-neutral-500"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full h-[1px] bg-[#1d1f26]" />

                {/* Tier selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-neutral-400">Tier</span>
                  <div className="grid grid-cols-4 gap-1">
                    {([["All", "all"], ["High", "high"], ["Med", "medium"], ["Low", "low"]] as const).map(([label, value]) => (
                      <button
                        key={value}
                        onClick={() => setFiltersAll({ tierFilter: value })}
                        className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                          filters.NEW.tierFilter === value
                            ? "bg-[#14f195] text-black border-[#14f195] font-semibold"
                            : "bg-[#16161e] text-white border-[#27272a] hover:border-neutral-500"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full h-[1px] bg-[#1d1f26]" />

                {/* Reset Button */}
                <button
                  onClick={() => setFiltersAll({ hideRisky: false, minMarketCap: 0, tierFilter: "all", launchpad: "all" })}
                  className="w-full py-1 text-[10px] font-bold bg-[#ef4444] text-white rounded hover:bg-red-600 transition-colors border-none cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
