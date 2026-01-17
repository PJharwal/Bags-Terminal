"use client";

import type { Token } from "@/lib/types";
import { useTerminalStore } from "@/store/terminal.store";
import { formatCurrency, formatTimeAgo, getScoreColor } from "@/lib/format";
import { InsiderIndicator } from "@/components/ui/InsiderIndicator";

interface DataTableProps {
    tokens: Token[];
}

export function DataTable({ tokens }: DataTableProps) {
    const { selectToken, selectedToken } = useTerminalStore();

    return (
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#050505] relative">
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none fixed" />
            
            <table className="w-full text-sm border-collapse relative z-10">
                <thead className="sticky top-0 bg-[#0A0A0A] z-20 border-b border-white/10 shadow-lg">
                    <tr>
                        <th className="text-left py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">Asset_ID</th>
                        <th className="text-left py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">Origin_Wallet</th>
                        <th className="text-center py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">Risk_Scr</th>
                        <th className="text-center py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">Insider_%</th>
                        <th className="text-center py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">Dev_Exit</th>
                        <th className="text-center py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">State</th>
                        <th className="text-right py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest border-r border-white/5">24h_Vol</th>
                        <th className="text-right py-3 px-4 text-[10px] text-[#666] font-bold font-mono uppercase tracking-widest">Mkt_Cap</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {tokens.map((token) => (
                        <tr
                            key={token.id}
                            onClick={() => selectToken(token)}
                            className={`cursor-pointer transition-all duration-75 group hover:bg-[#39FF14]/5 ${selectedToken?.id === token.id
                                    ? "bg-[#39FF14]/10 border-l-2 border-[#39FF14]"
                                    : "border-l-2 border-transparent hover:border-[#39FF14]/50"
                                }`}
                        >
                            {/* Token */}
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-[#39FF14] opacity-50 group-hover:opacity-100 transition-opacity font-mono text-xs">
                                        {'>'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#EDEDED] font-mono group-hover:text-[#39FF14] transition-colors">{token.symbol}</div>
                                        <div className="text-[9px] text-[#666] font-mono uppercase">{formatTimeAgo(token.launch_time)}</div>
                                    </div>
                                </div>
                            </td>

                            {/* Deployer */}
                            <td className="py-3 px-4">
                                <span className="text-xs font-mono text-[#888] group-hover:text-[#EDEDED] transition-colors">
                                    {token.deployer_wallet}
                                </span>
                            </td>

                            {/* Score */}
                            <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-white/10 bg-black/40">
                                    <span className={`font-mono font-bold text-xs ${getScoreColor(token.launch_score)}`}>
                                        {token.launch_score}
                                    </span>
                                </div>
                            </td>

                            {/* Insider */}
                            <td className="py-3 px-4 text-center">
                                <InsiderIndicator percentage={token.insider_pct} size="sm" />
                            </td>

                            {/* Dev Sold */}
                            <td className="py-3 px-4 text-center">
                                {token.dev_sold ? (
                                    <span className="text-[#FF003C] text-[10px] font-bold font-mono bg-[#FF003C]/10 px-1 py-0.5">SOLD</span>
                                ) : (
                                    <span className="text-[#666] text-[10px] font-mono">-</span>
                                )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-mono uppercase tracking-wider ${
                                    token.status === 'live' ? 'text-[#39FF14] animate-pulse' :
                                    token.status === 'rugged' ? 'text-[#FF003C]' :
                                    'text-[#888]'
                                }`}>
                                    {token.status}
                                </span>
                            </td>

                            {/* Volume */}
                            <td className="py-3 px-4 text-right">
                                <span className="font-mono text-xs text-[#888] group-hover:text-[#EDEDED]">
                                    {formatCurrency(token.volume_24h)}
                                </span>
                            </td>

                            {/* Market Cap */}
                            <td className="py-3 px-4 text-right">
                                <span className="font-mono text-xs text-[#EDEDED] font-bold">
                                    {formatCurrency(token.market_cap)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {tokens.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-[#666]">
                    <span className="text-4xl mb-4 opacity-20">∅</span>
                    <span className="font-mono text-xs uppercase tracking-widest">No_Data_Found</span>
                </div>
            )}
        </div>
    );
}