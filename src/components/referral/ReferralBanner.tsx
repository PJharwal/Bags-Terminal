'use client';

import { useEffect } from 'react';
import { useBagsWallet } from '@/hooks/useWallet';
import { useReferralStore } from '@/store/referral.store';
import { Copy, Check, Share2 } from 'lucide-react';
import { BagsLogo } from '@/components/ui/BagsLogo';

export function ReferralBanner() {
  const { publicKey, connected } = useBagsWallet();
  const { referralLink, copied, generateLink, copyLink } = useReferralStore();

  useEffect(() => {
    if (connected && publicKey) {
      generateLink(publicKey);
    }
  }, [connected, publicKey, generateLink]);

  if (!connected || !publicKey) return null;

  const shortLink = referralLink
    ? `${referralLink.split('?ref=')[0]}?ref=${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : '';

  return (
    <div className="border border-[#39FF14]/10 bg-[#0A0A0A] p-3 font-mono">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Share2 size={14} className="text-[#39FF14] shrink-0" />
          <span className="text-[10px] text-[#888] uppercase tracking-widest shrink-0">
            Earn fees when friends launch tokens
          </span>
          <BagsLogo size={14} className="shrink-0" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#666] truncate max-w-[200px]">
            {shortLink}
          </span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest border border-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/10 transition-colors"
          >
            {copied ? (
              <>
                <Check size={10} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={10} />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
