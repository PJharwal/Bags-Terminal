"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { bagsService } from "@/services/bags.service";

// Simple in-memory cache for fee status
const feeStatusCache = new Map<string, { hasFees: boolean; lifetimeFees: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface BagsFeeIndicatorProps {
    tokenMint: string;
    size?: "sm" | "md";
    showAmount?: boolean;
    className?: string;
}

/**
 * Lightweight component that shows a gold coin indicator if a token has Bags fees
 * Fetches data lazily and caches results
 */
export function BagsFeeIndicator({
    tokenMint,
    size = "sm",
    showAmount = false,
    className = "",
}: BagsFeeIndicatorProps) {
    const [feeData, setFeeData] = useState<{ hasFees: boolean; lifetimeFees: number } | null>(null);

    useEffect(() => {
        if (!tokenMint) return;

        // Check cache first
        const cached = feeStatusCache.get(tokenMint);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setFeeData({ hasFees: cached.hasFees, lifetimeFees: cached.lifetimeFees });
            return;
        }

        // Fetch fee data
        let mounted = true;
        bagsService.getTokenLifetimeFees(tokenMint)
            .then((fees) => {
                if (!mounted) return;
                const hasFees = fees > 0;
                const data = { hasFees, lifetimeFees: fees, timestamp: Date.now() };
                feeStatusCache.set(tokenMint, data);
                setFeeData({ hasFees, lifetimeFees: fees });
            })
            .catch(() => {
                // Silently fail - token might not be a Bags token
                if (mounted) {
                    feeStatusCache.set(tokenMint, { hasFees: false, lifetimeFees: 0, timestamp: Date.now() });
                    setFeeData({ hasFees: false, lifetimeFees: 0 });
                }
            });

        return () => {
            mounted = false;
        };
    }, [tokenMint]);

    // Don't render anything if no fees or still loading
    if (!feeData?.hasFees) {
        return null;
    }

    const iconSize = size === "sm" ? 10 : 14;

    return (
        <div
            className={`inline-flex items-center gap-1 text-[#FFD700] ${className}`}
            title={`Bags Token - ${feeData.lifetimeFees.toFixed(2)} SOL in fees earned`}
        >
            <Coins size={iconSize} />
            {showAmount && (
                <span className={`font-mono font-bold ${size === "sm" ? "text-[9px]" : "text-xs"}`}>
                    {feeData.lifetimeFees < 1
                        ? feeData.lifetimeFees.toFixed(2)
                        : feeData.lifetimeFees < 100
                            ? feeData.lifetimeFees.toFixed(1)
                            : `${(feeData.lifetimeFees / 1000).toFixed(1)}K`}
                </span>
            )}
        </div>
    );
}

/**
 * Static badge variant - use when you already know the token has fees
 */
export function BagsFeeBadge({
    lifetimeFees,
    size = "sm",
    className = "",
}: {
    lifetimeFees: number;
    size?: "sm" | "md";
    className?: string;
}) {
    if (lifetimeFees <= 0) return null;

    const iconSize = size === "sm" ? 10 : 14;

    return (
        <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded text-[#FFD700] ${className}`}
            title={`${lifetimeFees.toFixed(2)} SOL in fees earned`}
        >
            <Coins size={iconSize} />
            <span className={`font-mono font-bold ${size === "sm" ? "text-[9px]" : "text-xs"}`}>
                {lifetimeFees < 1
                    ? lifetimeFees.toFixed(2)
                    : lifetimeFees < 100
                        ? lifetimeFees.toFixed(1)
                        : `${(lifetimeFees / 1000).toFixed(1)}K`} SOL
            </span>
        </div>
    );
}
