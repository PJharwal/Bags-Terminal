'use client';

import type { SocialProvider } from '@/lib/bags-types';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';

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
      <div className="flex flex-col gap-1">
        <span className="text-meta text-muted-high uppercase tracking-widest">Platform</span>
        <div role="radiogroup" aria-label="Social platform" className="grid grid-cols-4 gap-1">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={provider === p.value}
              onClick={() => onProviderChange(p.value)}
              className={`py-1.5 text-meta font-bold uppercase border transition-colors active:scale-95 focus-ring ${
                provider === p.value
                  ? 'border-acid-green text-acid-green bg-acid-green/10'
                  : 'border-line text-fg-soft hover:border-muted-high hover:text-fg'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Username">
        <Input
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value.replace(/^@/, ''))}
          placeholder="username"
          prefix="@"
        />
      </Field>
    </div>
  );
}
