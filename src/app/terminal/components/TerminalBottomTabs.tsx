"use client";

import { useState } from "react";
import { useTerminalStore } from "@/store/terminal.store";
import { useBagsFees } from "@/hooks/useBagsFees";
import type { TerminalBottomTab, TradeRow, WalletRow } from "@/lib/types";
import type { BagsTokenClaimEvent } from "@/lib/bags-types";
import { ArrowDownRight, ArrowUpRight, Users, TrendingUp, Code, Coins, ExternalLink } from "lucide-react";
import { BagsLogo } from "@/components/ui/BagsLogo";
import { cn } from "@/lib/utils";

const TABS: { id: TerminalBottomTab; label: string; icon: React.ReactNode }[] = [
    { id: 'trades', label: 'Trades', icon: <ArrowUpRight size={12} /> },
    { id: 'holders', label: 'Holders', icon: <Users size={12} /> },
    { id: 'top-traders', label: 'Top Traders', icon: <TrendingUp size={12} /> },
    { id: 'fees', label: 'Fee Claims', icon: <Coins size={12} /> },
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
        <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-white/5 p-2">
                <div className="flex gap-1 overflow-x-auto custom-scrollbar">
                    {TABS.map((tab) => {
                        const isFeesTabHighlighted = tab.id === 'fees' && activeToken?.hasBagsFees;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveBottomTab(tab.id)}
                                className={cn(
                                    "btn-press inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                                    activeBottomTab === tab.id
                                        ? "border-white/15 bg-white text-background"
                                        : isFeesTabHighlighted
                                            ? "border-gold/20 bg-gold/[0.08] text-gold hover:bg-gold/[0.1]"
                                            : "border-white/10 bg-white/[0.02] text-muted-high hover:text-fg"
                                )}
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
            </div>

            <div className="flex-1 overflow-auto px-2 pb-2 custom-scrollbar">
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
                {activeBottomTab === 'dev-tokens' && <DevTokensTable />}
            </div>
        </div>
    );
}

// Trades Table
function TradesTable({ trades }: { trades: TradeRow[] }) {
    return (
        <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-muted-high">
                    <th className="px-3 py-3 text-left font-normal">Type</th>
                    <th className="px-3 py-3 text-left font-normal">Wallet</th>
                    <th className="px-3 py-3 text-right font-normal">Amount</th>
                    <th className="px-3 py-3 text-right font-normal">Total</th>
                    <th className="px-3 py-3 text-right font-normal">Time</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {trades.map((trade) => (
                    <tr
                        key={trade.id}
                        className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    >
                        <td className="px-3 py-3">
                            <span className={`flex items-center gap-1 ${trade.type === 'buy' ? 'text-acid-green' : 'text-error'}`}>
                                {trade.type === 'buy' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {trade.type.toUpperCase()}
                            </span>
                        </td>
                        <td className="px-3 py-3 text-fg">
                            {trade.walletLabel ? (
                                <span className="text-[#00F0FF]">{trade.walletLabel}</span>
                            ) : (
                                trade.wallet
                            )}
                        </td>
                        <td className="px-3 py-3 text-right text-fg">{formatNum(trade.amount)}</td>
                        <td className="px-3 py-3 text-right text-fg">${trade.total.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-muted-high">{formatTimeAgo(trade.timestamp)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Holders Table
function HoldersTable({ holders }: { holders: WalletRow[] }) {
    return (
        <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-muted-high">
                    <th className="px-3 py-3 text-left font-normal">Wallet</th>
                    <th className="px-3 py-3 text-right font-normal">Holding</th>
                    <th className="px-3 py-3 text-right font-normal">%</th>
                    <th className="px-3 py-3 text-right font-normal">Bought</th>
                    <th className="px-3 py-3 text-right font-normal">Sold</th>
                    <th className="px-3 py-3 text-right font-normal">PnL</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {holders.map((holder, idx) => (
                    <tr
                        key={holder.wallet}
                        className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    >
                        <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-high">#{idx + 1}</span>
                                {holder.walletLabel ? (
                                    <span className="text-[#00F0FF]">{holder.walletLabel}</span>
                                ) : (
                                    <span className="text-fg">{holder.wallet}</span>
                                )}
                            </div>
                        </td>
                        <td className="px-3 py-3 text-right text-fg">{formatNum(holder.holding)}</td>
                        <td className="px-3 py-3 text-right text-fg-soft">{holder.holdingPercent.toFixed(1)}%</td>
                        <td className="px-3 py-3 text-right text-acid-green">{formatNum(holder.bought)}</td>
                        <td className="px-3 py-3 text-right text-error">{formatNum(holder.sold)}</td>
                        <td className={`px-3 py-3 text-right ${holder.pnl >= 0 ? 'text-acid-green' : 'text-error'}`}>
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
        <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-muted-high">
                    <th className="px-3 py-3 text-left font-normal">Rank</th>
                    <th className="px-3 py-3 text-left font-normal">Wallet</th>
                    <th className="px-3 py-3 text-right font-normal">Realized PnL</th>
                    <th className="px-3 py-3 text-right font-normal">ROI</th>
                    <th className="px-3 py-3 text-right font-normal">Volume</th>
                    <th className="px-3 py-3 text-right font-normal">Last Active</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {traders.map((trader, idx) => (
                    <tr
                        key={trader.wallet}
                        className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    >
                        <td className="px-3 py-3">
                            <span className={`${idx < 3 ? 'text-gold' : 'text-muted-high'}`}>
                                #{idx + 1}
                            </span>
                        </td>
                        <td className="px-3 py-3">
                            {trader.walletLabel ? (
                                <span className="text-[#00F0FF]">{trader.walletLabel}</span>
                            ) : (
                                <span className="text-fg">{trader.wallet}</span>
                            )}
                        </td>
                        <td className={`px-3 py-3 text-right font-bold ${trader.pnl >= 0 ? 'text-acid-green' : 'text-error'}`}>
                            {trader.pnl >= 0 ? '+' : ''}${formatNum(Math.abs(trader.pnl))}
                        </td>
                        <td className={`px-3 py-3 text-right ${trader.pnlPercent >= 0 ? 'text-acid-green' : 'text-error'}`}>
                            {trader.pnlPercent >= 0 ? '+' : ''}{trader.pnlPercent.toFixed(0)}%
                        </td>
                        <td className="px-3 py-3 text-right text-fg">${formatNum(trader.bought + trader.sold)}</td>
                        <td className="px-3 py-3 text-right text-muted-high">{formatTimeAgo(trader.lastActive)}</td>
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
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2">
                <div className="flex items-center gap-2">
                    <BagsLogo size={12} />
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-high">Fee Claims</span>
                    {events.length > 0 && (
                        <span className="font-mono text-xs text-gold num">
                            {totalClaimed.toFixed(4)} SOL
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.id}
                            onClick={() => onTimeRangeChange(range.id)}
                            className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                                timeRange === range.id
                                    ? 'border-white/15 bg-white/[0.08] text-fg'
                                    : 'border-white/10 bg-white/[0.02] text-muted-high hover:text-fg'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center text-sm text-muted-high">
                        <BagsLogo size={24} className="mx-auto mb-2 opacity-50" />
                        <p>Loading fee claims...</p>
                    </div>
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center text-sm text-muted-high">
                        <BagsLogo size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No fee claims {timeRange !== 'all' ? `in the last ${timeRange}` : 'yet'}</p>
                        <p className="mt-1 text-xs text-muted-mid">Claims appear here when earners collect fees</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm font-mono">
                        <thead className="sticky top-0 bg-background/95 backdrop-blur">
                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-muted-high">
                                <th className="px-3 py-3 text-left font-normal">Time</th>
                                <th className="px-3 py-3 text-left font-normal">Wallet</th>
                                <th className="px-3 py-3 text-left font-normal">Role</th>
                                <th className="px-3 py-3 text-right font-normal">Amount</th>
                                <th className="px-3 py-3 text-right font-normal">Tx</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {events.map((event, idx) => (
                                <tr
                                    key={`${event.signature}-${idx}`}
                                    className="transition-colors hover:bg-white/[0.03]"
                                >
                                    <td className="px-3 py-3 text-muted-high">
                                        {formatTimeAgo(event.timestamp * 1000)}
                                    </td>
                                    <td className="px-3 py-3 text-fg">
                                        <a
                                            href={`https://solscan.io/account/${event.wallet}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="transition-colors hover:text-[#00F0FF]"
                                        >
                                            {event.wallet.slice(0, 4)}...{event.wallet.slice(-4)}
                                        </a>
                                    </td>
                                    <td className="px-3 py-3">
                                        {event.isCreator ? (
                                            <span className="text-acid-green">CREATOR</span>
                                        ) : (
                                            <span className="text-[#00F0FF]">EARNER</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-right text-gold font-bold">
                                        {parseFloat(event.amount).toFixed(4)} SOL
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        <a
                                            href={`https://solscan.io/tx/${event.signature}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-muted-high transition-colors hover:text-[#00F0FF]"
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

// Dev Tokens Table (placeholder)
function DevTokensTable() {
    return (
        <div className="flex h-32 items-center justify-center text-muted-high">
            <div className="text-center text-sm">
                <Code size={24} className="mx-auto mb-2 opacity-50" />
                <p>Developer wallet activity</p>
                <p className="mt-1 text-xs text-muted-mid">Coming soon</p>
            </div>
        </div>
    );
}
