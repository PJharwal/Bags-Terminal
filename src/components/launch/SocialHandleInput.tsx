'use client';

import type { SocialProvider } from '@/lib/bags-types';

interface SocialHandleInputProps {
  provider: SocialProvider;
  username: string;
  onProviderChange: (provider: SocialProvider) => void;
  onUsernameChange: (username: string) => void;
}

const PROVIDERS: { value: SocialProvider; label: string }[] = [
  { value: 'twitter', label: 'Twitter' },
  { value: 'kick', label: 'Kick' },
  { value: 'github', label: 'GitHub' },
  { value: 'tiktok', label: 'TikTok' },
];

export function SocialHandleInput({ provider, username, onProviderChange, onUsernameChange }: SocialHandleInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Provider */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Platform</label>
        <div className="grid grid-cols-4 gap-1">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => onProviderChange(p.value)}
              className={`py-1.5 text-[9px] font-bold uppercase border transition-colors ${
                provider === p.value
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-[#888] hover:border-[#666]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value.replace(/^@/, ''))}
            className="w-full bg-[#1A1A1A] border border-[#333] pl-7 pr-3 py-2 text-[11px] font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
            placeholder="username"
          />
        </div>
      </div>
    </div>
  );
}
