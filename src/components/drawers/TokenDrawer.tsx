"use client";

import { useTerminalStore } from "@/store/terminal.store";
import { DrawerShell } from "./DrawerShell";
import { formatCurrency, formatNumber, formatTimeAgo } from "@/lib/format";
import { Shield, AlertTriangle, Terminal, BarChart3 } from "lucide-react";

function StatBlock({ label, value, color = "text-fg" }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="stat-card p-3 group">
            <div className="label mb-1 group-hover:text-fg-soft transition-colors">{label}</div>
            <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}

export function TokenDrawer() {
    const { selectedToken } = useTerminalStore();

    if (!selectedToken) return null;

    // Deployer info from token (no longer using mock data)
    const deployerWallet = selectedToken.deployer_wallet;
    const deployerInfo = deployerWallet ? {
        wallet: deployerWallet,
        name: null, // Would need to fetch from API
        total_launches: null,
        success_rate: null,
    } : null;

    return (
        <DrawerShell title="INTELLIGENCE_REPORT">
            <div className="p-6 space-y-8">
                {/* Header Section */}
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${selectedToken.status === 'live' ? 'bg-acid-green animate-pulse' : 'bg-[#666]'}`} />
                                <span className="text-meta font-bold uppercase tracking-widest text-muted-high">
                                    STATUS: {selectedToken.status}
                                </span>
                            </div>
                            <h2 className="text-3xl font-display font-bold text-fg">{selectedToken.symbol}</h2>
                        </div>
                        <div className={`px-3 py-1 border ${selectedToken.launch_score >= 70 ? 'border-[#39FF14] text-acid-green' : 'border-[#FF003C] text-error'}`}>
                            <span className="text-xl font-bold">{selectedToken.launch_score}</span>
                            <span className="text-meta block text-center uppercase">SCR</span>
                        </div>
                    </div>
                    <p className="text-xs text-fg-soft font-mono">{selectedToken.name}</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <StatBlock label="MARKET_CAP" value={formatCurrency(selectedToken.market_cap)} color="text-acid-green" />
                    <StatBlock label="24H_VOLUME" value={formatCurrency(selectedToken.volume_24h)} />
                    <StatBlock label="HOLDERS" value={formatNumber(selectedToken.holders)} />
                    <StatBlock label="LAUNCHED" value={formatTimeAgo(selectedToken.launch_time)} />
                </div>

                {/* Risk Indicators */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-high flex items-center gap-2">
                            <Shield size={12} /> RISK_PROFILE
                        </h3>
                    </div>

                    <div className="space-y-2">
                        {/* Dynamic Risk Flags based on token data */}
                        {selectedToken.dev_sold && (
                             <div className="flex items-center gap-3 p-3 bg-[#FF003C]/5 border border-[#FF003C]/20 text-error">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold uppercase">DEV_EXIT_CONFIRMED</span>
                            </div>
                        )}
                        {selectedToken.insider_pct > 30 && (
                             <div className="flex items-center gap-3 p-3 bg-[#FAFF00]/5 border border-[#FAFF00]/20 text-[#FAFF00]">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold uppercase">HIGH_INSIDER_HOLDINGS ({selectedToken.insider_pct}%)</span>
                            </div>
                        )}
                        {selectedToken.funding_type === 'suspicious' && (
                             <div className="flex items-center gap-3 p-3 bg-[#FF003C]/5 border border-[#FF003C]/20 text-error">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold uppercase">SUSPICIOUS_FUNDING_SOURCE</span>
                            </div>
                        )}
                        {/* Clean Status */}
                        {selectedToken.funding_type === 'fresh' && !selectedToken.dev_sold && selectedToken.insider_pct < 15 && (
                             <div className="p-3 bg-acid-green/5 border border-[#39FF14]/20 text-acid-green flex items-center gap-3">
                                <Shield size={14} />
                                <span className="text-xs font-bold uppercase">CLEAN_LAUNCH_DETECTED</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution Bars */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-high mb-3 flex items-center gap-2">
                        <BarChart3 size={12} /> SUPPLY_DISTRIBUTION
                    </h3>
                    <div className="space-y-4">
                        {/* Retail */}
                        <div>
                            <div className="flex justify-between text-meta mb-1">
                                <span className="text-fg-soft">RETAIL</span>
                                <span className="text-fg">{selectedToken.retail_pct}%</span>
                            </div>
                            <div className="h-1 bg-[#111] w-full">
                                <div className="h-full bg-[#00F0FF]" style={{ width: `${selectedToken.retail_pct}%` }} />
                            </div>
                        </div>
                        {/* Insider */}
                        <div>
                            <div className="flex justify-between text-meta mb-1">
                                <span className="text-fg-soft">INSIDER</span>
                                <span className={selectedToken.insider_pct > 20 ? 'text-error' : 'text-fg'}>
                                    {selectedToken.insider_pct}%
                                </span>
                            </div>
                            <div className="h-1 bg-[#111] w-full">
                                <div
                                    className={`h-full ${selectedToken.insider_pct > 20 ? 'bg-[#FF003C]' : 'bg-[#FAFF00]'}`}
                                    style={{ width: `${selectedToken.insider_pct}%` }}
                                />
                            </div>
                        </div>
                        {/* Dev */}
                        <div>
                            <div className="flex justify-between text-meta mb-1">
                                <span className="text-fg-soft">DEV_WALLET</span>
                                <span className={selectedToken.dev_pct > 5 ? 'text-[#FAFF00]' : 'text-fg'}>
                                    {selectedToken.dev_pct}%
                                </span>
                            </div>
                            <div className="h-1 bg-[#111] w-full">
                                <div className="h-full bg-acid-green" style={{ width: `${selectedToken.dev_pct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deployer Info */}
                {deployerInfo && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-high mb-3 flex items-center gap-2">
                            <Terminal size={12} /> DEPLOYER_ID
                        </h3>
                        <div className="stat-card p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-meta text-muted-high">WALLET</span>
                                <span className="text-xs font-mono text-fg-soft">{deployerInfo.wallet.slice(0, 8)}...</span>
                            </div>
                            <div className="text-meta text-muted-high text-center pt-2 border-t border-white/5">
                                Deployer analytics available in Deployers page
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DrawerShell>
    );
}
