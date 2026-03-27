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
        <div className="h-[calc(100vh-56px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden font-mono">
            {/* Header */}
            <div className="glass gradient-border flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <Terminal size={20} className="text-[#39FF14]" />
                    <h1 className="text-lg font-bold tracking-tight">TERMINAL</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-[10px] ${isConnected ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                        {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                        <span>{isConnected ? 'LIVE' : 'CONNECTING...'}</span>
                    </div>
                    <span className="text-[10px] text-[#666] font-mono">SELECT_TOKEN_TO_ANALYZE</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Trending Tokens from GMGN */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={14} className="text-[#39FF14]" />
                        <h2 className="label">Trending Tokens (1h)</h2>
                        {isLoadingTrending && <Loader2 size={12} className="animate-spin text-[#666]" />}
                    </div>
                    {trendingTokens.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                            {trendingTokens.map((token) => (
                                <TokenCard
                                    key={token.address}
                                    id={token.address}
                                    symbol={token.symbol ? `$${token.symbol}` : '$???'}
                                    name={token.name || 'Unknown'}
                                    marketCap={token.market_cap}
                                    priceChange={token.price_change_percent}
                                    onClick={() => handleOpenTerminal(token.address)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-[#666] text-sm py-4">
                            {isLoadingTrending ? 'Loading trending tokens...' : 'Unable to load trending tokens. Try refreshing.'}
                        </div>
                    )}
                </section>

                {/* Recent from Pulse */}
                {recentTokens.length > 0 && (
                    <section className="mb-8">
                        <h2 className="label mb-4">Recent from Live Feed</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {recentTokens.map((token) => (
                                <TokenCard
                                    key={token.tokenId}
                                    id={token.tokenId}
                                    symbol={token.symbol}
                                    name={token.name || token.symbol}
                                    marketCap={token.marketCap}
                                    bondingProgress={token.bondingProgress}
                                    onClick={() => handleOpenTerminal(token.tokenId)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state when no tokens */}
                {recentTokens.length === 0 && trendingTokens.length === 0 && !isLoadingTrending && (
                    <div className="text-center py-12 text-[#666]">
                        <Terminal size={32} className="mx-auto mb-4 opacity-30" />
                        <p className="text-sm">
                            {isConnected
                                ? 'Waiting for BAGS tokens...'
                                : 'Connecting to live feed...'}
                        </p>
                    </div>
                )}

                {/* Search / Paste Address */}
                <section className="mt-8">
                    <h2 className="label mb-4">Or Enter Token Address</h2>
                    <div className="flex gap-4 max-w-xl">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Paste Solana token mint address..."
                            className="input flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const input = e.currentTarget.value.trim();
                                    if (input) handleOpenTerminal(input);
                                }
                            }}
                        />
                        <button
                            className="btn-primary"
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
    );
}

// Token Card Component
function TokenCard({
    symbol,
    name,
    marketCap,
    bondingProgress,
    priceChange,
    onClick,
}: {
    id: string;
    symbol: string;
    name: string;
    marketCap?: number;
    bondingProgress?: number;
    priceChange?: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="card group flex items-center justify-between p-4 text-left"
        >
            <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-[#EDEDED]">{symbol}</span>
                <span className="text-[10px] text-[#666] truncate max-w-[120px]">{name}</span>
                {marketCap !== undefined && (
                    <span className="text-[10px] text-[#888] font-mono">
                        MC: {formatCurrency(marketCap)}
                    </span>
                )}
                {bondingProgress !== undefined && (
                    <span className={`text-[10px] font-mono ${bondingProgress >= 100 ? 'text-[#39FF14]' : 'text-[#666]'}`}>
                        {bondingProgress}% bonded
                    </span>
                )}
                {priceChange !== undefined && (
                    <span className={`text-[10px] font-mono ${priceChange >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                )}
            </div>
            <ArrowRight size={14} className="text-[#666] group-hover:text-[#39FF14] transition-colors" />
        </button>
    );
}
