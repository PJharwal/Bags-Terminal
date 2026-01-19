"use client";

import { TokenStatsData } from "@/types/token";
import { cn } from "@/lib/utils";

interface TokenAuditProps {
    stats: TokenStatsData | null;
}

const getRiskLevel = (key: string, value: number): "safe" | "warning" | "danger" | "neutral" => {
    switch (key) {
        case "bundler_count":
            if (value > 100) return "danger";
            if (value > 50) return "warning";
            return "safe";
        case "sniper_count":
            if (value > 30) return "danger";
            if (value > 15) return "warning";
            return "safe";
        case "fresh_wallet_count":
            if (value > 50) return "warning";
            return "neutral";
        case "insider_count":
            if (value > 0) return "danger";
            return "safe";
        case "smart_degen_count":
        case "renowned_count":
        case "bluechip_owner_count":
            return value > 0 ? "safe" : "neutral";
        default:
            return "neutral";
    }
};

const dotColors = {
    safe: "bg-green-400",
    warning: "bg-yellow-400",
    danger: "bg-red-400",
    neutral: "bg-slate-400"
};

const valueColors = {
    safe: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400",
    neutral: "text-white"
};

export function TokenAudit({ stats }: TokenAuditProps) {
    if (!stats) {
        return (
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4">
                <h3 className="text-sm font-semibold text-white">Token Audit</h3>
                <p className="text-muted-foreground text-xs mt-2">Loading...</p>
            </div>
        );
    }

    const statItems = [
        { key: "smart_degen_count", label: "Smart Degens", value: stats.smart_degen_count },
        { key: "renowned_count", label: "Renowned", value: stats.renowned_count },
        { key: "bluechip_owner_count", label: "Bluechip", value: stats.bluechip_owner_count },
        { key: "fresh_wallet_count", label: "Fresh Wallets", value: stats.fresh_wallet_count },
        { key: "dex_bot_count", label: "DEX Bots", value: stats.dex_bot_count },
        { key: "insider_count", label: "Insiders", value: stats.insider_count },
        { key: "dev_count", label: "Devs", value: stats.dev_count },
        { key: "bundler_count", label: "Bundlers", value: stats.bundler_count },
        { key: "sniper_count", label: "Snipers", value: stats.sniper_count },
    ];

    const dangerCount = statItems.filter(s => getRiskLevel(s.key, s.value) === "danger").length;
    const warningCount = statItems.filter(s => getRiskLevel(s.key, s.value) === "warning").length;

    let riskScore = 100;
    if (dangerCount > 0) {
        riskScore = Math.max(10, 100 - (dangerCount * 30) - (warningCount * 10));
    } else if (warningCount > 0) {
        riskScore = Math.max(50, 100 - (warningCount * 15));
    }

    const scoreColor = riskScore >= 70 ? "text-green-400" : riskScore >= 40 ? "text-yellow-400" : "text-red-400";

    return (
        <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Token Audit</h3>
                <span className={cn("text-sm font-bold", scoreColor)}>{riskScore}/100</span>
            </div>

            <div className="space-y-1.5">
                {statItems.map((item) => {
                    const risk = getRiskLevel(item.key, item.value);
                    return (
                        <div key={item.key} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", dotColors[risk])} />
                                <span className="text-muted-foreground">{item.label}</span>
                            </div>
                            <span className={cn("font-mono font-medium", valueColors[risk])}>
                                {item.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
