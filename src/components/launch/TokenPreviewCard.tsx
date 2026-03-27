'use client';

import { useLaunchStore } from '@/store/launch.store';
import { Image as ImageIcon, Users, Percent, Heart, Link, Globe, MessageCircle } from 'lucide-react';
import { MAX_FEE_CLAIMERS } from '@/lib/bags-types';

export function TokenPreviewCard() {
  const { metadata, feeClaimers, initialBuyAmount, imagePreviewUrl, imageSourceMode, imageUrl, tipEnabled, tipAmountSol, partnerKey, twitterUrl, websiteUrl, telegramUrl } = useLaunchStore();

  const totalPercentage = feeClaimers.reduce((sum, c) => sum + c.percentage, 0);
  const creatorShare = feeClaimers.length > 0 ? 100 - totalPercentage : 100;

  const displayImage = imageSourceMode === 'url' ? imageUrl : imagePreviewUrl;

  return (
    <div className="card flex flex-col gap-4 p-4">
      <h3 className="label">Preview</h3>

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

      {/* Social Links */}
      {(twitterUrl || websiteUrl || telegramUrl) && (
        <div className="flex items-center gap-3">
          {twitterUrl && (
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-[#EDEDED] transition-colors" title="Twitter">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          )}
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-[#EDEDED] transition-colors" title="Website">
              <Globe size={12} />
            </a>
          )}
          {telegramUrl && (
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-[#EDEDED] transition-colors" title="Telegram">
              <MessageCircle size={12} />
            </a>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card flex flex-col gap-1 p-2.5">
          <span className="label" style={{ fontSize: '8px' }}>Claimers</span>
          <div className="flex items-center gap-1">
            <Users size={10} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#EDEDED]">
              {feeClaimers.length}
              <span className="text-[#666]">/{MAX_FEE_CLAIMERS}</span>
            </span>
          </div>
        </div>
        <div className="stat-card flex flex-col gap-1 p-2.5">
          <span className="label" style={{ fontSize: '8px' }}>Creator Share</span>
          <div className="flex items-center gap-1">
            <Percent size={10} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#EDEDED]">{creatorShare}%</span>
          </div>
        </div>
      </div>

      {/* Initial Buy */}
      <div className="stat-card flex justify-between items-center p-2.5">
        <span className="label">Initial Buy</span>
        <span className="text-xs font-mono text-[#EDEDED]">{initialBuyAmount} SOL</span>
      </div>

      {/* Tip */}
      {tipEnabled && tipAmountSol > 0 && (
        <div className="stat-card flex justify-between items-center p-2.5 !border-[#FFD700]/20 !bg-[linear-gradient(135deg,rgba(255,215,0,0.03)_0%,#0D0D0D_100%)]">
          <span className="label label-gold flex items-center gap-1">
            <Heart size={8} /> Tip
          </span>
          <span className="text-xs font-mono text-[#FFD700]">{tipAmountSol} SOL</span>
        </div>
      )}

      {/* Partner Key */}
      {partnerKey && (
        <div className="stat-card flex justify-between items-center p-2.5 !border-[#00F0FF]/20 !bg-[linear-gradient(135deg,rgba(0,240,255,0.03)_0%,#0D0D0D_100%)]">
          <span className="label flex items-center gap-1" style={{ color: 'rgba(0, 240, 255, 0.6)' }}>
            Partner
          </span>
          <span className="text-[10px] font-mono text-[#00F0FF]">{partnerKey.slice(0,6)}...{partnerKey.slice(-4)}</span>
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
