"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore } from "@/store/socket.store";
import { bagsService } from "@/services/bags.service";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, Loader2, Coins, Users, Zap, DollarSign, Percent, Award, Wallet } from "lucide-react";
import type { PulseItem } from "@/lib/types";
import type { BagsTokenCreator } from "@/lib/bags-types";
import BagsTokensSection from "@/components/bags/BagsTokensSection";

// View modes for the page
type ViewMode = "all" | "bags";

const FILTERS = ["All", "Migrated", "Near Migration", "Bonding", "High MC", "With Fees"];
const STATE_FILTERS = ["all", "MIGRATED", "FINAL_STRETCH", "NEW", "high_mc", "with_fees"] as const;

const AVATAR_COLORS = ['bg-[#FF003C]', 'bg-[#39FF14]', 'bg-[#00F0FF]', 'bg-[#FAFF00]', 'bg-[#FF00FF]', 'bg-[#FF6B35]'];

// Check if a token could be a BAGS token (mint ends with 'bags')
const isBagsToken = (mint: string): boolean => mint.toLowerCase().endsWith('bags');

// Extended fee data type
interface ExtendedFeeData {
    lifetimeFees: number;
    creatorsCount: number;
    creators: BagsTokenCreator[];
    topEarnerShare: number; // percentage
}

