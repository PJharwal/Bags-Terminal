"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore } from "@/store/socket.store";
import { formatCurrency, getScoreColor } from "@/lib/format";
import type { PulseItem } from "@/lib/types";
import { Search, Shield, AlertTriangle, Crosshair, Database, Wifi, WifiOff, Loader2 } from "lucide-react";

// Aggregate deployers from tokens
interface AggregatedDeployer {
    wallet: string;
    name?: string;
    total_launches: number;
    success_rate: number;
    avg_score: number;
    risk_flags: string[];
    last_launch: number;
    total_volume: number;
    insider_usage_avg: number;
    tokens: PulseItem[];
}

function aggregateDeployers(tokens: PulseItem[]): AggregatedDeployer[] {
    const deployerMap = new Map<string, AggregatedDeployer>();

    tokens.forEach(token => {
        const deployerKey = token.deployer;
        const existing = deployerMap.get(deployerKey);

        if (existing) {
            existing.tokens.push(token);
            existing.total_launches++;
            existing.total_volume += token.volume24h || 0;
            existing.last_launch = Math.max(existing.last_launch, token.updatedAt);
        } else {
            deployerMap.set(deployerKey, {
                wallet: deployerKey,
                name: token.deployerName || undefined,
                total_launches: 1,
                success_rate: 0,
                avg_score: 0,
                risk_flags: [],
                last_launch: token.updatedAt,
                total_volume: token.volume24h || 0,
                insider_usage_avg: 0,
                tokens: [token],
            });
        }
    });

    // Calculate success rate and risk flags
    deployerMap.forEach((deployer) => {
        const migratedCount = deployer.tokens.filter(t => t.state === 'MIGRATED').length;
        deployer.success_rate = deployer.total_launches > 0
            ? Math.round((migratedCount / deployer.total_launches) * 100)
            : 0;

        // Calculate average risk score (inverse of risky tokens)
        const riskyTokens = deployer.tokens.filter(t => t.riskFlags.some(f => f.severity === 'critical'));
        deployer.avg_score = deployer.total_launches > 0
            ? Math.round(100 - (riskyTokens.length / deployer.total_launches) * 100)
            : 50;

        // Calculate average insider percentage
        const insiderPercents = deployer.tokens
            .filter(t => t.riskFlags.some(f => f.type === 'INSIDER_CLUSTER'))
            .length;
        deployer.insider_usage_avg = deployer.total_launches > 0
            ? Math.round((insiderPercents / deployer.total_launches) * 100)
            : 0;

        // Set risk flags
        if (deployer.insider_usage_avg > 30) {
            deployer.risk_flags.push('high_insider_avg');
        }
        if (deployer.success_rate < 30 && deployer.total_launches > 2) {
            deployer.risk_flags.push('low_success_rate');
        }
        if (riskyTokens.length > deployer.total_launches * 0.5) {
            deployer.risk_flags.push('suspicious_patterns');
        }
    });

    return Array.from(deployerMap.values())
        .sort((a, b) => b.total_volume - a.total_volume);
}

