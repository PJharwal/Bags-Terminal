'use client';

import { useState } from 'react';
import { MyTokensTab } from './MyTokensTab';
import { FeeClaimsTab } from './FeeClaimsTab';
import { ClaimHistoryTab } from './ClaimHistoryTab';
import { PartnerConfigTab } from './PartnerConfigTab';
import { TokenAdminTab } from './TokenAdminTab';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { ReferralShareCard } from '@/components/share/ReferralShareCard';
import { useReferralStore } from '@/store/referral.store';
import { useBagsWallet } from '@/hooks/useWallet';

const TABS = [
  { id: 'tokens', label: 'MY TOKENS' },
  { id: 'claims', label: 'FEE CLAIMS' },
  { id: 'history', label: 'CLAIM HISTORY' },
  { id: 'partner', label: 'PARTNER' },
  { id: 'admin', label: 'ADMIN' },
  { id: 'referral', label: 'REFERRAL' },
] as const;

type TabId = typeof TABS[number]['id'];

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('tokens');

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Headers */}
      <div className="flex border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn-press px-5 py-3 text-[10px] font-bold tracking-widest transition-all relative ${
              activeTab === tab.id
                ? 'text-[#39FF14]'
                : 'text-[#666] hover:text-[#EDEDED]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#39FF14]" style={{ boxShadow: '0 0 8px rgba(57, 255, 20, 0.3)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tokens' && <MyTokensTab />}
        {activeTab === 'claims' && <FeeClaimsTab />}
        {activeTab === 'history' && <ClaimHistoryTab />}
        {activeTab === 'partner' && <PartnerConfigTab />}
        {activeTab === 'admin' && <TokenAdminTab />}
        {activeTab === 'referral' && <ReferralTabContent />}
      </div>
    </div>
  );
}

function ReferralTabContent() {
  const { publicKey } = useBagsWallet();
  const { referralLink, stats } = useReferralStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReferralCard />
      {publicKey && (
        <ReferralShareCard
          referralLink={referralLink}
          tokensReferred={stats.tokensReferred}
          feesEarned={stats.feesEarned}
          walletAddress={publicKey}
        />
      )}
    </div>
  );
}
