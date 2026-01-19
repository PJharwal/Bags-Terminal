import { HolderData } from "@/types/token";

interface HoldersTableProps {
    data: HolderData[];
}

export function HoldersTable({ data }: HoldersTableProps) {
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
        if (num >= 1000) return (num / 1000).toFixed(2) + "K";
        return num.toLocaleString();
    };

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
                <h3 className="text-lg font-semibold text-white">Top Holders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface border-b border-border text-muted-foreground">
                        <tr>
                            <th className="p-4 font-medium">Holder</th>
                            <th className="p-4 font-medium text-right">Balance</th>
                            <th className="p-4 font-medium text-right">Value</th>
                            <th className="p-4 font-medium text-right">%</th>
                            <th className="p-4 font-medium text-center">Tags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {data.map((holder) => (
                            <tr key={holder.address} className="group hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">
                                            {holder.wallet_tag_v2 || "Holder"}
                                        </span>
                                        <span className="truncate max-w-[100px]">{holder.address.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right text-white font-medium">
                                    {formatNumber(holder.balance)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    {formatCurrency(holder.usd_value)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    {(holder.amount_percentage * 100).toFixed(2)}%
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {holder.maker_token_tags?.map((tag) => (
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
