"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    // Simple heuristic based on price change and market cap
    if (Math.abs(token.price_change_percent) > 50) return 'high';
    if (Math.abs(token.price_change_percent) > 20) return 'medium';
    return 'low';
};

const getRiskColor = (risk: string) => {
    switch (risk) {
        case "low": return "bg-[#2ECC71]";
        case "medium": return "bg-[#F1C40F]";
        case "high": return "bg-[#E74C3C]";
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
        case "Clean": return "text-[#2ECC71]";
        case "Watch": return "text-[#F1C40F]";
        case "Risk": return "text-[#E74C3C]";
        default: return "text-[#9AA0A6]";
    }
};

export default function TrendingPage() {
    const router = useRouter();
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
            // Try different endpoints based on timeframe
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

    // Filter tokens
    const filteredTokens = tokens.filter(token => {
        const risk = getRiskLevel(token);
        if (activeFilter === "All") return true;
        if (activeFilter === "Clean") return risk === 'low';
        if (activeFilter === "Risky") return risk === 'high';
        if (activeFilter === "High Volume") return token.volume > 100000;
        return true;
    });

    const handleTokenClick = (address: string) => {
        router.push(`/terminal/${address}`);
    };

    return (
        <div className="min-h-screen bg-transparent p-6 font-mono">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <TrendingUp className="text-[#39FF14]" size={24} />
                    <h1 className="text-xl font-semibold">Trending Tokens</h1>
                </div>
                <p className="text-sm text-[#9AA0A6]">Real-time trending data from GMGN</p>
            </div>

            {/* Timeframe Selector */}
            <div className="max-w-5xl mx-auto mb-4 flex items-center gap-2">
                <Clock size={14} className="text-[#666]" />
                <span className="text-[10px] text-[#666] uppercase mr-2">Timeframe:</span>
                {TIMEFRAMES.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setActiveTimeframe(tf)}
                        className={`px-3 py-1 text-sm rounded-sm border transition-colors ${activeTimeframe === tf
                            ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                            : "border-white/10 text-[#9AA0A6] hover:border-white/20 hover:text-white"
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

            {/* Filters */}
            <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${activeFilter === filter
                                ? "border-[#2ECC71] text-[#2ECC71] bg-[#2ECC71]/10"
                                : "border-white/10 text-[#9AA0A6] hover:border-white/20 hover:text-white"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setView("grid")}
                        className={`p-1.5 rounded ${view === "grid" ? "bg-white/10 text-white" : "text-[#9AA0A6]"}`}
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setView("table")}
                        className={`p-1.5 rounded ${view === "table" ? "bg-white/10 text-white" : "text-[#9AA0A6]"}`}
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="max-w-5xl mx-auto flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-[#39FF14] mr-3" />
                    <span className="text-[#888]">Loading trending tokens...</span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="max-w-5xl mx-auto py-16 text-center">
                    <Flame size={32} className="mx-auto mb-4 text-[#FF003C] opacity-50" />
                    <p className="text-[#FF003C] mb-4">{error}</p>
                    <button
                        onClick={fetchTrending}
                        className="px-4 py-2 border border-white/10 text-[#888] hover:text-white hover:border-white/20 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredTokens.length === 0 && (
                <div className="max-w-5xl mx-auto py-16 text-center text-[#666]">
                    <TrendingUp size={32} className="mx-auto mb-4 opacity-30" />
                    <p>No tokens match your filters</p>
                </div>
            )}

            {/* Grid View */}
            {!isLoading && !error && view === "grid" && filteredTokens.length > 0 && (
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTokens.map((token, i) => {
                        const risk = getRiskLevel(token);
                        const status = getStatusFromRisk(risk);
                        return (
                            <div
                                key={token.address || i}
                                onClick={() => handleTokenClick(token.address)}
                                className="bg-[#11141B] border border-white/5 rounded-lg p-4 hover:border-[#39FF14]/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-mono font-semibold text-lg">${token.symbol}</span>
                                    <span className={`w-2 h-2 rounded-full ${getRiskColor(risk)}`} />
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#9AA0A6]">Price</span>
                                        <span className="font-mono">${token.price.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#9AA0A6]">Change</span>
                                        <span className={`font-mono ${token.price_change_percent >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                                            {token.price_change_percent >= 0 ? '+' : ''}{token.price_change_percent.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#9AA0A6]">Status</span>
                                        <span className={getStatusColor(status)}>{status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#9AA0A6]">Volume</span>
                                        <span className="font-mono">{formatCurrency(token.volume)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table View */}
            {!isLoading && !error && view === "table" && filteredTokens.length > 0 && (
                <div className="max-w-5xl mx-auto bg-[#11141B] border border-white/5 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[#9AA0A6] text-xs uppercase border-b border-white/5">
                                <th className="text-left p-4">Token</th>
                                <th className="text-right p-4">Price</th>
                                <th className="text-right p-4">Change</th>
                                <th className="text-right p-4">Volume</th>
                                <th className="text-right p-4">Status</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTokens.map((token, i) => {
                                const risk = getRiskLevel(token);
                                const status = getStatusFromRisk(risk);
                                return (
                                    <tr
                                        key={token.address || i}
                                        onClick={() => handleTokenClick(token.address)}
                                        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                                    >
                                        <td className="p-4 font-mono font-medium">${token.symbol}</td>
                                        <td className="p-4 text-right font-mono">${token.price.toFixed(6)}</td>
                                        <td className={`p-4 text-right font-mono ${token.price_change_percent >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                                            {token.price_change_percent >= 0 ? '+' : ''}{token.price_change_percent.toFixed(2)}%
                                        </td>
                                        <td className="p-4 text-right font-mono">{formatCurrency(token.volume)}</td>
                                        <td className={`p-4 text-right ${getStatusColor(status)}`}>{status}</td>
                                        <td className="p-4 text-right">
                                            <span className={`w-2 h-2 rounded-full inline-block ${getRiskColor(risk)}`} />
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
