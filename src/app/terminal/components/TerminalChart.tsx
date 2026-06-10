"use client";

import { useState, useEffect } from "react";

interface TerminalChartProps {
    tokenMint: string;
}

type ChartStatus = "resolving" | "ready" | "no-pool" | "error";

interface DexPair {
    chainId: string;
    pairAddress: string;
    liquidity?: { usd?: number };
}

export function TerminalChart({ tokenMint }: TerminalChartProps) {
    const [pairAddress, setPairAddress] = useState<string | null>(null);
    const [status, setStatus] = useState<ChartStatus>("resolving");
    const [revealed, setRevealed] = useState(false);
    const [chartKey, setChartKey] = useState(0);

    // Resolve the highest-liquidity Solana pool for this mint via DexScreener.
    useEffect(() => {
        if (!tokenMint) return;
        const controller = new AbortController();
        setStatus("resolving");
        setPairAddress(null);
        setRevealed(false);

        (async () => {
            try {
                const res = await fetch(
                    `/api/dexscreener/latest/dex/tokens/${tokenMint}`,
                    { signal: controller.signal }
                );
                if (!res.ok) {
                    setStatus("error");
                    return;
                }
                const data = await res.json();
                const pairs: DexPair[] = data?.pairs || [];
                const solPairs = pairs.filter((p) => p.chainId === "solana");
                if (solPairs.length === 0) {
                    setStatus("no-pool");
                    return;
                }
                const best = solPairs.sort(
                    (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
                )[0];
                setPairAddress(best.pairAddress);
                setChartKey((k) => k + 1);
                setStatus("ready");
            } catch {
                if (!controller.signal.aborted) setStatus("error");
            }
        })();

        return () => controller.abort();
        // chartKey: incremented by RETRY to re-run pool resolution
    }, [tokenMint, chartKey]);

    // Reveal the chart after the iframe has had time to paint. Cross-origin
    // iframes don't reliably fire onLoad, so we reveal on a timer too — the
    // chart loads underneath and the spinner never hangs.
    useEffect(() => {
        if (status !== "ready") return;
        const t = setTimeout(() => setRevealed(true), 3000);
        return () => clearTimeout(t);
    }, [status, chartKey]);

    const iframeSrc = pairAddress
        ? `https://www.geckoterminal.com/solana/pools/${pairAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=15m`
        : "";

    if (!tokenMint) {
        return (
            <div className="relative w-full h-full bg-black min-h-[300px] flex items-center justify-center">
                <span className="text-[#666] text-xs font-mono">NO_TOKEN_SELECTED</span>
            </div>
        );
    }

    if (status === "no-pool" || status === "error") {
        return (
            <div className="relative w-full h-full bg-black min-h-[300px] flex flex-col items-center justify-center gap-2">
                <span className="text-[#666] text-[11px] font-mono uppercase tracking-widest">
                    {status === "no-pool" ? "NO DEX POOL YET" : "CHART UNAVAILABLE"}
                </span>
                <span className="text-[#444] text-[9px] font-mono max-w-[260px] text-center leading-relaxed">
                    {status === "no-pool"
                        ? "Token is still on the bonding curve — a price chart appears once it migrates to a DEX."
                        : "Could not resolve a pool for this token."}
                </span>
                {status === "error" && (
                    <button
                        onClick={() => setChartKey((k) => k + 1)}
                        className="mt-2 text-[#39FF14] text-[10px] font-mono uppercase tracking-widest border border-[#39FF14]/30 px-3 py-1 hover:bg-[#39FF14]/10"
                    >
                        RETRY
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black min-h-[300px]">
            {/* Loading skeleton — dismissed on reveal timer or iframe onLoad */}
            {!revealed && (
                <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center z-10 pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[#666] text-[10px] font-mono uppercase tracking-widest">
                            LOADING_CHART...
                        </span>
                    </div>
                </div>
            )}

            {status === "ready" && iframeSrc && (
                <iframe
                    key={chartKey}
                    id="geckoterminal-embed"
                    title="GeckoTerminal Chart"
                    src={iframeSrc}
                    frameBorder="0"
                    allow="clipboard-write"
                    allowFullScreen
                    onLoad={() => setRevealed(true)}
                    className="w-full h-full border-none"
                    style={{ minHeight: "100%" }}
                />
            )}
        </div>
    );
}
