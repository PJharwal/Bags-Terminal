"use client";

import React, { useEffect, useState } from "react";
import { LivePulseDot } from "./LivePulseDot";
import { useSocketStore } from "@/store/socket.store";

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

/**
 * Hero badge row — LIVE MAINNET · v2.6.0 · SLOT 298,412,033
 * Slot number auto-increments to feel real.
 */
interface HeroBadgeRowProps {
    version?: string;
    showSlot?: boolean;
    extras?: React.ReactNode;
    className?: string;
}

export function HeroBadgeRow({
    version = "v2.6.0",
    showSlot = true,
    extras,
    className = "",
}: HeroBadgeRowProps) {
    const { isConnected } = useSocketStore();
    // Synthetic slot number that ticks — a visual trust signal
    const [slot, setSlot] = useState(298_412_033);

    useEffect(() => {
        if (!isConnected) return;
        const id = setInterval(() => {
            setSlot((s) => s + Math.floor(Math.random() * 3) + 1);
        }, 1800);
        return () => clearInterval(id);
    }, [isConnected]);

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <Badge
                label={isConnected ? "LIVE MAINNET" : "CONNECTING"}
                variant={isConnected ? "live" : "muted"}
            />
            <Badge label={version} variant="muted" />
            {showSlot && (
                <Badge
                    label="SLOT"
                    value={slot.toLocaleString()}
                    variant="muted"
                />
            )}
            {extras}
        </div>
    );
}

export { Badge };
