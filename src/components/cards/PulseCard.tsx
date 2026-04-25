"use client";

import type { PulseItem } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useSelectionStore } from "@/store/selection.store";
import { BagsFeeIndicator } from "@/components/ui/BagsFeeIndicator";

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
        case 'critical': return 'bg-[#FF003C]';
        case 'warn': return 'bg-[#FAFF00]';
        default: return 'bg-acid-green';
    }
}

function getBondingColor(progress: number): string {
    if (progress >= 85) return 'text-acid-green';
    if (progress >= 50) return 'text-[#FAFF00]';
    return 'text-muted-high';
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
            className={`card p-3 cursor-pointer ${isSelected
                    ? 'bg-acid-green/5 !border-[#39FF14]/20 shadow-[0_0_12px_rgba(57,255,20,0.06)]'
                    : isHovered
                        ? '!border-white/10'
                        : ''
                }`}
        >
            {/* Header: Symbol + Deployer */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-meta font-bold">
                        {item.symbol.slice(1, 3)}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">{item.symbol}</span>
                            <BagsFeeIndicator tokenMint={item.tokenId} size="sm" />
                        </div>
                        <div className="text-meta text-muted-mid font-mono">@{item.deployer}</div>
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
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-meta">
                <div className="flex items-center gap-1">
                    <span className="text-muted-mid">Age</span>
                    <span className="font-mono">{formatAge(item.ageSeconds)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-mid">Holders</span>
                    <span className="font-mono">{formatNumber(item.holders)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-mid">Tx</span>
                    <span className="font-mono">{formatNumber(item.txCount)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-mid">MC</span>
                    <span className="font-mono">{formatCurrency(item.marketCap)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-mid">Liq</span>
                    <span className="font-mono">{formatCurrency(item.liquidity)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-mid">Bond</span>
                    <span className={`font-mono font-bold num ${getBondingColor(item.bondingProgress)}`}>
                        {Math.round(item.bondingProgress)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
