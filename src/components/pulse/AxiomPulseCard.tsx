"use client";

import React, { memo, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RiCheckLine,
  RiUserLine,
  RiFlashlightFill,
  RiFileCopyFill,
  RiSpyFill,
  RiCrosshair2Fill,
  RiUserStarFill,
  RiWaterFlashFill,
  RiShieldCheckFill,
} from "@remixicon/react";
import type { PulseItem } from "@/lib/types";

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return "$0";
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value < 1) return "0";
  return Math.round(value).toString();
}

function formatTimeAgo(ageSeconds: number): string {
  if (ageSeconds < 60) return `${ageSeconds}s`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const PumpIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-45 12 12)">
      {/* Top half: green */}
      <path d="M12,2 C9.2,2 7,4.2 7,7 L7,12 L17,12 L17,7 C17,4.2 14.8,2 12,2 Z" fill="#14f195" />
      {/* Bottom half: cyan */}
      <path d="M7,12 L7,17 C7,19.8 9.2,22 12,22 C14.8,22 17,19.8 17,17 L17,12 L7,12 Z" fill="#00ffcc" />
      {/* Line divider */}
      <line x1="7" y1="12" x2="17" y2="12" stroke="#000000" strokeWidth="2" />
    </g>
  </svg>
);

const RaydiumIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.5 3h6.5c3.3 0 6 2.7 6 6 0 2.4-1.4 4.5-3.5 5.4l4.5 6.6H14.5l-4-6H8v6H5.5V3zm2.5 2.5v5.5h4c1.9 0 3.5-1.6 3.5-3.5S13.9 5.5 12 5.5H8z"
      fill="#00f0ff"
    />
  </svg>
);

const MeteoraIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18L8 6H11L6 18H3Z" fill="#14f195" />
    <path d="M9 18L13 8.4L15 6H12L8 15.6L9 18Z" fill="#00ffcc" />
    <path d="M21 18L16 6H13L18 18H21Z" fill="#14f195" />
    <path d="M15 18L11 8.4L9 6H12L16 15.6L15 18Z" fill="#00ffcc" />
  </svg>
);

const RING_COLORS = ["#16a34a", "#ef4444", "#fbbf24"];
const getRingColor = (tokenId: string): string =>
  RING_COLORS[tokenId.charCodeAt(0) % RING_COLORS.length];

const getMarketCapColor = (marketCap: number): string => {
  if (marketCap > 2000000) return "#16a34a";
  if (marketCap > 1000000) return "#d6bc3a";
  return "#52c5ff";
};

interface AxiomPulseCardProps {
  token: PulseItem;
}

