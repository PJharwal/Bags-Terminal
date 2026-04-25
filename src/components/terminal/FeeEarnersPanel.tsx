"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Copy, Check } from "lucide-react";
import { BagsLogo } from "@/components/ui/BagsLogo";
import type { TokenFeeEarner } from "@/lib/types";

interface FeeEarnersPanelProps {
    feeEarners: TokenFeeEarner[];
    lifetimeFees: number;
    className?: string;
}

// Provider icons
const providerIcons: Record<string, { icon: string; color: string }> = {
    twitter: { icon: "𝕏", color: "#1DA1F2" },
    tiktok: { icon: "♪", color: "#FF0050" },
    kick: { icon: "K", color: "#53FC18" },
    github: { icon: "GH", color: "#EDEDED" },
};

// Format wallet address
function shortenAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Format SOL amount
function formatSOL(amount: number): string {
    if (amount === 0) return "0";
    if (amount < 0.001) return "<0.001";
    if (amount < 1) return amount.toFixed(3);
    if (amount < 100) return amount.toFixed(2);
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(1);
}

export function FeeEarnersPanel({ feeEarners, lifetimeFees, className = "" }: FeeEarnersPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

    if (feeEarners.length === 0) {
        return null;
    }

    const handleCopyWallet = async (wallet: string) => {
        await navigator.clipboard.writeText(wallet);
        setCopiedWallet(wallet);
        setTimeout(() => setCopiedWallet(null), 2000);
    };

    // Sort by royalty percentage (highest first)
    const sortedEarners = [...feeEarners].sort((a, b) => b.royaltyBps - a.royaltyBps);

    return (
        <div className={`card overflow-hidden ${className}`}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls="fee-earners-panel-body"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors focus-ring"
            >
                <div className="flex items-center gap-3">
                    <BagsLogo size={14} />
                    <span className="label">Fee Earners</span>
                    <span className="text-xs font-bold text-gold num">
                        {formatSOL(lifetimeFees)} SOL
                    </span>
                    <span className="text-meta text-muted-high">
                        ({feeEarners.length} {feeEarners.length === 1 ? "earner" : "earners"})
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp size={14} aria-hidden="true" className="text-muted-high" />
                ) : (
                    <ChevronDown size={14} aria-hidden="true" className="text-muted-high" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div id="fee-earners-panel-body" className="border-t border-default">
                    {/* Dividend Status */}
                    {lifetimeFees !== undefined && (
                        <div className={`flex items-center justify-between px-3 py-2 border-b ${
                            lifetimeFees >= 10
                                ? 'border-[#39FF14]/20 bg-acid-green/5'
                                : 'border-white/5 bg-white/[0.02]'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    lifetimeFees >= 10 ? 'bg-acid-green animate-pulse' : 'bg-[#666]'
                                }`} />
                                <span className="text-meta font-mono text-fg-soft uppercase">
                                    {lifetimeFees >= 10 ? 'Auto-Dividends Active' : 'Dividends Inactive'}
                                </span>
                            </div>
                            <span className="text-meta font-mono text-muted-high">
                                {lifetimeFees >= 10
                                    ? 'Top 100 holders earn daily'
                                    : `${(10 - lifetimeFees).toFixed(2)} SOL until activation`}
                            </span>
                        </div>
                    )}

                    {/* Column Headers */}
                    <div className="table-header grid grid-cols-[1fr,80px,80px] gap-2 px-4 py-2 text-meta text-muted-high uppercase tracking-widest">
                        <span>Earner</span>
                        <span className="text-right">Share</span>
                        <span className="text-right">Claimed</span>
                    </div>

                    {/* Earner Rows */}
                    <div className="divide-y divide-white/5">
                        {sortedEarners.map((earner, idx) => (
                            <div
                                key={`${earner.wallet}-${idx}`}
                                className="table-row grid grid-cols-[1fr,80px,80px] gap-2 px-4 py-2"
                            >
                                {/* Earner Info */}
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {/* Avatar */}
                                    {earner.pfp ? (
                                        <img
                                            src={earner.pfp}
                                            alt={earner.username}
                                            className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#39FF14]/30 to-[#00F0FF]/30 border border-white/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-meta font-bold text-fg">
                                                {earner.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Name & Provider */}
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {/* Provider Icon */}
                                            {earner.provider && providerIcons[earner.provider] && (
                                                <span
                                                    className="text-meta"
                                                    style={{ color: providerIcons[earner.provider].color }}
                                                >
                                                    {providerIcons[earner.provider].icon}
                                                </span>
                                            )}

                                            {/* Username */}
                                            <span className="text-xs text-fg font-medium truncate">
                                                {earner.providerUsername || earner.username}
                                            </span>

                                            {/* Creator Badge */}
                                            {earner.isCreator && (
                                                <span className="text-meta px-1 py-0.5 bg-acid-green/20 text-acid-green rounded">
                                                    CREATOR
                                                </span>
                                            )}
                                        </div>

                                        {/* Wallet Address */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-meta text-muted-high font-mono num">
                                                {shortenAddress(earner.wallet)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyWallet(earner.wallet)}
                                                className="text-muted-high hover:text-fg transition-colors focus-ring"
                                                title="Copy wallet address"
                                                aria-label={`Copy wallet address ${shortenAddress(earner.wallet)}`}
                                            >
                                                {copiedWallet === earner.wallet ? (
                                                    <Check size={10} aria-hidden="true" className="text-acid-green" />
                                                ) : (
                                                    <Copy size={10} aria-hidden="true" />
                                                )}
                                            </button>
                                            <a
                                                href={`https://solscan.io/account/${earner.wallet}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-high hover:text-electric-blue transition-colors focus-ring"
                                                title="View on Solscan"
                                                aria-label={`View ${shortenAddress(earner.wallet)} on Solscan`}
                                            >
                                                <ExternalLink size={10} aria-hidden="true" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Share Percentage */}
                                <div className="flex items-center justify-end">
                                    <span className="text-xs font-bold text-electric-blue font-mono num">
                                        {earner.royaltyPercent.toFixed(1)}%
                                    </span>
                                </div>

                                {/* Total Claimed */}
                                <div className="flex items-center justify-end">
                                    <span className="text-xs text-fg font-mono num">
                                        {earner.totalClaimed !== undefined
                                            ? `${formatSOL(earner.totalClaimed)} SOL`
                                            : "—"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
