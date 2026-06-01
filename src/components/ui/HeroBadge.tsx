"use client";

import React from "react";
import { LivePulseDot } from "./LivePulseDot";

interface BadgeProps {
    label: string;
    value?: string | number;
    variant?: "live" | "muted" | "green" | "gold" | "blue";
    className?: string;
}

function Badge({ label, value, variant = "muted", className = "" }: BadgeProps) {
    const styles: Record<string, string> = {
        live: "text-[#39FF14] border-[#39FF14]/25 bg-[#39FF14]/5",
        green: "text-[#39FF14] border-[#39FF14]/25 bg-[#39FF14]/5",
        gold: "text-[#FFD700] border-[#FFD700]/25 bg-[#FFD700]/5",
        blue: "text-[#00F0FF] border-[#00F0FF]/25 bg-[#00F0FF]/5",
        muted: "text-[#888] border-white/10 bg-transparent",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.1em] border ${styles[variant]} ${className}`}
        >
            {variant === "live" && <LivePulseDot />}
            <span>{label}</span>
            {value != null && (
                <span className="tabular-nums text-[#EDEDED]">{value}</span>
            )}
        </span>
    );
}

interface HeroBadgeRowProps {
    extras?: React.ReactNode;
    className?: string;
}

// Honest, static network badge — no fabricated version/slot/connection chrome.
export function HeroBadgeRow({ extras, className = "" }: HeroBadgeRowProps) {
    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <Badge label="Solana · Mainnet" variant="muted" />
            {extras}
        </div>
    );
}

export { Badge };
