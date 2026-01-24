"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ExternalLink, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/env";

// Types based on the API response
interface TokenData {
    id: number;
    chain: string;
    address: string;
    name: string;
    symbol: string;
    logo: string;
    price: number;
    price_change_percent: number;
    price_change_percent1m: number;
    price_change_percent5m: number;
    price_change_percent1h: number;
    volume: number;
    liquidity: number;
    market_cap: number;
    swaps: number;
    holder_count: number;
    launchpad_platform: string;
    open_timestamp: number;
}

interface TrendingResponse {
    rank: TokenData[];
}

const timeframes = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "1h", value: "1h" },
    { label: "6h", value: "6h" },
    { label: "24h", value: "24h" },
];

export default function TrendingPage() {
    const [data, setData] = useState<TokenData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("1m");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `${config.baseGmgnUrl}/tokens/trending?timeframe=${timeframe}`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const result: TrendingResponse = await response.json();
                setData(result.rank || []);
            } catch (err) {
                console.error("Error fetching trending data:", err);
                setError("Failed to load trending tokens. Ensure the API is running.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeframe]);

    const formatCurrency = (value: number) => {
        if (value < 0.01) return value.toExponential(2);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        }).format(value);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
        if (num >= 1000) return (num / 1000).toFixed(2) + "K";
        return num.toString();
    };

    const PriceChange = ({ value }: { value: number }) => {
        const isPositive = value >= 0;
        return (
            <div
                className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    isPositive ? "text-green-500" : "text-red-500"
                )}
            >
                {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(value).toFixed(2)}%
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Trending</h1>
                    <p className="text-muted-foreground">
                        Top performing tokens in real-time
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timeframe Selector */}
                    <div className="flex items-center rounded-lg bg-surface p-1 border border-border">
                        {timeframes.map((tf) => (
                            <button
                                key={tf.value}
                                onClick={() => setTimeframe(tf.value)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    timeframe === tf.value
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    <button className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-2">
                        <p>{error}</p>
                        <button
                            onClick={() => setTimeframe(timeframe)} // Trigger re-fetch
                            className="text-sm underline hover:text-red-300"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface border-b border-border text-muted-foreground">
                                <tr>
                                    <th className="p-4 font-medium">Token</th>
                                    <th className="p-4 font-medium text-right">Price</th>
                                    <th className="p-4 font-medium text-right">1m %</th>
                                    <th className="p-4 font-medium text-right">5m %</th>
                                    <th className="p-4 font-medium text-right">1h %</th>
                                    <th className="p-4 font-medium text-right">Liquidity</th>
                                    <th className="p-4 font-medium text-right">Mkt Cap</th>
                                    <th className="p-4 font-medium text-right">Vol</th>
                                    <th className="p-4 font-medium text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {data.map((token) => (
                                    <tr
                                        key={token.id}
                                        className="group hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4">
                                            <Link href={`/token/${token.address}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                <img
                                                    src={token.logo || "/placeholder.png"}
                                                    alt={token.name}
                                                    className="w-8 h-8 rounded-full bg-white/10 object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src =
                                                            "https://placehold.co/32x32/1e1e1e/FFF?text=" +
                                                            token.symbol[0];
                                                    }}
                                                />
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-1">
                                                        {token.symbol}
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground font-normal">
                                                            {token.chain}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                        {token.name}
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">
                                            {formatCurrency(token.price)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <PriceChange value={token.price_change_percent1m} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <PriceChange value={token.price_change_percent5m} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <PriceChange value={token.price_change_percent1h} />
                                        </td>
                                        <td className="p-4 text-right font-mono text-muted-foreground">
                                            ${formatNumber(token.liquidity)}
                                        </td>
                                        <td className="p-4 text-right font-mono text-white font-medium">
                                            ${formatNumber(token.market_cap)}
                                        </td>
                                        <td className="p-4 text-right font-mono text-muted-foreground">
                                            ${formatNumber(token.volume)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-md transition-colors">
                                                Buy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
