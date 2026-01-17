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
                className={`${sizeClasses[size]} ${getScoreBgColor(score)} rounded-lg flex items-center justify-center font-mono font-bold ${getScoreColor(score)}`}
            >
                {score}
            </div>
            {showLabel && (
                <span className="text-xs text-[#9AA0A6]">Launch Score</span>
            )}
        </div>
    );
}
