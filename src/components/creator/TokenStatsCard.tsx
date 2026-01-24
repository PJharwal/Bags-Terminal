'use client';

import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { BagsCreatedToken } from '@/lib/bags-types';

interface TokenStatsCardProps {
  token: BagsCreatedToken;
  claimable: number;
  isClaiming: boolean;
  onClaim: () => void;
}

export function TokenStatsCard({ token, claimable, isClaiming, onClaim }: TokenStatsCardProps) {
  const launchDate = new Date(token.createdAt).toLocaleDateString();

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-colors">
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
        <div className="flex flex-col p-2 bg-[#1A1A1A]">
          <span className="text-[8px] text-[#666] uppercase tracking-widest">Launch</span>
          <span className="text-[10px] font-mono text-[#EDEDED]">{launchDate}</span>
        </div>
        <div className="flex flex-col p-2 bg-[#1A1A1A]">
          <span className="text-[8px] text-[#666] uppercase tracking-widest">Market Cap</span>
          <span className="text-[10px] font-mono text-[#EDEDED]">
            ${token.marketCap.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col p-2 bg-[#1A1A1A]">
          <span className="text-[8px] text-[#666] uppercase tracking-widest">Total Earned</span>
          <span className="text-[10px] font-mono text-[#39FF14]">
            {token.totalFeesEarned.toFixed(4)} SOL
          </span>
        </div>
        <div className="flex flex-col p-2 bg-[#1A1A1A]">
          <span className="text-[8px] text-[#666] uppercase tracking-widest">Claimable</span>
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
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#39FF14] text-black hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isClaiming ? (
            <Loader2 size={10} className="animate-spin" />
          ) : null}
          {isClaiming ? 'Claiming...' : 'Claim Fees'}
        </button>
        <Link
          href={`/terminal/${token.mint}`}
          className="flex items-center justify-center gap-1 px-3 py-2 border border-[#333] text-[10px] font-bold text-[#888] uppercase hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
        >
          <ExternalLink size={10} />
          View
        </Link>
      </div>
    </div>
  );
}
