"use client";

import { useTerminalStore } from "@/store/terminal.store";
import { Wallet } from "lucide-react";

const AMOUNT_PRESETS = [0.1, 0.5, 1, 5];

export function TerminalTradePanel() {
    const {
        tradePanel,
        activeToken,
        setTradePanelMode,
        setTradePanelOrderType,
        setTradePanelAmount,
    } = useTerminalStore();

    const isBuy = tradePanel.mode === 'buy';
    const accentColor = isBuy ? "#39FF14" : "#FF003C";
    const accentBg = isBuy ? "bg-[#39FF14]" : "bg-[#FF003C]";

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-white/10">
            {/* Mode Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setTradePanelMode('buy')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${isBuy
                            ? 'bg-[#39FF14]/20 text-[#39FF14] border-b-2 border-[#39FF14]'
                            : 'text-[#666] hover:text-[#EDEDED]'
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setTradePanelMode('sell')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${!isBuy
                            ? 'bg-[#FF003C]/20 text-[#FF003C] border-b-2 border-[#FF003C]'
                            : 'text-[#666] hover:text-[#EDEDED]'
                        }`}
                >
                    Sell
                </button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4">
                {/* Order Type */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Order Type</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTradePanelOrderType('market')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${tradePanel.orderType === 'market'
                                    ? 'border-[#EDEDED] text-[#EDEDED] bg-[#1A1A1A]'
                                    : 'border-[#333] text-[#666] hover:border-[#666]'
                                }`}
                        >
                            Market
                        </button>
                        <button
                            onClick={() => setTradePanelOrderType('limit')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${tradePanel.orderType === 'limit'
                                    ? 'border-[#EDEDED] text-[#EDEDED] bg-[#1A1A1A]'
                                    : 'border-[#333] text-[#666] hover:border-[#666]'
                                }`}
                        >
                            Limit
                        </button>
                    </div>
                </div>

                {/* Amount Presets */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Amount (SOL)</span>
                    <div className="grid grid-cols-4 gap-2">
                        {AMOUNT_PRESETS.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setTradePanelAmount(amount)}
                                className={`py-2 text-[10px] font-mono font-bold border transition-colors ${tradePanel.amount === amount
                                        ? `border-[${accentColor}] text-[${accentColor}]`
                                        : 'border-[#333] text-[#888] hover:border-[#666]'
                                    }`}
                                style={{
                                    borderColor: tradePanel.amount === amount ? accentColor : undefined,
                                    color: tradePanel.amount === amount ? accentColor : undefined,
                                }}
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Amount Input */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Custom Amount</span>
                    <div className="relative">
                        <input
                            type="number"
                            value={tradePanel.amount}
                            onChange={(e) => setTradePanelAmount(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                            placeholder="0.00"
                            step="0.1"
                            min="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">
                            SOL
                        </span>
                    </div>
                </div>

                {/* Limit Price (if limit order) */}
                {tradePanel.orderType === 'limit' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] text-[#666] uppercase tracking-widest">Limit Price</span>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                                placeholder="0.00000"
                                step="0.00001"
                                min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">
                                USD
                            </span>
                        </div>
                    </div>
                )}

                {/* Trade Summary */}
                {activeToken && (
                    <div className="flex flex-col gap-2 p-3 bg-[#1A1A1A] border border-white/10">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">You {isBuy ? 'pay' : 'receive'}</span>
                            <span className="text-[#EDEDED] font-mono">{tradePanel.amount} SOL</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">You {isBuy ? 'receive' : 'sell'}</span>
                            <span className="text-[#EDEDED] font-mono">
                                ~{((tradePanel.amount * 150) / (activeToken.priceUsd * 1000)).toFixed(0)} {activeToken.symbol}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">Price impact</span>
                            <span className="text-[#39FF14] font-mono">&lt;0.1%</span>
                        </div>
                    </div>
                )}

                {/* Wallet Balance (Mock) */}
                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/10">
                    <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-[#666]" />
                        <span className="text-[10px] text-[#666] uppercase">Balance</span>
                    </div>
                    <span className="text-xs font-mono text-[#EDEDED]">2.45 SOL</span>
                </div>
            </div>

            {/* Action Button */}
            <div className="p-4 border-t border-white/10">
                <button
                    className={`w-full py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-[0.98] ${accentBg}`}
                >
                    {isBuy ? 'Buy' : 'Sell'} {activeToken?.symbol || 'Token'}
                </button>
                <p className="text-center text-[9px] text-[#666] mt-2 font-mono">
                    Slippage: 1.0% · Priority: Medium
                </p>
            </div>
        </div>
    );
}
