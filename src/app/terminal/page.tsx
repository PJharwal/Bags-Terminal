"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore } from "@/store/socket.store";
import { gmgnService } from "@/services/gmgn.service";
import { formatCurrency } from "@/lib/format";
import { Terminal, ArrowRight, Loader2, TrendingUp, Wifi, WifiOff } from "lucide-react";
import type { GMGNTrendingToken } from "@/services/gmgn.service";

export default function TerminalIndexPage() {
    const router = useRouter();
    const { items } = usePulseStore();
    const { connect, isConnected } = useSocketStore();

    const inputRef = useRef<HTMLInputElement>(null);
    const [trendingTokens, setTrendingTokens] = useState<GMGNTrendingToken[]>([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState(false);

    // Connect to socket on mount
    useEffect(() => {
        connect();
    }, [connect]);

    // Fetch trending tokens — try GMGN first, fall back to DexScreener
    const fetchTrending = useCallback(async () => {
        setIsLoadingTrending(true);
        try {
            // Try GMGN first
            const data = await gmgnService.getTrending('1h');
            if (data?.rank && data.rank.length > 0) {
                setTrendingTokens(data.rank.slice(0, 6));
                return;
            }

            // Fall back to DexScreener
            const { dexScreenerService } = await import('@/services/dexscreener.service');
            const dexTokens = await dexScreenerService.getTrendingSolana();
            if (dexTokens.length > 0) {
                setTrendingTokens(
                    dexTokens.slice(0, 6).map(t => ({
                        address: t.address,
                        symbol: t.symbol,
                        name: t.name,
                        price: t.price,
                        price_change_percent: t.priceChange24h,
                        volume_24h: t.volume24h,
                        market_cap: t.marketCap,
                        logo: t.logo,
                    }))
                );
            }
        } catch (error) {
            console.error('Failed to fetch trending:', error);
        } finally {
            setIsLoadingTrending(false);
        }
    }, []);

    useEffect(() => {
        fetchTrending();
    }, [fetchTrending]);

    // Get recent tokens from Pulse
    const recentTokens = [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED].slice(0, 10);

    const handleOpenTerminal = (tokenId: string) => {
        router.push(`/terminal/${tokenId}`);
    };

    return (
        <div className="flex min-h-[calc(100vh-56px)] flex-col bg-background text-fg overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-[1820px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4">
                <div className="card grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-acid-green">
                            <Terminal size={18} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-semibold tracking-tight text-fg">Terminal</h1>
                                <span className="badge badge-muted">Live market surface</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-high">
                                Browse trending tokens or paste a mint address.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <div className={`badge ${isConnected ? 'badge-green' : 'badge-red'}`}>
                            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                            <span>{isConnected ? 'Live feed' : 'Connecting'}</span>
                        </div>
                        <span className="badge badge-muted">Select a token to continue</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto pr-1 custom-scrollbar">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_392px] 2xl:grid-cols-[minmax(0,1.2fr)_420px]">
                        <div className="space-y-4">
                            <section className="card p-4">
                                <div className="mb-4 flex items-end justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-acid-green" />
                                        <div>
                                            <h2 className="label">Trending tokens</h2>
                                            <p className="mt-1 text-xs text-muted-high">Fast movers from the live feed.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-high">
                                        {isLoadingTrending && <Loader2 size={12} className="animate-spin text-muted-high" />}
                                        <span>{trendingTokens.length} tokens</span>
                                    </div>
                                </div>
                                {trendingTokens.length > 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                                        {trendingTokens.map((token) => (
                                            <TokenCard
                                                key={token.address}
                                                id={token.address}
                                                symbol={token.symbol ? `$${token.symbol}` : '$???'}
                                                name={token.name || 'Unknown'}
                                                image={token.logo}
                                                marketCap={token.market_cap}
                                                volume={token.volume_24h}
                                                priceChange={token.price_change_percent}
                                                onClick={() => handleOpenTerminal(token.address)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-sm text-muted-high">
                                        {isLoadingTrending ? 'Loading trending tokens...' : 'Unable to load trending tokens. Try refreshing.'}
                                    </div>
                                )}
                            </section>

                            {recentTokens.length > 0 && (
                                <section className="card p-4">
                                    <div className="mb-4 flex items-end justify-between gap-2">
                                        <div>
                                            <h2 className="label">Recent from Live Feed</h2>
                                            <p className="mt-1 text-xs text-muted-high">Fresh launches and state changes.</p>
                                        </div>
                                        <span className="text-xs text-muted-high">{recentTokens.length} tokens</span>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                                        {recentTokens.map((token) => (
                                            <TokenCard
                                                key={token.tokenId}
                                                id={token.tokenId}
                                                symbol={token.symbol}
                                                name={token.name || token.symbol}
                                                image={token.image || token.logoUrl}
                                                marketCap={token.marketCap}
                                                holders={token.holders}
                                                bondingProgress={token.bondingProgress}
                                                onClick={() => handleOpenTerminal(token.tokenId)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {recentTokens.length === 0 && trendingTokens.length === 0 && !isLoadingTrending && (
                                <div className="card text-center py-12 text-muted-high">
                                    <Terminal size={32} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-sm">
                                        {isConnected
                                            ? 'Waiting for BAGS tokens...'
                                            : 'Connecting to live feed...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 xl:sticky xl:top-0">
                            <section className="card p-4">
                                <h2 className="label mb-4">Open by address</h2>
                                <div className="flex flex-col gap-3">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Paste Solana token mint address..."
                                        className="input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget.value.trim();
                                                if (input) handleOpenTerminal(input);
                                            }
                                        }}
                                    />
                                    <button
                                        className="btn-ghost border-acid-green/20 text-acid-green hover:border-acid-green/30 hover:bg-acid-green/10 w-full sm:w-auto"
                                        onClick={() => {
                                            const input = inputRef.current?.value.trim();
                                            if (input) handleOpenTerminal(input);
                                        }}
                                    >
                                        Open Terminal
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Token Card Component
function TokenCard({
    image,
    symbol,
    name,
    marketCap,
    volume,
    holders,
    bondingProgress,
    priceChange,
    onClick,
}: {
    id: string;
    image?: string;
    symbol: string;
    name: string;
    marketCap?: number;
    volume?: number;
    holders?: number;
    bondingProgress?: number;
    priceChange?: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="card group flex w-full flex-col gap-4 overflow-hidden p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/10"
        >
            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
                        {image ? (
                            <img
                                src={image}
                                alt={symbol}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-semibold text-fg-soft">{symbol.replace("$", "").charAt(0) || "?"}</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-sm font-semibold text-fg" title={symbol}>
                                {symbol}
                            </span>
                            {priceChange !== undefined && (
                                <span className={`badge ${priceChange >= 0 ? 'badge-green' : 'badge-red'} shrink-0`}>
                                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                                </span>
                            )}
                        </div>
                        <p className="truncate text-sm text-muted-high" title={name}>
                            {name}
                        </p>
                    </div>
                </div>
                <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-muted-high transition-colors group-hover:text-acid-green"
                />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {marketCap !== undefined && (
                    <span className="badge badge-muted justify-center">MC {formatCurrency(marketCap)}</span>
                )}
                {volume !== undefined && (
                    <span className="badge badge-muted justify-center">VOL {formatCurrency(volume)}</span>
                )}
                {holders !== undefined && (
                    <span className="badge badge-muted justify-center">{holders.toLocaleString()} holders</span>
                )}
                {bondingProgress !== undefined && (
                    <span className={`badge justify-center ${bondingProgress >= 100 ? 'badge-green' : 'badge-muted'}`}>
                        {Math.round(bondingProgress)}% Bonded
                    </span>
                )}
            </div>
        </button>
    );
}
