'use client';

import { useState } from 'react';
import { useSocialStore } from '@/store/social.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { ProviderIcon } from './ProviderIcon';
import type { SocialProvider } from '@/lib/bags-types';
import { Loader2, X } from 'lucide-react';

interface AddSocialLinkProps {
  onClose: () => void;
}

const PROVIDERS: SocialProvider[] = ['twitter', 'kick', 'github', 'tiktok'];

export function AddSocialLink({ onClose }: AddSocialLinkProps) {
  const [provider, setProvider] = useState<SocialProvider>('twitter');
  const [username, setUsername] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { linkAccount } = useSocialStore();
  const { publicKey } = useBagsWallet();

  const handleLink = async () => {
    if (!publicKey || !username.trim()) return;

    setIsLinking(true);
    setError(null);

    try {
      await linkAccount(provider, username.trim(), publicKey);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link account');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#0A0A0A] border border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest">Link Account</span>
        <button onClick={onClose} className="text-[#666] hover:text-[#EDEDED]">
          <X size={12} />
        </button>
      </div>

      {/* Provider Selection */}
      <div className="grid grid-cols-4 gap-1">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`flex flex-col items-center gap-1 py-2 border transition-colors ${
              provider === p
                ? 'border-[#39FF14] bg-[#39FF14]/10'
                : 'border-[#333] hover:border-[#666]'
            }`}
          >
            <ProviderIcon provider={p} size={14} className={provider === p ? 'text-[#39FF14]' : 'text-[#888]'} />
            <span className={`text-[8px] font-bold uppercase ${provider === p ? 'text-[#39FF14]' : 'text-[#888]'}`}>
              {p}
            </span>
          </button>
        ))}
      </div>

      {/* Username */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">@</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
          className="w-full bg-[#1A1A1A] border border-[#333] pl-7 pr-3 py-2 text-[11px] font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
          placeholder="username"
        />
      </div>

      {error && (
        <span className="text-[9px] text-[#FF003C] font-mono">{error}</span>
      )}

      <button
        onClick={handleLink}
        disabled={!username.trim() || isLinking}
        className="flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#39FF14] text-black hover:brightness-110 transition-all disabled:opacity-50"
      >
        {isLinking && <Loader2 size={10} className="animate-spin" />}
        {isLinking ? 'Linking...' : 'Link Account'}
      </button>
    </div>
  );
}
