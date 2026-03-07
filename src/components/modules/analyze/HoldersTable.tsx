"use client";

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
        <div className="card overflow-hidden">
            <div className="p-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold tracking-wider text-[#EDEDED] uppercase">Top Holders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="table-header text-[#555]">
                        <tr>
                            <th className="p-4 font-medium uppercase text-[10px] tracking-widest">Holder</th>
                            <th className="p-4 font-medium text-right uppercase text-[10px] tracking-widest">Balance</th>
                            <th className="p-4 font-medium text-right uppercase text-[10px] tracking-widest">Value</th>
                            <th className="p-4 font-medium text-right uppercase text-[10px] tracking-widest">%</th>
                            <th className="p-4 font-medium text-center uppercase text-[10px] tracking-widest">Tags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((holder) => (
                            <tr key={holder.address} className="table-row group">
                                <td className="p-4 text-xs text-[#888888]">
                                    <div className="flex flex-col">
                                        <span className="text-[#EDEDED] font-medium">
                                            {holder.wallet_tag_v2 || "Holder"}
                                        </span>
                                        <span className="truncate max-w-[100px]">{holder.address.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right text-[#EDEDED] font-medium">
                                    {formatNumber(holder.balance)}
                                </td>
                                <td className="p-4 text-right text-[#888888]">
                                    {formatCurrency(holder.usd_value)}
                                </td>
                                <td className="p-4 text-right text-[#888888]">
                                    {(holder.amount_percentage * 100).toFixed(2)}%
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {holder.maker_token_tags?.map((tag) => (
                                            <span key={tag} className="badge badge-muted text-[9px] px-1.5 py-0.5">
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
