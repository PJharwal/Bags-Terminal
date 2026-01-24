import { Shield, ShieldAlert, ShieldCheck, Lock, Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SecurityResponse } from "@/types/token";

interface SecurityCardProps {
    data: SecurityResponse["security"];
}

export function SecurityCard({ data }: SecurityCardProps) {
    const SecurityItem = ({
        label,
        value,
        isGood,
        icon: Icon
    }: {
        label: string;
        value: string | boolean;
        isGood: boolean;
        icon: any
    }) => (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon size={16} className={isGood ? "text-green-500" : "text-red-500"} />
                {label}
            </div>
            <div className={cn("text-sm font-medium", isGood ? "text-green-400" : "text-red-400")}>
                {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
            </div>
        </div>
    );

    return (
        <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="text-primary" size={20} />
                <h3 className="text-lg font-semibold text-white">Security Check</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SecurityItem
                    label="Mint Renounced"
                    value={data.renounced_mint}
                    isGood={data.renounced_mint}
                    icon={Lock}
                />
                <SecurityItem
                    label="Freeze Renounced"
                    value={data.renounced_freeze_account}
                    isGood={data.renounced_freeze_account}
                    icon={Lock}
                />
                <SecurityItem
                    label="Top 10 Holders"
                    value={`${(parseFloat(data.top_10_holder_rate || "0") * 100).toFixed(2)}%`}
                    isGood={parseFloat(data.top_10_holder_rate || "0") < 0.3}
                    icon={ShieldCheck}
                />
                <SecurityItem
                    label="Burn Ratio"
                    value={data.burn_ratio === "1" ? "100%" : `${(parseFloat(data.burn_ratio || "0") * 100).toFixed(2)}%`}
                    isGood={data.burn_status === "burn"}
                    icon={Flame}
                />
                <SecurityItem
                    label="Honeypot"
                    value={data.is_honeypot ? "Yes" : "No"}
                    isGood={!data.is_honeypot}
                    icon={AlertTriangle}
                />
                <SecurityItem
                    label="Buy/Sell Tax"
                    value={`${data.buy_tax || 0}% / ${data.sell_tax || 0}%`}
                    isGood={parseFloat(data.buy_tax || "0") < 5 && parseFloat(data.sell_tax || "0") < 5}
                    icon={ShieldAlert}
                />
            </div>
        </div>
    );
}
