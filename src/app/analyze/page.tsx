"use client";

import { useState, useCallback, useEffect } from "react";
import { TokenAudit } from "@/components/modules/analyze/TokenAudit";
import { HoldersTable } from "@/components/modules/analyze/HoldersTable";
import { TradersTable } from "@/components/modules/analyze/TradersTable";
import { TokenStatsData, HolderData, TraderData } from "@/types/token";
import { useSocketStore } from "@/store/socket.store";
import { gmgnService, GMGNHolder, GMGNTrader } from "@/services/gmgn.service";
import { Search, Loader2, AlertCircle } from "lucide-react";

export default function AnalyzePage() {
  const isConnected = useSocketStore((state) => state.isConnected);
  const connect = useSocketStore((state) => state.connect);
  const latestTokens = useSocketStore((state) => state.latestTokens);

  useEffect(() => { connect(); }, [connect]);

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
    <div className="min-h-[calc(100vh-56px)] bg-[#050505] text-[#EDEDED] font-mono p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-[#EDEDED] tracking-tight">
          ANALYZE<span className="text-[#39FF14]">_</span>MODULE
        </h1>
        <div className={`${isConnected ? 'badge-green' : 'badge-red'} font-mono text-sm`}>
          STATUS: {isConnected ? "CONNECTED" : "DISCONNECTED"}
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
              className="input w-full pl-12"
            />
            <Search className="absolute left-4 top-4.5 text-[#666]" size={18} />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="btn-ghost px-2 py-1 text-[10px]"
              >
                ${token.symbol}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Error Display */}
      {error && (
        <div className="badge-red p-4 flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
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
        <div className="flex-1 flex flex-col items-center justify-center text-[#666] py-12">
          <Search size={32} className="mb-4 opacity-30" />
          <p className="text-sm font-mono">Enter a token address to analyze</p>
        </div>
      )}
    </div>
  );
}
