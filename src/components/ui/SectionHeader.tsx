"use client";

import React from "react";

interface SectionHeaderProps {
    kicker?: string;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    accent?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Evolved Brutalist section header pattern.
 *   [KICKER in accent color, small uppercase]
 *   Large Display Title
 *   subtitle in dim
 *                                           [right slot — chips, badges, actions]
 */
export function SectionHeader({
    kicker,
    title,
    subtitle,
    right,
    accent = "#39FF14",
    size = "md",
    className = "",
}: SectionHeaderProps) {
    const titleSize =
        size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-base" : "text-lg sm:text-xl";

    return (
        <div
            className={`flex items-end justify-between gap-4 mb-4 ${className}`}
        >
            <div className="min-w-0">
                {kicker && (
                    <div
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2"
                        style={{ color: accent }}
                    >
                        <span className="w-1.5 h-1.5" style={{ background: accent }} />
                        {kicker}
                    </div>
                )}
                <h2
                    className={`${titleSize} font-bold uppercase tracking-tight text-[#EDEDED] leading-[1.1] font-[family-name:var(--font-display)]`}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-[11px] font-mono text-[#666] mt-1.5 leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>
            {right && <div className="flex-shrink-0">{right}</div>}
        </div>
    );
}
