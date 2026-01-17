"use client";

import { usePulseStore } from "@/store/pulse.store";
import { useSelectionStore } from "@/store/selection.store";
import { formatCurrency, formatNumber } from "@/lib/format";
import { formatAge, getBondingColor, getRiskColor } from "@/lib/lifecycle";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Terminal, X, ExternalLink, Copy, Activity, Zap } from "lucide-react";

function StatBlock({ label, value, color = "text-[#EDEDED]" }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="p-3 bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
            <div className="text-[9px] text-[#666] uppercase tracking-widest mb-1 font-mono">{label}</div>
            <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}

export function PulseDrawer() {
    const { selectedTokenId, drawerOpen, drawerSource, closeDrawer } = useSelectionStore();
    const { getItemById } = usePulseStore();

    const item = selectedTokenId ? getItemById(selectedTokenId) : null;

    if (!drawerOpen || !item || drawerSource !== 'pulse') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-14 right-0 h-[calc(100vh-56px)] w-[400px] bg-[#080808] border-l border-white/10 z-50 flex flex-col font-mono shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-[#0A0A0A]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 bg-[#39FF14] animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#39FF14]">LIVE_MONITOR</span>
                            </div>
                            <h2 className="text-2xl font-display font-bold text-[#EDEDED]">{item.symbol}</h2>
                        </div>
                        <button
                            onClick={closeDrawer}
                            className="p-1 text-[#666] hover:text-[#EDEDED] border border-transparent hover:border-[#333] transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#888]">
                        <span className="flex items-center gap-1">
                            <Activity size={12} /> {formatAge(item.ageSeconds)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap size={12} /> {item.bondingProgress}% BONDED
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <StatBlock label="MARKET_CAP" value={formatCurrency(item.marketCap)} color="text-[#39FF14]" />
                        <StatBlock label="LIQUIDITY" value={formatCurrency(item.liquidity)} />
                        <StatBlock label="HOLDERS" value={formatNumber(item.holders)} />
                        <StatBlock label="VOL_24H" value={formatCurrency(item.volume24h || 0)} />
                    </div>

                    {/* Risk Analysis */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] flex items-center gap-2">
                                <Shield size={12} /> RISK_ASSESSMENT
                            </h3>
                        </div>
                        
                        {item.riskFlags.length > 0 ? (
                            <div className="space-y-2">
                                {item.riskFlags.map((flag, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-[#FF003C]/5 border border-[#FF003C]/20 text-[#FF003C]">
                                        <AlertTriangle size={14} />
                                        <span className="text-xs font-bold uppercase">{flag.type.replace(/_/g, ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 bg-[#39FF14]/5 border border-[#39FF14]/20 text-[#39FF14] flex items-center gap-3">
                                <Shield size={14} />
                                <span className="text-xs font-bold uppercase">CLEAN_SCAN</span>
                            </div>
                        )}
                    </div>

                    {/* Bonding Curve */}
                    <div>
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#666]">CURVE_PROGRESS</span>
                            <span className="text-xs font-bold font-mono text-[#00F0FF]">{item.bondingProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#111] border border-white/5 relative overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]" 
                                style={{ width: `${item.bondingProgress}%` }} 
                            />
                            {/* Striped overlay */}
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                        </div>
                    </div>

                    {/* Deployer Info */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-3 flex items-center gap-2">
                            <Terminal size={12} /> DEPLOYER_ID
                        </h3>
                        <div className="p-4 bg-black/40 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-[#666]">ADDRESS</span>
                                <div className="flex items-center gap-2 text-xs font-mono text-[#EDEDED]">
                                    {item.deployer.slice(0, 6)}...{item.deployer.slice(-4)}
                                    <Copy size={10} className="text-[#666] cursor-pointer hover:text-white" />
                                </div>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] text-[#666]">HISTORY</span>
                                <span className="text-xs font-mono text-[#EDEDED]">
                                    {item.deployerLaunches || 0} LAUNCHES
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-[#0A0A0A] space-y-3">
                    <button className="w-full py-3 bg-[#39FF14] text-black font-bold uppercase tracking-wider hover:bg-[#32E010] transition-colors flex items-center justify-center gap-2">
                        <ExternalLink size={16} /> BUY_ON_DEX
                    </button>
                    <button className="w-full py-3 bg-transparent border border-white/10 text-[#888] font-bold uppercase tracking-wider hover:border-white/30 hover:text-[#EDEDED] transition-colors">
                        ADD_TO_WATCHLIST
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}