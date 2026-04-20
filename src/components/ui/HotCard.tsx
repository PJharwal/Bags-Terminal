"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PulseItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Sparkline, generateSpark } from "./Sparkline";

interface HotCardProps {
    token: PulseItem;
    index?: number;
    stagger?: boolean;
}

/**
 * Compact "Hot Right Now" card — avatar + info + sparkline + delta.
 * Used in the Home hero right-column and anywhere a trending-token teaser fits.
 * Preserves token logo when present; falls back to initial.
 */
export function HotCard({ token, index = 0, stagger = true }: HotCardProps) {
    const initial = (token.symbol || "?").replace("$", "").charAt(0).toUpperCase();
    const hueList = [
        "#FF003C",
        "#39FF14",
        "#00F0FF",
        "#FAFF00",
        "#B084FF",
        "#FFD700",
    ];
    const hue = hueList[initial.charCodeAt(0) % hueList.length];

    const sparkData = useMemo(() => {
        const seed = token.tokenId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
        const bias =
            token.bondingProgress >= 85 ? 1 : token.bondingProgress >= 50 ? 0.4 : -0.2;
        return generateSpark(seed, bias, 20);
    }, [token.tokenId, token.bondingProgress]);

    const trendColor =
        token.bondingProgress >= 85
            ? "#39FF14"
            : token.bondingProgress >= 50
              ? "#FFD700"
              : "#888";

    return (
        <motion.div
            initial={stagger ? { opacity: 0, x: -12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: stagger ? index * 0.08 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
            <Link href={`/terminal/${token.tokenId}`}>
                <div className="card flex items-center gap-3 p-3 cursor-pointer group transition-all hover:border-[#39FF14]/20">
                    {/* Avatar */}
                    {token.logoUrl ? (
                        <img
                            src={token.logoUrl}
                            alt={token.symbol}
                            className="w-9 h-9 object-cover border border-white/10 flex-shrink-0"
                        />
                    ) : (
                        <div
                            className="w-9 h-9 flex items-center justify-center font-[family-name:var(--font-display)] font-bold text-black text-sm flex-shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${hue}, ${hue}aa)`,
                            }}
                        >
                            {initial}
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-mono font-bold text-[#EDEDED] truncate group-hover:text-[#39FF14] transition-colors">
                                {token.symbol}
                            </span>
                            <span className="text-[9px] text-[#666] truncate">
                                {token.name}
                            </span>
                        </div>
                        <div className="text-[10px] font-mono text-[#666] tabular-nums truncate">
                            MC {formatCurrency(token.marketCap)}
                            {token.holders > 0 && (
                                <>
                                    {" · "}
                                    <span className="text-[#888]">
                                        {token.holders.toLocaleString()} hldrs
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline
                        data={sparkData}
                        width={56}
                        height={22}
                        color={trendColor}
                        filled
                    />

                    {/* Bonding percent */}
                    <div
                        className="text-[10px] font-mono font-bold tabular-nums flex-shrink-0"
                        style={{ color: trendColor }}
                    >
                        {token.bondingProgress}%
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
