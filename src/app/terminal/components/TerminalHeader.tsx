"use client";

import { useState } from "react";
import { Copy, ExternalLink, Link2, Check } from "lucide-react";
import type { TerminalToken } from "@/lib/types";
import { BagsLogo } from "@/components/ui/BagsLogo";
import { usePriceFlash } from "@/components/ui/usePriceFlash";
import { cn } from "@/lib/utils";

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

export function TerminalHeader({ token }: TerminalHeaderProps) {
    const [linkCopied, setLinkCopied] = useState(false);
    const [addressCopied, setAddressCopied] = useState(false);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(token.tokenId).then(() => {
            setAddressCopied(true);
            setTimeout(() => setAddressCopied(false), 2000);
        });
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
        <div className="card overflow-hidden">
            <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)_auto] xl:items-center xl:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    {token.image ? (
                        <img
                            src={token.image}
                            alt={token.symbol}
                            className="h-10 w-10 rounded-full border border-white/10 object-cover shadow-soft"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                            <span className="text-sm font-semibold text-fg">
                                {token.symbol.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-base font-semibold text-fg" title={token.symbol}>
                                {token.symbol}
                            </span>
                            {token.hasBagsFees && (
                                <span className="badge-gold badge">
                                    <BagsLogo size={10} />
                                    BAGS
                                </span>
                            )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-high">
                            <span className="truncate" title={token.name}>
                                {token.name}
                            </span>
                            <span className="hidden sm:inline text-white/25">•</span>
                            <span className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-muted-high num">
                                    {token.tokenId.slice(0, 6)}...{token.tokenId.slice(-4)}
                                </span>
                                <button
                                    onClick={handleCopyAddress}
                                    className="text-muted-high transition-colors hover:text-fg"
                                    title="Copy address"
                                    aria-label="Copy token address"
                                >
                                    {addressCopied ? <Check size={12} className="text-acid-green" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                                </button>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                    <StatItem label="Market Cap" value={`$${formatNumber(token.marketCap)}`} />
                    <StatItem label="Liquidity" value={`$${formatNumber(token.liquidity)}`} />
                    <StatItem label="24H Volume" value={`$${formatNumber(token.volume24h)}`} />
                    <StatItem label="5M Volume" value={`$${formatNumber(token.volume5m)}`} />
                    <StatItem
                        label={token.hasBagsFees ? "Fees" : "Bonding"}
                        value={token.hasBagsFees ? `${token.lifetimeFees.toFixed(token.lifetimeFees < 1 ? 4 : 2)} SOL` : `${Math.round(token.bondingProgress)}%`}
                        highlight={token.hasBagsFees}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-muted-high">
                            Price
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className={cn("text-[1.65rem] font-semibold text-fg num", priceFlash)}>
                                ${formatPrice(token.priceUsd)}
                            </span>
                            <span className={`text-sm font-mono num ${priceChangeColor}`}>
                                {priceChangeSign}{token.priceChange24h.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <LinkButton
                            icon={<ExternalLink size={12} />}
                            title="Solscan"
                            href={`https://solscan.io/token/${token.tokenId}`}
                        />
                        <button
                            onClick={handleShareLink}
                            className="btn-ghost btn-press flex items-center gap-2 px-3 py-2 text-xs"
                            title="Copy share link"
                        >
                            {linkCopied ? (
                                <Check size={12} className="text-acid-green" />
                            ) : (
                                <Link2 size={12} />
                            )}
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={cn("stat-card px-3 py-2", highlight && "border-[#FFD700]/15 bg-[#FFD700]/5")}>
            <span className={cn("block text-[9px] uppercase tracking-[0.26em]", highlight ? "text-gold" : "text-muted-high")}>
                {label}
            </span>
            <span className={cn("mt-1 block text-[11px] font-semibold text-fg font-mono num", highlight && "number-glow-gold")}>
                {value}
            </span>
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
