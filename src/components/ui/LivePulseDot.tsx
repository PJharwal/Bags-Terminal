"use client";

import React from "react";

type DotColor = "green" | "red" | "gold" | "blue";

interface LivePulseDotProps {
    color?: DotColor;
    className?: string;
}

export function LivePulseDot({ color = "green", className = "" }: LivePulseDotProps) {
    const cls =
        color === "red"
            ? "live-dot live-dot-red"
            : color === "gold"
              ? "live-dot live-dot-gold"
              : color === "blue"
                ? "live-dot live-dot-blue"
                : "live-dot";
    return <span className={`${cls} ${className}`} />;
}
