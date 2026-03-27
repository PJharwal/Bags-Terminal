'use client';

import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { BagsCreatedToken } from '@/lib/bags-types';
import { DexListingButton } from './DexListingButton';

interface TokenStatsCardProps {
  token: BagsCreatedToken;
  claimable: number;
  isClaiming: boolean;
  onClaim: () => void;
}

export function TokenStatsCard({ token, claimable, isClaiming, onClaim }: TokenStatsCardProps) {
  const launchDate = new Date(token.createdAt).toLocaleDateString();

  return (
    <div className="card flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {token.image ? (
          <img src={token.image} alt={token.symbol} className="w-10 h-10 border border-white/10" />
        ) : (
          <div className="w-10 h-10 bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[10px] font-mono text-[#666]">
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-[#EDEDED] truncate">{token.name}</span>
          <span className="text-[10px] font-mono text-[#39FF14]">${token.symbol}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card flex flex-col p-2">
          <span className="label">Launch</span>
          <span className="text-[10px] font-mono text-[#EDEDED]">{launchDate}</span>
        </div>
        <div className="stat-card flex flex-col p-2">
          <span className="label">Market Cap</span>
          <span className="text-[10px] font-mono text-[#EDEDED]">
            ${token.marketCap.toLocaleString()}
          </span>
        </div>
        <div className="stat-card flex flex-col p-2">
          <span className="label label-green">Total Earned</span>
          <span className="text-[10px] font-mono text-[#39FF14]">
            {token.totalFeesEarned.toFixed(4)} SOL
          </span>
        </div>
        <div className="stat-card flex flex-col p-2">
          <span className="label label-green">Claimable</span>
          <span className="text-[10px] font-mono text-[#39FF14] font-bold">
            {claimable.toFixed(4)} SOL
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClaim}
          disabled={claimable <= 0 || isClaiming}
          className="btn-primary flex-1 flex items-center justify-center gap-1 py-2 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isClaiming ? (
            <Loader2 size={10} className="animate-spin" />
          ) : null}
          {isClaiming ? 'Claiming...' : 'Claim Fees'}
        </button>
        <Link
          href={`/terminal/${token.mint}`}
          className="btn-ghost flex items-center justify-center gap-1 px-3 py-2 text-[10px] font-bold uppercase"
        >
          <ExternalLink size={10} />
          View
        </Link>
      </div>

      {/* Dexscreener Listing */}
      <DexListingButton tokenMint={token.mint} />
    </div>
  );
}
