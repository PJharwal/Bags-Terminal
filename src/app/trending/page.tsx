"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gmgnService } from "@/services/gmgn.service";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, Loader2, RefreshCw, Flame, Clock } from "lucide-react";
import type { GMGNTrendingToken } from "@/services/gmgn.service";

const FILTERS = ["All", "Clean", "Risky", "High Volume"];
const TIMEFRAMES = ["1m", "5m", "1h", "6h", "24h"];

interface TrendingToken {
    address: string;
    symbol: string;
    name: string;
    price: number;
    price_change_percent: number;
    volume: number;
    market_cap: number;
    logo?: string;
}

const getRiskLevel = (token: TrendingToken): 'low' | 'medium' | 'high' => {
    if (Math.abs(token.price_change_percent) > 50) return 'high';
    if (Math.abs(token.price_change_percent) > 20) return 'medium';
    return 'low';
};

const getRiskColor = (risk: string) => {
    switch (risk) {
        case "low": return "bg-[#39FF14]";
        case "medium": return "bg-[#FAFF00]";
        case "high": return "bg-[#FF003C]";
        default: return "bg-white/20";
    }
};

const getStatusFromRisk = (risk: string) => {
    switch (risk) {
        case "low": return "Clean";
        case "medium": return "Watch";
        case "high": return "Risk";
        default: return "Unknown";
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "Clean": return "text-[#39FF14]";
        case "Watch": return "text-[#FAFF00]";
        case "Risk": return "text-[#FF003C]";
        default: return "text-[#888]";
    }
};

const AVATAR_COLORS = ['bg-[#FF003C]', 'bg-[#39FF14]', 'bg-[#00F0FF]', 'bg-[#FAFF00]', 'bg-[#FF00FF]', 'bg-[#FF6B35]'];

