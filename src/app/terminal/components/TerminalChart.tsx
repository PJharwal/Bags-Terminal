"use client";

import { useState, useEffect } from "react";

interface TerminalChartProps {
    tokenMint: string;
}

export function TerminalChart({ tokenMint }: TerminalChartProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [chartKey, setChartKey] = useState(0);

    // Reset loading state when tokenMint changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoaded(false);
        setChartKey(prev => prev + 1);
    }, [tokenMint]);

    // GeckoTerminal embed URL - use token page format instead of pool
    // Format: /solana/tokens/{tokenMint} for token-based view
    const iframeSrc = `https://www.geckoterminal.com/solana/tokens/${tokenMint}?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=15m&bg_color=000000`;

    if (!tokenMint) {
        return (
            <div className="relative flex h-full min-h-[420px] w-full items-center justify-center bg-black sm:min-h-[520px] lg:min-h-[640px] xl:min-h-[760px]">
                <span className="text-muted-high text-xs font-mono">NO_TOKEN_SELECTED</span>
            </div>
        );
    }

    return (
        <div className="relative h-full min-h-[420px] w-full bg-black sm:min-h-[520px] lg:min-h-[640px] xl:min-h-[760px]">
            {/* Loading skeleton */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-high text-meta font-mono uppercase tracking-widest">
                            LOADING_CHART...
                        </span>
                        <span className="text-[#444] text-meta font-mono mt-2 max-w-[200px] truncate">
                            {tokenMint}
                        </span>
                    </div>
                </div>
            )}

            <iframe
                key={chartKey}
                id="geckoterminal-embed"
                title="GeckoTerminal Chart"
                src={iframeSrc}
                frameBorder="0"
                allow="clipboard-write"
                allowFullScreen
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                className="w-full h-full border-none"
                style={{ minHeight: '100%' }}
            />
        </div>
    );
}
