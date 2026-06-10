"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { KolTrendingToken, KolsApiResponse, EnhancedKolToken, TimeframeMetrics } from "@/lib/types/kols";
import { formatCurrency } from "@/lib/format";
import { useSolPrice } from "@/hooks/useSolPrice";

type KolSortType = 'kol_count' | 'volume' | 'buys';

const kolTimeframes = ["5m", "1h", "6h", "24h"];
const kolSortOptions: { value: KolSortType; label: string }[] = [
    { value: 'kol_count', label: 'KOL Count' },
    { value: 'volume', label: 'Volume' },
    { value: 'buys', label: 'Buys' },
];

const KOLS_API_URL = "https://backend.solshift.fun";
const POLLING_INTERVAL = 10000; // 10s for KOLs

export default function KolsPage() {
    const router = useRouter();
    const { price: solPrice } = useSolPrice();
    const [kolTokens, setKolTokens] = useState<EnhancedKolToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState("24h");
    const [kolSort, setKolSort] = useState<KolSortType>('kol_count');

    const mapKolsResponse = (tokens: KolTrendingToken[]): EnhancedKolToken[] => {
        return tokens.map((item) => ({
            address: item.mint,
            symbol: item.symbol || '',
            name: item.name || '',
            logo: item.logo_url,
            createdAt: Number(item.created_at) || 0,
            tokenAgeMinutes: Number(item.token_age_minutes) || 0,
            price: Number(item.price_sol) || 0,
            marketCap: Number(item.market_cap_usd) || 0,
            kolMetrics: item.kol_metrics,
            kolCount: Number(item.current_holders?.kol_count) || 0,
            kolPercent: Number(item.current_holders?.kol_percent) || 0,
            kols: item.kols || [],
        }));
    };

    const reqSeq = useRef(0);

    const fetchData = useCallback(async (isPolling = false) => {
        const reqId = ++reqSeq.current;
        if (!isPolling) {
            setLoading(true);
            setKolTokens([]);
            setError(null);
        }

        try {
            const res = await fetch(`${KOLS_API_URL}/api/stats/trending-kols?timeframe=${timeframe}&sort=${kolSort}&limit=30`);
            if (!res.ok) throw new Error("Failed to load KOLs data");
            const data: KolsApiResponse = await res.json();
            if (reqId !== reqSeq.current) return;
            setKolTokens(mapKolsResponse(data.tokens || []));
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            if (!isPolling && reqId === reqSeq.current) setError("Failed to load data.");
        } finally {
            if (!isPolling && reqId === reqSeq.current) setLoading(false);
        }
    }, [timeframe, kolSort]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        pollingRef.current = setInterval(() => fetchData(true), POLLING_INTERVAL);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchData]);

    const formatCompact = (val: number) => {
        if (!val) return "-";
        if (val >= 1e9) return "$" + (val / 1e9).toFixed(1) + "B";
        if (val >= 1e6) return "$" + (val / 1e6).toFixed(1) + "M";
        if (val >= 1e3) return "$" + (val / 1e3).toFixed(1) + "K";
        return "$" + val.toFixed(0);
    };

    const formatTokenAge = (minutes: number) => {
        if (!minutes) return '';
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
        return `${Math.floor(minutes / 1440)}d`;
    };

    return (
        <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] p-4 sm:p-6 font-mono">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <SectionHeader
                    kicker="◆ ALPHA"
                    title="KOLs TRENDING"
                    subtitle="Real-time tokens trending by Key Opinion Leader activity"
                    size="lg"
                />

                <div className="flex items-center gap-4 mt-5 flex-wrap">
                    {/* Timeframe Selector */}
                    <div className="flex bg-[#0A0A0A] border border-white/5 p-1 rounded w-fit">
                        {kolTimeframes.map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-all",
                                    timeframe === tf
                                        ? "bg-[#39FF14] text-black"
                                        : "text-[#888] hover:text-white"
                                )}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Sort Selector */}
                    <div className="flex bg-[#0A0A0A] border border-white/5 p-1 rounded w-fit">
                        {kolSortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setKolSort(option.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-all",
                                    kolSort === option.value
                                        ? "bg-[#FFD700] text-black"
                                        : "text-[#888] hover:text-white"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto mb-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="card p-4 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-20 bg-white/5 rounded" />
                                        <div className="h-3 w-16 bg-white/5 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="h-3 w-full bg-white/5 rounded" />
                                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                                </div>
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-white/5" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#FF003C]">
                        <p className="font-mono mb-4">{error}</p>
                        <button onClick={() => fetchData(false)} className="btn-ghost px-4 py-2 text-xs">RETRY_CONNECTION</button>
                    </div>
                ) : kolTokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#666]">
                        <p className="font-mono mb-4">NO_TOKENS_FOUND</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {kolTokens.map((token, idx) => {
                            const displayKols = token.kols.slice(0, 5);
                            const extraCount = token.kols.length - 5;
                            const currentMetrics = token.kolMetrics?.[timeframe as keyof typeof token.kolMetrics] as TimeframeMetrics | undefined;

                            return (
                                <div
                                    key={idx}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => router.push(`/terminal/${token.address}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') router.push(`/terminal/${token.address}`);
                                    }}
                                >
                                    <div className="group card p-4 cursor-pointer h-full hover:-translate-y-1 transition-transform relative">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={token.logo || `https://placehold.co/48x48/111/FFF?text=${token.symbol?.slice(0, 2) || '??'}`}
                                                        alt={token.symbol}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
                                                            {token.symbol || 'Unknown'}
                                                        </span>
                                                        {token.tokenAgeMinutes > 0 && (
                                                            <span className="text-[9px] bg-[#39FF14]/10 text-[#39FF14] px-1.5 py-0.5 rounded font-mono">
                                                                {formatTokenAge(token.tokenAgeMinutes)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[#666] truncate">{token.name}</p>
                                                </div>
                                            </div>

                                            {/* KOL Count Badge */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-1 rounded">
                                                    <span className="text-[10px] font-bold text-[#39FF14]">
                                                        {token.kolCount} KOLs
                                                    </span>
                                                </div>
                                                {Number(token.kolPercent) > 0 && (
                                                    <span className="text-[8px] text-[#888]">
                                                        {Number(token.kolPercent).toFixed(1)}% held
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeframe Metrics */}
                                        {currentMetrics && (
                                            <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-[#111] rounded border border-white/5">
                                                <div className="text-center">
                                                    <p className="text-[8px] text-[#666] uppercase">Buys</p>
                                                    <p className="text-xs font-bold text-[#39FF14]">{currentMetrics.buys}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[8px] text-[#666] uppercase">Sells</p>
                                                    <p className="text-xs font-bold text-[#FF003C]">{currentMetrics.sells}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[8px] text-[#666] uppercase">Vol</p>
                                                    <p className="text-xs font-bold text-white">
                                                        {formatCompact((Number(currentMetrics.volume_sol || 0) / 1e9) * solPrice)}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[8px] text-[#666] uppercase">Active</p>
                                                    <p className="text-xs font-bold text-[#FFD700]">{currentMetrics.unique_kols}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* KOL Avatars */}
                                        <div className="mb-4">
                                            <div className="flex items-center flex-wrap gap-1">
                                                {displayKols.map((kol, kolIdx) => {
                                                    const avatarContent = (
                                                        <>
                                                            <img
                                                                src={kol.image_url || `https://placehold.co/24x24/222/FFF?text=${kol.name?.slice(0, 1) || '?'}`}
                                                                alt={kol.name}
                                                                className={cn(
                                                                    "w-7 h-7 rounded-full border border-[#222] object-cover bg-[#111]",
                                                                    kol.last_action === 'buy' ? "border-[#39FF14]/50" : kol.last_action === 'sell' ? "border-[#FF003C]/50" : ""
                                                                )}
                                                            />
                                                            {/* Buy/Sell indicator */}
                                                            {kol.last_action && (
                                                                <div className={cn(
                                                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold text-black border border-black",
                                                                    kol.last_action === 'buy' ? "bg-[#39FF14]" : "bg-[#FF003C]"
                                                                )}>
                                                                    {kol.last_action === 'buy' ? '↑' : '↓'}
                                                                </div>
                                                            )}
                                                            {/* Rank badge */}
                                                            {kol.rank && kol.rank <= 10 && (
                                                                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-[#FFD700] rounded-full flex items-center justify-center text-[7px] font-bold text-black">
                                                                    {kol.rank}
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                    const avatarTitle = `${kol.name} - ${kol.last_action === 'buy' ? 'Bought' : 'Sold'}`;

                                                    return kol.twitter ? (
                                                        <a
                                                            key={kolIdx}
                                                            href={kol.twitter}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="relative group/avatar"
                                                            title={avatarTitle}
                                                        >
                                                            {avatarContent}
                                                        </a>
                                                    ) : (
                                                        <span
                                                            key={kolIdx}
                                                            className="relative group/avatar"
                                                            title={avatarTitle}
                                                        >
                                                            {avatarContent}
                                                        </span>
                                                    );
                                                })}
                                                {extraCount > 0 && (
                                                    <div className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center">
                                                        <span className="text-[8px] font-bold text-[#888]">+{extraCount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#666] uppercase">MC</span>
                                                <span className="font-mono text-sm text-white font-bold">{formatCompact(token.marketCap)}</span>
                                            </div>
                                            <div className="text-[10px] text-[#39FF14] flex items-center gap-1 group-hover:underline">
                                                TRADE <ExternalLink size={10} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
