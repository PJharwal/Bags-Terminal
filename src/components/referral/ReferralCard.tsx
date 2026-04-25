'use client';

import { useEffect } from 'react';
import { useBagsWallet } from '@/hooks/useWallet';
import { useReferralStore } from '@/store/referral.store';
import { Copy, Check, Share2, Link2, Rocket, Coins } from 'lucide-react';
import { BagsLogo } from '@/components/ui/BagsLogo';

export function ReferralCard() {
  const { publicKey, connected } = useBagsWallet();
  const { referralLink, copied, stats, generateLink, copyLink } = useReferralStore();

  useEffect(() => {
    if (connected && publicKey) {
      generateLink(publicKey);
    }
  }, [connected, publicKey, generateLink]);

  if (!connected || !publicKey) {
    return (
      <div className="card p-6 text-center">
        <p className="text-meta text-muted-high font-mono">Connect wallet to access referrals</p>
      </div>
    );
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `Launch your token on bags.fm with built-in fee sharing! Use my referral link:`
    );
    const url = encodeURIComponent(referralLink);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Referral Link */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BagsLogo size={16} />
          <span className="label">Your Referral Link</span>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[#050505] border border-white/5 mb-4">
          <span className="text-meta text-fg-soft font-mono truncate flex-1">
            {referralLink}
          </span>
          <button
            onClick={copyLink}
            className="btn-primary flex items-center gap-1 px-3 py-1.5 text-meta shrink-0"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          onClick={shareOnTwitter}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-meta font-mono uppercase tracking-widest border border-white/10 text-fg-soft hover:text-white hover:border-white/20 transition-colors"
        >
          <Share2 size={12} />
          Share on X
        </button>
      </div>

      {/* How it Works */}
      <div className="card p-5">
        <span className="label mb-4 block">How It Works</span>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-acid-green/10 flex items-center justify-center shrink-0">
              <Link2 size={12} className="text-acid-green" />
            </div>
            <div>
              <p className="text-meta text-white font-mono">Share your referral link</p>
              <p className="text-meta text-muted-high font-mono">Your wallet address is your partner key</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#00F0FF]/10 flex items-center justify-center shrink-0">
              <Rocket size={12} className="text-[#00F0FF]" />
            </div>
            <div>
              <p className="text-meta text-white font-mono">Friends launch tokens</p>
              <p className="text-meta text-muted-high font-mono">Your partner key auto-fills in their launch</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFD700]/10 flex items-center justify-center shrink-0">
              <Coins size={12} className="text-gold" />
            </div>
            <div>
              <p className="text-meta text-white font-mono">Earn ongoing fee share</p>
              <p className="text-meta text-muted-high font-mono">Receive fees from every token launched with your key</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card p-4">
          <span className="label">Tokens Referred</span>
          <p className="text-2xl font-bold text-white font-mono mt-1">{stats.tokensReferred}</p>
        </div>
        <div className="stat-card p-4">
          <span className="label">Fees Earned</span>
          <p className="text-2xl font-bold text-acid-green font-mono mt-1">
            {stats.feesEarned.toFixed(4)} SOL
          </p>
        </div>
      </div>
    </div>
  );
}
