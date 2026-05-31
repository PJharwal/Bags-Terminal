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
    }, [latestTrades, tokenId, addTrade]);

    // Loading state
    if (isLoading) {
        return (
            <div className="h-[calc(100vh-92px)] flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="text-[#39FF14] animate-spin" />
                    <span className="text-[#666] text-xs font-mono uppercase tracking-widest">
                        LOADING_TERMINAL...
                    </span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-[calc(100vh-92px)] flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="text-[#FF003C] text-lg font-bold">Failed to load token</div>
                    <div className="text-[#666] text-sm font-mono">{error}</div>
                    <div className="text-[#555] text-xs mt-1">
                        Check the token address and try again
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <button
                            onClick={() => router.back()}
                            className="btn-ghost flex items-center gap-2 text-sm font-mono"
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

    // No token loaded yet
    if (!activeToken) {
        return (
            <div className="h-[calc(100vh-92px)] flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="text-[#39FF14] animate-spin" />
                    <span className="text-[#666] text-xs font-mono uppercase tracking-widest">
                        INITIALIZING...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-92px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden font-mono">
            {/* Back Button */}
            <div className="absolute top-[70px] left-4 z-20">
                <button
                    onClick={() => router.back()}
                    className="btn-ghost flex items-center gap-2 text-[10px] font-mono"
                >
                    <ArrowLeft size={12} />
                    BACK
                </button>
            </div>

            {/* Connection Status */}
            <div className="absolute top-[70px] right-4 z-20">
                <div className={`${isConnected ? 'badge-green' : 'badge-red'} flex items-center gap-2 text-[10px] font-mono`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#39FF14] animate-pulse' : 'bg-[#FF003C]'}`} />
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </div>
            </div>

            {/* Terminal Header */}
            <TerminalHeader token={activeToken} />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <TerminalToolbar />

                {/* Center: Chart */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Chart Area */}
                    <div className="flex-1 min-h-0">
                        <TerminalChart tokenMint={tokenId} />
                    </div>

                    {/* Bottom Tabs */}
                    <div className="h-[200px] min-h-[200px]">
                        <TerminalBottomTabs />
                    </div>
                </div>

                {/* Right: Trade Panel + Credibility + Fee Earners */}
                <div className="w-[300px] min-w-[300px] flex flex-col overflow-y-auto custom-scrollbar">
                    <TerminalTradePanel />
                    <div className="p-2">
                        <LaunchConfigPanel token={activeToken} />
                    </div>
                    <CredibilityMatrix tokenId={tokenId} layout="terminal" />
                    {activeToken.hasBagsFees && (
                        <div className="p-2">
                            <FeeEarnersPanel
                                feeEarners={activeToken.feeEarners}
                                lifetimeFees={activeToken.lifetimeFees}
                            />
                        </div>
                    )}

                    {/* Share Cards */}
                    <ShareSection token={activeToken} />
                </div>
            </div>
        </div>
    );
}

// Collapsible share section for the right panel
function ShareSection({ token }: { token: import('@/lib/types').TerminalToken }) {
    const [open, setOpen] = useState(false);
    const [activeCard, setActiveCard] = useState<'pnl' | 'snapshot'>('snapshot');

    // Public token URL — X unfurls its OG card (/api/og?mint=) when shared.
    const shareUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/terminal/${token.tokenId}`
            : `/terminal/${token.tokenId}`;

    return (
        <div className="p-2 border-t border-white/5">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#888] hover:text-[#39FF14] transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Share2 size={12} />
                    Share Card
                </span>
                <span>{open ? '−' : '+'}</span>
            </button>

            {open && (
                <div className="mt-2 flex flex-col gap-2">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveCard('snapshot')}
                            className={`flex-1 px-2 py-1 text-[9px] font-mono uppercase tracking-widest border transition-colors ${
                                activeCard === 'snapshot'
                                    ? 'border-[#39FF14]/30 text-[#39FF14] bg-[#39FF14]/5'
                                    : 'border-white/10 text-[#666]'
                            }`}
                        >
                            Snapshot
                        </button>
                        <button
                            onClick={() => setActiveCard('pnl')}
                            className={`flex-1 px-2 py-1 text-[9px] font-mono uppercase tracking-widest border transition-colors ${
                                activeCard === 'pnl'
                                    ? 'border-[#39FF14]/30 text-[#39FF14] bg-[#39FF14]/5'
                                    : 'border-white/10 text-[#666]'
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
                            shareUrl={shareUrl}
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
                            shareUrl={shareUrl}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
