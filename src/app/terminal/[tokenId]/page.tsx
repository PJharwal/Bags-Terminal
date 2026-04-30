"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTerminalStore } from "@/store/terminal.store";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useSocketStore } from "@/store/socket.store";
import { TerminalHeader } from "../components/TerminalHeader";
import { TerminalChart } from "../components/TerminalChart";
import { TerminalTradePanel } from "../components/TerminalTradePanel";
import { TerminalBottomTabs } from "../components/TerminalBottomTabs";
import { TerminalToolbar } from "../components/TerminalToolbar";
import { CredibilityMatrix } from "@/components/credibility/CredibilityMatrix";
import { FeeEarnersPanel } from "@/components/terminal/FeeEarnersPanel";
import { LaunchConfigPanel } from "@/components/terminal/LaunchConfigPanel";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { PnLCard } from "@/components/share/PnLCard";
import { TokenSnapshotCard } from "@/components/share/TokenSnapshotCard";
import type { TradeRow } from "@/lib/types";

export default function TerminalPage() {
    const params = useParams();
    const router = useRouter();
    const tokenId = params.tokenId as string;

    const { activeToken, isLoading, error, loadToken, addTrade } = useTerminalStore();
    const { latestTrades, connect, isConnected } = useSocketStore();
    const { price: solPrice } = useSolPrice();

    // Connect to socket and load token data on mount
    useEffect(() => {
        connect();
    }, [connect]);

    // Load token data on tokenId change
    useEffect(() => {
        if (tokenId) {
            loadToken(tokenId);
        }
    }, [tokenId, loadToken]);

    // Subscribe to trades for this token from socket
    useEffect(() => {
        if (latestTrades.length > 0 && tokenId) {
            const latestTrade = latestTrades[0];
            // Only add trades for the current token
            if (latestTrade.mint === tokenId) {
                const solAmount = parseFloat(latestTrade.sol_amount || '0');
                const tokenAmount = parseFloat(latestTrade.token_amount || '1');
                const priceUsd = solAmount * solPrice / (tokenAmount || 1);

                const trade: TradeRow = {
                    id: latestTrade.signature || String(Date.now()),
                    type: latestTrade.direction === 'buy' ? 'buy' : 'sell',
                    wallet: latestTrade.user_wallet?.slice(0, 4) + '...' + latestTrade.user_wallet?.slice(-4) || 'unknown',
                    amount: tokenAmount,
                    priceUsd: priceUsd,
                    total: solAmount * solPrice,
                    timestamp: latestTrade.block_time || Date.now(),
                };
                addTrade(trade);
            }
        }
    }, [latestTrades, tokenId, addTrade, solPrice]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-background text-fg">
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 shadow-soft">
                    <Loader2 size={28} className="text-acid-green animate-spin" />
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-high">
                        LOADING_TERMINAL...
                    </span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-background px-4 text-fg">
                <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center shadow-soft">
                    <div className="text-lg font-semibold text-fg">Failed to load token</div>
                    <div className="text-sm text-muted-high">{error}</div>
                    <div className="text-xs text-muted-mid">
                        Check the token address and try again.
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="btn-ghost flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft size={14} />
                            Go Back
                        </button>
                        <button
                            onClick={() => loadToken(tokenId)}
                            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!activeToken) {
        return (
            <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-background text-fg">
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 shadow-soft">
                    <Loader2 size={28} className="text-acid-green animate-spin" />
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-high">
                        INITIALIZING...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-56px)] flex-col bg-background text-fg overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-[1820px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-soft">
                    <button
                        onClick={() => router.back()}
                        className="btn-ghost flex items-center gap-2 text-sm"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <div className="hidden text-center sm:block">
                        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-high">
                            Terminal view
                        </div>
                        <div className="text-sm text-fg-soft">
                            Simple trading surface with live updates
                        </div>
                    </div>
                    <div className={`${isConnected ? "badge-green" : "badge-red"} badge`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-acid-green animate-pulse" : "bg-[#FF003C]"}`} />
                        {isConnected ? "Live" : "Offline"}
                    </div>
                </div>

                <TerminalHeader token={activeToken} />

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[68px_minmax(0,1fr)_360px]">
                    <div className="hidden xl:flex">
                        <TerminalToolbar />
                    </div>

                    <div className="grid min-h-0 min-w-0 gap-4 lg:grid-rows-[minmax(520px,1fr)_260px] xl:grid-rows-[minmax(700px,1fr)_280px]">
                        <div className="card min-h-[420px] overflow-hidden lg:min-h-[520px] xl:min-h-[700px]">
                            <TerminalChart tokenMint={tokenId} />
                        </div>
                        <div className="card min-h-[240px] overflow-hidden">
                            <TerminalBottomTabs />
                        </div>
                    </div>

                    <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar xl:col-span-1">
                        <TerminalTradePanel />
                        <div className="card p-3">
                            <LaunchConfigPanel token={activeToken} />
                        </div>
                        <div className="card p-3">
                            <CredibilityMatrix tokenId={tokenId} layout="terminal" />
                        </div>
                        {activeToken.hasBagsFees && (
                            <div className="card p-3">
                                <FeeEarnersPanel
                                    feeEarners={activeToken.feeEarners}
                                    lifetimeFees={activeToken.lifetimeFees}
                                />
                            </div>
                        )}

                        <ShareSection token={activeToken} />
                    </aside>
                </div>
            </div>
        </div>
    );
}

// Collapsible share section for the right panel
function ShareSection({ token }: { token: import('@/lib/types').TerminalToken }) {
    const [open, setOpen] = useState(false);
    const [activeCard, setActiveCard] = useState<'pnl' | 'snapshot'>('snapshot');

    return (
        <div className="card p-3">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs uppercase tracking-[0.2em] text-muted-high transition-colors hover:text-fg"
            >
                <span className="flex items-center gap-2">
                    <Share2 size={12} />
                    Share Card
                </span>
                <span>{open ? '−' : '+'}</span>
            </button>

            {open && (
                <div className="mt-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => setActiveCard('snapshot')}
                            className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                                activeCard === 'snapshot'
                                    ? 'border-white/15 bg-white/[0.08] text-fg'
                                    : 'border-white/10 text-muted-high hover:text-fg'
                            }`}
                        >
                            Snapshot
                        </button>
                        <button
                            onClick={() => setActiveCard('pnl')}
                            className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                                activeCard === 'pnl'
                                    ? 'border-white/15 bg-white/[0.08] text-fg'
                                    : 'border-white/10 text-muted-high hover:text-fg'
                            }`}
                        >
                            PnL
                        </button>
                    </div>

                    {activeCard === 'snapshot' ? (
                        <TokenSnapshotCard
                            tokenSymbol={token.symbol.replace('$', '')}
                            tokenName={token.name}
                            tokenImage={token.image}
                            price={token.priceUsd}
                            priceChange24h={token.priceChange24h}
                            marketCap={token.marketCap}
                            volume24h={token.volume24h}
                            holders={token.holders}
                            liquidity={token.liquidity}
                            lifetimeFees={token.lifetimeFees}
                            hasBagsFees={token.hasBagsFees}
                        />
                    ) : (
                        <PnLCard
                            tokenSymbol={token.symbol.replace('$', '')}
                            tokenName={token.name}
                            tokenImage={token.image}
                            entryPrice={0}
                            currentPrice={token.priceUsd}
                            pnlPercent={token.priceChange24h}
                            pnlUsd={token.priceUsd * (token.priceChange24h / 100)}
                            marketCap={token.marketCap}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
