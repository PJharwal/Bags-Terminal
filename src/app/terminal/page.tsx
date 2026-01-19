"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePulseStore } from "@/store/pulse.store";
import { Terminal, ArrowRight, Loader2 } from "lucide-react";

// Mock featured tokens for quick access
const FEATURED_TOKENS = [
    { id: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "$BONK", name: "Bonk" },
    { id: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", symbol: "$POPCAT", name: "Popcat" },
    { id: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY", symbol: "$MOODENG", name: "Moodeng" },
];

export default function TerminalIndexPage() {
    const router = useRouter();
    const { items } = usePulseStore();

    // Get recent tokens from Pulse
    const recentTokens = [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED].slice(0, 10);

    const handleOpenTerminal = (tokenId: string) => {
        router.push(`/terminal/${tokenId}`);
    };

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0A0A]">
                <div className="flex items-center gap-3">
                    <Terminal size={20} className="text-[#39FF14]" />
                    <h1 className="text-lg font-bold tracking-tight">TERMINAL</h1>
                </div>
                <span className="text-[10px] text-[#666] font-mono">SELECT_TOKEN_TO_ANALYZE</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Featured Tokens */}
                <section className="mb-8">
                    <h2 className="text-[10px] text-[#666] uppercase tracking-widest mb-4">Featured Tokens</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {FEATURED_TOKENS.map((token) => (
                            <TokenCard
                                key={token.id}
                                id={token.id}
                                symbol={token.symbol}
                                name={token.name}
                                onClick={() => handleOpenTerminal(token.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Recent from Pulse */}
                {recentTokens.length > 0 && (
                    <section>
                        <h2 className="text-[10px] text-[#666] uppercase tracking-widest mb-4">Recent from Pulse</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {recentTokens.map((token) => (
                                <TokenCard
                                    key={token.tokenId}
                                    id={token.tokenId}
                                    symbol={token.symbol}
                                    name={token.name || token.symbol}
                                    marketCap={token.marketCap}
                                    onClick={() => handleOpenTerminal(token.tokenId)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Search / Paste Address */}
                <section className="mt-8">
                    <h2 className="text-[10px] text-[#666] uppercase tracking-widest mb-4">Or Enter Token Address</h2>
                    <div className="flex gap-4 max-w-xl">
                        <input
                            type="text"
                            placeholder="Paste Solana token mint address..."
                            className="flex-1 bg-[#1A1A1A] border border-[#333] px-4 py-3 text-sm font-mono text-[#EDEDED] placeholder-[#666] focus:border-[#39FF14] focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const input = e.currentTarget.value.trim();
                                    if (input) handleOpenTerminal(input);
                                }
                            }}
                        />
                        <button
                            className="px-6 py-3 bg-[#39FF14] text-black font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                            onClick={() => {
                                const input = document.querySelector('input')?.value.trim();
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
    id,
    symbol,
    name,
    marketCap,
    onClick,
}: {
    id: string;
    symbol: string;
    name: string;
    marketCap?: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/10 hover:border-[#39FF14] transition-colors text-left"
        >
            <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-[#EDEDED]">{symbol}</span>
                <span className="text-[10px] text-[#666]">{name}</span>
                {marketCap && (
                    <span className="text-[10px] text-[#888] font-mono">
                        MC: ${(marketCap / 1000).toFixed(0)}K
                    </span>
                )}
            </div>
            <ArrowRight size={14} className="text-[#666] group-hover:text-[#39FF14] transition-colors" />
        </button>
    );
}