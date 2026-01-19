"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTerminalStore } from "@/store/terminal.store";
import { TerminalHeader } from "../components/TerminalHeader";
import { TerminalChart } from "../components/TerminalChart";
import { TerminalTradePanel } from "../components/TerminalTradePanel";
import { TerminalBottomTabs } from "../components/TerminalBottomTabs";
import { TerminalToolbar } from "../components/TerminalToolbar";
import { CredibilityMatrix } from "@/components/credibility/CredibilityMatrix";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TerminalPage() {
    const params = useParams();
    const router = useRouter();
    const tokenId = params.tokenId as string;

    const { activeToken, isLoading, loadToken, simulateTrade } = useTerminalStore();

    // Load token data on mount or tokenId change
    useEffect(() => {
        if (tokenId) {
            loadToken(tokenId);
        }
    }, [tokenId, loadToken]);

    // Simulate real-time trades
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeToken) {
                simulateTrade();
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeToken, simulateTrade]);

    // Loading state
    if (isLoading || !activeToken) {
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

                {/* Right: Trade Panel + Credibility */}
                <div className="w-[300px] min-w-[300px] flex flex-col overflow-y-auto custom-scrollbar">
                    <TerminalTradePanel />
                    <CredibilityMatrix tokenId={tokenId} layout="terminal" />
                </div>
            </div>
        </div>
    );
}
