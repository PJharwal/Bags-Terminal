"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { TokenDrawer } from "@/components/drawers/TokenDrawer";
import { useTerminalStore } from "@/store/terminal.store";
import { MOCK_TOKENS } from "@/lib/mock-data";
import { Terminal, Filter, Sliders } from "lucide-react";

export default function TerminalPage() {
    const { filters, activePreset } = useTerminalStore();

    // Filter tokens based on active filters
    const filteredTokens = useMemo(() => {
        return MOCK_TOKENS.filter((token) => {
            if (filters.min_launch_score && token.launch_score < filters.min_launch_score) return false;
            if (filters.max_insider_pct && token.insider_pct > filters.max_insider_pct) return false;
            if (filters.dev_sold !== null && token.dev_sold !== filters.dev_sold) return false;
            if (filters.status.length > 0 && !filters.status.includes(token.status)) return false;
            if (filters.funding_type.length > 0 && !filters.funding_type.includes(token.funding_type)) return false;
            return true;
        });
    }, [filters]);

    return (
        <div className="h-[calc(100vh-56px)] flex bg-[#050505] overflow-hidden font-mono">
            {/* Left Sidebar - Filters */}
            <aside className="w-64 border-r border-white/10 bg-[#0A0A0A] flex flex-col z-20">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#EDEDED]">
                        <Filter size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
                    </div>
                    <span className="text-[10px] text-[#666]">{filteredTokens.length} MATCHES</span>
                </div>
                
                <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Presets */}
                    <div className="space-y-3">
                        <div className="text-[10px] text-[#666] uppercase tracking-widest font-bold">Quick_Presets</div>
                        {['SAFE_LAUNCH', 'DEGEN_PLAY', 'WHALE_WATCH'].map((preset) => (
                            <button 
                                key={preset}
                                className="w-full text-left px-3 py-2 border border-white/10 hover:border-[#39FF14] hover:text-[#39FF14] text-xs text-[#888] transition-colors bg-black/20"
                            >
                                {'>'} {preset}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Manual Sliders */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-[#666] uppercase tracking-widest font-bold flex items-center gap-2">
                            <Sliders size={12} /> Parameters
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-[10px] text-[#888] mb-1">
                                <span>MIN_SCORE</span>
                                <span className="text-[#39FF14]">70</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-[#333] rounded-none appearance-none cursor-pointer accent-[#39FF14]" />
                        </div>

                        <div>
                            <div className="flex justify-between text-[10px] text-[#888] mb-1">
                                <span>MAX_INSIDER</span>
                                <span className="text-[#FF003C]">15%</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-[#333] rounded-none appearance-none cursor-pointer accent-[#FF003C]" />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 text-[10px] text-[#444]">
                    TERMINAL_V2.4 // READY
                </div>
            </aside>

            {/* Main Content - Data Grid */}
            <main className="flex-1 flex flex-col relative bg-[#050505]">
                {/* Top Bar */}
                <div className="h-10 border-b border-white/10 flex items-center px-4 justify-between bg-[#050505]">
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                        <Terminal size={14} />
                        <span className="font-bold text-[#EDEDED]">MAIN_FEED</span>
                        <span>/</span>
                        <span>ALL_ASSETS</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono">
                         <span className="text-[#39FF14]">● LIVE</span>
                         <span className="text-[#666]">LATENCY: 12ms</span>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable tokens={filteredTokens} />
            </main>

            <TokenDrawer />
        </div>
    );
}