function AxiomPulseCardComponent({ token }: AxiomPulseCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  // Reset the failed flag when the logo changes (e.g. backfilled via
  // metadata_updated) so the new image gets a fresh attempt. Adjusting state
  // during render per React's "you might not need an effect" guidance.
  const [renderedLogo, setRenderedLogo] = useState(token.logoUrl);
  if (renderedLogo !== token.logoUrl) {
    setRenderedLogo(token.logoUrl);
    setImgFailed(false);
  }

  const ringColor = getRingColor(token.tokenId);
  const mcColor = useMemo(
    () => getMarketCapColor(token.marketCap),
    [token.marketCap],
  );

  const renderProtocolIcon = () => {
    const src = (token.protocolSource || "").toLowerCase();
    if (src.includes("pump")) {
      return (
        <div title="Pump.fun" className="flex items-center justify-center w-full h-full">
          <PumpIcon />
        </div>
      );
    }
    if (src.includes("meteora")) {
      return (
        <div title="Meteora" className="flex items-center justify-center w-full h-full">
          <MeteoraIcon />
        </div>
      );
    }
    if (src.includes("raydium")) {
      return (
        <div title="Raydium" className="flex items-center justify-center w-full h-full">
          <RaydiumIcon />
        </div>
      );
    }
    
    // Fallback based on state
    if (token.state === "MIGRATED") {
      return (
        <div title="Raydium" className="flex items-center justify-center w-full h-full">
          <RaydiumIcon />
        </div>
      );
    }
    return (
      <div title="Pump.fun" className="flex items-center justify-center w-full h-full">
        <PumpIcon />
      </div>
    );
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.tokenId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bondingProgress = token.bondingProgress || 0;
  const netChange = token.marketCap > 0 ? 0 : 0;
  const netColor = netChange >= 0 ? "#16a34a" : "#ef4444";
  const netSign = netChange >= 0 ? "+" : "";

  const greenPct = 50;
  const redPct = 50;

  const cardContent = (
    <div
      onClick={() => router.push('/terminal/' + token.tokenId)}
      className="relative w-full flex items-center pl-2 lg:pl-3 pr-2 py-2 border-b border-[#1a1b23] cursor-pointer gap-2 min-h-[64px] transition-colors duration-200 tabular-nums hover:bg-[#252630] bg-transparent"
    >
      {/* Avatar */}
      <div className="shrink-0 w-[55px]">
        <div className="relative w-[55px] h-[55px]">
          <div
            className="absolute inset-[-2px] rounded-lg border-[1.5px]"
            style={{ borderColor: ringColor }}
          />
          {token.logoUrl && !imgFailed ? (
            <img
              src={token.logoUrl}
              alt={token.name}
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className="absolute inset-[1px] rounded-[6px] w-[calc(100%-2px)] h-[calc(100%-2px)] object-cover"
            />
          ) : (
            <div className="absolute inset-[1px] rounded-[6px] bg-[#1a1a1f] flex items-center justify-center">
              <span className="text-[14px] font-bold text-[#6b6b7a]">
                {token.symbol?.replace("$", "").charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="absolute bottom-[-3px] right-[-3px] w-[18px] h-[18px] bg-black rounded-full border-[1.5px] border-[#2a2a35] flex items-center justify-center">
            {renderProtocolIcon()}
          </div>
        </div>
        <div className="h-[8px] w-[42px] mx-auto mt-1.5 rounded bg-[#1a1a1f]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
        {/* Row 1: Name · Symbol · Copy | MC · Vol */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-[12px] text-[#fcfcfc] truncate">
                {token.name}
              </span>
              <span className="text-[10px] text-[#777a8c] shrink-0 font-semibold">
                {token.symbol}
              </span>
              <div
                onClick={handleCopy}
                className="relative flex items-center gap-1 shrink-0 px-1 py-[1px] bg-[#16161e] border border-[#23242e] rounded text-[9px] text-[#777a8c] hover:text-[#fcfcfc] hover:border-[#38394e] cursor-pointer transition-all font-mono"
              >
                <span>{token.tokenId ? `${token.tokenId.slice(0, 4)}...${token.tokenId.slice(-4)}` : ""}</span>
                {copied ? (
                  <RiCheckLine className="w-[10.5px] h-[10.5px] text-[#16a34a]" />
                ) : (
                  <RiFileCopyFill className="w-[10.5px] h-[10.5px]" />
                )}
                {copied && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-[2px] bg-black text-[8px] text-white rounded shadow border border-[#2a2a35] pointer-events-none">
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Time · Holder Counts */}
            <div className="flex items-center gap-1 text-[9.8px] text-[#777a8c] mt-[1px] overflow-hidden">
              <span className="text-[#16a34a] shrink-0 min-w-[20px]">
                {formatTimeAgo(token.ageSeconds)}
              </span>
              {token.holders > 0 && (
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-[2px] shrink-0">
                    <RiUserLine className="w-[11px] h-[11px] shrink-0 text-[#51c4fe]" />
                    <span className="text-[#fcfcfc]">
                      {formatCompactNumber(token.holders)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MC · Vol (right side) */}
          <div className="flex flex-col items-end gap-[1px] shrink-0 min-w-[56px] lg:min-w-[64px]">
            <div className="flex items-center gap-[3px]">
              <span className="text-[9px] text-[#777a8c]">MC</span>
              <span
                className="text-[12px] font-semibold"
                style={{ color: mcColor }}
              >
                {formatCurrency(token.marketCap)}
              </span>
            </div>
            <div className="flex items-center gap-[3px] -mt-1">
              <span className="text-[9px] text-[#777a8c] -mb-1">V</span>
              <span className="text-[12px] font-semibold text-[#fcfcfc]">
                {formatCurrency(token.volume24h || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Liquidity · Net change | TX count · Buy/Sell bar */}
        <div className="flex items-center justify-between w-full gap-2 -mt-0.5">
          <div className="flex items-center gap-[6px] text-[9.8px] overflow-hidden min-w-0">
            {token.liquidity > 0 && (
              <span className="flex items-center gap-[2px] shrink-0">
                <RiWaterFlashFill className="w-3 h-3 text-[#52c5ff]" />
                <span className="text-white font-semibold">
                  ${formatCompactNumber(token.liquidity)}
                </span>
              </span>
            )}
            <span className="shrink-0" style={{ color: netColor }}>
              <span className="text-[#777a8c]">N</span>{" "}
              <span className="font-semibold">
                {netSign}
                {Math.min(Math.abs(netChange), 9999).toFixed(2)}%
              </span>
            </span>
          </div>
          <div className="flex items-center gap-[6px] text-[9px] shrink-0">
            <span className="flex items-center gap-[2px] shrink-0 min-w-[40px] justify-end">
              <span className="text-[#777a8c]">TX</span>
              <span className="text-[#fcfcfc] font-semibold">
                {formatCompactNumber(token.txCount)}
              </span>
            </span>
            <div className="flex w-[60px] sm:w-[70px] h-[4px] rounded-[2px] overflow-hidden shrink-0">
              <div className="bg-[#16a34a]" style={{ width: `${greenPct}%` }} />
              <div className="bg-[#ef4444]" style={{ width: `${redPct}%` }} />
            </div>
          </div>
        </div>

        {/* Row 4: Holder stats · Quick-buy */}
        <div className="flex items-center justify-between gap-2 -mt-0.7">
          <div className="flex items-center gap-[7px] flex-nowrap overflow-hidden min-w-0 text-[9px]">
            <span className="flex items-center gap-[2px] shrink-0">
              <RiUserLine className="w-[10px] h-[10px] text-[#16a34a]" />
              <span className="text-[#16a34a] font-semibold">0%</span>
            </span>
            <span className="flex items-center gap-[2px] shrink-0">
              <RiUserStarFill className="w-[10px] h-[10px] text-[#fbbf24]" />
              <span className="text-[#fbbf24] font-semibold">0%</span>
            </span>
            <span className="flex items-center gap-[2px] shrink-0">
              <RiCrosshair2Fill className="w-[10px] h-[10px] text-[#ef4444]" />
              <span className="text-[#ef4444] font-semibold">0%</span>
            </span>
            <span className="flex items-center gap-[2px] shrink-0">
              <RiShieldCheckFill className="w-[10px] h-[10px] text-[#52c5ff]" />
              <span className="text-[#52c5ff] font-semibold">0%</span>
            </span>
            <span className="flex items-center gap-[2px] shrink-0">
              <RiSpyFill className="w-[10px] h-[10px] text-[#a855f7]" />
              <span className="text-[#a855f7] font-semibold">0%</span>
            </span>
          </div>

          <button
            onClick={(e) => e.stopPropagation()}
            className="px-1 py-[1px] rounded-xl text-[10px] font-semibold bg-[#526fff] text-black border-none cursor-pointer whitespace-nowrap flex items-center gap-[2px] min-w-[54px] justify-center shrink-0"
          >
            <RiFlashlightFill className="w-3 h-3 text-black" />
            <span className="text-black">0.1 SOL</span>
          </button>
        </div>
      </div>
    </div>
  );

  return cardContent;
}

export const AxiomPulseCard = memo(AxiomPulseCardComponent);
