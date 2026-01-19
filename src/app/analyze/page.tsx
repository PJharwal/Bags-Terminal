"use client";

import { TokenAudit } from "@/components/modules/analyze/TokenAudit";
import { HoldersTable } from "@/components/modules/analyze/HoldersTable";
import { TradersTable } from "@/components/modules/analyze/TradersTable";
import { TokenStatsData, HolderData, TraderData } from "@/types/token";
import { useSocketStore } from "@/store/socket.store";

// Dummy data for visualization
const dummyStats: TokenStatsData = {
  smart_degen_count: 5,
  renowned_count: 2,
  fresh_wallet_count: 10,
  dex_bot_count: 3,
  insider_count: 0,
  following_count: 15,
  dev_count: 1,
  bluechip_owner_count: 4,
  bundler_count: 0,
  sniper_count: 12
};

const dummyHolders: HolderData[] = [
    { address: "8x...7z", balance: 5000000, amount_percentage: 0.05, usd_value: 125000, wallet_tag_v2: "Dev Wallet", is_suspicious: false, maker_token_tags: ["dev", "early"] },
    { address: "2a...9b", balance: 2000000, amount_percentage: 0.02, usd_value: 50000, wallet_tag_v2: "Sniper Bot", is_suspicious: true, maker_token_tags: ["sniper"] },
    { address: "4f...1c", balance: 1000000, amount_percentage: 0.01, usd_value: 25000, wallet_tag_v2: "Whale", is_suspicious: false, maker_token_tags: ["whale"] },
];

const dummyTraders: TraderData[] = [
    { address: "9p...3k", wallet_tag_v2: "Alpha Hunter", profit: 15000, total_cost: 5000, realized_profit: 10000, unrealized_profit: 5000, buy_volume_cur: 20000, sell_volume_cur: 10000, buy_tx_count_cur: 5, sell_tx_count_cur: 2, is_suspicious: false, maker_token_tags: ["smart_money"] },
    { address: "3m...5j", wallet_tag_v2: "Rekt Pleb", profit: -2000, total_cost: 10000, realized_profit: -1000, unrealized_profit: -1000, buy_volume_cur: 10000, sell_volume_cur: 8000, buy_tx_count_cur: 3, sell_tx_count_cur: 3, is_suspicious: false, maker_token_tags: ["fomo"] },
];

export default function AnalyzePage() {
  const isConnected = useSocketStore((state) => state.isConnected);
  const latestTokens = useSocketStore((state) => state.latestTokens);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TokenAudit stats={dummyStats} />
        
        <div className="col-span-2 space-y-6">
            <HoldersTable data={dummyHolders} />
            <TradersTable data={dummyTraders} />
        </div>
      </div>
    </div>
  );
}
