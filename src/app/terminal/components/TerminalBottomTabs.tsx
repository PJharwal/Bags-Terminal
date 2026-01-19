"use client";

import { useTerminalStore } from "@/store/terminal.store";
import type { TerminalBottomTab, TradeRow, WalletRow } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight, Users, TrendingUp, Code } from "lucide-react";

const TABS: { id: TerminalBottomTab; label: string; icon: React.ReactNode }[] = [
    { id: 'trades', label: 'Trades', icon: <ArrowUpRight size={12} /> },
    { id: 'holders', label: 'Holders', icon: <Users size={12} /> },
    { id: 'top-traders', label: 'Top Traders', icon: <TrendingUp size={12} /> },
    { id: 'dev-tokens', label: 'Dev Tokens', icon: <Code size={12} /> },
];

// Format relative time
function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

// Format number
function formatNum(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
}

export function TerminalBottomTabs() {
    const { activeBottomTab, setActiveBottomTab, trades, holders, topTraders } = useTerminalStore();

    return (
        <div className="flex flex-col h-full border-t border-white/10 bg-[#0A0A0A]">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveBottomTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeBottomTab === tab.id
                                ? 'text-[#39FF14] border-b-2 border-[#39FF14] bg-[#39FF14]/5'
                                : 'text-[#666] hover:text-[#EDEDED]'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {activeBottomTab === 'trades' && <TradesTable trades={trades} />}
                {activeBottomTab === 'holders' && <HoldersTable holders={holders} />}
                {activeBottomTab === 'top-traders' && <TopTradersTable traders={topTraders} />}
                {activeBottomTab === 'dev-tokens' && <DevTokensTable />}
            </div>
        </div>
    );
}

// Trades Table
function TradesTable({ trades }: { trades: TradeRow[] }) {
    return (
        <table className="w-full text-[10px] font-mono">
            <thead className="sticky top-0 bg-[#0A0A0A]">
                <tr className="text-[#666] uppercase tracking-widest border-b border-white/10">
                    <th className="py-2 px-3 text-left font-normal">Type</th>
                    <th className="py-2 px-3 text-left font-normal">Wallet</th>
                    <th className="py-2 px-3 text-right font-normal">Amount</th>
                    <th className="py-2 px-3 text-right font-normal">Total</th>
                    <th className="py-2 px-3 text-right font-normal">Time</th>
                </tr>
            </thead>
            <tbody>
                {trades.map((trade) => (
                    <tr
                        key={trade.id}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <td className="py-2 px-3">
                            <span className={`flex items-center gap-1 ${trade.type === 'buy' ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                                {trade.type === 'buy' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {trade.type.toUpperCase()}
                            </span>
                        </td>
                        <td className="py-2 px-3 text-[#EDEDED]">
                            {trade.walletLabel ? (
                                <span className="text-[#00F0FF]">{trade.walletLabel}</span>
                            ) : (
                                trade.wallet
                            )}
                        </td>
                        <td className="py-2 px-3 text-right text-[#EDEDED]">{formatNum(trade.amount)}</td>
                        <td className="py-2 px-3 text-right text-[#EDEDED]">${trade.total.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-[#666]">{formatTimeAgo(trade.timestamp)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Holders Table
function HoldersTable({ holders }: { holders: WalletRow[] }) {
    return (
        <table className="w-full text-[10px] font-mono">
            <thead className="sticky top-0 bg-[#0A0A0A]">
                <tr className="text-[#666] uppercase tracking-widest border-b border-white/10">
                    <th className="py-2 px-3 text-left font-normal">Wallet</th>
                    <th className="py-2 px-3 text-right font-normal">Holding</th>
                    <th className="py-2 px-3 text-right font-normal">%</th>
                    <th className="py-2 px-3 text-right font-normal">Bought</th>
                    <th className="py-2 px-3 text-right font-normal">Sold</th>
                    <th className="py-2 px-3 text-right font-normal">PnL</th>
                </tr>
            </thead>
            <tbody>
                {holders.map((holder, idx) => (
                    <tr
                        key={holder.wallet}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[#666]">#{idx + 1}</span>
                                {holder.walletLabel ? (
                                    <span className="text-[#00F0FF]">{holder.walletLabel}</span>
                                ) : (
                                    <span className="text-[#EDEDED]">{holder.wallet}</span>
                                )}
                            </div>
                        </td>
                        <td className="py-2 px-3 text-right text-[#EDEDED]">{formatNum(holder.holding)}</td>
                        <td className="py-2 px-3 text-right text-[#888]">{holder.holdingPercent.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-[#39FF14]">{formatNum(holder.bought)}</td>
                        <td className="py-2 px-3 text-right text-[#FF003C]">{formatNum(holder.sold)}</td>
                        <td className={`py-2 px-3 text-right ${holder.pnl >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                            {holder.pnl >= 0 ? '+' : ''}${formatNum(Math.abs(holder.pnl))}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Top Traders Table
function TopTradersTable({ traders }: { traders: WalletRow[] }) {
    return (
        <table className="w-full text-[10px] font-mono">
            <thead className="sticky top-0 bg-[#0A0A0A]">
                <tr className="text-[#666] uppercase tracking-widest border-b border-white/10">
                    <th className="py-2 px-3 text-left font-normal">Rank</th>
                    <th className="py-2 px-3 text-left font-normal">Wallet</th>
                    <th className="py-2 px-3 text-right font-normal">Realized PnL</th>
                    <th className="py-2 px-3 text-right font-normal">ROI</th>
                    <th className="py-2 px-3 text-right font-normal">Volume</th>
                    <th className="py-2 px-3 text-right font-normal">Last Active</th>
                </tr>
            </thead>
            <tbody>
                {traders.map((trader, idx) => (
                    <tr
                        key={trader.wallet}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <td className="py-2 px-3">
                            <span className={`${idx < 3 ? 'text-[#FFD700]' : 'text-[#666]'}`}>
                                #{idx + 1}
                            </span>
                        </td>
                        <td className="py-2 px-3">
                            {trader.walletLabel ? (
                                <span className="text-[#00F0FF]">{trader.walletLabel}</span>
                            ) : (
                                <span className="text-[#EDEDED]">{trader.wallet}</span>
                            )}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${trader.pnl >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                            {trader.pnl >= 0 ? '+' : ''}${formatNum(Math.abs(trader.pnl))}
                        </td>
                        <td className={`py-2 px-3 text-right ${trader.pnlPercent >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                            {trader.pnlPercent >= 0 ? '+' : ''}{trader.pnlPercent.toFixed(0)}%
                        </td>
                        <td className="py-2 px-3 text-right text-[#EDEDED]">${formatNum(trader.bought + trader.sold)}</td>
                        <td className="py-2 px-3 text-right text-[#666]">{formatTimeAgo(trader.lastActive)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Dev Tokens Table (placeholder)
function DevTokensTable() {
    return (
        <div className="flex items-center justify-center h-32 text-[#666] text-xs font-mono">
            <div className="text-center">
                <Code size={24} className="mx-auto mb-2 opacity-50" />
                <p>Developer wallet activity</p>
                <p className="text-[10px] text-[#444] mt-1">Coming soon</p>
            </div>
        </div>
    );
}
