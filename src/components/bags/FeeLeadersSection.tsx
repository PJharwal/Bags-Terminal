"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Coins,
  Users,
  Loader2,
  Shield,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { bagsService } from "@/services/bags.service";
import { formatCurrency, formatNumber } from "@/lib/format";
import { LAMPORTS_PER_SOL } from "@/lib/bags-types";
import type { BagsLeaderboardItem } from "@/lib/bags-types";

const AVATAR_COLORS = [
  "bg-[#FF003C]",
  "bg-[#39FF14]",
  "bg-[#00F0FF]",
  "bg-[#FAFF00]",
  "bg-[#FF00FF]",
  "bg-[#FF6B35]",
];

function formatFeeSol(lamports: string): string {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  if (sol === 0) return "0";
  if (sol < 0.001) return sol.toFixed(6);
  if (sol < 1) return sol.toFixed(4);
  if (sol < 1000) return sol.toFixed(2);
  return formatNumber(sol);
}

function getOrganicScoreColor(score: number): string {
  if (score >= 80) return "text-[#39FF14]";
  if (score >= 50) return "text-[#FAFF00]";
  return "text-[#FF003C]";
}

function getOrganicScoreBg(score: number): string {
  if (score >= 80) return "bg-[#39FF14]/10 border-[#39FF14]/20";
  if (score >= 50) return "bg-[#FAFF00]/10 border-[#FAFF00]/20";
  return "bg-[#FF003C]/10 border-[#FF003C]/20";
}

function getRankStyle(index: number) {
  if (index === 0) return { border: "border-[#FFD700]/40", glow: "shadow-[0_0_20px_rgba(255,215,0,0.15)]", badge: "bg-[#FFD700] text-black" };
  if (index === 1) return { border: "border-[#C0C0C0]/30", glow: "shadow-[0_0_15px_rgba(192,192,192,0.1)]", badge: "bg-[#C0C0C0] text-black" };
  if (index === 2) return { border: "border-[#CD7F32]/30", glow: "shadow-[0_0_15px_rgba(205,127,50,0.1)]", badge: "bg-[#CD7F32] text-black" };
  return { border: "border-white/6", glow: "", badge: "bg-white/10 text-[#888]" };
}

