"use client";

import { useState, useCallback } from "react";
import { TokenAudit } from "@/components/modules/analyze/TokenAudit";
import { HoldersTable } from "@/components/modules/analyze/HoldersTable";
import { TradersTable } from "@/components/modules/analyze/TradersTable";
import { TokenStatsData, HolderData, TraderData } from "@/types/token";
import { useSocketStore } from "@/store/socket.store";
import { gmgnService, GMGNHolder, GMGNTrader } from "@/services/gmgn.service";
import { Search, Loader2, AlertCircle } from "lucide-react";

export default function AnalyzePage() {
  const isConnected = useSocketStore((state) => state.isConnected);
  const latestTokens = useSocketStore((state) => state.latestTokens);

  const [tokenAddress, setTokenAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetched data
  const [stats, setStats] = useState<TokenStatsData | null>(null);
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");

  const fetchTokenData = useCallback(async (address: string) => {
    if (!address.trim()) {
      setError("Please enter a token address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [enrichedData, holdersData, tradersData] = await Promise.all([
        gmgnService.getTokenEnriched(address),
        gmgnService.getTokenHolders(address, 50),
        gmgnService.getTokenTraders(address, 50),
      ]);

      if (!enrichedData) {
        throw new Error("Token not found or GMGN server unavailable");
      }

      // Set stats from enriched response
      if (enrichedData.stats) {
        setStats(enrichedData.stats);
      } else {
        // Use default stats if not available
        setStats({
          smart_degen_count: 0,
          renowned_count: 0,
          fresh_wallet_count: 0,
          dex_bot_count: 0,
          insider_count: 0,
          following_count: 0,
          dev_count: 0,
          bluechip_owner_count: 0,
          bundler_count: 0,
          sniper_count: 0,
        });
      }

      // Set token symbol
      if (enrichedData.info) {
        setTokenSymbol(enrichedData.info.symbol || "");
      }

      // Transform holders data
      if (holdersData?.list) {
        const transformedHolders: HolderData[] = holdersData.list.map((h: GMGNHolder) => ({
          address: h.address,
          balance: h.balance || 0,
          amount_percentage: h.amount_percentage || 0,
          usd_value: h.usd_value || 0,
          wallet_tag_v2: h.wallet_tag_v2 || "",
          is_suspicious: h.is_suspicious || false,
          maker_token_tags: h.maker_token_tags || [],
        }));
        setHolders(transformedHolders);
      }

      // Transform traders data
      if (tradersData?.list) {
        const transformedTraders: TraderData[] = tradersData.list.map((t: GMGNTrader) => ({
          address: t.address,
          wallet_tag_v2: t.wallet_tag_v2 || "",
          profit: t.profit || 0,
          total_cost: t.total_cost || 0,
          realized_profit: t.realized_profit || 0,
          unrealized_profit: t.unrealized_profit || 0,
          buy_volume_cur: t.buy_volume_cur || 0,
          sell_volume_cur: t.sell_volume_cur || 0,
          buy_tx_count_cur: t.buy_tx_count_cur || 0,
          sell_tx_count_cur: t.sell_tx_count_cur || 0,
          is_suspicious: t.is_suspicious || false,
          maker_token_tags: t.maker_token_tags || [],
        }));
        setTraders(transformedTraders);
      }

    } catch (err) {
      console.error("Failed to fetch token data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch token data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTokenData(tokenAddress);
  };

  const handleQuickSelect = (mint: string, symbol: string) => {
    setTokenAddress(mint);
    setTokenSymbol(symbol);
    fetchTokenData(mint);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-[#EDEDED] tracking-tight">
          ANALYZE<span className="text-[#39FF14]">_</span>MODULE
        </h1>
        <div className="text-[#888888] font-mono text-sm border border-[rgba(255,255,255,0.12)] px-3 py-1 bg-[#0A0A0A]">
          STATUS: <span className={isConnected ? "text-[#39FF14] animate-pulse" : "text-[#FF003C]"}>
            {isConnected ? "CONNECTED" : "DISCONNECTED"}
          </span>
          {isConnected && <span className="ml-2 text-xs">({latestTokens.length} TOKENS)</span>}
        </div>
      </div>

      {/* Token Address Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Enter Solana token mint address..."
              className="w-full bg-[#0A0A0A] border border-white/10 p-4 pl-12 text-sm text-[#EDEDED] focus:border-[#39FF14] focus:outline-none placeholder-[#444] font-mono"
            />
            <Search className="absolute left-4 top-4.5 text-[#666]" size={18} />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-[#39FF14] text-black font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>

        {/* Quick select from recent tokens */}
        {latestTokens.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[#666] uppercase">Quick select:</span>
            {latestTokens.slice(0, 5).map((token) => (
              <button
                key={token.mint}
                type="button"
                onClick={() => handleQuickSelect(token.mint, token.symbol)}
                className="px-2 py-1 text-[10px] border border-white/10 text-[#888] hover:border-[#39FF14] hover:text-[#39FF14] transition-colors"
              >
                ${token.symbol}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-[#FF003C]/10 border border-[#FF003C]/30 flex items-center gap-3 text-[#FF003C]">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {stats && (
        <div className="space-y-6">
          {tokenSymbol && (
            <div className="text-lg font-bold text-[#EDEDED]">
              Results for <span className="text-[#39FF14]">${tokenSymbol}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TokenAudit stats={stats} />

            <div className="col-span-2 space-y-6">
              <HoldersTable data={holders} />
              <TradersTable data={traders} />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!stats && !isLoading && !error && (
        <div className="text-center py-16 text-[#666]">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Enter a token address to analyze</p>
          <p className="text-sm">Get detailed holder distribution, trader analysis, and risk assessment</p>
        </div>
      )}
    </div>
  );
}
