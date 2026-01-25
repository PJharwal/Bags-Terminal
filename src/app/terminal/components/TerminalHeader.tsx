"use client";

import { Copy, ExternalLink, Globe, Twitter, Coins } from "lucide-react";
import type { TerminalToken } from "@/lib/types";

// Provider icon mapping
const providerIcons: Record<string, string> = {
    twitter: "𝕏",
    tiktok: "TT",
    kick: "K",
    github: "GH",
};

interface TerminalHeaderProps {
    token: TerminalToken;
}

// Format number with K/M/B suffix
function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(2);
}

// Format price with dynamic decimals
function formatPrice(price: number): string {
    if (price < 0.0001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
}

// Format SOL amount
function formatSOL(amount: number): string {
    if (amount === 0) return "0";
    if (amount < 0.01) return amount.toFixed(4);
    if (amount < 1) return amount.toFixed(3);
    if (amount < 100) return amount.toFixed(2);
    return formatNumber(amount);
}

export function TerminalHeader({ token }: TerminalHeaderProps) {
    const handleCopyAddress = () => {
        navigator.clipboard.writeText(token.tokenId);
    };

    const priceChangeColor = token.priceChange24h >= 0 ? "text-[#39FF14]" : "text-[#FF003C]";
    const priceChangeSign = token.priceChange24h >= 0 ? "+" : "";

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0A0A0A]">
            {/* Left: Token Info */}
            <div className="flex items-center gap-4">
                {/* Token Image & Symbol */}
                <div className="flex items-center gap-3">
                    {token.image ? (
                        <img
                            src={token.image}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full border border-white/20"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39FF14]/30 to-[#00F0FF]/30 border border-white/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#EDEDED]">
                                {token.symbol.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#EDEDED]">{token.symbol}</span>
                            <span className="text-xs text-[#666]">{token.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#888] font-mono">
                                {token.tokenId.slice(0, 6)}...{token.tokenId.slice(-4)}
                            </span>
                            <button
                                onClick={handleCopyAddress}
                                className="text-[#666] hover:text-[#EDEDED] transition-colors"
                                title="Copy address"
                            >
                                <Copy size={10} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-white/10" />

                {/* Price */}
                <div className="flex flex-col">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Price</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#EDEDED]">
                            ${formatPrice(token.priceUsd)}
                        </span>
                        <span className={`text-[10px] font-mono ${priceChangeColor}`}>
                            {priceChangeSign}{token.priceChange24h.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: Stats */}
            <div className="flex items-center gap-6">
                <StatItem label="MC" value={`$${formatNumber(token.marketCap)}`} />
                <StatItem label="LIQ" value={`$${formatNumber(token.liquidity)}`} />
                <StatItem label="VOL_24H" value={`$${formatNumber(token.volume24h)}`} />
                <StatItem label="VOL_5M" value={`$${formatNumber(token.volume5m)}`} />
                <StatItem label="HOLDERS" value={formatNumber(token.holders)} />

                {/* Fees - highlighted if has Bags fees */}
                <div className="flex flex-col">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">FEES</span>
                    <div className="flex items-center gap-1">
                        {token.hasBagsFees && (
                            <Coins size={10} className="text-[#FFD700]" />
                        )}
                        <span className={`text-xs font-bold font-mono ${token.hasBagsFees ? "text-[#FFD700]" : "text-[#EDEDED]"}`}>
                            {formatSOL(token.lifetimeFees)} SOL
                        </span>
                    </div>
                </div>

                {/* Fee Earners Badge */}
                {token.hasBagsFees && token.feeEarners.length > 0 && (
                    <div className="flex flex-col">
                        <span className="text-[9px] text-[#666] uppercase tracking-widest">EARNERS</span>
                        <div className="flex items-center gap-1">
                            {token.topEarner && (
                                <span className="text-[10px] text-[#00F0FF] font-mono">
                                    {token.topEarner.provider && providerIcons[token.topEarner.provider]
                                        ? `${providerIcons[token.topEarner.provider]} `
                                        : ""}
                                    {token.topEarner.username.length > 12
                                        ? `${token.topEarner.username.slice(0, 12)}...`
                                        : token.topEarner.username}
                                </span>
                            )}
                            {token.feeEarners.length > 1 && (
                                <span className="text-[9px] text-[#666]">
                                    +{token.feeEarners.length - 1}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Bonding Progress */}
                <div className="flex flex-col">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">BONDING</span>
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#333] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#39FF14] to-[#00F0FF]"
                                style={{ width: `${token.bondingProgress}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-[#EDEDED]">
                            {token.bondingProgress}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Deployer Badge */}
                {token.deployerName && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-[#1A1A1A] border border-white/10 rounded">
                        <span className="text-[9px] text-[#666] uppercase">DEV</span>
                        <span className="text-[10px] text-[#EDEDED] font-mono">{token.deployerName}</span>
                        {token.deployerSuccessRate && (
                            <span className="text-[10px] text-[#39FF14] font-mono">
                                {token.deployerSuccessRate}%
                            </span>
                        )}
                    </div>
                )}

                {/* External Links */}
                <div className="flex items-center gap-1">
                    <LinkButton icon={<ExternalLink size={12} />} title="Solscan" />
                    <LinkButton icon={<Twitter size={12} />} title="Twitter" />
                    <LinkButton icon={<Globe size={12} />} title="Website" />
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] text-[#666] uppercase tracking-widest">{label}</span>
            <span className="text-xs font-bold text-[#EDEDED] font-mono">{value}</span>
        </div>
    );
}

function LinkButton({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <button
            className="p-1.5 bg-[#1A1A1A] border border-white/10 rounded hover:border-[#39FF14] hover:text-[#39FF14] text-[#666] transition-colors"
            title={title}
        >
            {icon}
        </button>
    );
}
