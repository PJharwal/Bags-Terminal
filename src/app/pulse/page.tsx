"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { usePulseStore, type DisplayMode, type TierFilter } from "@/store/pulse.store";
import { useSocketStore } from "@/store/socket.store";
import { useSelectionStore } from "@/store/selection.store";
import { PulseColumn } from "@/components/pulse/PulseColumn";
import { PulseDrawer } from "@/components/pulse/PulseDrawer";
import { config } from "@/config/env";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Wifi, WifiOff, Activity, Zap, ShieldAlert, Cpu, Layers, RefreshCw } from "lucide-react";
import type { PulseItem, PulseState, RiskFlag } from "@/lib/types";
import type { RawTokenData } from "@/lib/bags-types";

// Types
type Network = 'solana' | 'base' | 'ethereum';

// SOL price for USD calculations (per user spec: use constant 140)
const SOL_PRICE = 140;

// BAGS token filter
const isBagsToken = (mint: string | undefined): boolean => {
    if (!mint) return false;
    return mint.toLowerCase().endsWith('bags');
};

// Process API token data into PulseItem format
const processApiTokenData = (data: RawTokenData, targetState: PulseState): PulseItem => {
    const marketCapSol = parseFloat(data.market_cap_sol || data.marketCapSol || "0");
    const bondingProgress = data.bonding_curve_percent
        ? parseFloat(data.bonding_curve_percent)
        : targetState === 'MIGRATED' ? 100 : Math.min(99, Math.floor(marketCapSol / 85 * 100));

    const top10Rate = parseFloat(data.top_10_holder_rate || "0");
    const riskFlags: RiskFlag[] = [];

    if (top10Rate > 50) {
        riskFlags.push({
            type: 'INSIDER_CLUSTER',
            severity: top10Rate > 70 ? 'critical' : 'warn',
        });
    }

    const creationTs = data.creation_timestamp || data.created_at || Math.floor(Date.now() / 1000);
    const ageSeconds = Math.floor((Date.now() / 1000) - creationTs);

    return {
        tokenId: data.mint || data.address || "",
        symbol: `$${data.symbol || "UNK"}`,
        name: data.name || "Unknown",
        deployer: data.creator?.slice(0, 4) + '...' + data.creator?.slice(-4) || "unknown",
        deployerName: 'deployer',
        deployerLaunches: 1,
        deployerSuccessRate: 50,
        ageSeconds: ageSeconds > 0 ? ageSeconds : 0,
        marketCap: marketCapSol * SOL_PRICE,
        liquidity: marketCapSol * SOL_PRICE * 0.3,
        bondingProgress,
        holders: data.holder_count || 0,
        txCount: data.total_transactions || 0,
        volume24h: parseFloat(data.volume_24h_sol || "0") * SOL_PRICE,
        state: targetState,
        riskFlags,
        updatedAt: Date.now(),
        logoUrl: data.logo_url || data.image_uri || undefined,
        protocolSource: data.protocol_source || "unknown",
    };
};

