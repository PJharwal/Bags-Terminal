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
          <div className="w-12 h-12 border border-acid-green/30 overflow-hidden shrink-0">
            <img src={displayImage} alt="Token preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 border border-line flex items-center justify-center shrink-0" aria-hidden="true">
            <ImageIcon size={16} className="text-muted" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-fg truncate" title={metadata.name || 'Token Name'}>
            {metadata.name || 'Token Name'}
          </span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-meta font-mono text-acid-green truncate" title={metadata.symbol || 'TKN'}>
              ${metadata.symbol || 'TKN'}
            </span>
            {imageSourceMode === 'url' && (
              <Link size={8} aria-hidden="true" className="text-muted-high shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-meta text-fg-soft font-mono leading-relaxed">
        {metadata.description || 'No description provided.'}
      </p>

      {/* Social Links */}
      {(twitterUrl || websiteUrl || telegramUrl) && (
        <div className="flex items-center gap-3">
          {twitterUrl && (
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors" title="Twitter">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          )}
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors" title="Website">
              <Globe size={12} />
            </a>
          )}
          {telegramUrl && (
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors" title="Telegram">
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
            <Users size={10} aria-hidden="true" className="text-acid-green" />
            <span className="text-xs font-mono text-fg num">
              {feeClaimers.length}
              <span className="text-muted-high">/{MAX_FEE_CLAIMERS}</span>
            </span>
          </div>
        </div>
        <div className="stat-card flex flex-col gap-1 p-2.5">
          <span className="label" style={{ fontSize: '8px' }}>Creator Share</span>
          <div className="flex items-center gap-1">
            <Percent size={10} aria-hidden="true" className="text-acid-green" />
            <span className="text-xs font-mono text-fg num">{creatorShare}%</span>
          </div>
        </div>
      </div>

      {/* Initial Buy */}
      <div className="stat-card flex justify-between items-center p-2.5">
        <span className="label">Initial Buy</span>
        <span className="text-xs font-mono text-fg num">{initialBuyAmount} SOL</span>
      </div>

      {/* Tip */}
      {tipEnabled && tipAmountSol > 0 && (
        <div className="stat-card flex justify-between items-center p-2.5 !border-gold/20 !bg-[linear-gradient(135deg,rgba(255,215,0,0.03)_0%,#0D0D0D_100%)]">
          <span className="label label-gold flex items-center gap-1">
            <Heart size={8} aria-hidden="true" /> Tip
          </span>
          <span className="text-xs font-mono text-gold num">{tipAmountSol} SOL</span>
        </div>
      )}

      {/* Partner Key */}
      {partnerKey && (
        <div className="stat-card flex justify-between items-center p-2.5 !border-electric-blue/20 !bg-[linear-gradient(135deg,rgba(0,240,255,0.03)_0%,#0D0D0D_100%)]">
          <span className="label flex items-center gap-1 text-electric-blue/60">
            Partner
          </span>
          <span className="text-meta font-mono text-electric-blue num">{partnerKey.slice(0,6)}...{partnerKey.slice(-4)}</span>
        </div>
      )}

      {/* API Fee Notice */}
      <div className="text-center">
        <span className="text-meta text-acid-green/60 font-mono">
          No API fees — only Solana tx costs
        </span>
      </div>
    </div>
  );
}
