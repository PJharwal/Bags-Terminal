"use client";

import React from "react";

interface DeltaProps {
    value: number;
    small?: boolean;
    showSign?: boolean;
    className?: string;
}

export function Delta({ value, small = false, showSign = true, className = "" }: DeltaProps) {
    const pos = value >= 0;
    const color = pos ? "#39FF14" : "#FF003C";

    return (
        <span
            className={`font-mono tabular-nums inline-flex items-center gap-0.5 ${className}`}
            style={{
                color,
                fontSize: small ? 10 : 12,
                fontWeight: 700,
            }}
        >
            <span style={{ fontSize: small ? 8 : 10 }}>{pos ? "▲" : "▼"}</span>
            {showSign && pos ? "+" : ""}
            {Math.abs(value).toFixed(2)}%
        </span>
    );
}