// Components
const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all ${active
            ? 'bg-[#39FF14] text-black border-[#39FF14]'
            : 'bg-transparent text-[#888] border-[#333] hover:border-[#EDEDED] hover:text-[#EDEDED]'
            }`}
    >
        {children}
    </button>
);

const StatDisplay = ({ label, value, color = "text-[#EDEDED]" }: { label: string; value: string; color?: string }) => (
    <div className="flex flex-col">
        <span className="text-[9px] text-[#666] uppercase tracking-widest font-mono">{label}</span>
        <span className={`text-sm font-display font-bold ${color}`}>{value}</span>
    </div>
);

// Header Component
function PulseHeader({
    network,
    onNetworkChange,
    isConnected,
    onRefresh,
    isLoading
}: {
    network: Network;
    onNetworkChange: (n: Network) => void;
    isConnected: boolean;
    onRefresh: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050505]">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[#39FF14]">
                    <Activity size={18} />
                    <h1 className="text-xl font-display font-bold tracking-tighter">LIVE_PULSE</h1>
                </div>
                <div className="h-4 w-[1px] bg-[#333]" />
                <div className="flex items-center gap-2 text-[10px] font-mono">
                    {isConnected ? (
                        <>
                            <Wifi size={12} className="text-[#39FF14]" />
                            <span className="text-[#39FF14]">CONNECTED</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={12} className="text-[#FF003C]" />
                            <span className="text-[#FF003C]">CONNECTING...</span>
                        </>
                    )}
                </div>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-1.5 border border-[#333] hover:border-[#39FF14] transition-colors disabled:opacity-50"
                    title="Refresh data"
                >
                    <RefreshCw size={12} className={`text-[#888] ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex border border-[#333]">
                    {(['solana', 'base', 'ethereum'] as Network[]).map((net) => (
                        <button
                            key={net}
                            onClick={() => onNetworkChange(net)}
                            className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${network === net
                                ? 'bg-[#EDEDED] text-black'
                                : 'text-[#666] hover:text-[#EDEDED]'
                                }`}
                        >
                            {net}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Parallax Background
const ParallaxBackground = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    const x = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-20, 20]);
    const y = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [-20, 20]);

    return (
        <motion.div style={{ x, y }} className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-[#39FF14] rounded-full opacity-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] border border-[#FF003C] rounded-full opacity-10" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </motion.div>
    );
};

export default function PulsePage() {
    const { items, getFilteredItems, filters, setFilters, addItem, setConnected, clearItems } = usePulseStore();
    const { connect, isConnected, latestTokens, latestTrades } = useSocketStore();
    const { drawerOpen } = useSelectionStore();
    const [network, setNetwork] = useState<Network>('solana');
    const [isLoading, setIsLoading] = useState(false);
    const processedTokensRef = useRef<Set<string>>(new Set());

    // Fetch initial data from API
    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('Fetching initial data from:', config.baseServerUrl);

            const [newRes, soonRes, bondedRes] = await Promise.all([
                fetch(`${config.baseServerUrl}/api/tokens?limit=20`),
                fetch(`${config.baseServerUrl}/api/tokens?status=graduating&hours=6`),
                fetch(`${config.baseServerUrl}/api/tokens?status=migrated&limit=20`),
            ]);

            // Process NEW tokens
            if (newRes.ok) {
                const data = await newRes.json();
                const tokens = Array.isArray(data) ? data : data.tokens || [];
                console.log('Fetched NEW tokens:', tokens.length);

                tokens.forEach((t: RawTokenData) => {
                    // Apply BAGS filter if enabled
                    if (filters.bagsOnly && !isBagsToken(t.mint)) return;

                    const item = processApiTokenData(t, 'NEW');
                    if (!processedTokensRef.current.has(item.tokenId)) {
                        processedTokensRef.current.add(item.tokenId);
                        addItem(item);
                    }
                });
            }

            // Process GRADUATING/SOON tokens (Processing column)
            if (soonRes.ok) {
                const data = await soonRes.json();
                const tokens = data.tokens || (Array.isArray(data) ? data : []);
                console.log('Fetched GRADUATING tokens:', tokens.length);

                tokens.forEach((t: RawTokenData) => {
                    if (filters.bagsOnly && !isBagsToken(t.mint)) return;

                    const item = processApiTokenData(t, 'FINAL_STRETCH');
                    if (!processedTokensRef.current.has(item.tokenId)) {
                        processedTokensRef.current.add(item.tokenId);
                        addItem(item);
                    }
                });
            }

            // Process MIGRATED tokens (Finalized column)
            if (bondedRes.ok) {
                const data = await bondedRes.json();
                const tokens = data.tokens || (Array.isArray(data) ? data : []);
                console.log('Fetched MIGRATED tokens:', tokens.length);

                tokens.forEach((t: RawTokenData) => {
                    if (filters.bagsOnly && !isBagsToken(t.mint)) return;

                    const item = processApiTokenData(t, 'MIGRATED');
                    if (!processedTokensRef.current.has(item.tokenId)) {
                        processedTokensRef.current.add(item.tokenId);
                        addItem(item);
                    }
                });
            }
        } catch (error) {
            console.error("Failed to fetch initial token data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [addItem, filters.bagsOnly]);

    // Connect to socket and fetch initial data on mount
    useEffect(() => {
        connect();
        fetchInitialData();
    }, [connect, fetchInitialData]);

    // Update pulse store connection status
    useEffect(() => {
        setConnected(isConnected);
    }, [isConnected, setConnected]);

    // Process new tokens from socket
    useEffect(() => {
        if (latestTokens.length > 0) {
            const token = latestTokens[0];

            // Apply BAGS filter
            if (filters.bagsOnly && !isBagsToken(token.mint)) {
                return;
            }

            // Skip if already processed
            if (processedTokensRef.current.has(token.mint)) {
                return;
            }

            console.log('New token from socket:', token.symbol, token.mint);
            processedTokensRef.current.add(token.mint);

            // Determine state based on bonding progress
            let state: PulseState = 'NEW';
            let bondingProgress = 0;

            if (token.status === 'migrated') {
                state = 'MIGRATED';
                bondingProgress = 100;
            } else if (token.market_cap_sol) {
                const mcSol = parseFloat(token.market_cap_sol);
                bondingProgress = Math.min(99, Math.floor(mcSol / 85 * 100));
                if (bondingProgress >= 85) {
                    state = 'FINAL_STRETCH';
                }
            }

            const item: PulseItem = {
                tokenId: token.mint,
                symbol: `$${token.symbol}`,
                name: token.name,
                deployer: token.creator?.slice(0, 4) + '...' + token.creator?.slice(-4),
                deployerName: 'deployer',
                deployerLaunches: 1,
                deployerSuccessRate: 50,
                ageSeconds: Math.max(0, Math.floor((Date.now() / 1000) - token.creation_timestamp)),
                marketCap: parseFloat(token.market_cap_sol || '0') * SOL_PRICE,
                liquidity: parseFloat(token.market_cap_sol || '0') * SOL_PRICE * 0.3,
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
    }, [latestTokens, addItem, filters.bagsOnly]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        processedTokensRef.current.clear();
        clearItems();
        fetchInitialData();
    }, [clearItems, fetchInitialData]);

    const totalTokens = items.NEW.length + items.FINAL_STRETCH.length + items.MIGRATED.length;

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden relative font-mono">
            <ParallaxBackground />

            <PulseHeader
                network={network}
                onNetworkChange={setNetwork}
                isConnected={isConnected}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />

            {/* Filter / Stats Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <FilterButton active={filters.tierFilter === 'all'} onClick={() => setFilters({ tierFilter: 'all' })}>ALL</FilterButton>
                        <FilterButton active={filters.tierFilter === 'high'} onClick={() => setFilters({ tierFilter: 'high' })}>WHALE</FilterButton>
                        <FilterButton active={filters.tierFilter === 'medium'} onClick={() => setFilters({ tierFilter: 'medium' })}>MID</FilterButton>
                    </div>
                    <div className="h-4 w-[1px] bg-[#333]" />
                    <button
                        onClick={() => setFilters({ hideRisky: !filters.hideRisky })}
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1 border transition-colors ${filters.hideRisky ? 'border-[#FF003C] text-[#FF003C]' : 'border-[#333] text-[#666]'
                            }`}
                    >
                        <ShieldAlert size={12} />
                        {filters.hideRisky ? 'RISK_FILTER: ON' : 'RISK_FILTER: OFF'}
                    </button>
                    <div className="h-4 w-[1px] bg-[#333]" />
                    <button
                        onClick={() => {
                            setFilters({ bagsOnly: !filters.bagsOnly });
                            // Refresh data when toggling filter
                            setTimeout(handleRefresh, 100);
                        }}
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1 border transition-colors ${filters.bagsOnly ? 'border-[#39FF14] text-[#39FF14]' : 'border-[#333] text-[#666]'
                            }`}
                    >
                        {filters.bagsOnly ? 'BAGS_ONLY: ON' : 'BAGS_ONLY: OFF'}
                    </button>
                </div>

                <div className="flex items-center gap-8">
                    <StatDisplay
                        label="TOKENS"
                        value={String(totalTokens)}
                        color={totalTokens > 0 ? "text-[#39FF14]" : "text-[#666]"}
                    />
                    <StatDisplay
                        label="STATUS"
                        value={isLoading ? "LOADING..." : isConnected ? "LIVE" : "..."}
                        color={isConnected ? "text-[#39FF14]" : "text-[#FF003C]"}
                    />
                </div>
            </div>

            {/* Main Content Area (Columns) */}
            <div className={`relative flex-1 flex overflow-hidden transition-all duration-300 ${drawerOpen ? 'mr-[400px]' : ''}`}>
                <div className="flex-1 grid grid-cols-3 divide-x divide-white/10">
                    {/* NEW Column */}
                    <div className="relative flex flex-col min-h-0 bg-[#050505]/50">
                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
                            <span className="text-xs font-bold text-[#39FF14] flex items-center gap-2">
                                <Zap size={14} /> INCOMING
                            </span>
                            <span className="text-[10px] text-[#666] font-mono">{items.NEW.length} items</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center text-[#666] text-xs py-8">
                                    Loading tokens...
                                </div>
                            ) : items.NEW.length === 0 ? (
                                <div className="text-center text-[#666] text-xs py-8">
                                    {filters.bagsOnly ? 'Waiting for BAGS tokens...' : 'No new tokens'}
                                </div>
                            ) : (
                                <PulseColumn state="NEW" items={getFilteredItems('NEW')} />
                            )}
                        </div>
                    </div>

                    {/* FINAL STRETCH Column */}
                    <div className="relative flex flex-col min-h-0 bg-[#050505]/50">
                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
                            <span className="text-xs font-bold text-[#00F0FF] flex items-center gap-2">
                                <Cpu size={14} /> PROCESSING
                            </span>
                            <span className="text-[10px] text-[#666] font-mono">{items.FINAL_STRETCH.length} items</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center text-[#666] text-xs py-8">
                                    Loading tokens...
                                </div>
                            ) : items.FINAL_STRETCH.length === 0 ? (
                                <div className="text-center text-[#666] text-xs py-8">
                                    {filters.bagsOnly ? 'No graduating BAGS tokens' : 'No tokens graduating'}
                                </div>
                            ) : (
                                <PulseColumn state="FINAL_STRETCH" items={getFilteredItems('FINAL_STRETCH')} />
                            )}
                        </div>
                    </div>

                    {/* MIGRATED Column */}
                    <div className="relative flex flex-col min-h-0 bg-[#050505]/50">
                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
                            <span className="text-xs font-bold text-[#FF003C] flex items-center gap-2">
                                <Layers size={14} /> FINALIZED
                            </span>
                            <span className="text-[10px] text-[#666] font-mono">{items.MIGRATED.length} items</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center text-[#666] text-xs py-8">
                                    Loading tokens...
                                </div>
                            ) : items.MIGRATED.length === 0 ? (
                                <div className="text-center text-[#666] text-xs py-8">
                                    {filters.bagsOnly ? 'No migrated BAGS tokens' : 'No migrated tokens'}
                                </div>
                            ) : (
                                <PulseColumn state="MIGRATED" items={getFilteredItems('MIGRATED')} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PulseDrawer />
        </div>
    );
}