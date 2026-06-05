"use client";

import React from "react";
import Link from "next/link";
import { usePulseStore } from "@/store/pulse.store";
import { formatCurrency } from "@/lib/format";

/**
 * Global live ticker strip.
 * Pulls live token data from socket store + pulse store and marquees it.
 * Positioned directly under TopBar (40-56px height).
 */
export function LiveTicker() {
    const { items } = usePulseStore();

    const tokens = [
        ...items.MIGRATED,
        ...items.FINAL_STRETCH,
        ...items.NEW,
    ].slice(0, 20);

    if (tokens.length === 0) {
        return (
            <div className="h-9 border-b border-white/5 bg-[#060606] flex items-center px-6 gap-3 text-[10px] font-mono uppercase tracking-widest">
                <span className="text-[#555]">No live tokens yet</span>
            </div>
        );
    }

    // Duplicate the array so the marquee loops seamlessly
    const doubled = [...tokens, ...tokens];

    return (
        <div className="relative h-9 border-b border-white/5 bg-[#060606] overflow-hidden flex items-center">
            {/* Marquee */}
            <div className="flex-1 overflow-hidden">
                <div className="marquee-track">
                    {doubled.map((t, i) => {
                        const positive = t.bondingProgress >= 85;
                        const color = positive ? "#39FF14" : t.bondingProgress >= 50 ? "#FFD700" : "#888";
                        return (
                            <Link
                                key={`${t.tokenId}-${i}`}
                                href={`/terminal/${t.tokenId}`}
                                className="inline-flex items-center px-4 h-9 gap-2 text-[11px] font-mono tabular-nums hover:bg-white/5 transition-colors border-r border-white/5"
                            >
                                <span className="text-[#EDEDED] font-bold">
                                    {t.symbol}
                                </span>
                                <span className="text-[#555]">MC</span>
                                <span className="text-[#EDEDED]">
                                    {formatCurrency(t.marketCap)}
                                </span>
                                <span style={{ color }}>
                                    {(t.bondingProgress || 0).toFixed(1)}%
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#060606] to-transparent pointer-events-none" />
        </div>
    );
}
