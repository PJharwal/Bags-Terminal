"use client";

import type { PulseItem } from "@/lib/types";
import { useSelectionStore } from "@/store/selection.store";
import { formatAge } from "@/lib/lifecycle";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, ExternalLink } from "lucide-react";
import { usePriceFlash } from "@/components/ui/usePriceFlash";
import { cn } from "@/lib/utils";

interface PulseCardCompactProps {
    item: PulseItem;
    isSelected?: boolean;
}

const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    if (num < 1 && num > 0) return num.toFixed(2);
    return num.toString();
};

const getBondingColor = (pct: number): string => {
    if (pct >= 90) return "#39FF14";
    if (pct >= 70) return "#FFD700";
    if (pct >= 40) return "#00F0FF";
    return "#666";
};

export function PulseCardCompact({ item, isSelected }: PulseCardCompactProps) {
    const { selectToken, hoverToken } = useSelectionStore();
    const router = useRouter();

    const hasRisk = item.riskFlags.some(
        (f) => f.severity === "critical" || f.severity === "warn",
    );
    const isCritical = item.riskFlags.some(
        (f) => f.severity === "critical",
    );
    const bondingColor = getBondingColor(item.bondingProgress);
    const imgSrc = item.logoUrl || (item as unknown as { image?: string }).image;
    const mcFlash = usePriceFlash(item.marketCap);

    const handleOpenTerminal = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/terminal/${item.tokenId}`);
    };

    return (
        <motion.div
            onClick={() => selectToken(item.tokenId, 'pulse')}
            onDoubleClick={() => router.push(`/terminal/${item.tokenId}`)}
            onMouseEnter={() => hoverToken(item.tokenId)}
            onMouseLeave={() => hoverToken(null)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`
                relative cursor-pointer transition-all duration-100 group h-full
                ${isSelected ? "bg-acid-green/5" : "hover:bg-white/[0.02]"}
                ${isCritical ? "border-l-2 border-l-[#FF003C]" : hasRisk && !isSelected ? "border-l-2 border-l-[#FFD700]/60" : isSelected ? "border-l-2 border-l-[#39FF14]" : "border-l-2 border-l-transparent"}
            `}
        >
            <div className="flex gap-3 px-3 py-2.5 h-full items-center">
                {/* Token image / avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 bg-[#111] border border-white/8 flex items-center justify-center overflow-hidden group-hover:border-white/20 transition-colors">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={item.symbol}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-meta font-bold font-mono text-muted-mid group-hover:text-fg-soft">
                                {item.symbol.replace("$", "").slice(0, 3)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    {/* Row 1: symbol + age | mcap */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-fg font-mono truncate max-w-[90px] group-hover:text-white transition-colors">
                                {item.symbol}
                            </span>
                            <span className="text-meta text-muted-mid font-mono flex-shrink-0 num">
                                {formatAge(item.ageSeconds)}
                            </span>
                        </div>
                        <span className={cn("text-xs font-bold font-mono text-fg flex-shrink-0 num px-1 -mx-1", mcFlash)}>
                            ${formatCompact(item.marketCap)}
                        </span>
                    </div>

                    {/* Row 2: holders + txns | bonding bar */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-meta font-mono text-muted-mid">
                            <span className="flex items-center gap-1 num">
                                <Users size={9} aria-hidden="true" />{" "}
                                {formatCompact(item.holders)}
                            </span>
                            <span className="flex items-center gap-1 num">
                                <TrendingUp size={9} aria-hidden="true" /> {item.txCount}
                            </span>
                        </div>
                        {/* Bonding progress mini bar */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-12 h-1 bg-elevated overflow-hidden">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: `${item.bondingProgress}%`,
                                        backgroundColor: bondingColor,
                                    }}
                                />
                            </div>
                            <span
                                className="text-meta font-mono font-bold tabular-nums"
                                style={{ color: bondingColor }}
                            >
                                {Math.round(item.bondingProgress)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hover action */}
                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={handleOpenTerminal}
                        className="p-1.5 text-muted-high hover:text-acid-green hover:bg-acid-green/5 transition-all focus-ring"
                        title="Open Terminal"
                        aria-label={`Open ${item.symbol} in terminal`}
                    >
                        <ExternalLink size={12} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
