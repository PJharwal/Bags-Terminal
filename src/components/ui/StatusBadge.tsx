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
        sm: "px-1.5 py-0.5 text-meta",
        md: "px-2 py-0.5 text-xs",
    };

    return (
        <span
            className={`badge ${sizeClasses[size]} ${getStatusBgColor(status)} ${getStatusColor(status)} font-medium`}
            role={status === 'live' ? 'status' : 'img'}
            aria-label={`Token status: ${statusLabels[status]}`}
            aria-live={status === 'live' ? 'polite' : undefined}
        >
            {status === 'live' && (
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {statusLabels[status]}
        </span>
    );
}
