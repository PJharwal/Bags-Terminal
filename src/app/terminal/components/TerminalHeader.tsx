"use client";

import { useState } from "react";
import { Copy, ExternalLink, Link2, Check } from "lucide-react";
import type { TerminalToken } from "@/lib/types";
import { BagsLogo } from "@/components/ui/BagsLogo";
import { usePriceFlash } from "@/components/ui/usePriceFlash";
import { cn } from "@/lib/utils";

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
    const [linkCopied, setLinkCopied] = useState(false);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(token.tokenId);
    };

    const handleShareLink = () => {
        const url = `${window.location.origin}/terminal/${token.tokenId}`;
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const priceChangeColor = token.priceChange24h >= 0 ? "text-acid-green" : "text-error";
    const priceChangeSign = token.priceChange24h >= 0 ? "+" : "";
    const priceFlash = usePriceFlash(token.priceUsd);

    return (
        <div className="glass-heavy gradient-border flex items-center justify-between px-4 py-3">
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
                            <span className="text-xs font-bold text-fg">
                                {token.symbol.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className="text-sm font-bold text-fg truncate max-w-[120px]"
                                title={token.symbol}
                            >
                                {token.symbol}
                            </span>
                            {token.hasBagsFees && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-acid-green/10 border border-acid-green/20 text-meta text-acid-green font-bold uppercase shrink-0">
                                    <BagsLogo size={10} /> BAGS
                                </span>
                            )}
                            <span className="text-xs text-muted-high truncate" title={token.name}>{token.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-meta text-fg-soft font-mono num">
                                {token.tokenId.slice(0, 6)}...{token.tokenId.slice(-4)}
                            </span>
                            <button
                                onClick={handleCopyAddress}
                                className="text-muted-high hover:text-fg transition-colors focus-ring"
                                title="Copy address"
                                aria-label="Copy token address"
                            >
                                <Copy size={10} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-white/10" />

                {/* Price */}
                <div className="flex flex-col">
                    <span className="label">Price</span>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-bold text-fg num px-1 -mx-1", priceFlash)}>
                            ${formatPrice(token.priceUsd)}
                        </span>
                        <span className={`text-meta font-mono num ${priceChangeColor} ${token.priceChange24h >= 0 ? 'number-glow-green' : 'number-glow-red'}`}>
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
                <div className={`flex flex-col ${token.hasBagsFees ? "px-2 py-1 bg-[#FFD700]/5 border border-[#FFD700]/10 rounded" : ""}`}>
                    <span className={`${token.hasBagsFees ? "label-gold" : "label"} flex items-center gap-1`}>
                        {token.hasBagsFees && <BagsLogo size={10} />}
                        FEES
                    </span>
                    <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold font-mono ${token.hasBagsFees ? "number-glow-gold" : "text-fg"}`}>
                            {formatSOL(token.lifetimeFees)} SOL
                        </span>
                    </div>
                </div>

                {/* Fee Earners Badge */}
                {token.hasBagsFees && token.feeEarners.length > 0 && (
                    <div className="flex flex-col">
                        <span className="label">EARNERS</span>
                        <div className="flex items-center gap-1">
                            {token.topEarner && (
                                <span className="text-meta text-[#00F0FF] font-mono">
                                    {token.topEarner.provider && providerIcons[token.topEarner.provider]
                                        ? `${providerIcons[token.topEarner.provider]} `
                                        : ""}
                                    {token.topEarner.username.length > 12
                                        ? `${token.topEarner.username.slice(0, 12)}...`
                                        : token.topEarner.username}
                                </span>
                            )}
                            {token.feeEarners.length > 1 && (
                                <span className="text-meta text-muted-high">
                                    +{token.feeEarners.length - 1}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Bonding Progress */}
                <div className="flex flex-col">
                    <span className="label">BONDING</span>
                    <div className="flex items-center gap-2">
                        <div className="progress-bar w-16">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${token.bondingProgress}%` }}
                            />
                        </div>
                        <span className="text-meta font-mono text-fg num">
                            {Math.round(token.bondingProgress)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Deployer Badge */}
                {token.deployerName && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-elevated border border-white/10 rounded">
                        <span className="text-meta text-muted-high uppercase">DEV</span>
                        <span className="text-meta text-fg font-mono">{token.deployerName}</span>
                        {token.deployerSuccessRate && (
                            <span className="text-meta text-acid-green font-mono">
                                {token.deployerSuccessRate}%
                            </span>
                        )}
                    </div>
                )}

                {/* External Links */}
                <div className="flex items-center gap-1">
                    <LinkButton
                        icon={<ExternalLink size={12} />}
                        title="Solscan"
                        href={`https://solscan.io/token/${token.tokenId}`}
                    />
                    <button
                        onClick={handleShareLink}
                        className="btn-ghost btn-press p-1.5 flex items-center gap-1"
                        title="Copy share link"
                    >
                        {linkCopied ? (
                            <Check size={12} className="text-acid-green" />
                        ) : (
                            <Link2 size={12} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="label">{label}</span>
            <span className="text-xs font-bold text-fg font-mono num">{value}</span>
        </div>
    );
}

function LinkButton({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-press p-1.5"
            title={title}
        >
            {icon}
        </a>
    );
}