function LeaderCard({ item, index }: { item: BagsLeaderboardItem; index: number }) {
  const info = item.tokenInfo;
  const name = info?.name || "Unknown";
  const symbol = info?.symbol || "???";
  const icon = info?.icon;
  const mcap = info?.mcap || 0;
  const organicScore = info?.organicScore || 0;
  const organicLabel = info?.organicScoreLabel || "";
  const holderCount = info?.holderCount || 0;
  const creatorCount = item.creators?.length || 0;

  const initial = symbol.replace("$", "").charAt(0).toUpperCase();
  const fallbackColor = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
  const rank = getRankStyle(index);
  const feeSol = formatFeeSol(item.lifetimeFees);

  return (
    <Link href={`/terminal/${item.token}`}>
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.15 }}
        className={`group card p-0 cursor-pointer h-full overflow-hidden ${rank.border} ${rank.glow}`}
      >
        {/* Rank badge */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${rank.badge}`}>
            #{index + 1}
          </span>
          {index < 3 && (
            <Trophy size={14} className={index === 0 ? "text-[#FFD700]" : index === 1 ? "text-[#C0C0C0]" : "text-[#CD7F32]"} />
          )}
        </div>

        {/* Token header */}
        <div className="flex items-center gap-3 px-4 pt-2 pb-3">
          <div className="relative flex-shrink-0">
            {icon ? (
              <img src={icon} alt={symbol} className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className={`w-11 h-11 ${fallbackColor} flex items-center justify-center font-display font-bold text-black text-lg`}>
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
                ${symbol}
              </span>
            </div>
            <div className="text-[11px] text-[#666] truncate">{name}</div>
          </div>
        </div>

        {/* Fee highlight */}
        <div className="mx-4 mb-3 p-2.5 bg-[#FFD700]/5 border border-[#FFD700]/15 rounded">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#FFD700] font-mono uppercase tracking-wider flex items-center gap-1">
              <Coins size={10} /> Lifetime Fees
            </span>
            <span className="text-base font-mono font-bold text-[#FFD700]">
              {feeSol} SOL
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#666] font-mono flex items-center gap-1">
              <DollarSign size={9} /> MCap
            </span>
            <span className="text-xs font-mono text-white">{mcap > 0 ? formatCurrency(mcap) : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#666] font-mono flex items-center gap-1">
              <Users size={9} /> Holders
            </span>
            <span className="text-xs font-mono text-white">{holderCount > 0 ? formatNumber(holderCount) : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#666] font-mono flex items-center gap-1">
              <Shield size={9} /> Organic
            </span>
            {organicScore > 0 ? (
              <span className={`text-xs font-mono font-bold ${getOrganicScoreColor(organicScore)}`}>
                {organicScore}
              </span>
            ) : (
              <span className="text-xs font-mono text-[#444]">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#666] font-mono flex items-center gap-1">
              <TrendingUp size={9} /> Creators
            </span>
            <span className="text-xs font-mono text-white">{creatorCount > 0 ? creatorCount : "—"}</span>
          </div>
        </div>

        {/* Bottom badges */}
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          {organicScore > 0 && (
            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono ${getOrganicScoreBg(organicScore)} ${getOrganicScoreColor(organicScore)}`}>
              {organicLabel || (organicScore >= 80 ? "HIGH" : organicScore >= 50 ? "MED" : "LOW")}
            </span>
          )}
          {item.creators && item.creators.length > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] font-mono">
              FEE SHARING
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-white/5" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-white/5 rounded mb-1" />
              <div className="h-3 w-32 bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-12 bg-[#FFD700]/5 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-3/4 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeeLeadersSection() {
  const [items, setItems] = useState<BagsLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");

    try {
      const data = await bagsService.getTopTokensByFees();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalFees = items.reduce((sum, item) => sum + Number(item.lifetimeFees) / LAMPORTS_PER_SOL, 0);
  const totalCreators = items.reduce((sum, item) => sum + (item.creators?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Stats bar */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card p-4 !border-[#FFD700]/15">
            <div className="label label-gold mb-1 flex items-center gap-1">
              <Trophy size={10} /> Top Tokens
            </div>
            <div className="text-2xl font-bold text-[#FFD700]">{items.length}</div>
          </div>
          <div className="stat-card p-4">
            <div className="label mb-1 flex items-center gap-1">
              <Coins size={10} className="text-[#FFD700]" /> Total Fees
            </div>
            <div className="text-2xl font-bold text-[#FFD700]">
              {totalFees < 1 ? totalFees.toFixed(4) : totalFees.toFixed(2)} SOL
            </div>
          </div>
          <div className="stat-card p-4">
            <div className="label mb-1 flex items-center gap-1">
              <Users size={10} /> Total Creators
            </div>
            <div className="text-2xl font-bold text-white">{totalCreators}</div>
          </div>
          <div className="stat-card p-4">
            <div className="label mb-1">
              <div className="flex items-center gap-2">
                <span>Avg Organic</span>
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="text-[#666] hover:text-[#39FF14] transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={10} className={isRefreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#39FF14]">
              {items.length > 0
                ? Math.round(
                    items.reduce((s, i) => s + (i.tokenInfo?.organicScore || 0), 0) /
                      items.filter((i) => i.tokenInfo?.organicScore).length || 1
                  )
                : "—"}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingSkeleton />}

      {/* Error */}
      {!isLoading && error && (
        <div className="text-center py-16">
          <Trophy size={32} className="mx-auto mb-4 text-[#FFD700] opacity-30" />
          <p className="text-[#FF003C] mb-4 font-mono">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 border border-white/10 rounded hover:border-white/30 text-sm font-mono"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <Trophy size={32} className="mx-auto mb-4 text-[#FFD700] opacity-30" />
          <p className="text-[#888] font-mono">No leaderboard data available</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <LeaderCard key={item.token} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
