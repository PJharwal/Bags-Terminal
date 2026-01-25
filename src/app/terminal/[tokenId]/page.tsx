"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTerminalStore } from "@/store/terminal.store";
import { useSocketStore } from "@/store/socket.store";
import { TerminalHeader } from "../components/TerminalHeader";
import { TerminalChart } from "../components/TerminalChart";
import { TerminalTradePanel } from "../components/TerminalTradePanel";
import { TerminalBottomTabs } from "../components/TerminalBottomTabs";
import { TerminalToolbar } from "../components/TerminalToolbar";
import { CredibilityMatrix } from "@/components/credibility/CredibilityMatrix";
import { FeeEarnersPanel } from "@/components/terminal/FeeEarnersPanel";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { TradeRow } from "@/lib/types";

export default function TerminalPage() {
    const params = useParams();
    const router = useRouter();
    const tokenId = params.tokenId as string;

    const { activeToken, isLoading, error, loadToken, addTrade } = useTerminalStore();
    const { latestTrades, connect, isConnected } = useSocketStore();

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
                const priceUsd = solAmount * 140 / (tokenAmount || 1);

                const trade: TradeRow = {
                    id: latestTrade.signature || String(Date.now()),
                    type: latestTrade.direction === 'buy' ? 'buy' : 'sell',
                    wallet: latestTrade.user_wallet?.slice(0, 4) + '...' + latestTrade.user_wallet?.slice(-4) || 'unknown',
                    amount: tokenAmount,
                    priceUsd: priceUsd,
                    total: solAmount * 140,
                    timestamp: latestTrade.block_time || Date.now(),
                };
                addTrade(trade);
            }
        }
    }, [latestTrades, tokenId, addTrade]);

    // Loading state
    if (isLoading) {
        return (
            <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#050505]">
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
            <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="text-[#FF003C] text-lg font-bold">Failed to load token</div>
                    <div className="text-[#666] text-sm font-mono">{error}</div>
                    <div className="text-[#666] text-xs">
                        Make sure the GMGN server is running on localhost:8000
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-white/10 text-sm font-mono text-[#888] hover:text-[#EDEDED] hover:border-[#39FF14] transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // No token loaded yet
    if (!activeToken) {
        return (
            <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#050505]">
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
        <div className="h-[calc(100vh-56px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden font-mono">
            {/* Back Button */}
            <div className="absolute top-[70px] left-4 z-20">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] border border-white/10 text-[10px] font-mono text-[#888] hover:text-[#EDEDED] hover:border-[#39FF14] transition-colors"
                >
                    <ArrowLeft size={12} />
                    BACK
                </button>
            </div>

            {/* Connection Status */}
            <div className="absolute top-[70px] right-4 z-20">
                <div className={`flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] border text-[10px] font-mono ${isConnected ? 'border-[#39FF14]/30 text-[#39FF14]' : 'border-[#FF003C]/30 text-[#FF003C]'}`}>
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
                    <CredibilityMatrix tokenId={tokenId} layout="terminal" />
                    {activeToken.hasBagsFees && (
                        <div className="p-2">
                            <FeeEarnersPanel
                                feeEarners={activeToken.feeEarners}
                                lifetimeFees={activeToken.lifetimeFees}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
