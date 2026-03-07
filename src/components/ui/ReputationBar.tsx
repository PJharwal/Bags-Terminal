"use client";

interface ReputationBarProps {
    value: number; // 0-100
    label?: string;
    size?: "sm" | "md";
}

export function ReputationBar({ value, label, size = "md" }: ReputationBarProps) {
    const getColor = () => {
        if (value >= 75) return "bg-[#39FF14]";
        if (value >= 50) return "bg-[#FAFF00]";
        if (value >= 25) return "bg-[#FF6B35]";
        return "bg-[#FF003C]";
    };

    const getGlow = () => {
        if (value >= 75) return "shadow-[0_0_6px_rgba(57,255,20,0.3)]";
        return "";
    };

    const height = size === "sm" ? "h-1" : "h-1.5";

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <div className="flex items-center justify-between">
                    <span className="label">{label}</span>
                    <span className="text-xs font-mono text-[#EDEDED]">{value}%</span>
                </div>
            )}
            <div className={`progress-bar w-full ${height}`}>
                <div
                    className={`progress-bar-fill ${height} ${getColor()} ${getGlow()} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
}
