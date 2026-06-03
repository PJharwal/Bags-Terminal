"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { resolveTokenImage } from "@/lib/image";
import { usePulseStore, filterPulseItems, estimateBondingProgress } from "@/store/pulse.store";
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
          : estimateBondingProgress(marketCapSol);

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
        deployerLaunches: 0,
        deployerSuccessRate: 0,
        ageSeconds: ageSeconds > 0 ? ageSeconds : 0,
        marketCap: marketCapSol * solPrice,
        liquidity: 0,
        bondingProgress,
        holders: data.holder_count || 0,
        txCount: data.total_transactions || 0,
        volume24h: parseFloat(data.volume_24h_sol || "0") * solPrice,
        state: targetState,
        riskFlags,
        updatedAt: Date.now(),
        logoUrl: resolveTokenImage(data.logo_url || data.image_uri),
        protocolSource: data.protocol_source || "unknown",
    };
};

/* ------------------------------------------------------------------ */
/* COLUMN CONFIG                                                       */
/* ------------------------------------------------------------------ */
const COLUMNS: {
    state: PulseState;
    label: string;
    color: string;
    emptyMsg: string;
    emptyBagsMsg: string;
}[] = [
    {
        state: "NEW",
        label: "New Pairs",
        color: "#526fff",
        emptyMsg: "Waiting for new tokens...",
        emptyBagsMsg: "Waiting for BAGS tokens...",
    },
    {
        state: "FINAL_STRETCH",
        label: "Final Stretch",
        color: "#7c8cff",
        emptyMsg: "No tokens graduating",
        emptyBagsMsg: "No graduating BAGS tokens",
    },
    {
        state: "MIGRATED",
        label: "Migrated",
        color: "#39FF14",
        emptyMsg: "No migrated tokens",
        emptyBagsMsg: "No migrated BAGS tokens",
    },
];

export default function PulsePage() {
    const {
        items,
        filters,
        setFilters,
        addItem,
        setConnected,
        clearItems,
        reconcileItem,
    } = usePulseStore(
        useShallow((s) => ({
            items: s.items,
            filters: s.filters,
            setFilters: s.setFilters,
            addItem: s.addItem,
            setConnected: s.setConnected,
            clearItems: s.clearItems,
            reconcileItem: s.reconcileItem,
        })),
    );
    // Selector-scoped so the page doesn't re-render on the trade firehose.
    const connect = useSocketStore((s) => s.connect);
    const isConnected = useSocketStore((s) => s.isConnected);
    const markFeedOk = useSocketStore((s) => s.markFeedOk);
    const { drawerOpen } = useSelectionStore();
    const { price: solPrice } = useSolPrice();
    const [network, setNetwork] = useState<Network>("solana");
    const [activeTab, setActiveTab] = useState<"live" | "bags">("live");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    // One-time backfill on open (seeds all three columns, incl. Final Stretch /
    // Migrated which the socket rarely emits). After this the socket drives all
    // live updates.
    useEffect(() => {
        connect();
        fetchInitialData();
    }, [connect, fetchInitialData]);

    // Silent 30s reconcile of the two columns the socket barely feeds (Final
    // Stretch, Migrated). Merges server truth without skeletons and without
    // touching New Pairs; reconcileItem is idempotent, so no flicker/duplicates.
    const reconcileColumns = useCallback(async () => {
        try {
            const [soonRes, bondedRes] = await Promise.all([
                fetch(
                    `${config.baseServerUrl}/api/tokens?status=graduating&hours=6`,
                ),
                fetch(
                    `${config.baseServerUrl}/api/tokens?status=migrated&limit=20`,
                ),
            ]);

            const merge = async (res: Response, state: PulseState) => {
                if (!res.ok) return;
                const data = await res.json();
                const tokens = Array.isArray(data) ? data : data.tokens || [];
                tokens.forEach((t: RawTokenData) => {
                    if (filters.bagsOnly && !isBagsToken(t.mint)) return;
                    reconcileItem(processApiTokenData(t, state, solPrice));
                });
            };

            await Promise.all([
                merge(soonRes, "FINAL_STRETCH"),
                merge(bondedRes, "MIGRATED"),
            ]);
            markFeedOk();
        } catch {
            // Best-effort; the socket remains the primary live source.
        }
    }, [filters.bagsOnly, solPrice, reconcileItem, markFeedOk]);

    useEffect(() => {
        const id = setInterval(reconcileColumns, 30000);
        return () => clearInterval(id);
    }, [reconcileColumns]);

    useEffect(() => {
        setConnected(isConnected);
    }, [isConnected, setConnected]);

    // NOTE: socket-driven token inserts are handled exclusively by the socket
    // store (addTokenFromSocket). The page must NOT also add them here or the
    // same token gets inserted twice (duplicate keys + cross-column dupes).

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

    // Derive feed status on a throttled tick (read via getState) instead of
    // subscribing to lastEventAt, which would re-render the page on every
    // socket event.
    const [feedStatus, setFeedStatus] = useState<"live" | "polling" | "offline">(
        "offline",
    );
    useEffect(() => {
        const tick = () => {
            const { lastEventAt, lastFeedOkAt } = useSocketStore.getState();
            const live = usePulseStore.getState().items;
            const hasData =
                live.NEW.length + live.FINAL_STRETCH.length + live.MIGRATED.length >
                0;
            setFeedStatus(getFeedStatus({ lastEventAt, lastFeedOkAt }, hasData));
        };
        tick();
        const id = setInterval(tick, 2000);
        return () => clearInterval(id);
    }, []);

    // Compute the filtered, per-column lists once per data change. Memoizing
    // keeps array identity stable across unrelated re-renders so the columns /
    // virtualizer don't churn on every socket event.
    const newItems = useMemo(
        () => filterPulseItems(items.NEW, filters),
        [items.NEW, filters],
    );
    const finalStretchItems = useMemo(
        () => filterPulseItems(items.FINAL_STRETCH, filters),
        [items.FINAL_STRETCH, filters],
    );
    const migratedItems = useMemo(
        () => filterPulseItems(items.MIGRATED, filters),
        [items.MIGRATED, filters],
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#06070b]">
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

            {/* Main content - 3 column layout */}
            <div
                className={`flex-1 flex overflow-hidden min-h-0 px-2 lg:px-5 gap-1 ${
                    drawerOpen ? "pb-[50px] justify-center" : ""
                }`}
            >
                {activeTab === "bags" ? (
                    <LaunchFeedSection />
                ) : (
                    <>
                        <AxiomPulseColumn
                            title="New Pairs"
                            tokens={newItems}
                            isLoading={isLoading && newItems.length === 0}
                            color="#526fff"
                            className="flex-1"
                        />
                        <AxiomPulseColumn
                            title="Final Stretch"
                            tokens={finalStretchItems}
                            isLoading={isLoading && finalStretchItems.length === 0}
                            color="#7c8cff"
                            className="flex-1"
                        />
                        <AxiomPulseColumn
                            title="Migrated"
                            tokens={migratedItems}
                            isLoading={isLoading && migratedItems.length === 0}
                            color="#39FF14"
                            className="flex-1"
                        />
                    </>
                )}
            </div>

            <PulseDrawer />
        </div>
    );
}
