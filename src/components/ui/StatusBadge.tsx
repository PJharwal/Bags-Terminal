"use client";

import { getStatusColor, getStatusBgColor } from "@/lib/format";
import type { TokenStatus } from "@/lib/types";

interface StatusBadgeProps {
    status: TokenStatus;
    size?: "sm" | "md";
}

const statusLabels: Record<TokenStatus, string> = {
    live: "Live",
    graduated: "Graduated",
    new: "New",
    stealth: "Stealth",
    rugged: "Rugged",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5 text-xs",
    };

    return (
        <span
            className={`badge ${sizeClasses[size]} ${getStatusBgColor(status)} ${getStatusColor(status)} font-medium`}
        >
            {status === 'live' && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {statusLabels[status]}
        </span>
    );
}
