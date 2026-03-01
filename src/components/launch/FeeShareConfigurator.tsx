'use client';

import { useState } from 'react';
import { useLaunchStore } from '@/store/launch.store';
import { AddClaimerForm } from './AddClaimerForm';
import { Trash2, Plus, AlertTriangle, Info } from 'lucide-react';
import type { SocialProvider } from '@/lib/bags-types';
import { MAX_FEE_CLAIMERS } from '@/lib/bags-types';

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  twitter: 'Twitter',
  kick: 'Kick',
  github: 'GitHub',
  tiktok: 'TikTok',
};

export function FeeShareConfigurator() {
  const { feeClaimers, removeFeeClaimer } = useLaunchStore();
  const [showAddForm, setShowAddForm] = useState(false);

  const totalPercentage = feeClaimers.reduce((sum, c) => sum + c.percentage, 0);
  const isValid = feeClaimers.length === 0 || totalPercentage === 100;
  const needsLookupTable = feeClaimers.length > 15;
  const isAtMax = feeClaimers.length >= MAX_FEE_CLAIMERS;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#EDEDED] uppercase tracking-widest">Fee Share</h2>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#666] font-mono">
            {feeClaimers.length}/{MAX_FEE_CLAIMERS}
          </span>
          <span className={`text-[10px] font-mono ${isValid ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
            {totalPercentage}%
          </span>
        </div>
      </div>

      {/* Validation Warning */}
      {!isValid && feeClaimers.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-[#FF003C]/10 border border-[#FF003C]/30">
          <AlertTriangle size={12} className="text-[#FF003C]" />
          <span className="text-[9px] text-[#FF003C] font-mono">
            Percentages must total 100% (currently {totalPercentage}%)
          </span>
        </div>
      )}

      {/* Large claimer set notice */}
      {needsLookupTable && (
        <div className="flex items-center gap-2 p-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30">
          <Info size={12} className="text-[#00F0FF]" />
          <span className="text-[9px] text-[#00F0FF] font-mono">
            {feeClaimers.length} claimers — lookup tables will be created automatically (extra TX required)
          </span>
        </div>
      )}

      {/* Claimers List */}
      {feeClaimers.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {feeClaimers.map((claimer) => (
            <div
              key={claimer.id}
              className="flex items-center justify-between p-2 bg-[#1A1A1A] border border-white/10"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#EDEDED]">
                  {claimer.type === 'wallet'
                    ? `${claimer.identifier.slice(0, 6)}...${claimer.identifier.slice(-4)}`
                    : `@${claimer.identifier}`
                  }
                </span>
                <span className="text-[8px] text-[#666] uppercase">
                  {claimer.type === 'wallet' ? 'Wallet' : PROVIDER_LABELS[claimer.provider!]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#39FF14] font-bold">
                  {claimer.percentage}%
                </span>
                <button
                  onClick={() => removeFeeClaimer(claimer.id)}
                  className="p-1 text-[#666] hover:text-[#FF003C] transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Claimer */}
      {showAddForm ? (
        <AddClaimerForm onClose={() => setShowAddForm(false)} />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          disabled={isAtMax}
          className="flex items-center justify-center gap-2 py-2 border border-dashed border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-wider hover:border-[#39FF14] hover:text-[#39FF14] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          Add Fee Claimer
        </button>
      )}

      {feeClaimers.length === 0 && (
        <p className="text-[9px] text-[#666] font-mono">
          Add up to {MAX_FEE_CLAIMERS} fee claimers to receive trading fees from your token.
        </p>
      )}

      {/* No API fees notice */}
      <div className="flex items-center gap-2 p-2 bg-[#39FF14]/5 border border-[#39FF14]/20">
        <Info size={10} className="text-[#39FF14] shrink-0" />
        <span className="text-[8px] text-[#39FF14]/70 font-mono">
          No API fees for token creation — you only pay Solana transaction costs
        </span>
      </div>
    </div>
  );
}
