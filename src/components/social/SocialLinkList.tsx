'use client';

import { useSocialStore } from '@/store/social.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { ProviderIcon, PROVIDER_COLORS } from './ProviderIcon';
import { Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import type { SocialLink } from '@/lib/bags-types';

export function SocialLinkList() {
  const { linkedAccounts, isLoading, unlinkAccount } = useSocialStore();
  const { publicKey } = useBagsWallet();

  const handleUnlink = async (link: SocialLink) => {
    if (!publicKey) return;
    await unlinkAccount(link.provider, link.username, publicKey);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={14} className="text-[#39FF14] animate-spin" />
      </div>
    );
  }

  if (linkedAccounts.length === 0) {
    return (
      <p className="text-[10px] text-[#666] font-mono py-4 text-center">
        No social accounts linked yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {linkedAccounts.map((link) => (
        <div
          key={link.id}
          className="flex items-center justify-between p-2 bg-[#1A1A1A] border border-white/10"
        >
          <div className="flex items-center gap-2">
            <div style={{ color: PROVIDER_COLORS[link.provider] }}>
              <ProviderIcon provider={link.provider} size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#EDEDED]">@{link.username}</span>
              <div className="flex items-center gap-1">
                {link.verified && (
                  <CheckCircle2 size={8} className="text-[#39FF14]" />
                )}
                <span className="text-[8px] text-[#666] capitalize">{link.provider}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleUnlink(link)}
            className="p-1 text-[#666] hover:text-[#FF003C] transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
