"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTerminalStore } from "@/store/terminal.store";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useSocketStore } from "@/store/socket.store";
import { TerminalHeader } from "../components/TerminalHeader";
import { TerminalChart } from "../components/TerminalChart";
import { TerminalTradePanel } from "../components/TerminalTradePanel";
import { TerminalBottomTabs } from "../components/TerminalBottomTabs";
import { TerminalToolbar } from "../components/TerminalToolbar";
import { VerticalSplitPanel } from "@/components/ui/VerticalSplitPanel";
import { FeeEarnersPanel } from "@/components/terminal/FeeEarnersPanel";
import { LaunchConfigPanel } from "@/components/terminal/LaunchConfigPanel";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { TokenSnapshotCard } from "@/components/share/TokenSnapshotCard";
import type { TradeRow } from "@/lib/types";
import { config } from "@/config/env";

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

    // Subscribe to trades for this token from socket. React batches multiple
    // socket store writes into one render, so diff against the last-processed
    // signature instead of only reading latestTrades[0].
    const lastSeenTradeSig = useRef<string | null>(null);
    useEffect(() => {
        if (latestTrades.length === 0 || !tokenId) return;

        // Collect everything newer than the last-processed trade
        const newTrades: typeof latestTrades = [];
        for (const t of latestTrades) {
            if (t.signature && t.signature === lastSeenTradeSig.current) break;
            newTrades.push(t);
        }
        lastSeenTradeSig.current = latestTrades[0]?.signature ?? lastSeenTradeSig.current;

        // Process oldest-first, only trades for the current token
        for (const t of newTrades.reverse()) {
            if (t.mint !== tokenId) continue;
            const solAmount = parseFloat(t.sol_amount || '0');
            const tokenAmount = parseFloat(t.token_amount || '1');
            const priceUsd = solAmount * solPrice / (tokenAmount || 1);

            const trade: TradeRow = {
                id: t.signature || String(Date.now()),
                type: t.direction === 'buy' ? 'buy' : 'sell',
                wallet: t.user_wallet ? `${t.user_wallet.slice(0, 4)}...${t.user_wallet.slice(-4)}` : 'unknown',
                amount: tokenAmount,
                priceUsd: priceUsd,
                total: solAmount * solPrice,
                timestamp: t.block_time ? t.block_time * 1000 : Date.now(),
            };
            addTrade(trade);
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

                {/* Center: Chart & Bottom Tabs (Split Layout) */}
                <div className="flex-1 flex flex-col min-w-0">
                    <VerticalSplitPanel
                        topPanel={<TerminalChart tokenMint={tokenId} />}
                        bottomPanel={<TerminalBottomTabs />}
                        initialTopHeight={450}
                        minTopHeight={150}
                        minBottomHeight={150}
                    />
                </div>

                {/* Right: Trade Panel + Config + Fee Earners */}
                <div className="w-[300px] min-w-[300px] flex flex-col overflow-y-auto custom-scrollbar border-l border-white/10 bg-[#0A0A0A]">
                    <TerminalTradePanel />
                    <div className="p-4 border-t border-white/10">
                        <LaunchConfigPanel token={activeToken} />
                    </div>
                    {activeToken.hasBagsFees && (
                        <div className="p-4 border-t border-white/10">
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

    // Public token URL — X unfurls its OG card (/api/og?mint=) when shared.
    const shareUrl = `${config.siteUrl}/terminal/${token.tokenId}`;

    return (
        <div className="p-4 border-t border-white/10">
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
                    {/* PnL card removed — no tracked position data exists, so it
                        fabricated entry/PnL. Re-add once real entries are persisted. */}
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
                </div>
            )}
        </div>
    );
}