export default function DeployersPage() {
    const [selectedDeployer, setSelectedDeployer] = useState<AggregatedDeployer | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { items } = usePulseStore();
    const { connect, isConnected } = useSocketStore();

    useEffect(() => {
        connect();
    }, [connect]);

    // Get all tokens and aggregate deployers
    const allTokens = useMemo(() =>
        [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED],
        [items]
    );

    const deployers = useMemo(() => aggregateDeployers(allTokens), [allTokens]);

    // Filter deployers by search
    const filteredDeployers = useMemo(() => {
        if (!searchQuery) return deployers;
        const query = searchQuery.toLowerCase();
        return deployers.filter(d =>
            d.wallet.toLowerCase().includes(query) ||
            (d.name && d.name.toLowerCase().includes(query))
        );
    }, [deployers, searchQuery]);

    return (
        <div className="h-[calc(100vh-56px)] flex bg-[#050505] font-mono overflow-hidden">
            {/* Main List */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-6 bg-[#0A0A0A]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-[#EDEDED] mb-2 tracking-tighter">
                                DEPLOYER_DB
                            </h1>
                            <p className="text-xs text-[#888] uppercase tracking-widest">
                                Aggregated from live token data
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`${isConnected ? 'badge-green' : 'badge-red'} flex items-center gap-2`}>
                                {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                                <span className="text-xs font-bold">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                            </div>
                            <div className="badge-muted flex items-center gap-2">
                                <Database size={14} />
                                <span className="text-xs font-bold">{deployers.length} DEPLOYERS</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="SEARCH_WALLET_OR_ALIAS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input w-full pl-10 uppercase"
                        />
                        <Search className="absolute left-3 top-3.5 text-[#666]" size={16} />
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none fixed" />

                    {!isConnected && filteredDeployers.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-center gap-3 text-[#666]">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm font-mono">LOADING_DATA...</span>
                            </div>
                        </div>
                    ) : filteredDeployers.length > 0 ? (
                        <table className="w-full text-sm relative z-10">
                            <thead className="table-header sticky top-0 z-20">
                                <tr>
                                    <th className="text-left py-3 px-6">Identity</th>
                                    <th className="text-center py-3 px-4">Reputation</th>
                                    <th className="text-center py-3 px-4">Launches</th>
                                    <th className="text-right py-3 px-6">Vol_Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredDeployers.map((deployer) => (
                                    <tr
                                        key={deployer.wallet}
                                        onClick={() => setSelectedDeployer(deployer)}
                                        className={`table-row cursor-pointer group ${selectedDeployer?.wallet === deployer.wallet
                                                ? "bg-[#39FF14]/10 border-l-2 border-[#39FF14]"
                                                : "border-l-2 border-transparent"
                                            }`}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 flex items-center justify-center border ${
                                                    deployer.risk_flags.length > 0 ? 'border-[#FF003C] text-[#FF003C]' : 'border-[#39FF14] text-[#39FF14]'
                                                } bg-black`}>
                                                    <Crosshair size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#EDEDED] group-hover:text-[#39FF14] transition-colors">
                                                        {deployer.name || deployer.wallet}
                                                    </div>
                                                    <div className="text-[10px] text-[#666] font-mono">{deployer.wallet}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-sm font-bold ${getScoreColor(deployer.avg_score)}`}>
                                                    {deployer.avg_score}
                                                </span>
                                                <div className="progress-bar w-16">
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{ width: `${deployer.avg_score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 text-center font-mono text-[#888]">
                                            {deployer.total_launches}
                                        </td>

                                        <td className="py-4 px-6 text-right font-mono text-[#EDEDED]">
                                            {formatCurrency(deployer.total_volume)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#666] py-12">
                            <Database size={32} className="mb-4 opacity-30" />
                            <p className="text-sm font-mono">No deployers found. Waiting for tokens...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Dossier Panel (Right Sidebar) */}
            <AnimatePresence>
                {selectedDeployer && (
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="glass-heavy w-[400px] border-l border-white/10 overflow-y-auto custom-scrollbar shadow-2xl z-30"
                    >
                        {/* Dossier Header */}
                        <div className="p-6 border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-display font-bold text-[#EDEDED] tracking-tight">
                                    TARGET_DOSSIER
                                </h2>
                                <button
                                    onClick={() => setSelectedDeployer(null)}
                                    className="btn-ghost uppercase text-[10px] font-bold tracking-widest"
                                >
                                    CLOSE [ESC]
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-black border border-white/20 flex items-center justify-center">
                                    <Shield size={24} className={selectedDeployer.risk_flags.length > 0 ? "text-[#FF003C]" : "text-[#39FF14]"} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{selectedDeployer.name || selectedDeployer.wallet}</div>
                                    <div className="text-[10px] text-[#666] font-mono break-all">{selectedDeployer.wallet}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="stat-card">
                                    <div className="label">Win_Rate</div>
                                    <div className={`text-xl font-bold ${selectedDeployer.success_rate > 50 ? 'number-glow-green' : 'number-glow-red'}`}>
                                        {selectedDeployer.success_rate}%
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="label">Total_Vol</div>
                                    <div className="text-xl font-bold text-white">
                                        {selectedDeployer.total_volume >= 1000000
                                            ? `${(selectedDeployer.total_volume / 1000000).toFixed(1)}M`
                                            : formatCurrency(selectedDeployer.total_volume)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Risk Analysis */}
                        <div className="p-6 border-b border-white/10">
                            <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle size={12} /> Risk_Profile
                            </h3>

                            {selectedDeployer.risk_flags.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedDeployer.risk_flags.map((flag) => (
                                        <div key={flag} className="badge-red flex items-center gap-3 p-3">
                                            <AlertTriangle size={14} />
                                            <span className="text-xs font-bold uppercase">{flag.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="badge-green p-3 flex items-center gap-3">
                                    <Shield size={14} />
                                    <span className="text-xs font-bold uppercase">NO_ACTIVE_FLAGS</span>
                                </div>
                            )}
                        </div>

                        {/* Launch History */}
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">
                                Recent_Deployment_Log ({selectedDeployer.tokens.length})
                            </h3>
                            <div className="space-y-1">
                                {selectedDeployer.tokens.slice(0, 10).map((token, i) => (
                                    <div key={token.tokenId} className="flex items-center justify-between p-3 border border-white/5 hover:border-white/20 bg-black/20 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-[#444] font-mono">0{i+1}</span>
                                            <span className="font-bold text-[#EDEDED]">{token.symbol}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] ${token.state === 'MIGRATED' ? 'badge-green' : 'badge-muted'}`}>
                                                {token.state}
                                            </span>
                                            <span className="text-xs font-mono text-[#666]">
                                                {formatCurrency(token.marketCap)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
}
