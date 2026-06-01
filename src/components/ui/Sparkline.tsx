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
