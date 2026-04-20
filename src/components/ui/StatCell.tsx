"use client";

import React from "react";
import { Delta } from "./Delta";

interface StatCellProps {
    label: string;
    value: string | React.ReactNode;
    delta?: number;
    accent?: "green" | "gold" | "blue" | "red" | "default";
    size?: "sm" | "md" | "lg";
    className?: string;
}

const ACCENT_COLORS: Record<string, { border: string; text: string }> = {
    green:   { border: "rgba(57, 255, 20, 0.6)",  text: "#39FF14" },
    gold:    { border: "rgba(255, 215, 0, 0.6)",  text: "#FFD700" },
    blue:    { border: "rgba(0, 240, 255, 0.6)",  text: "#00F0FF" },
    red:     { border: "rgba(255, 0, 60, 0.6)",   text: "#FF003C" },
    default: { border: "rgba(255, 255, 255, 0.12)", text: "#EDEDED" },
};

/**
 * Stat cell with colored left border (data-dense layout primitive).
 *  |━━━━━
 *  |  LABEL
 *  |  VALUE (colored)
 *  |  Δ 4.2%
 */
export function StatCell({
    label,
    value,
    delta,
    accent = "default",
    size = "md",
    className = "",
}: StatCellProps) {
    const colors = ACCENT_COLORS[accent];
    const valueSize =
        size === "lg" ? "text-xl sm:text-2xl" : size === "sm" ? "text-sm" : "text-base sm:text-lg";
    const labelSize = size === "sm" ? "text-[9px]" : "text-[10px]";

    return (
        <div
            className={`py-1.5 pl-3 border-l-2 transition-colors ${className}`}
            style={{ borderLeftColor: colors.border }}
        >
            <div
                className={`${labelSize} font-mono font-bold uppercase tracking-[0.1em] text-[#666] mb-1`}
            >
                {label}
            </div>
            <div
                className={`${valueSize} font-mono font-bold tabular-nums leading-tight`}
                style={{ color: colors.text }}
            >
                {value}
            </div>
            {delta != null && (
                <div className="mt-0.5">
                    <Delta value={delta} small />
                </div>
            )}
        </div>
    );
}
