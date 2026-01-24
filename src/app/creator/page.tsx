'use client';

import { useEffect } from 'react';
import { DashboardTabs } from '@/components/creator/DashboardTabs';
import { useBagsWallet } from '@/hooks/useWallet';
import { useCreatorStore } from '@/store/creator.store';
import { useSocialStore } from '@/store/social.store';
import { SocialLinkManager } from '@/components/social/SocialLinkManager';
import { Wallet } from 'lucide-react';

export default function CreatorPage() {
  const { connected, publicKey } = useBagsWallet();
  const { refreshAll } = useCreatorStore();
  const { loadLinkedAccounts } = useSocialStore();

  useEffect(() => {
    if (connected && publicKey) {
      refreshAll(publicKey);
      loadLinkedAccounts(publicKey);
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border border-[#333] flex items-center justify-center">
            <Wallet size={24} className="text-[#444]" />
          </div>
          <span className="text-sm font-bold text-[#EDEDED]">Connect your wallet</span>
          <span className="text-[10px] text-[#666] font-mono">
            Connect your wallet to view your created tokens and claim fees
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight font-mono">
            CREATOR<span className="text-[#39FF14]">_</span>DASHBOARD
          </h1>
          <p className="text-[11px] text-[#666] font-mono mt-1">
            Manage tokens, claim fees, and link social accounts
          </p>
        </div>
        <SocialLinkManager />
      </div>

      {/* Dashboard Content */}
      <DashboardTabs />
    </div>
  );
}
