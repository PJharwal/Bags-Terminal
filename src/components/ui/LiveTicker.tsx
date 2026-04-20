"use client";

import React from "react";
import Link from "next/link";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore } from "@/store/socket.store";
import { formatCurrency } from "@/lib/format";
import { LivePulseDot } from "./LivePulseDot";

/**
 * Global live ticker strip.
 * Pulls live token data from socket store + pulse store and marquees it.
 * Positioned directly under TopBar (40-56px height).
 */
export function LiveTicker() {
    const { items } = usePulseStore();
    const { isConnected } = useSocketStore();

    const tokens = [
        ...items.MIGRATED,
        ...items.FINAL_STRETCH,
        ...items.NEW,
    ].slice(0, 20);

    if (tokens.length === 0) {
        return (
            <div className="h-9 border-b border-white/5 bg-[#060606] flex items-center px-6 gap-3 text-[10px] font-mono uppercase tracking-widest">
                <LivePulseDot color={isConnected ? "green" : "red"} />
                <span className="text-[#555]">
                    {isConnected ? "LIVE FEED · WAITING FOR TOKENS…" : "CONNECTING…"}
                </span>
            </div>
        );
    }

    // Duplicate the array so the marquee loops seamlessly
    const doubled = [...tokens, ...tokens];

    return (
        <div className="relative h-9 border-b border-white/5 bg-[#060606] overflow-hidden flex items-center">
            {/* Left label */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 h-full border-r border-white/5 bg-[#050505] z-10">
                <LivePulseDot color="green" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#39FF14]">
                    LIVE
                </span>
            </div>

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
                                    {t.bondingProgress}%
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
