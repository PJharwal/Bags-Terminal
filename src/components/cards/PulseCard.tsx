"use client";

import type { PulseItem } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useSelectionStore } from "@/store/selection.store";

interface PulseCardProps {
    item: PulseItem;
}

function formatAge(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

function getRiskColor(severity: string): string {
    switch (severity) {
        case 'critical': return 'bg-[#E74C3C]';
        case 'warn': return 'bg-[#F1C40F]';
        default: return 'bg-[#2ECC71]';
    }
}

function getBondingColor(progress: number): string {
    if (progress >= 85) return 'text-[#2ECC71]';
    if (progress >= 50) return 'text-[#F1C40F]';
    return 'text-[#9AA0A6]';
}

export function PulseCard({ item }: PulseCardProps) {
    const { selectToken, selectedTokenId, hoveredTokenId, hoverToken } = useSelectionStore();
    const isSelected = selectedTokenId === item.tokenId;
    const isHovered = hoveredTokenId === item.tokenId;

    return (
        <div
            onClick={() => selectToken(item.tokenId, 'pulse')}
            onMouseEnter={() => hoverToken(item.tokenId)}
            onMouseLeave={() => hoverToken(null)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                    ? 'bg-[#4C8DFF]/10 border-[#4C8DFF]/30'
                    : isHovered
                        ? 'bg-white/[0.04] border-white/10'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}
        >
            {/* Header: Symbol + Deployer */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {item.symbol.slice(1, 3)}
                    </div>
                    <div>
                        <div className="font-medium text-sm">{item.symbol}</div>
                        <div className="text-[10px] text-[#9AA0A6] font-mono">@{item.deployer}</div>
                    </div>
                </div>
                {/* Risk dots */}
                <div className="flex gap-1">
                    {item.riskFlags.map((flag, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${getRiskColor(flag.severity)}`}
                            title={flag.type.replace(/_/g, ' ')}
                        />
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
                <div className="flex items-center gap-1">
                    <span className="text-[#9AA0A6]">Age</span>
                    <span className="font-mono">{formatAge(item.ageSeconds)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[#9AA0A6]">Holders</span>
                    <span className="font-mono">{formatNumber(item.holders)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[#9AA0A6]">Tx</span>
                    <span className="font-mono">{formatNumber(item.txCount)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[#9AA0A6]">MC</span>
                    <span className="font-mono">{formatCurrency(item.marketCap)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[#9AA0A6]">Liq</span>
                    <span className="font-mono">{formatCurrency(item.liquidity)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[#9AA0A6]">Bond</span>
                    <span className={`font-mono font-bold ${getBondingColor(item.bondingProgress)}`}>
                        {item.bondingProgress}%
                    </span>
                </div>
            </div>
        </div>
    );
}
