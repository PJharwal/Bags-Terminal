"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore, getFeedStatus } from "@/store/socket.store";
import { useSelectionStore } from "@/store/selection.store";
import { PulseColumn } from "@/components/pulse/PulseColumn";
import { PulseDrawer } from "@/components/pulse/PulseDrawer";
import { LiveTradesPanel } from "@/components/pulse/LiveTradesPanel";
import { LaunchFeedSection } from "@/components/bags/LaunchFeedSection";
import { config } from "@/config/env";
import { motion } from "framer-motion";
import {
    Wifi,
    WifiOff,
    Activity,
    Zap,
    ShieldAlert,
    Cpu,
    Layers,
    RefreshCw,
    Rocket,
    Radio,
    TrendingUp,
    ArrowUpRight,
} from "lucide-react";
import type { PulseItem, PulseState, RiskFlag } from "@/lib/types";
import type { RawTokenData } from "@/lib/bags-types";
import { useSolPrice } from "@/hooks/useSolPrice";
import { LivePulseDot } from "@/components/ui/LivePulseDot";

type Network = "solana" | "base" | "ethereum";

const isBagsToken = (mint: string | undefined): boolean => {
    if (!mint) return false;
    return mint.toLowerCase().endsWith("bags");
};

const processApiTokenData = (
    data: RawTokenData,
    targetState: PulseState,
    solPrice: number,
): PulseItem => {
    const marketCapSol = parseFloat(
        data.market_cap_sol || data.marketCapSol || "0",
    );
    const bondingProgress = data.bonding_curve_percent
        ? parseFloat(data.bonding_curve_percent)
        : targetState === "MIGRATED"
          ? 100
          : Math.min(99, Math.floor((marketCapSol / 85) * 100));

    const top10Rate = parseFloat(data.top_10_holder_rate || "0");
    const riskFlags: RiskFlag[] = [];

    if (top10Rate > 50) {
        riskFlags.push({
            type: "INSIDER_CLUSTER",
            severity: top10Rate > 70 ? "critical" : "warn",
        });
    }

    const creationTs =
        data.creation_timestamp ||
        data.created_at ||
        Math.floor(Date.now() / 1000);
    const ageSeconds = Math.floor(Date.now() / 1000 - creationTs);

    return {
        tokenId: data.mint || data.address || "",
        symbol: `$${data.symbol || "UNK"}`,
        name: data.name || "Unknown",
        deployer:
            data.creator?.slice(0, 4) + "..." + data.creator?.slice(-4) ||
            "unknown",
        deployerName: "deployer",
        deployerLaunches: 1,
        deployerSuccessRate: 50,
        ageSeconds: ageSeconds > 0 ? ageSeconds : 0,
        marketCap: marketCapSol * solPrice,
        liquidity: marketCapSol * solPrice * 0.3,
        bondingProgress,
        holders: data.holder_count || 0,
        txCount: data.total_transactions || 0,
        volume24h: parseFloat(data.volume_24h_sol || "0") * solPrice,
        state: targetState,
        riskFlags,
        updatedAt: Date.now(),
        logoUrl: data.logo_url || data.image_uri || undefined,
        protocolSource: data.protocol_source || "unknown",
    };
};

/* ------------------------------------------------------------------ */
/* COLUMN CONFIG                                                       */
/* ------------------------------------------------------------------ */
const COLUMNS: {
    state: PulseState;
    label: string;
    icon: React.ElementType;
    color: string;
    emptyMsg: string;
    emptyBagsMsg: string;
    description: string;
}[] = [
    {
        state: "NEW",
        label: "INCOMING",
        icon: Zap,
        color: "#39FF14",
        emptyMsg: "Waiting for new tokens...",
        emptyBagsMsg: "Waiting for BAGS tokens...",
        description: "Bonding curve active",
    },
    {
        state: "FINAL_STRETCH",
        label: "GRADUATING",
        icon: TrendingUp,
        color: "#FFD700",
        emptyMsg: "No tokens graduating",
        emptyBagsMsg: "No graduating BAGS tokens",
        description: "Near DEX migration",
    },
    {
        state: "MIGRATED",
        label: "LIVE ON DEX",
        icon: ArrowUpRight,
        color: "#00F0FF",
        emptyMsg: "No migrated tokens",
        emptyBagsMsg: "No migrated BAGS tokens",
        description: "LP deployed",
    },
];

