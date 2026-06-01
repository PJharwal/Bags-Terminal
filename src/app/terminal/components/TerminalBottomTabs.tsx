"use client";

import { useState } from "react";
import { useTerminalStore } from "@/store/terminal.store";
import { useBagsFees } from "@/hooks/useBagsFees";
import type { TerminalBottomTab, TradeRow, WalletRow } from "@/lib/types";
import type { BagsTokenClaimEvent } from "@/lib/bags-types";
import { ArrowDownRight, ArrowUpRight, Users, TrendingUp, Coins, ExternalLink } from "lucide-react";
import { BagsLogo } from "@/components/ui/BagsLogo";

const TABS: { id: TerminalBottomTab; label: string; icon: React.ReactNode }[] = [
    { id: 'trades', label: 'Trades', icon: <ArrowUpRight size={12} /> },
    { id: 'holders', label: 'Holders', icon: <Users size={12} /> },
    { id: 'top-traders', label: 'Top Traders', icon: <TrendingUp size={12} /> },
    { id: 'fees', label: 'Fee Claims', icon: <Coins size={12} /> },
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

const TIME_RANGES = [
    { id: 'all', label: 'All' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
] as const;

function getTimeRange(rangeId: string): { from: number; to: number } | undefined {
    const now = Math.floor(Date.now() / 1000);
    switch (rangeId) {
        case '24h': return { from: now - 86400, to: now };
        case '7d': return { from: now - 604800, to: now };
        case '30d': return { from: now - 2592000, to: now };
        default: return undefined;
    }
}

export function TerminalBottomTabs() {
    const { activeBottomTab, setActiveBottomTab, trades, holders, topTraders, activeToken } = useTerminalStore();
    const [feeTimeRange, setFeeTimeRange] = useState('all');

    // Fetch claim events when on fees tab
    const { claimEvents, isLoading: feesLoading } = useBagsFees(
        activeBottomTab === 'fees' ? activeToken?.tokenId ?? null : null,
        {
            fetchClaimEvents: true,
            claimEventsLimit: 100,
            timeRange: getTimeRange(feeTimeRange),
        }
    );

    return (
        <div className="flex flex-col h-full border-t border-white/10 bg-[#0A0A0A]">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
                {TABS.map((tab) => {
                    const isFeesTabHighlighted = tab.id === 'fees' && activeToken?.hasBagsFees;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveBottomTab(tab.id)}
                            className={`btn-press flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeBottomTab === tab.id
                                    ? 'text-[#39FF14] border-b-2 border-[#39FF14] bg-[#39FF14]/5'
                                    : isFeesTabHighlighted
                                        ? 'text-[#FFD700] hover:text-[#FFD700]'
                                        : 'text-[#666] hover:text-[#EDEDED]'
                                }`}
                        >
                            {tab.id === 'fees' ? <BagsLogo size={12} /> : tab.icon}
                            {tab.label}
                            {isFeesTabHighlighted && activeBottomTab !== tab.id && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] badge-live" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {activeBottomTab === 'trades' && <TradesTable trades={trades} />}
                {activeBottomTab === 'holders' && <HoldersTable holders={holders} />}
                {activeBottomTab === 'top-traders' && <TopTradersTable traders={topTraders} />}
                {activeBottomTab === 'fees' && (
                    <FeesTable
                        events={claimEvents}
                        isLoading={feesLoading}
                        timeRange={feeTimeRange}
                        onTimeRangeChange={setFeeTimeRange}
                    />
                )}
            </div>
        </div>
    );
}

// Shared empty-state row — honest messaging when a data source is unavailable.
function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="py-10 text-center text-[#555] text-[10px] font-mono uppercase tracking-widest"
            >
                {message}
            </td>
        </tr>
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
                {trades.length === 0 && (
                    <TableEmpty colSpan={5} message="No live trades — trade feed unavailable" />
                )}
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
                {holders.length === 0 && (
                    <TableEmpty colSpan={6} message="Holder data unavailable — requires a holder API key" />
                )}
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
                {traders.length === 0 && (
                    <TableEmpty colSpan={6} message="Trader data unavailable — requires a holder API key" />
                )}
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

// Fees Table - Claim Events History with time range filter
function FeesTable({
    events,
    isLoading,
    timeRange,
    onTimeRangeChange,
}: {
    events: BagsTokenClaimEvent[];
    isLoading: boolean;
    timeRange: string;
    onTimeRangeChange: (range: string) => void;
}) {
    const totalClaimed = events.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return (
        <div className="flex flex-col h-full">
            {/* Time Range Filter Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D0D0D] border-b border-white/5">
                <div className="flex items-center gap-1.5">
                    <BagsLogo size={12} />
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Fee Claims</span>
                    {events.length > 0 && (
                        <span className="text-[9px] text-[#FFD700] font-mono font-bold ml-2">
                            {totalClaimed.toFixed(4)} SOL
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.id}
                            onClick={() => onTimeRangeChange(range.id)}
                            className={`btn-press px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-colors ${
                                timeRange === range.id
                                    ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30'
                                    : 'text-[#666] hover:text-[#EDEDED] border border-transparent'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center flex-1 text-[#666] text-xs font-mono">
                    <div className="text-center">
                        <BagsLogo size={24} className="mx-auto mb-2 opacity-50" />
                        <p>Loading fee claims...</p>
                    </div>
                </div>
            ) : events.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-[#666] text-xs font-mono">
                    <div className="text-center">
                        <BagsLogo size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No fee claims {timeRange !== 'all' ? `in the last ${timeRange}` : 'yet'}</p>
                        <p className="text-[10px] text-[#444] mt-1">Claims appear here when earners collect fees</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-[10px] font-mono">
                        <thead className="sticky top-0 bg-[#0A0A0A]">
                            <tr className="text-[#666] uppercase tracking-widest border-b border-white/10">
                                <th className="py-2 px-3 text-left font-normal">Time</th>
                                <th className="py-2 px-3 text-left font-normal">Wallet</th>
                                <th className="py-2 px-3 text-left font-normal">Role</th>
                                <th className="py-2 px-3 text-right font-normal">Amount</th>
                                <th className="py-2 px-3 text-right font-normal">Tx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event, idx) => (
                                <tr
                                    key={`${event.signature}-${idx}`}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="py-2 px-3 text-[#666]">
                                        {formatTimeAgo(event.timestamp * 1000)}
                                    </td>
                                    <td className="py-2 px-3 text-[#EDEDED]">
                                        <a
                                            href={`https://solscan.io/account/${event.wallet}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-[#00F0FF] transition-colors"
                                        >
                                            {event.wallet.slice(0, 4)}...{event.wallet.slice(-4)}
                                        </a>
                                    </td>
                                    <td className="py-2 px-3">
                                        {event.isCreator ? (
                                            <span className="text-[#39FF14]">CREATOR</span>
                                        ) : (
                                            <span className="text-[#00F0FF]">EARNER</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-3 text-right text-[#FFD700] font-bold">
                                        {parseFloat(event.amount).toFixed(4)} SOL
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <a
                                            href={`https://solscan.io/tx/${event.signature}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#666] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1"
                                        >
                                            {event.signature.slice(0, 4)}...
                                            <ExternalLink size={10} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

