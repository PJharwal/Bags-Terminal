"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, RefreshCw, Rocket, Users, Coins } from "lucide-react";
import { bagsService } from "@/services/bags.service";
import { formatNumber, formatTimeAgo } from "@/lib/format";
import type { BagsLaunchFeedItem } from "@/lib/bags-types";

const REFRESH_INTERVAL = 30_000;

function formatMarketCap(mc?: number): string {
    if (!mc || mc === 0) return "—";
    if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(1)}M`;
    if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`;
    return `$${mc.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
    if (!addr || addr.length < 12) return addr || "—";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.03]">
            <div className="w-9 h-9 rounded skeleton-shimmer shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-24 skeleton-shimmer rounded" />
                <div className="h-2.5 w-16 skeleton-shimmer rounded" />
            </div>
            <div className="space-y-1.5 text-right">
                <div className="h-3 w-14 skeleton-shimmer rounded ml-auto" />
                <div className="h-2.5 w-10 skeleton-shimmer rounded ml-auto" />
            </div>
        </div>
    );
}

function LaunchItem({ item }: { item: BagsLaunchFeedItem }) {
    const router = useRouter();
    // Fallback timestamp for items missing createdAt — set on first mount in an effect
    // (Date.now() is impure during render). Stored in state so the formatted age renders.
    const [fallbackTs, setFallbackTs] = useState<number | null>(null);
    useEffect(() => {
        if (item.createdAt) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: capture fallback timestamp once on mount.
        setFallbackTs(Date.now());
    }, [item.createdAt]);
    const createdAtMs = item.createdAt
        ? (item.createdAt < 1e12 ? item.createdAt * 1000 : item.createdAt)
        : (fallbackTs ?? 0);

    return (
        <button
            onClick={() => router.push(`/terminal/${item.mint}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.03] hover:bg-acid-green/[0.02] transition-colors text-left group"
        >
            {item.image ? (
                <img
                    src={item.image}
                    alt=""
                    className="w-9 h-9 rounded object-cover shrink-0 border border-white/[0.06]"
                    loading="lazy"
                />
            ) : (
                <div className="w-9 h-9 rounded bg-[#111] border border-white/[0.06] shrink-0 flex items-center justify-center">
                    <Rocket size={14} className="text-[#333]" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-meta font-bold text-fg truncate group-hover:text-acid-green transition-colors">
                        {item.name}
                    </span>
                    <span className="text-meta text-muted-mid font-mono shrink-0">
                        ${item.symbol}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-meta text-[#444] font-mono mt-0.5">
                    <span>{truncateAddress(item.creator)}</span>
                    <span className="text-[#333]">&middot;</span>
                    <span>{item.status ? item.status.replace('_', ' ') : formatTimeAgo(createdAtMs)}</span>
                </div>
            </div>

            <div className="text-right shrink-0 space-y-0.5">
                <div className="text-meta font-bold text-fg font-mono">
                    {formatMarketCap(item.marketCap)}
                </div>
                <div className="flex items-center gap-2 justify-end text-meta font-mono text-muted-mid">
                    {item.bondingCurve !== undefined && (
                        <span className={item.bondingCurve >= 90 ? "text-acid-green" : item.bondingCurve >= 50 ? "text-[#FAFF00]" : ""}>
                            {item.bondingCurve.toFixed(0)}%
                        </span>
                    )}
                    {item.lifetimeFees !== undefined && item.lifetimeFees > 0 && (
                        <span className="text-gold flex items-center gap-0.5">
                            <Coins size={8} />
                            {formatNumber(item.lifetimeFees)}
                        </span>
                    )}
                    {item.creatorCount !== undefined && item.creatorCount > 1 && (
                        <span className="text-[#00F0FF] flex items-center gap-0.5">
                            <Users size={8} />
                            {item.creatorCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

export function LaunchFeedSection() {
    const [items, setItems] = useState<BagsLaunchFeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchFeed = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const data = await bagsService.getLaunchFeed({ limit: 20 });
            setItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load launch feed");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
        intervalRef.current = setInterval(() => fetchFeed(true), REFRESH_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchFeed]);

    if (loading) {
        return (
            <div className="flex-1 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06]">
                    <span className="label flex items-center gap-2">
                        <Rocket size={12} className="text-acid-green" />
                        BAGS LAUNCHES
                    </span>
                    <span className="badge badge-green text-meta px-1.5 py-0.5 badge-live">LIVE</span>
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <AlertTriangle size={20} className="text-error" />
                <p className="text-meta text-fg-soft font-mono">{error}</p>
                <button
                    onClick={() => fetchFeed()}
                    className="btn-ghost px-3 py-1.5 text-meta font-bold uppercase flex items-center gap-1.5"
                >
                    <RefreshCw size={10} />
                    RETRY
                </button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                <Rocket size={20} className="text-[#333]" />
                <p className="text-meta text-muted-mid font-mono">No launches found</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                <span className="label flex items-center gap-2">
                    <Rocket size={12} className="text-acid-green" />
                    BAGS LAUNCHES
                    <span className="text-[#444]">({items.length})</span>
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchFeed(true)}
                        disabled={refreshing}
                        className="btn-ghost p-1 disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={10} className={`text-muted-mid ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <span className="badge badge-green text-meta px-1.5 py-0.5 badge-live">LIVE</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                    <LaunchItem key={item.mint} item={item} />
                ))}
            </div>
        </div>
    );
}
