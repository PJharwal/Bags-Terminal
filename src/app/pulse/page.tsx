"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore, getFeedStatus } from "@/store/socket.store";
import { useSelectionStore } from "@/store/selection.store";
import { AxiomPulseColumn } from "@/components/pulse/AxiomPulseColumn";
import { AxiomPulseToolbar } from "@/components/pulse/AxiomPulseToolbar";
import { PulseDrawer } from "@/components/pulse/PulseDrawer";
import { LaunchFeedSection } from "@/components/bags/LaunchFeedSection";
import { config } from "@/config/env";
import { motion } from "framer-motion";
import type { PulseItem, PulseState, RiskFlag } from "@/lib/types";
import type { RawTokenData } from "@/lib/bags-types";
import { useSolPrice } from "@/hooks/useSolPrice";

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
    const { connect, isConnected, markFeedOk, lastEventAt, lastFeedOkAt } = useSocketStore();
    const { drawerOpen } = useSelectionStore();
    const { price: solPrice } = useSolPrice();
    const [network, setNetwork] = useState<Network>("solana");
    const [activeTab, setActiveTab] = useState<"live" | "bags">("live");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobileColumn, setMobileColumn] = useState<PulseState>("NEW");
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
        const id = setInterval(fetchInitialData, 15000);
        return () => clearInterval(id);
    }, [connect, fetchInitialData]);

    useEffect(() => {
        setConnected(isConnected);
    }, [isConnected, setConnected]);



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

    const handleTabChange = useCallback((tab: "live" | "bags") => {
        setActiveTab(tab);
        setFilters({ bagsOnly: tab === "bags" });
    }, [setFilters]);

    const totalTokens =
        items.NEW.length + items.FINAL_STRETCH.length + items.MIGRATED.length;
    const feedStatus = getFeedStatus({ lastEventAt, lastFeedOkAt }, totalTokens > 0);

    return (
        <div className="h-[calc(100vh-92px)] flex flex-col overflow-hidden bg-[#06070b]">
            {/* Axiom-style toolbar */}
            <AxiomPulseToolbar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                activeChain={network}
                onChainChange={setNetwork}
                feedStatus={feedStatus}
                totalTokens={totalTokens}
                isLoading={isLoading}
                onRefresh={handleRefresh}
            />

            {/* Error banner */}
            {error && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-5 py-2 bg-[#1a1a2e] text-[#fbbf24] text-xs text-center"
                >
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-[#fbbf24]/60 hover:text-[#fbbf24] text-xs"
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}

            {/* Mobile sub-tab bar */}
            {activeTab === "live" && (
                <div className="flex md:hidden bg-[#101114] border-b border-[#1d1f26] p-1 gap-1 shrink-0">
                    <button
                        onClick={() => setMobileColumn("NEW")}
                        className={`flex-1 py-1.5 text-center text-xs font-semibold rounded transition-colors border-none cursor-pointer ${
                            mobileColumn === "NEW" ? "bg-[#14f195] text-black" : "text-neutral-400 hover:text-white bg-transparent"
                        }`}
                    >
                        New Pairs
                    </button>
                    <button
                        onClick={() => setMobileColumn("FINAL_STRETCH")}
                        className={`flex-1 py-1.5 text-center text-xs font-semibold rounded transition-colors border-none cursor-pointer ${
                            mobileColumn === "FINAL_STRETCH" ? "bg-[#14f195] text-black" : "text-neutral-400 hover:text-white bg-transparent"
                        }`}
                    >
                        Final Stretch
                    </button>
                    <button
                        onClick={() => setMobileColumn("MIGRATED")}
                        className={`flex-1 py-1.5 text-center text-xs font-semibold rounded transition-colors border-none cursor-pointer ${
                            mobileColumn === "MIGRATED" ? "bg-[#14f195] text-black" : "text-neutral-400 hover:text-white bg-transparent"
                        }`}
                    >
                        Migrated
                    </button>
                </div>
            )}

            {/* Main content - 3 column layout */}
            <div
                className={`flex-1 flex overflow-hidden min-h-0 border-t border-[#1d1f26] ${
                    drawerOpen ? "pb-[50px]" : ""
                }`}
            >
                {activeTab === "bags" ? (
                    <div className="flex-1 px-2 lg:px-5">
                        <LaunchFeedSection />
                    </div>
                ) : (
                    <>
                        <div className={`${mobileColumn === "NEW" ? "flex" : "hidden"} md:flex flex-1 min-h-0`}>
                            <AxiomPulseColumn
                                title="New Pairs"
                                tokens={getFilteredItems("NEW")}
                                isLoading={isLoading}
                                color="#526fff"
                                className="flex-1"
                            />
                        </div>
                        <div className={`${mobileColumn === "FINAL_STRETCH" ? "flex" : "hidden"} md:flex flex-1 min-h-0`}>
                            <AxiomPulseColumn
                                title="Final Stretch"
                                tokens={getFilteredItems("FINAL_STRETCH")}
                                isLoading={isLoading}
                                color="#7c8cff"
                                className="flex-1"
                            />
                        </div>
                        <div className={`${mobileColumn === "MIGRATED" ? "flex" : "hidden"} md:flex flex-1 min-h-0`}>
                            <AxiomPulseColumn
                                title="Migrated"
                                tokens={getFilteredItems("MIGRATED")}
                                isLoading={isLoading}
                                color="#39FF14"
                                className="flex-1"
                            />
                        </div>
                    </>
                )}
            </div>

            <PulseDrawer />
        </div>
    );
}
