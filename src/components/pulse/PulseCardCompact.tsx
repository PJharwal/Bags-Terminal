"use client";

import type { PulseItem } from "@/lib/types";
import { useSelectionStore } from "@/store/selection.store";
import { formatAge } from "@/lib/lifecycle";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Activity, Users, TrendingUp, Zap } from "lucide-react";

interface PulseCardCompactProps {
    item: PulseItem;
    isSelected?: boolean;
}

const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export function PulseCardCompact({ item, isSelected }: PulseCardCompactProps) {
    const { selectToken, hoverToken } = useSelectionStore();
    const router = useRouter();

    const hasRisk = item.riskFlags.some(f => f.severity === 'critical' || f.severity === 'warn');

    const handleOpenTerminal = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/terminal/${item.tokenId}`);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Opens terminal with buy intent - could also open a buy modal
        router.push(`/terminal/${item.tokenId}?action=buy`);
    };

    return (
        <motion.div
            onClick={() => selectToken(item.tokenId, 'pulse')}
            onMouseEnter={() => hoverToken(item.tokenId)}
            onMouseLeave={() => hoverToken(null)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
                relative cursor-pointer transition-all duration-100 border-b border-white/5 group h-full
                ${isSelected ? 'bg-[#39FF14]/5' : 'hover:bg-white/[0.02]'}
            `}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#39FF14] z-20 shadow-[0_0_10px_#39FF14]" />
            )}

            {/* Risk Indicator */}
            {hasRisk && !isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF003C] z-20" />
            )}

            <div className="flex gap-3 p-3 h-full items-center">
                {/* Image / Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#39FF14]/50 transition-colors">
                        {item.image ? (
                            <img src={item.image} alt={item.symbol} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold font-mono text-[#666] group-hover:text-[#39FF14]">
                                {item.symbol.slice(0, 2)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#EDEDED] font-mono group-hover:text-[#39FF14] transition-colors truncate max-w-[80px]">
                                {item.symbol}
                            </span>
                            <span className="text-[10px] text-[#666] font-mono">{formatAge(item.ageSeconds)}</span>
                        </div>
                        <div className="text-xs font-bold font-mono text-[#EDEDED]">
                            ${formatCompact(item.marketCap)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Users size={10} /> {formatCompact(item.holders)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Activity size={10} /> {item.txCount}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={`px-1 py-px rounded text-[9px] ${item.bondingProgress > 80 ? 'badge-green' : 'badge-muted'}`}>
                                {item.bondingProgress}% BOND
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Show on hover */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Trade/Terminal Button */}
                    <button
                        onClick={handleOpenTerminal}
                        className="btn-ghost p-1.5"
                        title="Open Terminal"
                    >
                        <TrendingUp size={12} />
                    </button>

                    {/* Buy Now Button */}
                    <button
                        onClick={handleBuyNow}
                        className="btn-primary px-2 py-1 text-[9px]"
                        title="Buy Now"
                    >
                        <span className="flex items-center gap-1">
                            <Zap size={10} />
                            BUY
                        </span>
                    </button>
                </div>
            </div>

            {/* Hover Glitch Overlay (Optional) */}
            <div className="absolute inset-0 bg-[#39FF14] opacity-0 group-hover:opacity-[0.02] pointer-events-none mix-blend-overlay" />
        </motion.div>
    );
}