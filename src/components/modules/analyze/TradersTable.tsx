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
        <div className="card overflow-hidden">
            <div className="p-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold tracking-wider text-fg uppercase">Top Traders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="table-header text-muted-mid">
                        <tr>
                            <th className="p-4 font-medium uppercase text-meta tracking-widest">Trader</th>
                            <th className="p-4 font-medium text-right uppercase text-meta tracking-widest">PnL</th>
                            <th className="p-4 font-medium text-right uppercase text-meta tracking-widest">Bought</th>
                            <th className="p-4 font-medium text-right uppercase text-meta tracking-widest">Sold</th>
                            <th className="p-4 font-medium text-right uppercase text-meta tracking-widest">Unrealized</th>
                            <th className="p-4 font-medium text-center uppercase text-meta tracking-widest">Tags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((trader) => (
                            <tr key={trader.address} className="table-row group">
                                <td className="p-4 text-xs text-fg-soft">
                                    <div className="flex flex-col">
                                        <span className="text-fg font-medium">
                                            {trader.wallet_tag_v2 || "Trader"}
                                        </span>
                                        <span className="truncate max-w-[100px]">{trader.address.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className={cn("p-4 text-right font-medium", trader.profit >= 0 ? "text-acid-green" : "text-error")}>
                                    {formatCurrency(trader.profit)}
                                </td>
                                <td className="p-4 text-right text-fg-soft">
                                    {formatCurrency(trader.buy_volume_cur)}
                                </td>
                                <td className="p-4 text-right text-fg-soft">
                                    {formatCurrency(trader.sell_volume_cur)}
                                </td>
                                <td className="p-4 text-right text-fg-soft">
                                    {formatCurrency(trader.unrealized_profit)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {trader.maker_token_tags?.map((tag) => (
                                            <span key={tag} className="badge badge-muted text-meta px-1.5 py-0.5">
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
