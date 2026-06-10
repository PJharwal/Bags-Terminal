"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, RefreshCw, Rocket } from "lucide-react";
import { bagsService } from "@/services/bags.service";
import { formatTimeAgo } from "@/lib/format";
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
    const createdAtMs = item.createdAt ? (item.createdAt < 1e12 ? item.createdAt * 1000 : item.createdAt) : undefined;
    const statusLabel = item.status ? item.status.replace('_', ' ') : createdAtMs ? formatTimeAgo(createdAtMs) : null;

    return (
        <button
            onClick={() => router.push(`/terminal/${item.mint}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.03] hover:bg-[#39FF14]/[0.02] transition-colors text-left group"
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
                    <span className="text-[11px] font-bold text-[#EDEDED] truncate group-hover:text-[#39FF14] transition-colors">
                        {item.name}
                    </span>
                    <span className="text-[9px] text-[#555] font-mono shrink-0">
                        ${item.symbol}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-[#444] font-mono mt-0.5">
                    <span>{truncateAddress(item.creator)}</span>
                    {statusLabel && (
                        <>
                            <span className="text-[#333]">&middot;</span>
                            <span>{statusLabel}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-[#EDEDED] font-mono">
                    {formatMarketCap(item.marketCap)}
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
                        <Rocket size={12} className="text-[#39FF14]" />
                        BAGS LAUNCHES
                    </span>
                    <span className="badge badge-green text-[8px] px-1.5 py-0.5 badge-live">LIVE</span>
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
                <AlertTriangle size={20} className="text-[#FF003C]" />
                <p className="text-[11px] text-[#888] font-mono">{error}</p>
                <button
                    onClick={() => fetchFeed()}
                    className="btn-ghost px-3 py-1.5 text-[10px] font-bold uppercase flex items-center gap-1.5"
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
                <p className="text-[11px] text-[#555] font-mono">No launches found</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                <span className="label flex items-center gap-2">
                    <Rocket size={12} className="text-[#39FF14]" />
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
                        <RefreshCw size={10} className={`text-[#555] ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <span className="badge badge-green text-[8px] px-1.5 py-0.5 badge-live">LIVE</span>
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
