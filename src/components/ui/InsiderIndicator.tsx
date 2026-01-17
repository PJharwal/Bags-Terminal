"use client";

interface InsiderIndicatorProps {
    percentage: number;
    size?: "sm" | "md";
}

export function InsiderIndicator({ percentage, size = "md" }: InsiderIndicatorProps) {
    const getColor = () => {
        if (percentage <= 10) return "text-[#2ECC71] bg-[#2ECC71]/20";
        if (percentage <= 25) return "text-[#F1C40F] bg-[#F1C40F]/20";
        if (percentage <= 40) return "text-[#E67E22] bg-[#E67E22]/20";
        return "text-[#E74C3C] bg-[#E74C3C]/20";
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
            <span className={`${sizeClasses[size]} ${getColor()} rounded font-mono`}>
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
