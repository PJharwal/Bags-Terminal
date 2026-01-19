"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceDataPoint {
    timestamp: number;
    price: number;
}

interface ChartData {
    priceHistory: PriceDataPoint[];
    priceChange: number;
    priceChangeAmount: number;
}

interface TokenChartProps {
    address: string;
}

type TimeRange = "1H" | "4H" | "1D" | "1W";

export function TokenChart({ address }: TokenChartProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>("1H");
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `https://orb-api-invest.helius-rpc.com/api/invest/token-chart-data?address=${address}&timeRange=${timeRange}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Chart API error:", response.status, errorText);
                    throw new Error(`API returned ${response.status}`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    setChartData(result.data);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (err) {
                console.error("Error fetching chart data:", err);
                setError(err instanceof Error ? err.message : "Failed to load chart");
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [address, timeRange]);

    const formatPrice = (price: number) => {
        if (price < 0.000001) return price.toExponential(2);
        if (price < 0.01) return price.toFixed(8);
        if (price < 1) return price.toFixed(6);
        return price.toFixed(4);
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        if (timeRange === "1H" || timeRange === "4H") {
            return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        }
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface border border-border rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-muted-foreground mb-1">
                        {new Date(data.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm font-mono font-bold text-white">
                        ${formatPrice(data.price)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-6">
                <div className="flex items-center justify-center h-[400px]">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !chartData) {
        return (
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-6">
                <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                    <p className="text-muted-foreground text-center">
                        Chart data temporarily unavailable
                    </p>
                    {error && (
                        <p className="text-xs text-red-400/70">{error}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 text-center max-w-md">
                        The chart API may be unavailable. Trading functionality is not affected.
                    </p>
                </div>
            </div>
        );
    }

    const isPositive = chartData.priceChange >= 0;

    return (
        <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Price Chart</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-2xl font-mono font-bold", isPositive ? "text-green-500" : "text-red-500")}>
                            {isPositive ? "+" : ""}{chartData.priceChange.toFixed(2)}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                            ({isPositive ? "+" : ""}${formatPrice(chartData.priceChangeAmount)})
                        </span>
                        {isPositive ? (
                            <TrendingUp className="text-green-500" size={20} />
                        ) : (
                            <TrendingDown className="text-red-500" size={20} />
                        )}
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                    {(["1H", "4H", "1D", "1W"] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                timeRange === range
                                    ? "bg-primary text-white"
                                    : "bg-surface border border-border text-muted-foreground hover:text-white hover:border-primary/50"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.priceHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatTimestamp}
                            stroke="#666"
                            style={{ fontSize: "12px" }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => `$${formatPrice(value)}`}
                            stroke="#666"
                            style={{ fontSize: "12px" }}
                            tickLine={false}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? "#22c55e" : "#ef4444"}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: isPositive ? "#22c55e" : "#ef4444" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
