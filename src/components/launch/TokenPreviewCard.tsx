'use client';

import { useLaunchStore } from '@/store/launch.store';
import { Image as ImageIcon, Users, Percent, Heart, Link } from 'lucide-react';
import { MAX_FEE_CLAIMERS } from '@/lib/bags-types';

export function TokenPreviewCard() {
  const { metadata, feeClaimers, initialBuyAmount, imagePreviewUrl, imageSourceMode, imageUrl, tipEnabled, tipAmountSol } = useLaunchStore();

  const totalPercentage = feeClaimers.reduce((sum, c) => sum + c.percentage, 0);
  const creatorShare = feeClaimers.length > 0 ? 100 - totalPercentage : 100;

  const displayImage = imageSourceMode === 'url' ? imageUrl : imagePreviewUrl;

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0A0A0A] border border-white/10">
      <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Preview</h3>

      {/* Token Header */}
      <div className="flex items-center gap-3">
        {displayImage ? (
          <div className="w-12 h-12 border border-[#39FF14]/30 overflow-hidden shrink-0">
            <img src={displayImage} alt="Token" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 border border-[#333] flex items-center justify-center shrink-0">
            <ImageIcon size={16} className="text-[#444]" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-[#EDEDED] truncate">
            {metadata.name || 'Token Name'}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-[#39FF14]">
              ${metadata.symbol || 'TKN'}
            </span>
            {imageSourceMode === 'url' && (
              <Link size={8} className="text-[#666]" />
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-[#888] font-mono leading-relaxed">
        {metadata.description || 'No description provided.'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 p-2 bg-[#1A1A1A] border border-white/5">
          <span className="text-[8px] text-[#666] uppercase tracking-widest">Claimers</span>
          <div className="flex items-center gap-1">
            <Users size={10} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#EDEDED]">
              {feeClaimers.length}
              <span className="text-[#666]">/{MAX_FEE_CLAIMERS}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-2 bg-[#1A1A1A] border border-white/5">
          <span className="text-[8px] text-[#666] uppercase tracking-widest">Creator Share</span>
          <div className="flex items-center gap-1">
            <Percent size={10} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#EDEDED]">{creatorShare}%</span>
          </div>
        </div>
      </div>

      {/* Initial Buy */}
      <div className="flex justify-between items-center p-2 bg-[#1A1A1A] border border-white/5">
        <span className="text-[9px] text-[#666] uppercase tracking-widest">Initial Buy</span>
        <span className="text-xs font-mono text-[#EDEDED]">{initialBuyAmount} SOL</span>
      </div>

      {/* Tip */}
      {tipEnabled && tipAmountSol > 0 && (
        <div className="flex justify-between items-center p-2 bg-[#FFD700]/5 border border-[#FFD700]/20">
          <span className="text-[9px] text-[#FFD700] uppercase tracking-widest flex items-center gap-1">
            <Heart size={8} /> Tip
          </span>
          <span className="text-xs font-mono text-[#FFD700]">{tipAmountSol} SOL</span>
        </div>
      )}

      {/* API Fee Notice */}
      <div className="text-center">
        <span className="text-[8px] text-[#39FF14]/60 font-mono">
          No API fees — only Solana tx costs
        </span>
      </div>
    </div>
  );
}
