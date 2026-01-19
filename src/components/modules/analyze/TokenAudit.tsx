"use client";

import { TokenStatsData } from "@/types/token";
import { cn } from "@/lib/utils";
import {
    computeTokenAudit,
    getRiskLevel,
    getScoreColor,
    getRiskColor,
    type RiskLevel
} from "@/skills/analyze/tokenAudit.engine";

interface TokenAuditProps {
    stats: TokenStatsData | null;
}

// Map risk level to Tailwind classes
const dotColors: Record<RiskLevel, string> = {
    safe: "bg-[#39FF14]",
    warning: "bg-[#FAFF00]",
    danger: "bg-[#FF003C]",
    neutral: "bg-[#444444]"
};

const valueColors: Record<RiskLevel, string> = {
    safe: "text-[#39FF14]",
    warning: "text-[#FAFF00]",
    danger: "text-[#FF003C]",
    neutral: "text-[#EDEDED]"
};

export function TokenAudit({ stats }: TokenAuditProps) {
    if (!stats) {
        return (
            <div className="border border-[rgba(255,255,255,0.12)] bg-[#0A0A0A] p-4 animate-pulse">
                <h3 className="text-sm font-bold tracking-wider text-[#EDEDED] font-sans">TOKEN AUDIT</h3>
                <p className="text-[#444444] text-xs mt-2 font-mono">Initializing...</p>
            </div>
        );
    }

    // Use skill engine for computation
    const audit = computeTokenAudit(stats);
    const scoreColor = getScoreColor(audit.score);

    return (
        <div className="border border-[rgba(255,255,255,0.12)] bg-[#0A0A0A] p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2">
                <h3 className="text-sm font-bold tracking-wider text-[#EDEDED] font-sans">TOKEN AUDIT</h3>
                <span className="text-sm font-bold" style={{ color: scoreColor }}>
                    {audit.score}/100
                </span>
            </div>

            <div className="space-y-1.5 pt-1">
                {audit.breakdown.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-none", dotColors[item.risk])} />
                            <span className="text-[#888888] uppercase">{item.label}</span>
                        </div>
                        <span className={cn("font-medium", valueColors[item.risk])}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

