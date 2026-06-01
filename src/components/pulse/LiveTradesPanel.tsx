"use client";

import React, { useRef, useEffect } from "react";
import { useSocketStore } from "@/store/socket.store";
import { useRouter } from "next/navigation";
import { LivePulseDot } from "@/components/ui/LivePulseDot";
import { formatCurrency } from "@/lib/format";
import type { TradeEvent } from "@/types/socket";

const shortAddr = (a: string, n = 4) =>
    a ? `${a.slice(0, n)}…${a.slice(-n)}` : "—";

function TradeRow({ trade, isNew }: { trade: TradeEvent; isNew: boolean }) {
    const router = useRouter();
    const isBuy = trade.direction === "buy";
    const solAmount = parseFloat(trade.sol_amount || "0");
    const color = isBuy ? "#39FF14" : "#FF003C";
    const flashClass = isNew ? (isBuy ? "flash-up" : "flash-down") : "";

    return (
        <div
            onClick={() => router.push(`/terminal/${trade.mint}`)}
            className={`grid grid-cols-[18px_1fr_auto] gap-2 px-3 py-1.5 border-b border-white/5 items-center cursor-pointer hover:bg-white/[0.02] ${flashClass}`}
        >
            <span
                className="font-mono font-bold text-[9px]"
                style={{ color }}
            >
                {isBuy ? "▲" : "▼"}
            </span>
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-[#EDEDED] truncate">
                        {shortAddr(trade.mint, 4)}
                    </span>
                    {trade.is_sniper && (
                        <span className="text-[8px] text-[#FFD700]" title="Sniper">⚡</span>
                    )}
                    {trade.is_bundle && (
                        <span className="text-[8px] text-[#FF003C]" title="Bundle">⚠</span>
                    )}
                    {trade.is_dev_trade && (
                        <span className="text-[8px] text-[#00F0FF]" title="Dev">D</span>
                    )}
                </div>
                <div className="text-[9px] font-mono text-[#555] truncate">
                    {shortAddr(trade.user_wallet, 4)}
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <div
                    className="text-[10px] font-mono tabular-nums font-bold"
                    style={{ color }}
                >
                    {solAmount.toFixed(2)} SOL
                </div>
                {trade.market_cap_usd && (
                    <div className="text-[9px] font-mono tabular-nums text-[#555]">
                        {formatCurrency(parseFloat(trade.market_cap_usd))}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Live Trades Panel — streams trades from socket with flash animations.
 */
export function LiveTradesPanel() {
    const { latestTrades, isConnected } = useSocketStore();
    const prevFirstIdRef = useRef<number | null>(null);

    // Track the first trade id — used to flash the newest trade once
    useEffect(() => {
        if (latestTrades.length > 0) {
            prevFirstIdRef.current = latestTrades[0].id;
        }
    }, [latestTrades]);

    const displayTrades = latestTrades.slice(0, 50);

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#080808]">
                <div className="flex items-center gap-2">
                    <LivePulseDot color={isConnected ? "green" : "red"} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEDED]">
                        LIVE TRADES
                    </span>
                </div>
                <span className="text-[9px] font-mono text-[#666] tabular-nums">
                    {displayTrades.length}
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {displayTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
                        <span className="text-[9px] text-[#444] uppercase tracking-widest text-center">
                            {isConnected ? 'No trades yet' : 'Live trades unavailable'}
                        </span>
                    </div>
                ) : (
                    displayTrades.map((trade, i) => (
                        <TradeRow
                            key={`${trade.id}-${i}`}
                            trade={trade}
                            isNew={i === 0}
                        />
                    ))
                )}
            </div>

        </div>
    );
}
