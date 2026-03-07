"use client";

interface InsiderIndicatorProps {
    percentage: number;
    size?: "sm" | "md";
}

export function InsiderIndicator({ percentage, size = "md" }: InsiderIndicatorProps) {
    const getColor = () => {
        if (percentage <= 10) return "text-[#39FF14] bg-[#39FF14]/10";
        if (percentage <= 25) return "text-[#FAFF00] bg-[#FAFF00]/10";
        if (percentage <= 40) return "text-[#FF6B35] bg-[#FF6B35]/10";
        return "text-[#FF003C] bg-[#FF003C]/10";
    };

    const getRiskLabel = () => {
        if (percentage <= 10) return "Low";
        if (percentage <= 25) return "Med";
        if (percentage <= 40) return "High";
        return "Critical";
    };

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5 text-xs",
    };

    return (
        <div className="flex items-center gap-1.5">
            <span className={`badge ${sizeClasses[size]} ${getColor()} font-mono`}>
                {percentage}%
            </span>
            {size === "md" && (
                <span className={`text-[10px] ${getColor().split(" ")[0]} opacity-70`}>
                    {getRiskLabel()}
                </span>
            )}
        </div>
    );
}
