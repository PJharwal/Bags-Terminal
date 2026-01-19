"use client";

import { TraderData } from "@/types/token";
import { cn } from "@/lib/utils";

interface TradersTableProps {
    data: TraderData[];
}

export function TradersTable({ data }: TradersTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (
        <div className="border border-[rgba(255,255,255,0.12)] bg-[#0A0A0A] overflow-hidden">
            <div className="p-4 border-b border-[rgba(255,255,255,0.12)]">
                <h3 className="text-sm font-bold tracking-wider text-[#EDEDED] font-sans uppercase">Top Traders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-[#111111] border-b border-[rgba(255,255,255,0.12)] text-[#888888]">
                        <tr>
                            <th className="p-4 font-medium uppercase text-xs">Trader</th>
                            <th className="p-4 font-medium text-right uppercase text-xs">PnL</th>
                            <th className="p-4 font-medium text-right uppercase text-xs">Bought</th>
                            <th className="p-4 font-medium text-right uppercase text-xs">Sold</th>
                            <th className="p-4 font-medium text-right uppercase text-xs">Unrealized</th>
                            <th className="p-4 font-medium text-center uppercase text-xs">Tags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                        {data.map((trader) => (
                            <tr key={trader.address} className="group hover:bg-white/5 transition-colors">
                                <td className="p-4 text-xs text-[#888888]">
                                    <div className="flex flex-col">
                                        <span className="text-[#EDEDED] font-medium">
                                            {trader.wallet_tag_v2 || "Trader"}
                                        </span>
                                        <span className="truncate max-w-[100px]">{trader.address.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className={cn("p-4 text-right font-medium", trader.profit >= 0 ? "text-[#39FF14]" : "text-[#FF003C]")}>
                                    {formatCurrency(trader.profit)}
                                </td>
                                <td className="p-4 text-right text-[#888888]">
                                    {formatCurrency(trader.buy_volume_cur)}
                                </td>
                                <td className="p-4 text-right text-[#888888]">
                                    {formatCurrency(trader.sell_volume_cur)}
                                </td>
                                <td className="p-4 text-right text-[#888888]">
                                    {formatCurrency(trader.unrealized_profit)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {trader.maker_token_tags?.map((tag) => (
                                            <span key={tag} className="px-1.5 py-0.5 border border-[rgba(255,255,255,0.1)] bg-white/5 text-[10px] text-[#888888] uppercase tracking-wider">
                                                {tag.replace("_", " ")}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
