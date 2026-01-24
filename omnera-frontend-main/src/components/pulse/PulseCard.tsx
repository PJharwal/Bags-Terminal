import { PulseTokenData, TokenStats } from "@/types/pulse";
import Link from "next/link";
import { useState } from "react";
import {
  Copy,
  Check,
  Bot,
  Users,
  Crosshair,
  Wallet,
  Sparkles,
  Target,
  Shield,
  Zap,
} from "lucide-react";
import Image from "next/image";

interface PulseCardProps {
  data: PulseTokenData;
  type: "new" | "soon" | "bonded";
}

// Protocol configuration
const PROTOCOL_CONFIG: Record<
  string,
  { icon: string; color: string; gradient: string; name: string }
> = {
  pumpfun: {
    icon: "/pump.fun.svg",
    color: "#22c55e", // green
    gradient: "from-green-500 to-emerald-400",
    name: "Pump.fun",
  },
  pumpfun_v2: {
    icon: "/pump.fun.svg",
    color: "#22c55e", // green
    gradient: "from-green-500 to-emerald-400",
    name: "Pump.fun V2",
  },
  bonk: {
    icon: "/letsbonk.fun.svg",
    color: "#f97316", // orange
    gradient: "from-orange-500 to-amber-400",
    name: "LetsBonk",
  },
  meteora_dbc: {
    icon: "/met-dbc.svg",
    color: "#ef4444", // red
    gradient: "from-red-500 to-rose-400",
    name: "Meteora DBC",
  },
  meteora: {
    icon: "/met-dbc.svg",
    color: "#ef4444", // red
    gradient: "from-red-500 to-rose-400",
    name: "Meteora",
  },
  moonshot: {
    icon: "/moonshot.svg",
    color: "#a855f7", // purple
    gradient: "from-purple-500 to-violet-400",
    name: "Moonshot",
  },
  bagsfun: {
    icon: "/bags.fun.svg",
    color: "#06b6d4", // cyan/teal
    gradient: "from-cyan-500 to-teal-400",
    name: "Bags.fun",
  },
  bags: {
    icon: "/bags.fun.svg",
    color: "#06b6d4", // cyan/teal
    gradient: "from-cyan-500 to-teal-400",
    name: "Bags.fun",
  },
};

const DEFAULT_PROTOCOL = {
  icon: "/pump.fun.svg",
  color: "#22c55e",
  gradient: "from-green-500 to-emerald-400",
  name: "Unknown",
};

// Circular progress border component for PFP with dynamic color
function CircularProgress({
  progress,
  size = 56,
  strokeWidth = 3,
  color = "#22c55e",
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle (dark) */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle (dynamic color) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Content (PFP) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Stats badge component
function StatBadge({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: number;
  label: string;
  color: string;
}) {
  if (value === 0) return null;

  return (
    <div
      className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${color}`}
      title={label}
    >
      <Icon size={10} />
      <span>{value}</span>
    </div>
  );
}

export function PulseCard({ data, type }: PulseCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Get protocol configuration
  const protocolSource = data.protocol_source?.toLowerCase() || "pumpfun";
  const protocolConfig = PROTOCOL_CONFIG[protocolSource] || DEFAULT_PROTOCOL;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Format age as relative time (e.g., "0s", "5m", "2h", "3d")
  const formatAge = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(data.mint);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const bondingProgress = data.bonding_curve_progress || 0;
  const stats = data.stats;

  // Check if any stats are present
  const hasStats = stats && Object.values(stats).some((v) => v > 0);

  return (
    <Link href={`/token/${data.mint}`} className="block">
      <div className="group relative overflow-hidden rounded-lg border border-gray-800 bg-[#0a0a0a] hover:bg-[#111] hover:border-gray-700 transition-all duration-200 p-3">
        <div className="flex items-center gap-3">
          {/* PFP with circular progress border and protocol badge */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <CircularProgress
                progress={bondingProgress}
                size={52}
                strokeWidth={2.5}
                color={protocolConfig.color}
              >
                <img
                  src={data.image_uri || data.logo || "/placeholder.png"}
                  alt={data.name}
                  className="h-11 w-11 rounded-full object-cover bg-gray-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/44x44/1a1a1a/666?text=" +
                      (data.symbol?.[0] || "?");
                  }}
                />
              </CircularProgress>
              {/* Protocol badge */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-md flex items-center justify-center shadow-lg"
                style={{ backgroundColor: protocolConfig.color }}
                title={protocolConfig.name}
              >
                <Image
                  src={protocolConfig.icon}
                  alt={protocolConfig.name}
                  width={14}
                  height={14}
                  className="brightness-0 invert"
                />
              </div>
            </div>
            {/* Wallet address below PFP */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors font-mono"
              title="Copy Address"
            >
              {truncateAddress(data.mint)}
              {isCopied ? (
                <Check size={10} className="text-green-500" />
              ) : (
                <Copy size={10} />
              )}
            </button>
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            {/* Name & Symbol Row with Age */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white text-sm truncate">
                {data.symbol}
              </span>
              <span className="text-gray-200 text-xs">
                {formatAge(data.created_at)}
              </span>
              <span className="text-gray-400 text-xs truncate">
                {data.name}
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1.5">
              <span className="flex items-center gap-1">
                <span className="text-pink-400">👥</span>
                {formatNumber(data.holder_count || 0)}
              </span>
              <span>TX {data.tx_count || 0}</span>
              <span style={{ color: protocolConfig.color }}>
                ↑ {bondingProgress.toFixed(1)}%
              </span>
            </div>

            {/* Security Stats Row */}
            {hasStats && (
              <div className="flex items-center gap-1 flex-wrap mb-1.5">
                <StatBadge
                  icon={Crosshair}
                  value={stats.sniper_count}
                  label="Snipers"
                  color="bg-red-500/20 text-red-400"
                />
                <StatBadge
                  icon={Target}
                  value={stats.bundler_count}
                  label="Bundlers"
                  color="bg-orange-500/20 text-orange-400"
                />
                <StatBadge
                  icon={Bot}
                  value={stats.dex_bot_count}
                  label="Bots"
                  color="bg-yellow-500/20 text-yellow-400"
                />
                <StatBadge
                  icon={Shield}
                  value={stats.insider_count}
                  label="Insiders"
                  color="bg-purple-500/20 text-purple-400"
                />
                <StatBadge
                  icon={Wallet}
                  value={stats.fresh_wallet_count}
                  label="Fresh Wallets"
                  color="bg-cyan-500/20 text-cyan-400"
                />
                <StatBadge
                  icon={Sparkles}
                  value={stats.smart_degen_count}
                  label="Smart Degens"
                  color="bg-green-500/20 text-green-400"
                />
                <StatBadge
                  icon={Zap}
                  value={stats.bluechip_owner_count}
                  label="Bluechip Holders"
                  color="bg-blue-500/20 text-blue-400"
                />
              </div>
            )}

            {/* Bonding Progress Bar with dynamic color */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${protocolConfig.gradient} transition-all duration-300`}
                  style={{ width: `${Math.min(bondingProgress, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {bondingProgress.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Right Side - MC & Buy Button */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="text-right">
              <div className="text-xs text-gray-500">MC</div>
              <div className="text-sm font-bold text-cyan-400">
                {formatCurrency(data.market_cap)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">V</div>
              <div className="text-xs text-white">
                {formatCurrency(data.volume_24h || 0)}
              </div>
            </div>
            {/* Buy Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement quick buy
              }}
              className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors flex items-center gap-1"
            >
              ◆ 0 SOL
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
