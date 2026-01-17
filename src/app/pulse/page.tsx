"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { usePulseStore, type DisplayMode, type TierFilter } from "@/store/pulse.store";
import { useSelectionStore } from "@/store/selection.store";
import { PulseColumn } from "@/components/pulse/PulseColumn";
import { PulseDrawer } from "@/components/pulse/PulseDrawer";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Wifi, Activity, Zap, ShieldAlert, Cpu, Layers } from "lucide-react";

// Types
type Platform = 'all' | 'pump' | 'launchlab' | 'moonshot';
type Network = 'solana' | 'base' | 'ethereum';

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
function PulseHeader({ network, onNetworkChange }: { network: Network; onNetworkChange: (n: Network) => void }) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050505]">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[#39FF14]">
                    <Activity size={18} />
                    <h1 className="text-xl font-display font-bold tracking-tighter">LIVE_PULSE</h1>
                </div>
                <div className="h-4 w-[1px] bg-[#333]" />
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#888]">
                    <span className="w-1.5 h-1.5 bg-[#39FF14] animate-pulse" />
                    REALTIME_FEED
                </div>
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
    const { items, getFilteredItems, simulateRealtime, filters, setFilters } = usePulseStore();
    const { drawerOpen } = useSelectionStore();
    const [network, setNetwork] = useState<Network>('solana');

    // Realtime Simulation
    useEffect(() => {
        const interval = setInterval(simulateRealtime, 2000);
        return () => clearInterval(interval);
    }, [simulateRealtime]);

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-[#050505] text-[#EDEDED] overflow-hidden relative font-mono">
            <ParallaxBackground />
            
            <PulseHeader network={network} onNetworkChange={setNetwork} />

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
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1 border transition-colors ${
                            filters.hideRisky ? 'border-[#FF003C] text-[#FF003C]' : 'border-[#333] text-[#666]'
                        }`}
                    >
                        <ShieldAlert size={12} />
                        {filters.hideRisky ? 'RISK_FILTER: ON' : 'RISK_FILTER: OFF'}
                    </button>
                </div>

                <div className="flex items-center gap-8">
                    <StatDisplay label="TOKENS_TRACKED" value={String(items.NEW.length + items.FINAL_STRETCH.length)} color="text-[#39FF14]" />
                    <StatDisplay label="GAS_PRICE" value="4 GWEI" />
                    <StatDisplay label="TPS" value="2,450" />
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
                            <PulseColumn state="NEW" items={getFilteredItems('NEW')} />
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
                            <PulseColumn state="FINAL_STRETCH" items={getFilteredItems('FINAL_STRETCH')} />
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
                             <PulseColumn state="MIGRATED" items={getFilteredItems('MIGRATED')} />
                        </div>
                    </div>
                </div>
            </div>

            <PulseDrawer />
        </div>
    );
}