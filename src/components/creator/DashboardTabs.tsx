'use client';

import { useState } from 'react';
import { MyTokensTab } from './MyTokensTab';
import { FeeClaimsTab } from './FeeClaimsTab';
import { ClaimHistoryTab } from './ClaimHistoryTab';

const TABS = [
  { id: 'tokens', label: 'MY TOKENS' },
  { id: 'claims', label: 'FEE CLAIMS' },
  { id: 'history', label: 'CLAIM HISTORY' },
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
            className={`px-5 py-3 text-[10px] font-bold tracking-widest transition-all relative ${
              activeTab === tab.id
                ? 'text-[#39FF14]'
                : 'text-[#666] hover:text-[#EDEDED]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#39FF14]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tokens' && <MyTokensTab />}
        {activeTab === 'claims' && <FeeClaimsTab />}
        {activeTab === 'history' && <ClaimHistoryTab />}
      </div>
    </div>
  );
}
