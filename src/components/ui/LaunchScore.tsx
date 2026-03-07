"use client";

import { getScoreColor, getScoreBgColor } from "@/lib/format";

interface LaunchScoreProps {
    score: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function LaunchScore({ score, size = "md", showLabel = false }: LaunchScoreProps) {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-14 h-14 text-lg",
    };

    return (
        <div className="flex items-center gap-2">
            <div
                className={`${sizeClasses[size]} ${getScoreBgColor(score)} flex items-center justify-center font-mono font-bold ${getScoreColor(score)} border border-current/20 transition-all duration-300`}
            >
                {score}
            </div>
            {showLabel && (
                <span className="label">Launch Score</span>
            )}
        </div>
    );
}