const TokenCard = ({ token }: { token: TrendingToken }) => {
    const initial = (token.symbol || '?').charAt(0).toUpperCase();
    const fallbackColor = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
    const risk = getRiskLevel(token);
    const status = getStatusFromRisk(risk);

    return (
        <Link href={`/terminal/${token.address}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className="group bg-[#0A0A0A] border border-white/10 hover:border-[#39FF14] p-4 transition-all cursor-pointer h-full"
            >
                <div className="flex items-start gap-3 mb-3">
                    {token.logo ? (
                        <img src={token.logo} alt={token.symbol} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className={`w-12 h-12 ${fallbackColor} flex items-center justify-center font-bold text-black text-xl`}>
                            {initial}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
                                ${token.symbol}
                            </span>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getRiskColor(risk)}`} />
                        </div>
                        <div className="text-xs text-[#666] truncate">{token.name}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono">Market Cap</span>
                        <span className="text-sm font-mono text-white">{formatCurrency(token.market_cap)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono">Change</span>
                        <span className={`text-sm font-mono font-bold ${token.price_change_percent >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                            {token.price_change_percent >= 0 ? '+' : ''}{token.price_change_percent.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono">Volume</span>
                        <span className="text-sm font-mono text-white">{formatCurrency(token.volume)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono">Status</span>
                        <span className={`text-xs font-mono font-bold uppercase ${getStatusColor(status)}`}>{status}</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default function TrendingPage() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeTimeframe, setActiveTimeframe] = useState("1h");
    const [view, setView] = useState<"grid" | "table">("grid");
    const [tokens, setTokens] = useState<TrendingToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrending = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let data;
            if (activeTimeframe === '1m' || activeTimeframe === '5m') {
                data = await gmgnService.getSwapRanks(activeTimeframe, 20);
            } else {
                data = await gmgnService.getTrending(activeTimeframe);
            }

            if (data?.rank) {
                const transformedTokens: TrendingToken[] = data.rank.map((t: GMGNTrendingToken) => ({
                    address: t.address,
                    symbol: t.symbol || '???',
                    name: t.name || 'Unknown',
                    price: t.price || 0,
                    price_change_percent: t.price_change_percent || 0,
                    volume: t.volume || t.volume_24h || 0,
                    market_cap: t.market_cap || 0,
                    logo: t.logo,
                }));
                setTokens(transformedTokens);
            } else {
                setTokens([]);
            }
        } catch (err) {
            console.error('Failed to fetch trending:', err);
            setError('Failed to fetch trending tokens. Make sure GMGN server is running.');
        } finally {
            setIsLoading(false);
        }
    }, [activeTimeframe]);

    useEffect(() => {
        fetchTrending();
    }, [fetchTrending]);

    const filteredTokens = tokens.filter(token => {
        const risk = getRiskLevel(token);
        if (activeFilter === "All") return true;
        if (activeFilter === "Clean") return risk === 'low';
        if (activeFilter === "Risky") return risk === 'high';
        if (activeFilter === "High Volume") return token.volume > 100000;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#050505] p-6 font-mono">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-[#39FF14]" size={24} />
                    <h1 className="text-3xl font-bold tracking-tight">Trending Tokens</h1>
                </div>
                <p className="text-sm text-[#888]">Real-time trending data</p>
            </div>

            {/* Timeframe Selector */}
            <div className="max-w-7xl mx-auto mb-4 flex items-center gap-2">
                <Clock size={14} className="text-[#666]" />
                <span className="text-[10px] text-[#666] uppercase tracking-widest mr-2">Timeframe:</span>
                {TIMEFRAMES.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setActiveTimeframe(tf)}
                        className={`px-3 py-1 text-sm border transition-colors ${activeTimeframe === tf
                            ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                            : "border-white/10 text-[#888] hover:border-white/20 hover:text-white"
                            }`}
                    >
                        {tf}
                    </button>
                ))}
                <button
                    onClick={fetchTrending}
                    disabled={isLoading}
                    className="ml-auto p-2 border border-white/10 hover:border-[#39FF14] transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw size={14} className={`text-[#888] ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters + View Toggle */}
            <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${activeFilter === filter
                                ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                                : "border-white/10 text-[#888] hover:border-white/20 hover:text-white"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setView("grid")}
                        className={`p-2 border transition-colors ${view === "grid" ? "border-[#39FF14] text-[#39FF14]" : "border-white/10 text-[#888]"}`}
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setView("table")}
                        className={`p-2 border transition-colors ${view === "table" ? "border-[#39FF14] text-[#39FF14]" : "border-white/10 text-[#888]"}`}
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-[#39FF14] mr-3" />
                    <span className="text-[#888]">Loading trending tokens...</span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="max-w-7xl mx-auto py-20 text-center">
                    <Flame size={32} className="mx-auto mb-4 text-[#FF003C] opacity-50" />
                    <p className="text-[#FF003C] mb-4 font-mono">{error}</p>
                    <button
                        onClick={fetchTrending}
                        className="px-4 py-2 border border-white/10 text-[#888] hover:text-[#39FF14] hover:border-[#39FF14] transition-colors font-mono text-sm"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredTokens.length === 0 && (
                <div className="max-w-7xl mx-auto py-20 text-center text-[#666]">
                    <TrendingUp size={32} className="mx-auto mb-4 opacity-30" />
                    <p className="font-mono">No tokens match your filters</p>
                </div>
            )}

            {/* Grid View */}
            {!isLoading && !error && view === "grid" && filteredTokens.length > 0 && (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTokens.map((token, i) => (
                        <TokenCard key={token.address || i} token={token} />
                    ))}
                </div>
            )}

            {/* Table View */}
            {!isLoading && !error && view === "table" && filteredTokens.length > 0 && (
                <div className="max-w-7xl mx-auto bg-[#0A0A0A] border border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[#888] text-[10px] uppercase tracking-widest border-b border-white/10">
                                <th className="text-left p-4">Token</th>
                                <th className="text-right p-4">Price</th>
                                <th className="text-right p-4">Change</th>
                                <th className="text-right p-4">Market Cap</th>
                                <th className="text-right p-4">Volume</th>
                                <th className="text-right p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTokens.map((token, i) => {
                                const risk = getRiskLevel(token);
                                const status = getStatusFromRisk(risk);
                                const initial = (token.symbol || '?').charAt(0).toUpperCase();
                                const fallbackColor = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
                                return (
                                    <tr
                                        key={token.address || i}
                                        className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                                    >
                                        <td className="p-4">
                                            <Link href={`/terminal/${token.address}`} className="flex items-center gap-3">
                                                {token.logo ? (
                                                    <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className={`w-8 h-8 ${fallbackColor} flex items-center justify-center font-bold text-black text-sm`}>
                                                        {initial}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-mono font-bold text-white">${token.symbol}</div>
                                                    <div className="text-[10px] text-[#666]">{token.name}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(4)}</td>
                                        <td className={`p-4 text-right font-mono font-bold ${token.price_change_percent >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                                            {token.price_change_percent >= 0 ? '+' : ''}{token.price_change_percent.toFixed(2)}%
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">{formatCurrency(token.market_cap)}</td>
                                        <td className="p-4 text-right font-mono text-white">{formatCurrency(token.volume)}</td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase ${getStatusColor(status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getRiskColor(risk)}`} />
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
