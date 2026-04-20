"use client";

import React from "react";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    filled?: boolean;
    strokeWidth?: number;
    className?: string;
}

export function Sparkline({
    data,
    width = 96,
    height = 28,
    color,
    filled = false,
    strokeWidth = 1.5,
    className,
}: SparklineProps) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const points = data.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return [x, y];
    });

    const d = points
        .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
        .join(" ");
    const fillD = `${d} L${width},${height} L0,${height} Z`;

    const stroke =
        color || (data[data.length - 1] >= data[0] ? "#39FF14" : "#FF003C");

    return (
        <svg
            width={width}
            height={height}
            className={className}
            style={{ display: "block", flexShrink: 0 }}
        >
            {filled && <path d={fillD} fill={stroke} opacity={0.12} />}
            <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * Generate deterministic-ish sparkline data.
 * seed: any number (use token symbol char code or mc)
 * bias: -1 to 1, influences direction
 * n: number of points
 */
export function generateSpark(seed: number = 1, bias: number = 0, n: number = 30): number[] {
    const out: number[] = [];
    let v = 50 + ((seed * 17) % 30);
    // Pseudo-random seeded using seed value to be stable across re-renders
    for (let i = 0; i < n; i++) {
        v += Math.sin(i * 0.6 + seed) * 4 + (((i * seed) % 7) / 7 - 0.5 + bias * 0.15) * 4;
        out.push(v);
    }
    return out;
}
