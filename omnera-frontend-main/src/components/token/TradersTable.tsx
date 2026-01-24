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
        <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-white">Top Traders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface border-b border-border text-muted-foreground">
                        <tr>
                            <th className="p-4 font-medium">Trader</th>
                            <th className="p-4 font-medium text-right">PnL</th>
                            <th className="p-4 font-medium text-right">Bought</th>
                            <th className="p-4 font-medium text-right">Sold</th>
                            <th className="p-4 font-medium text-right">Unrealized</th>
                            <th className="p-4 font-medium text-center">Tags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {data.map((trader) => (
                            <tr key={trader.address} className="group hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">
                                            {trader.wallet_tag_v2 || "Trader"}
                                        </span>
                                        <span className="truncate max-w-[100px]">{trader.address.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className={cn("p-4 text-right font-medium", trader.profit >= 0 ? "text-green-500" : "text-red-500")}>
                                    {formatCurrency(trader.profit)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    {formatCurrency(trader.buy_volume_cur)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    {formatCurrency(trader.sell_volume_cur)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    {formatCurrency(trader.unrealized_profit)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {trader.maker_token_tags?.map((tag) => (
                                            <span key={tag} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-muted-foreground capitalize">
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
