"use client";

import { useTerminalStore } from "@/store/terminal.store";
import { DrawerShell } from "./DrawerShell";
import { formatCurrency, formatNumber, formatTimeAgo, getScoreColor } from "@/lib/format";
import { getDeployerByWallet } from "@/lib/mock-data";
import { Shield, AlertTriangle, Terminal, Activity, Zap, BarChart3, Users } from "lucide-react";

function StatBlock({ label, value, color = "text-[#EDEDED]" }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="p-3 bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="text-[9px] text-[#666] uppercase tracking-widest mb-1 font-mono group-hover:text-[#888] transition-colors">{label}</div>
            <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}

export function TokenDrawer() {
    const { selectedToken } = useTerminalStore();

    if (!selectedToken) return null;

    const deployer = getDeployerByWallet(selectedToken.deployer_wallet);

    return (
        <DrawerShell title="INTELLIGENCE_REPORT">
            <div className="p-6 space-y-8">
                {/* Header Section */}
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${selectedToken.status === 'live' ? 'bg-[#39FF14] animate-pulse' : 'bg-[#666]'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                                    STATUS: {selectedToken.status}
                                </span>
                            </div>
                            <h2 className="text-3xl font-display font-bold text-[#EDEDED]">{selectedToken.symbol}</h2>
                        </div>
                        <div className={`px-3 py-1 border ${selectedToken.launch_score >= 70 ? 'border-[#39FF14] text-[#39FF14]' : 'border-[#FF003C] text-[#FF003C]'}`}>
                            <span className="text-xl font-bold">{selectedToken.launch_score}</span>
                            <span className="text-[9px] block text-center uppercase">SCR</span>
                        </div>
                    </div>
                    <p className="text-xs text-[#888] font-mono">{selectedToken.name}</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <StatBlock label="MARKET_CAP" value={formatCurrency(selectedToken.market_cap)} color="text-[#39FF14]" />
                    <StatBlock label="24H_VOLUME" value={formatCurrency(selectedToken.volume_24h)} />
                    <StatBlock label="HOLDERS" value={formatNumber(selectedToken.holders)} />
                    <StatBlock label="LAUNCHED" value={formatTimeAgo(selectedToken.launch_time)} />
                </div>

                {/* Risk Indicators */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] flex items-center gap-2">
                            <Shield size={12} /> RISK_PROFILE
                        </h3>
                    </div>
                    
                    <div className="space-y-2">
                        {/* Dynamic Risk Flags based on token data */}
                        {selectedToken.dev_sold && (
                             <div className="flex items-center gap-3 p-3 bg-[#FF003C]/5 border border-[#FF003C]/20 text-[#FF003C]">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold uppercase">DEV_EXIT_CONFIRMED</span>
                            </div>
                        )}
                        {selectedToken.insider_pct > 30 && (
                             <div className="flex items-center gap-3 p-3 bg-[#F1C40F]/5 border border-[#F1C40F]/20 text-[#F1C40F]">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold uppercase">HIGH_INSIDER_HOLDINGS ({selectedToken.insider_pct}%)</span>
                            </div>
                        )}
                        {selectedToken.funding_type === 'suspicious' && (
                             <div className="flex items-center gap-3 p-3 bg-[#FF003C]/5 border border-[#FF003C]/20 text-[#FF003C]">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold uppercase">SUSPICIOUS_FUNDING_SOURCE</span>
                            </div>
                        )}
                        {/* Clean Status */}
                        {selectedToken.funding_type === 'fresh' && !selectedToken.dev_sold && selectedToken.insider_pct < 15 && (
                             <div className="p-3 bg-[#39FF14]/5 border border-[#39FF14]/20 text-[#39FF14] flex items-center gap-3">
                                <Shield size={14} />
                                <span className="text-xs font-bold uppercase">CLEAN_LAUNCH_DETECTED</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution Bars */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-3 flex items-center gap-2">
                        <BarChart3 size={12} /> SUPPLY_DISTRIBUTION
                    </h3>
                    <div className="space-y-4">
                        {/* Retail */}
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-[#888]">RETAIL</span>
                                <span className="text-[#EDEDED]">{selectedToken.retail_pct}%</span>
                            </div>
                            <div className="h-1 bg-[#111] w-full">
                                <div className="h-full bg-[#00F0FF]" style={{ width: `${selectedToken.retail_pct}%` }} />
                            </div>
                        </div>
                        {/* Insider */}
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-[#888]">INSIDER</span>
                                <span className={selectedToken.insider_pct > 20 ? 'text-[#FF003C]' : 'text-[#EDEDED]'}>
                                    {selectedToken.insider_pct}%
                                </span>
                            </div>
                            <div className="h-1 bg-[#111] w-full">
                                <div 
                                    className={`h-full ${selectedToken.insider_pct > 20 ? 'bg-[#FF003C]' : 'bg-[#F1C40F]'}`} 
                                    style={{ width: `${selectedToken.insider_pct}%` }} 
                                />
                            </div>
                        </div>
                        {/* Dev */}
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-[#888]">DEV_WALLET</span>
                                <span className={selectedToken.dev_pct > 5 ? 'text-[#F1C40F]' : 'text-[#EDEDED]'}>
                                    {selectedToken.dev_pct}%
                                </span>
                            </div>
                            <div className="h-1 bg-[#111] w-full">
                                <div className="h-full bg-[#39FF14]" style={{ width: `${selectedToken.dev_pct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deployer Info */}
                {deployer && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-3 flex items-center gap-2">
                            <Terminal size={12} /> DEPLOYER_ID
                        </h3>
                        <div className="p-4 bg-black/40 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-[#666]">IDENTITY</span>
                                <span className="text-xs font-mono font-bold text-[#EDEDED]">{deployer.name || "UNKNOWN"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-[#666]">WALLET</span>
                                <span className="text-xs font-mono text-[#888]">{deployer.wallet.slice(0, 8)}...</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mt-2">
                                <div className="text-center p-2 bg-white/5">
                                    <div className="text-lg font-bold text-[#EDEDED]">{deployer.total_launches}</div>
                                    <div className="text-[9px] text-[#666]">LAUNCHES</div>
                                </div>
                                <div className="text-center p-2 bg-white/5">
                                    <div className={`text-lg font-bold ${deployer.success_rate >= 50 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                                        {deployer.success_rate}%
                                    </div>
                                    <div className="text-[9px] text-[#666]">WIN_RATE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DrawerShell>
    );
}