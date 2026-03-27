'use client';

import { useEffect, useState } from 'react';
import { DashboardTabs } from '@/components/creator/DashboardTabs';
import { useBagsWallet } from '@/hooks/useWallet';
import { useCreatorStore } from '@/store/creator.store';
import { useSocialStore } from '@/store/social.store';
import { SocialLinkManager } from '@/components/social/SocialLinkManager';
import { FeeEarningsCard } from '@/components/share/FeeEarningsCard';
import { PortfolioCard } from '@/components/share/PortfolioCard';
import { Wallet, Share2 } from 'lucide-react';
import { BagsLogo } from '@/components/ui/BagsLogo';

export default function CreatorPage() {
  const { connected, publicKey } = useBagsWallet();
  const { refreshAll } = useCreatorStore();
  const { loadLinkedAccounts } = useSocialStore();

  useEffect(() => {
    if (connected && publicKey) {
      refreshAll(publicKey);
      loadLinkedAccounts(publicKey);
    }
  }, [connected, publicKey, refreshAll, loadLinkedAccounts]);

  if (!connected) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#050505] text-[#EDEDED] font-mono flex-1 flex flex-col items-center justify-center text-[#666] py-12">
        <Wallet size={32} className="mb-4 opacity-30" />
        <p className="text-sm font-mono">Connect your wallet to view created tokens</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#050505] text-[#EDEDED] font-mono max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight text-display flex items-center gap-2">
            <BagsLogo size={18} />
            CREATOR<span className="text-[#39FF14]">_</span>DASHBOARD
          </h1>
          <p className="label mt-2">
            Manage tokens, claim fees on bags.fm, and link social accounts
          </p>
        </div>
        <SocialLinkManager />
      </div>

      {/* Dashboard Content */}
      <DashboardTabs />

      {/* Share Cards Section */}
      {publicKey && <CreatorShareCards wallet={publicKey} />}
    </div>
  );
}

function CreatorShareCards({ wallet }: { wallet: string }) {
  const [open, setOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<'fees' | 'portfolio'>('fees');
  const { createdTokens, claimableEarnings, claimHistory } = useCreatorStore();

  const totalFeesEarned = createdTokens.reduce((sum, t) => sum + t.totalFeesEarned, 0);
  const totalFeesClaimed = createdTokens.reduce((sum, t) => sum + (t.totalFeesEarned - t.claimableFees), 0);
  const totalMarketCap = createdTokens.reduce((sum, t) => sum + t.marketCap, 0);
  const bestToken = createdTokens.length > 0
    ? createdTokens.reduce((best, t) => t.marketCap > best.marketCap ? t : best)
    : undefined;
  const topToken = createdTokens.length > 0
    ? createdTokens.reduce((best, t) => t.totalFeesEarned > best.totalFeesEarned ? t : best)
    : undefined;

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#888] hover:text-[#39FF14] transition-colors mb-4"
      >
        <Share2 size={14} />
        Share Your Stats
        <span className="text-[#666]">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="max-w-lg">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveCard('fees')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                activeCard === 'fees'
                  ? 'border-[#FFD700]/30 text-[#FFD700] bg-[#FFD700]/5'
                  : 'border-white/10 text-[#666]'
              }`}
            >
              Fee Earnings
            </button>
            <button
              onClick={() => setActiveCard('portfolio')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                activeCard === 'portfolio'
                  ? 'border-[#00F0FF]/30 text-[#00F0FF] bg-[#00F0FF]/5'
                  : 'border-white/10 text-[#666]'
              }`}
            >
              Portfolio
            </button>
          </div>

          {activeCard === 'fees' ? (
            <FeeEarningsCard
              totalFeesEarned={totalFeesEarned}
              totalFeesClaimed={totalFeesClaimed}
              tokensCreated={createdTokens.length}
              claimCount={claimHistory.length}
              topToken={topToken ? { symbol: topToken.symbol, fees: topToken.totalFeesEarned } : undefined}
              walletAddress={wallet}
            />
          ) : (
            <PortfolioCard
              tokensCreated={createdTokens.length}
              totalMarketCap={totalMarketCap}
              totalVolume={0}
              totalFeesEarned={totalFeesEarned}
              bestToken={bestToken ? { symbol: bestToken.symbol, marketCap: bestToken.marketCap } : undefined}
              walletAddress={wallet}
            />
          )}
        </div>
      )}
    </div>
  );
}
