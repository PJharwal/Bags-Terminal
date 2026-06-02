"use client";

import { useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  RiEqualizer3Line,
  RiFlashlightFill,
} from "@remixicon/react";
import { AxiomPulseCard } from "./AxiomPulseCard";
import type { PulseItem } from "@/lib/types";

interface AxiomPulseColumnProps {
  title: string;
  tokens: PulseItem[];
  isLoading?: boolean;
  color?: string;
  className?: string;
}

function AxiomPulseColumnSkeleton() {
  return (
    <div className="shimmer-column h-full">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="relative flex items-start pl-2 lg:pl-3 pr-1 py-2 border-b border-[#1a1b23] bg-transparent gap-2 min-h-[64px] mr-2"
        >
          <div className="shrink-0 w-[55px]">
            <div className="relative w-[55px] h-[55px]">
              <div className="absolute inset-[-2px] rounded-lg border-[1.5px] border-[#2a2a35]" />
              <div className="absolute inset-[1px] rounded-[6px] h-auto bg-[#1a1a1f] animate-pulse" />
              <div className="absolute bottom-[-3px] right-[-3px] w-[18px] h-[18px] bg-black rounded-full border-[1.5px] border-[#2a2a35]" />
            </div>
            <div className="h-[8px] w-[42px] mx-auto mt-1.5 rounded bg-[#1a1a1f] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="h-[12px] w-[80px] bg-[#1a1a1f] rounded animate-pulse" />
                  <div className="h-[10px] w-[32px] bg-[#1a1a1f] rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1 mt-[2px]">
                  <div className="h-[10px] w-[20px] bg-[#1a1a1f] rounded animate-pulse" />
                  <div className="h-[11px] w-[11px] bg-[#1a1a1f] rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-[1px] shrink-0">
                <div className="flex items-center gap-[3px]">
                  <div className="h-[9px] w-[14px] bg-[#1a1a1f] rounded animate-pulse" />
                  <div className="h-[12px] w-[46px] bg-[#1a1a1f] rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AxiomPulseColumn({
  title,
  tokens,
  isLoading = false,
  color = "#526fff",
  className,
}: AxiomPulseColumnProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const estimateSize = useCallback(() => 85, []);

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
  });

  return (
    <div
      className={`w-full flex flex-col h-full min-h-0 bg-[#101114] border-r border-[#1d1f26] ${className || ""}`}
    >
      {/* Column header */}
      <div className="hidden lg:flex items-center justify-between px-2 py-1.5 border-b border-[#1d1f26] bg-[#101114] sticky top-0 z-10 mb-0.5">
        <h2 className="text-[12.5px] font-semibold text-white m-0">
          {title}
        </h2>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-[3px] border border-[#2a2a35] rounded-full bg-transparent">
            <div className="flex items-center gap-[3px]">
              <RiFlashlightFill className="w-3 h-3 text-[#6b6b7a]" />
              <span className="text-[10px] text-white mr-4">
                {tokens.length}
              </span>
            </div>

            <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: color }} />
            <div className="w-[1px] h-3 bg-[#2a2a35]" />

            {["P1", "P2", "P3"].map((preset, index) => (
              <button
                key={preset}
                className={`p-0 px-[1px] text-[10px] font-medium border-none cursor-pointer bg-transparent ${
                  index === 0 ? "text-[#526fff]" : "text-white"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button className="relative p-1 bg-none border-none text-white cursor-pointer flex items-center hover:text-[#526fff] transition-colors">
            <RiEqualizer3Line className="w-[12px] h-[12px]" />
            <span className="absolute -top-0 -right-0.5 h-1 w-1 rounded-full bg-[#526fff]" />
          </button>
        </div>
      </div>

      {/* Column content */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a35 transparent" }}
      >
        {isLoading ? (
          <AxiomPulseColumnSkeleton />
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#6b6b7a] space-y-2">
            <RiEqualizer3Line className="w-8 h-8 opacity-50" />
            <span className="text-[13px] font-medium">No matching Results</span>
            <button className="text-[#526fff] text-[11px] hover:underline cursor-pointer">
              Adjust Filters
            </button>
          </div>
        ) : (
          <div
            className="w-full relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const token = tokens[virtualRow.index];
              return (
                <div
                  key={token.tokenId}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <AxiomPulseCard token={token} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