// Enhanced Token Card with fee data display
const BagsTokenCard = ({ token, onFeeDataLoaded }: { token: PulseItem; onFeeDataLoaded?: (tokenId: string, hasFees: boolean) => void }) => {
    const [feeData, setFeeData] = useState<ExtendedFeeData | null>(null);
    const [isLoadingFees, setIsLoadingFees] = useState(true);
    const [feeError, setFeeError] = useState(false);

    const isPotentialBags = isBagsToken(token.tokenId);

    useEffect(() => {
        let mounted = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoadingFees(true);
        setFeeError(false);

        bagsService.getTokenFeeInfo(token.tokenId)
            .then((info) => {
                if (mounted && info) {
                    const topEarner = info.creators.length > 0
                        ? Math.max(...info.creators.map(c => c.royaltyBps)) / 100
                        : 0;
                    setFeeData({
                        lifetimeFees: info.lifetimeFees,
                        creatorsCount: info.creators.length,
                        creators: info.creators,
                        topEarnerShare: topEarner,
                    });
                    onFeeDataLoaded?.(token.tokenId, info.lifetimeFees > 0 || info.creators.length > 0);
                } else {
                    onFeeDataLoaded?.(token.tokenId, false);
                }
            })
            .catch(() => {
                if (mounted) setFeeError(true);
                onFeeDataLoaded?.(token.tokenId, false);
            })
            .finally(() => {
                if (mounted) setIsLoadingFees(false);
            });
        return () => { mounted = false; };
    }, [token.tokenId, onFeeDataLoaded]);

    const initial = (token.symbol || '?').replace('$', '').charAt(0).toUpperCase();
    const fallbackColor = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];

    const hasFeeData = feeData && (feeData.lifetimeFees > 0 || feeData.creatorsCount > 0);

    return (
        <Link href={`/terminal/${token.tokenId}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className={`group bg-[#0A0A0A] border p-4 transition-all cursor-pointer h-full ${
                    hasFeeData
                        ? 'border-[#FFD700]/30 hover:border-[#FFD700]'
                        : 'border-white/10 hover:border-[#39FF14]'
                }`}
            >
                {/* Header with token info */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                        {token.logoUrl ? (
                            <img src={token.logoUrl} alt={token.symbol} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className={`w-12 h-12 ${fallbackColor} flex items-center justify-center font-display font-bold text-black text-xl`}>
                                {initial}
                            </div>
                        )}
                        {hasFeeData && (
                            <div className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-0.5">
                                <Coins size={10} className="text-black" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
                                {token.symbol}
                            </span>
                            {isPotentialBags && (
                                <span className="text-[8px] bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded font-mono uppercase">
                                    BAGS
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-[#666] truncate">{token.name}</div>
                    </div>
                </div>

                {/* Core metrics */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                            <DollarSign size={10} /> Market Cap
                        </span>
                        <span className="text-sm font-mono text-white">{formatCurrency(token.marketCap)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                            <Percent size={10} /> Bonding
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${token.bondingProgress >= 85 ? 'bg-[#39FF14]' : 'bg-[#444]'}`}
                                    style={{ width: `${Math.min(token.bondingProgress, 100)}%` }}
                                />
                            </div>
                            <span className={`text-xs font-mono ${token.bondingProgress >= 85 ? 'text-[#39FF14]' : 'text-[#666]'}`}>
                                {token.bondingProgress}%
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                            <Users size={10} /> Holders
                        </span>
                        <span className="text-sm font-mono text-white">{token.holders || '—'}</span>
                    </div>
                </div>

                {/* Fee Data Section */}
                <div className="mt-3 pt-3 border-t border-white/5">
                    {isLoadingFees ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <Loader2 size={12} className="animate-spin text-[#FFD700]" />
                            <span className="text-[10px] text-[#666] font-mono">Loading fee data...</span>
                        </div>
                    ) : hasFeeData ? (
                        <div className="space-y-2">
                            {/* Lifetime Earnings */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[#FFD700] font-mono flex items-center gap-1">
                                    <Coins size={10} /> Total Earnings
                                </span>
                                <span className="text-sm font-mono text-[#FFD700] font-bold">
                                    {feeData.lifetimeFees < 0.001
                                        ? feeData.lifetimeFees.toFixed(6)
                                        : feeData.lifetimeFees < 1
                                            ? feeData.lifetimeFees.toFixed(4)
                                            : feeData.lifetimeFees.toFixed(2)} SOL
                                </span>
                            </div>

                            {/* Fee Earners */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                                    <Award size={10} /> Fee Earners
                                </span>
                                <span className="text-sm font-mono text-white">{feeData.creatorsCount}</span>
                            </div>

                            {/* Top Earner Share */}
                            {feeData.topEarnerShare > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                                        <Wallet size={10} /> Top Share
                                    </span>
                                    <span className="text-sm font-mono text-[#39FF14]">{feeData.topEarnerShare.toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-1">
                            <span className="text-[10px] text-[#444] font-mono">
                                {feeError ? 'Not a fee-sharing token' : 'No fee data available'}
                            </span>
                        </div>
                    )}
                </div>

                {/* State badge */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                        token.state === 'MIGRATED' ? 'bg-[#39FF14]/20 text-[#39FF14]' :
                        token.state === 'FINAL_STRETCH' ? 'bg-[#FAFF00]/20 text-[#FAFF00]' :
                        'bg-white/10 text-[#888]'
                    }`}>
                        {token.state === 'MIGRATED' ? 'LP Live' :
                         token.state === 'FINAL_STRETCH' ? 'Near Migration' :
                         'Bonding'}
                    </span>
                    {hasFeeData && (
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700]">
                            Fee Sharing
                        </span>
                    )}
                </div>
            </motion.div>
        </Link>
    );
};

// Table row with enhanced fee data
const TokenTableRow = ({ token, index, onFeeDataLoaded }: { token: PulseItem; index: number; onFeeDataLoaded?: (tokenId: string, hasFees: boolean) => void }) => {
    const [feeData, setFeeData] = useState<ExtendedFeeData | null>(null);
    const [isLoadingFees, setIsLoadingFees] = useState(true);

    const isPotentialBags = isBagsToken(token.tokenId);

    useEffect(() => {
        let mounted = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoadingFees(true);

        bagsService.getTokenFeeInfo(token.tokenId)
            .then((info) => {
                if (mounted && info) {
                    const topEarner = info.creators.length > 0
                        ? Math.max(...info.creators.map(c => c.royaltyBps)) / 100
                        : 0;
                    setFeeData({
                        lifetimeFees: info.lifetimeFees,
                        creatorsCount: info.creators.length,
                        creators: info.creators,
                        topEarnerShare: topEarner,
                    });
                    onFeeDataLoaded?.(token.tokenId, info.lifetimeFees > 0 || info.creators.length > 0);
                } else {
                    onFeeDataLoaded?.(token.tokenId, false);
                }
            })
            .catch(() => {
                onFeeDataLoaded?.(token.tokenId, false);
            })
            .finally(() => {
                if (mounted) setIsLoadingFees(false);
            });
        return () => { mounted = false; };
    }, [token.tokenId, onFeeDataLoaded]);

    const initial = (token.symbol || '?').replace('$', '').charAt(0).toUpperCase();
    const fallbackColor = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
    const hasFeeData = feeData && (feeData.lifetimeFees > 0 || feeData.creatorsCount > 0);

    return (
        <tr className={`border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors ${
            hasFeeData ? 'bg-[#FFD700]/5' : ''
        }`}>
            <td className="p-4 text-[#666] font-mono text-sm">{index + 1}</td>
            <td className="p-4">
                <Link href={`/terminal/${token.tokenId}`} className="flex items-center gap-3">
                    <div className="relative">
                        {token.logoUrl ? (
                            <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className={`w-8 h-8 ${fallbackColor} flex items-center justify-center font-bold text-black text-sm`}>
                                {initial}
                            </div>
                        )}
                        {hasFeeData && (
                            <div className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-0.5">
                                <Coins size={8} className="text-black" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{token.symbol}</span>
                            {isPotentialBags && (
                                <span className="text-[7px] bg-[#FFD700]/20 text-[#FFD700] px-1 py-0.5 rounded font-mono uppercase">
                                    BAGS
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-[#666]">{token.name}</div>
                    </div>
                </Link>
            </td>
            <td className="p-4 text-right font-mono text-white">{formatCurrency(token.marketCap)}</td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                            className={`h-full ${token.bondingProgress >= 85 ? 'bg-[#39FF14]' : 'bg-[#444]'}`}
                            style={{ width: `${Math.min(token.bondingProgress, 100)}%` }}
                        />
                    </div>
                    <span className={`text-xs font-mono ${token.bondingProgress >= 85 ? 'text-[#39FF14]' : 'text-[#666]'}`}>
                        {token.bondingProgress}%
                    </span>
                </div>
            </td>
            <td className="p-4 text-right font-mono text-white">{token.holders || '—'}</td>
            <td className="p-4 text-right">
                {isLoadingFees ? (
                    <Loader2 size={12} className="animate-spin text-[#FFD700] ml-auto" />
                ) : feeData && feeData.lifetimeFees > 0 ? (
                    <span className="font-mono text-[#FFD700] font-bold">
                        {feeData.lifetimeFees < 0.001
                            ? feeData.lifetimeFees.toFixed(6)
                            : feeData.lifetimeFees < 1
                                ? feeData.lifetimeFees.toFixed(4)
                                : feeData.lifetimeFees.toFixed(2)} SOL
                    </span>
                ) : (
                    <span className="text-[#444]">—</span>
                )}
            </td>
            <td className="p-4 text-right">
                {isLoadingFees ? (
                    <Loader2 size={12} className="animate-spin text-[#666] ml-auto" />
                ) : feeData && feeData.creatorsCount > 0 ? (
                    <span className="font-mono text-white">{feeData.creatorsCount}</span>
                ) : (
                    <span className="text-[#444]">—</span>
                )}
            </td>
            <td className="p-4 text-right">
                {isLoadingFees ? (
                    <Loader2 size={12} className="animate-spin text-[#666] ml-auto" />
                ) : feeData && feeData.topEarnerShare > 0 ? (
                    <span className="font-mono text-[#39FF14]">{feeData.topEarnerShare.toFixed(1)}%</span>
                ) : (
                    <span className="text-[#444]">—</span>
                )}
            </td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1">
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                        token.state === 'MIGRATED' ? 'bg-[#39FF14]/20 text-[#39FF14]' :
                        token.state === 'FINAL_STRETCH' ? 'bg-[#FAFF00]/20 text-[#FAFF00]' :
                        'bg-white/10 text-[#888]'
                    }`}>
                        {token.state === 'MIGRATED' ? 'LP Live' :
                         token.state === 'FINAL_STRETCH' ? 'Near Migration' :
                         'Bonding'}
                    </span>
                    {hasFeeData && (
                        <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700]">
                            FEE
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default function TrendingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("all");
    const [activeFilter, setActiveFilter] = useState(0);
    const [view, setView] = useState<"grid" | "table">("grid");
    const [tokensWithFees, setTokensWithFees] = useState<Set<string>>(new Set());
    const { items, loadInitialData, isInitialLoading } = usePulseStore();
    const { connect, isConnected } = useSocketStore();

    useEffect(() => {
        connect();
        // Load initial data from GMGN/DexScreener while socket connects
        loadInitialData();
    }, [connect, loadInitialData]);

    // Track which tokens have fee data
    const handleFeeDataLoaded = useMemo(() => (tokenId: string, hasFees: boolean) => {
        setTokensWithFees(prev => {
            const next = new Set(prev);
            if (hasFees) {
                next.add(tokenId);
            } else {
                next.delete(tokenId);
            }
            return next;
        });
    }, []);

    // Combine and sort all tokens by market cap
    const allBagsTokens = useMemo(() => {
        return [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED]
            .sort((a, b) => b.marketCap - a.marketCap);
    }, [items]);

    // Apply filter
    const filteredTokens = useMemo(() => {
        return allBagsTokens.filter(token => {
            const filterType = STATE_FILTERS[activeFilter];
            if (filterType === "all") return true;
            if (filterType === "high_mc") return token.marketCap >= 100000;
            if (filterType === "with_fees") return tokensWithFees.has(token.tokenId) || isBagsToken(token.tokenId);
            return token.state === filterType;
        });
    }, [allBagsTokens, activeFilter, tokensWithFees]);

    // Count tokens with fees
    const tokensWithFeesCount = tokensWithFees.size;
    const potentialBagsCount = allBagsTokens.filter(t => isBagsToken(t.tokenId)).length;

    const isLoading = isInitialLoading || (!isConnected && allBagsTokens.length === 0);

    return (
        <div className="min-h-screen bg-[#050505] p-6 font-mono">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-[#39FF14]" size={24} />
                            <h1 className="text-3xl font-bold tracking-tight">Trending</h1>
                            <span className={`ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest border ${
                                isConnected ? 'border-[#39FF14] text-[#39FF14]' : 'border-[#FF003C] text-[#FF003C]'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#39FF14]' : 'bg-[#FF003C]'} animate-pulse`} />
                                {isConnected ? 'Live' : 'Connecting'}
                            </span>
                        </div>
                        <p className="text-sm text-[#888]">
                            {viewMode === "all"
                                ? `Real-time tokens with fee sharing data ${allBagsTokens.length > 0 ? `(${allBagsTokens.length} tokens)` : ''}`
                                : 'BAGS tokens with fee-sharing from bags.fm'
                            }
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded p-1">
                        <button
                            onClick={() => setViewMode("all")}
                            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all rounded ${
                                viewMode === "all"
                                    ? "bg-[#39FF14] text-black font-bold"
                                    : "text-[#888] hover:text-white"
                            }`}
                        >
                            All Tokens
                        </button>
                        <button
                            onClick={() => setViewMode("bags")}
                            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all rounded flex items-center gap-2 ${
                                viewMode === "bags"
                                    ? "bg-[#FFD700] text-black font-bold"
                                    : "text-[#888] hover:text-white"
                            }`}
                        >
                            <Coins size={14} />
                            BAGS Only
                        </button>
                    </div>
                </div>
            </div>

            {/* BAGS Only Section */}
            {viewMode === "bags" && (
                <div className="max-w-7xl mx-auto mb-8">
                    <BagsTokensSection solPrice={140} />
                </div>
            )}

            {/* All Tokens Section */}
            {viewMode === "all" && (
                <>
                    {/* Filters + View Toggle */}
                    <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex gap-2 flex-wrap">
                            {FILTERS.map((filter, i) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(i)}
                                    className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${activeFilter === i
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

            {/* Stats Bar */}
            <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#0A0A0A] border border-white/10 p-4">
                    <div className="text-[10px] text-[#888] uppercase tracking-widest mb-1">Total Tokens</div>
                    <div className="text-2xl font-bold text-white">{allBagsTokens.length}</div>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 p-4">
                    <div className="text-[10px] text-[#888] uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Zap size={10} className="text-[#39FF14]" /> LP Live
                    </div>
                    <div className="text-2xl font-bold text-[#39FF14]">{items.MIGRATED.length}</div>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 p-4">
                    <div className="text-[10px] text-[#888] uppercase tracking-widest mb-1">Near Migration</div>
                    <div className="text-2xl font-bold text-[#FAFF00]">{items.FINAL_STRETCH.length}</div>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 p-4">
                    <div className="text-[10px] text-[#888] uppercase tracking-widest mb-1">Bonding</div>
                    <div className="text-2xl font-bold text-white">{items.NEW.length}</div>
                </div>
                <div className="bg-[#0A0A0A] border border-[#FFD700]/30 p-4">
                    <div className="text-[10px] text-[#FFD700] uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Coins size={10} /> Fee Sharing
                    </div>
                    <div className="text-2xl font-bold text-[#FFD700]">
                        {tokensWithFeesCount > 0 ? tokensWithFeesCount : potentialBagsCount}
                    </div>
                    {potentialBagsCount > 0 && tokensWithFeesCount === 0 && (
                        <div className="text-[9px] text-[#666] mt-1">potential BAGS tokens</div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-[#39FF14] mr-3" />
                    <span className="text-[#888]">Connecting to live feed...</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredTokens.length === 0 && (
                <div className="max-w-7xl mx-auto py-20 text-center text-[#666]">
                    <TrendingUp size={32} className="mx-auto mb-4 opacity-30" />
                    <p className="font-mono">
                        {allBagsTokens.length === 0
                            ? "Waiting for tokens..."
                            : "No tokens match your filter"}
                    </p>
                </div>
            )}

            {/* Grid View */}
            {!isLoading && view === "grid" && filteredTokens.length > 0 && (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTokens.map((token) => (
                        <BagsTokenCard key={token.tokenId} token={token} onFeeDataLoaded={handleFeeDataLoaded} />
                    ))}
                </div>
            )}

            {/* Table View */}
            {!isLoading && view === "table" && filteredTokens.length > 0 && (
                <div className="max-w-7xl mx-auto bg-[#0A0A0A] border border-white/10 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[#888] text-[10px] uppercase tracking-widest border-b border-white/10">
                                <th className="text-left p-4 w-12">#</th>
                                <th className="text-left p-4">Token</th>
                                <th className="text-right p-4">Market Cap</th>
                                <th className="text-right p-4">Bonding</th>
                                <th className="text-right p-4">Holders</th>
                                <th className="text-right p-4">
                                    <span className="flex items-center justify-end gap-1">
                                        <Coins size={10} className="text-[#FFD700]" /> Earnings
                                    </span>
                                </th>
                                <th className="text-right p-4">
                                    <span className="flex items-center justify-end gap-1">
                                        <Users size={10} /> Earners
                                    </span>
                                </th>
                                <th className="text-right p-4">
                                    <span className="flex items-center justify-end gap-1">
                                        <Percent size={10} /> Top Share
                                    </span>
                                </th>
                                <th className="text-right p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTokens.map((token, i) => (
                                <TokenTableRow key={token.tokenId} token={token} index={i} onFeeDataLoaded={handleFeeDataLoaded} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
                </>
            )}
        </div>
    );
}
