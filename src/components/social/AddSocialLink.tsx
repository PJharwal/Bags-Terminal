'use client';

import { useState } from 'react';
import { useSocialStore } from '@/store/social.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { ProviderIcon } from './ProviderIcon';
import type { SocialProvider } from '@/lib/bags-types';
import { Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

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
    <div role="region" aria-label="Link social account" className="flex flex-col gap-3 p-3 card">
      <div className="flex items-center justify-between">
        <span className="text-meta font-bold text-fg uppercase tracking-widest">Link Account</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel linking account"
          className="flex items-center justify-center w-6 h-6 text-muted-high hover:text-fg focus-ring"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>

      {/* Provider Selection */}
      <div role="radiogroup" aria-label="Social provider" className="grid grid-cols-4 gap-1">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={provider === p}
            onClick={() => setProvider(p)}
            className={`flex flex-col items-center gap-1 py-2 border transition-colors active:scale-95 focus-ring ${
              provider === p
                ? 'border-acid-green bg-acid-green/10'
                : 'border-line hover:border-muted-high'
            }`}
          >
            <ProviderIcon provider={p} size={14} className={provider === p ? 'text-acid-green' : 'text-fg-soft'} />
            <span className={`text-meta font-bold uppercase ${provider === p ? 'text-acid-green' : 'text-fg-soft'}`}>
              {p}
            </span>
          </button>
        ))}
      </div>

      {/* Username */}
      <Field label="Username" error={error ?? undefined}>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
          placeholder="username"
          prefix="@"
        />
      </Field>

      <Button
        variant="primary"
        size="sm"
        fullWidth
        loading={isLinking}
        disabled={!username.trim()}
        onClick={handleLink}
      >
        {isLinking ? 'Linking...' : 'Link Account'}
      </Button>
    </div>
  );
}
