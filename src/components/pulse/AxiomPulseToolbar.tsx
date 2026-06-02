"use client";

import { useState } from "react";
import {
  RiSettings4Line,
  RiStarLine,
  RiLineChartLine,
  RiQuestionLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiVolumeUpLine,
  RiCrosshair2Line,
  RiListUnordered,
  RiEqualizer3Line,
  RiSettings3Line,
  RiKeyboardBoxLine,
  RiBookmark3Line,
  RiListCheck,
  RiWalletLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCoinLine,
  RiCircleFill,
} from "@remixicon/react";
import { SolanaLogo } from "@/components/ui/SolanaLogo";
import type { PulseState } from "@/lib/types";

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

  return (
    <div className="bg-[#06070b] border-b border-[#1a1b23]">
      {/* Desktop toolbar */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2.5 px-4 lg:px-9 py-1 border-b border-[#1a1b23] overflow-visible -ml-4">
          <button
            aria-label="Settings"
            className="bg-none border-none text-[#636470] hover:text-[#a1a1aa] cursor-pointer flex transition-colors shrink-0"
          >
            <RiSettings3Line className="w-3 h-3" />
          </button>
          <div className="w-[1px] h-3 bg-[#27272a] shrink-0" />
          <button
            aria-label="Watchlist"
            className="bg-none border-none text-[#636470] hover:text-[#a1a1aa] cursor-pointer flex transition-colors shrink-0"
          >
            <RiStarLine className="w-2.5 h-2.5" />
          </button>
          <button
            aria-label="Active Positions"
            className="bg-none border-none text-white hover:text-[#a1a1aa] cursor-pointer flex transition-colors shrink-0"
          >
            <RiLineChartLine className="w-3 h-3 ml-1.5" />
          </button>
          <div className="w-[1px] h-3 bg-[#27272a] shrink-0" />
        </div>

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
            <button
              aria-label="Help"
              className="bg-none border-none text-[#52525b] hover:text-[#a1a1aa] cursor-pointer p-1 flex transition-colors"
            >
              <RiQuestionLine className="w-4 h-4" />
            </button>

            <button className="flex items-center gap-1 px-2.5 py-1 bg-[#22242d] border border-[#27272a] hover:border-[#3f3f46] rounded-full text-white text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap">
              <RiListCheck className="w-3.5 h-3.5 text-white" />
              <span className="mr-1">Display</span>
              <RiArrowDownSLine className="w-3.5 h-3.5 text-white" />
            </button>

            <div className="flex items-center gap-2">
              <button
                aria-label="Blacklist Settings"
                className="w-6 h-6 flex items-center justify-center bg-none border-none text-[#bfc0c8] hover:text-white hover:bg-[#1a1b23] rounded-full transition-colors cursor-pointer"
              >
                <RiBookmark3Line className="w-3 h-3" />
              </button>
              <button
                aria-label="Hotkeys"
                className="w-6 h-6 flex items-center justify-center bg-none border-none text-[#bfc0c8] hover:text-white hover:bg-[#1a1b23] rounded-full transition-colors cursor-pointer"
              >
                <RiKeyboardBoxLine className="w-3 h-3" />
              </button>
              <button
                aria-label="Alerts"
                className="w-6 h-6 flex items-center justify-center bg-none border-none text-[#bfc0c8] hover:text-white hover:bg-[#1a1b23] rounded-full transition-colors cursor-pointer"
              >
                <RiVolumeUpLine className="w-3 h-3" />
              </button>
              <button
                aria-label="Snipe Settings"
                className="relative w-6 h-6 flex items-center justify-center bg-none border-none text-[#bfc0c8] hover:text-white hover:bg-[#1a1b23] rounded-full transition-colors cursor-pointer"
              >
                <RiCrosshair2Line className="w-3.5 h-3.5" />
                <RiSettings4Line className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5" />
              </button>
            </div>

            {/* Wallet pill */}
            <div className="flex items-center gap-[10px] h-[28px] px-[10px] bg-[#22242d] border border-[#2a2a38] rounded-[16px] cursor-pointer transition-colors duration-150 hover:bg-[#2a2c36]">
              <div className="flex items-center gap-[4px]">
                <RiWalletLine className="w-[16px] h-[16px] text-white" />
                <RiCoinLine className="w-[14px] h-[14px] text-[#14f195]" />
                <span className="text-white text-[12px] font-bold">0</span>
              </div>
              <div className="flex items-center gap-[4px]">
                <span className="text-white text-[12px] font-bold">0</span>
                <RiArrowDownSLine className="w-[16px] h-[16px] text-white font-semibold" />
              </div>
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
          </div>

          <button
            onClick={() => setShowMobileSettings(!showMobileSettings)}
            aria-label="Toggle Mobile Settings"
            className={`flex items-center gap-1.5 py-0.5 bg-[#16161e] rounded-full border border-[#2a2a38] shrink-0 ${
              showMobileSettings ? "px-1.5" : "pl-2 pr-1.5"
            }`}
          >
            {!showMobileSettings && (
              <span className="text-[11px] text-white font-medium">P1</span>
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
            <div className="flex items-center justify-between w-full">
              <button className="flex items-center gap-2 px-2.5 py-0.5 bg-[#22242d] rounded-full border border-[#2a2a38]">
                <RiListUnordered className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] text-white font-bold">Display</span>
                <RiArrowDownSLine className="w-3.5 h-3.5 text-[#6b6b7a] rounded-full" />
              </button>

              <div className="flex items-center gap-3">
                <button className="bg-none border-none cursor-pointer p-0 flex">
                  <RiBookmark3Line className="w-4 h-4 text-[#6b6b7a] hover:text-white transition-colors" />
                </button>
                <button className="relative bg-none border-none cursor-pointer p-0 flex">
                  <RiCrosshair2Line className="w-4 h-4 text-[#6b6b7a] hover:text-white transition-colors" />
                  <RiSettings4Line className="w-[10px] h-[10px] text-[#6b6b7a] absolute -bottom-1 -right-1" />
                </button>
                <button className="bg-none border-none cursor-pointer p-0 flex">
                  <RiQuestionLine className="w-4 h-4 text-[#6b6b7a] hover:text-white transition-colors" />
                </button>
              </div>

              <button className="flex items-center gap-2 px-2.5 py-0.5 bg-[#22242d] rounded-full border border-[#2a2a38]">
                <RiEqualizer3Line className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] text-white font-bold">Filter</span>
                <RiArrowDownSLine className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            <div className="flex items-center justify-between w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div className="flex items-center gap-[10px] h-[24px] px-[8px] bg-[#22242d] border border-[#2a2a38] rounded-[16px]">
                <div className="flex items-center gap-[3px]">
                  <RiWalletLine className="w-[12px] h-[12px] text-white" />
                  <RiCoinLine className="w-[10px] h-[10px] text-[#14f195]" />
                  <span className="text-white text-[10px] font-bold">0</span>
                </div>
                <div className="w-[1px] h-2.5 bg-[#2a2a38]" />
                <span className="text-white text-[10px] font-bold">0</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#16161e] rounded-full border border-[#2a2a38]">
                <span className="text-[10px] text-white font-medium">P1</span>
                <RiArrowDownSLine className="w-2.5 h-2.5 text-[#6b6b7a]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