export default function PulsePage() {
    const {
        items,
        getFilteredItems,
        filters,
        setFilters,
        addItem,
        setConnected,
        clearItems,
    } = usePulseStore();
    const { connect, isConnected, latestTokens, markFeedOk, lastEventAt, lastFeedOkAt } = useSocketStore();
    const { drawerOpen } = useSelectionStore();
    const { price: solPrice } = useSolPrice();
    const [network, setNetwork] = useState<Network>("solana");
    const [activeTab, setActiveTab] = useState<"live" | "bags">("live");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTrades, setShowTrades] = useState(true);
    const processedTokensRef = useRef<Set<string>>(new Set());
    const refreshingRef = useRef(false);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [newRes, soonRes, bondedRes] = await Promise.all([
                fetch(`${config.baseServerUrl}/api/tokens?limit=20`),
                fetch(
                    `${config.baseServerUrl}/api/tokens?status=graduating&hours=6`,
                ),
                fetch(
                    `${config.baseServerUrl}/api/tokens?status=migrated&limit=20`,
                ),
            ]);

            const processResponse = async (
                res: Response,
                state: PulseState,
            ) => {
                if (!res.ok) return;
                const data = await res.json();
                const tokens = Array.isArray(data) ? data : data.tokens || [];
                tokens.forEach((t: RawTokenData) => {
                    if (filters.bagsOnly && !isBagsToken(t.mint)) return;
                    const item = processApiTokenData(t, state, solPrice);
                    if (!processedTokensRef.current.has(item.tokenId)) {
                        processedTokensRef.current.add(item.tokenId);
                        addItem(item);
                    }
                });
            };

            await Promise.all([
                processResponse(newRes, "NEW"),
                processResponse(soonRes, "FINAL_STRETCH"),
                processResponse(bondedRes, "MIGRATED"),
            ]);
            markFeedOk();
        } catch (err) {
            console.error("Failed to fetch initial token data:", err);
            setError("Failed to load tokens. Retrying...");
        } finally {
            setIsLoading(false);
        }
    }, [addItem, filters.bagsOnly, solPrice, markFeedOk]);

    useEffect(() => {
        connect();
        fetchInitialData();
        // Poll periodically so the feed stays fresh even when the live socket
        // is silent. fetchInitialData dedupes via processedTokensRef.
        const id = setInterval(fetchInitialData, 15000);
        return () => clearInterval(id);
    }, [connect, fetchInitialData]);

    useEffect(() => {
        setConnected(isConnected);
    }, [isConnected, setConnected]);

    useEffect(() => {
        if (latestTokens.length > 0) {
            const token = latestTokens[0];
            if (filters.bagsOnly && !isBagsToken(token.mint)) return;
            if (processedTokensRef.current.has(token.mint)) return;

            processedTokensRef.current.add(token.mint);

            let state: PulseState = "NEW";
            let bondingProgress = 0;

            if (token.status === "migrated") {
                state = "MIGRATED";
                bondingProgress = 100;
            } else if (token.market_cap_sol) {
                const mcSol = parseFloat(token.market_cap_sol);
                bondingProgress = Math.min(
                    99,
                    Math.floor((mcSol / 85) * 100),
                );
                if (bondingProgress >= 85) {
                    state = "FINAL_STRETCH";
                }
            }

            const item: PulseItem = {
                tokenId: token.mint,
                symbol: `$${token.symbol}`,
                name: token.name,
                deployer:
                    token.creator?.slice(0, 4) +
                    "..." +
                    token.creator?.slice(-4),
                deployerName: "deployer",
                deployerLaunches: 1,
                deployerSuccessRate: 50,
                ageSeconds: Math.max(
                    0,
                    Math.floor(Date.now() / 1000 - token.creation_timestamp),
                ),
                marketCap:
                    parseFloat(token.market_cap_sol || "0") * solPrice,
                liquidity:
                    parseFloat(token.market_cap_sol || "0") * solPrice * 0.3,
                bondingProgress,
                holders: token.holder_count || 0,
                txCount: 0,
                volume24h: 0,
                state,
                riskFlags: [],
                updatedAt: Date.now(),
                logoUrl: token.logo_url || undefined,
                protocolSource: token.protocol_source,
            };

            addItem(item);
        }
    }, [latestTokens, addItem, filters.bagsOnly, solPrice]);

    const handleRefresh = useCallback(async () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        try {
            processedTokensRef.current.clear();
            clearItems();
            await fetchInitialData();
        } finally {
            refreshingRef.current = false;
        }
    }, [clearItems, fetchInitialData]);

    const totalTokens =
        items.NEW.length + items.FINAL_STRETCH.length + items.MIGRATED.length;
    const feedStatus = getFeedStatus({ lastEventAt, lastFeedOkAt }, totalTokens > 0);

    return (
        <div className="h-[calc(100vh-92px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden relative font-mono">
            {/* ── HEADER BAR ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#080808] z-10">
                <div className="flex items-center gap-4">
                    {/* Logo / Title */}
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-[#39FF14]" />
                        <h1 className="text-sm font-display font-bold tracking-tight uppercase">
                            PULSE
                        </h1>
                    </div>

                    {/* Connection badge — 3-state: live socket / REST polling / offline */}
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                            feedStatus === "live"
                                ? "border-[#39FF14]/20 text-[#39FF14] bg-[#39FF14]/5"
                                : feedStatus === "polling"
                                  ? "border-[#FFD700]/20 text-[#FFD700] bg-[#FFD700]/5"
                                  : "border-[#FF003C]/20 text-[#FF003C] bg-[#FF003C]/5"
                        }`}
                    >
                        {feedStatus === "offline" ? (
                            <WifiOff size={10} />
                        ) : (
                            <Wifi size={10} />
                        )}
                        {feedStatus === "live" ? "LIVE" : feedStatus === "polling" ? "POLLING" : "OFFLINE"}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-1.5 text-[#666] hover:text-[#EDEDED] hover:bg-white/5 transition-all disabled:opacity-30"
                        title="Refresh data"
                    >
                        <RefreshCw
                            size={13}
                            className={isLoading ? "animate-spin" : ""}
                        />
                    </button>
                </div>

                {/* Right side: network + stats */}
                <div className="flex items-center gap-5">
                    {/* Token count */}
                    {activeTab === "live" && (
                        <div className="flex items-center gap-4 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[#666]">TOKENS</span>
                                <span
                                    className={
                                        totalTokens > 0
                                            ? "text-[#39FF14] font-bold"
                                            : "text-[#666]"
                                    }
                                >
                                    {totalTokens}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Network switcher */}
                    <div className="flex border border-white/5">
                        <button
                            onClick={() => setNetwork("solana")}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                                network === "solana"
                                    ? "bg-[#39FF14] text-black"
                                    : "text-[#666] hover:text-[#EDEDED]"
                            }`}
                        >
                            SOL
                        </button>
                        {(["base", "ethereum"] as Network[]).map((net) => (
                            <button
                                key={net}
                                disabled
                                className="px-3 py-1 text-[9px] font-bold uppercase text-[#333] cursor-not-allowed border-l border-white/5"
                            >
                                {net === "base" ? "BASE" : "ETH"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── TAB BAR + FILTERS ──────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-white/5 bg-[#060606] z-10">
                <div className="flex items-center gap-3">
                    {/* Tabs */}
                    <div className="flex border border-white/5">
                        <button
                            onClick={() => setActiveTab("live")}
                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                activeTab === "live"
                                    ? "bg-[#39FF14] text-black"
                                    : "text-[#888] hover:text-[#EDEDED]"
                            }`}
                        >
                            <Radio size={10} />
                            LIVE FEED
                        </button>
                        <button
                            onClick={() => setActiveTab("bags")}
                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border-l border-white/5 ${
                                activeTab === "bags"
                                    ? "bg-[#FFD700] text-black"
                                    : "text-[#888] hover:text-[#EDEDED]"
                            }`}
                        >
                            <Rocket size={10} />
                            BAGS LAUNCHES
                        </button>
                    </div>

                    {/* Filters (only for live tab) */}
                    {activeTab === "live" && (
                        <>
                            <div className="h-4 w-px bg-white/5" />
                            <div className="flex gap-1">
                                {(
                                    [
                                        { key: "all", label: "ALL" },
                                        { key: "high", label: "WHALE" },
                                        { key: "medium", label: "MID" },
                                    ] as const
                                ).map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() =>
                                            setFilters({ tierFilter: f.key })
                                        }
                                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                                            filters.tierFilter === f.key
                                                ? "bg-white/10 text-[#EDEDED]"
                                                : "text-[#666] hover:text-[#EDEDED]"
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-4 w-px bg-white/5" />

                            <button
                                onClick={() =>
                                    setFilters({
                                        hideRisky: !filters.hideRisky,
                                    })
                                }
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                                    filters.hideRisky
                                        ? "bg-[#FF003C]/10 text-[#FF003C] border border-[#FF003C]/20"
                                        : "text-[#666] hover:text-[#EDEDED]"
                                }`}
                            >
                                <ShieldAlert size={10} />
                                RISK
                                {filters.hideRisky ? " ON" : ""}
                            </button>

                            <button
                                onClick={() => {
                                    setFilters({
                                        bagsOnly: !filters.bagsOnly,
                                    });
                                    handleRefresh();
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                                    filters.bagsOnly
                                        ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                                        : "text-[#666] hover:text-[#EDEDED]"
                                }`}
                            >
                                BAGS{filters.bagsOnly ? " ON" : ""}
                            </button>

                            <div className="h-4 w-px bg-white/5" />

                            <button
                                onClick={() => setShowTrades((v) => !v)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                                    showTrades
                                        ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20"
                                        : "text-[#666] hover:text-[#EDEDED]"
                                }`}
                            >
                                TRADES{showTrades ? " ON" : ""}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── ERROR BANNER ────────────────────────────────────── */}
            {error && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-5 py-2 bg-[#FF003C]/10 border-b border-[#FF003C]/20 text-[#FF003C] text-[10px] font-mono flex items-center justify-between"
                >
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-[#FF003C]/60 hover:text-[#FF003C] text-xs"
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}

            {/* ── MAIN CONTENT ────────────────────────────────────── */}
            <div
                className={`relative flex-1 flex overflow-hidden transition-all duration-300 ${drawerOpen ? "mr-[400px]" : ""}`}
            >
                {activeTab === "bags" ? (
                    <LaunchFeedSection />
                ) : (
                    <div
                        className="flex-1 grid divide-x divide-white/5"
                        style={{
                            gridTemplateColumns: showTrades && !drawerOpen
                                ? "1fr 1fr 1fr 300px"
                                : "1fr 1fr 1fr",
                        }}
                    >
                        {COLUMNS.map((col) => (
                            <div
                                key={col.state}
                                className="relative flex flex-col min-h-0"
                            >
                                {/* Column header — accent top-bar + icon/label row */}
                                <div
                                    className="h-[3px]"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${col.color}55, transparent)`,
                                    }}
                                />
                                <div className="px-4 py-2.5 border-b border-white/5 bg-[#080808] flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-6 h-6 border flex items-center justify-center flex-shrink-0"
                                            style={{
                                                borderColor: `${col.color}33`,
                                                background: `${col.color}08`,
                                            }}
                                        >
                                            <col.icon
                                                size={12}
                                                style={{ color: col.color }}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div
                                                className="text-[10px] font-bold uppercase tracking-widest leading-none"
                                                style={{ color: col.color }}
                                            >
                                                {col.label}
                                            </div>
                                            <div className="text-[8px] text-[#444] mt-0.5 hidden sm:block leading-none">
                                                {col.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold tabular-nums text-[#888]">
                                            {items[col.state].length}
                                        </span>
                                        {/* Live pulse dot for NEW column */}
                                        {col.state === "NEW" &&
                                            isConnected && (
                                                <LivePulseDot color="green" />
                                            )}
                                    </div>
                                </div>

                                {/* Column content */}
                                <div className="flex-1 overflow-hidden">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3">
                                            <div className="w-5 h-5 border-2 border-white/10 border-t-[#39FF14] rounded-full animate-spin" />
                                            <span className="text-[10px] text-[#555] uppercase tracking-widest">
                                                Loading...
                                            </span>
                                        </div>
                                    ) : items[col.state].length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 px-6">
                                            <col.icon
                                                size={20}
                                                className="text-[#222]"
                                            />
                                            <span className="text-[10px] text-[#444] text-center">
                                                {filters.bagsOnly
                                                    ? col.emptyBagsMsg
                                                    : col.emptyMsg}
                                            </span>
                                        </div>
                                    ) : (
                                        <PulseColumn
                                            state={col.state}
                                            items={getFilteredItems(col.state)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Live Trades Side Panel */}
                        {showTrades && !drawerOpen && (
                            <LiveTradesPanel />
                        )}
                    </div>
                )}
            </div>

            <PulseDrawer />
        </div>
    );
}
