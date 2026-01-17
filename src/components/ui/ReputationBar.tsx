"use client";

interface ReputationBarProps {
    value: number; // 0-100
    label?: string;
    size?: "sm" | "md";
}

export function ReputationBar({ value, label, size = "md" }: ReputationBarProps) {
    const getColor = () => {
        if (value >= 75) return "bg-[#2ECC71]";
        if (value >= 50) return "bg-[#F1C40F]";
        if (value >= 25) return "bg-[#E67E22]";
        return "bg-[#E74C3C]";
    };

    const height = size === "sm" ? "h-1" : "h-1.5";

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#9AA0A6]">{label}</span>
                    <span className="text-xs font-mono text-white">{value}%</span>
                </div>
            )}
            <div className={`w-full ${height} bg-white/10 rounded-full overflow-hidden`}>
                <div
                    className={`${height} ${getColor()} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
}
