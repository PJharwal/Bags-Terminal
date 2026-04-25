'use client';

import { useState } from 'react';
import { useLaunchStore } from '@/store/launch.store';
import { SocialHandleInput } from './SocialHandleInput';
import type { FeeClaimerType, SocialProvider } from '@/lib/bags-types';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { AddressInput } from '@/components/ui/AddressInput';

interface AddClaimerFormProps {
  onClose: () => void;
}

export function AddClaimerForm({ onClose }: AddClaimerFormProps) {
  const { addFeeClaimer } = useLaunchStore();
  const [type, setType] = useState<FeeClaimerType>('wallet');
  const [walletAddress, setWalletAddress] = useState('');
  const [socialProvider, setSocialProvider] = useState<SocialProvider>('twitter');
  const [socialUsername, setSocialUsername] = useState('');
  const [percentage, setPercentage] = useState(50);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [percentageError, setPercentageError] = useState<string | null>(null);

  const validateSolanaAddress = (addr: string) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  };

  const handleSubmit = () => {
    setWalletError(null);
    setSocialError(null);
    setPercentageError(null);

    let valid = true;
    if (type === 'wallet') {
      if (!validateSolanaAddress(walletAddress)) {
        setWalletError('Invalid Solana address');
        valid = false;
      }
    } else if (!socialUsername.trim()) {
      setSocialError('Username is required');
      valid = false;
    }

    if (percentage <= 0 || percentage > 100) {
      setPercentageError('Must be between 1 and 100');
      valid = false;
    }

    if (!valid) return;

    addFeeClaimer({
      id: `claimer_${Date.now()}`,
      type,
      identifier: type === 'wallet' ? walletAddress : socialUsername,
      provider: type === 'social' ? socialProvider : undefined,
      percentage,
    });

    onClose();
  };

  return (
    <div
      role="region"
      aria-label="Add fee claimer"
      className="flex flex-col gap-3 p-3 card"
    >
      <div className="flex items-center justify-between">
        <span className="text-meta font-bold text-fg uppercase tracking-widest">Add Claimer</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel adding claimer"
          className="flex items-center justify-center w-6 h-6 text-muted-high hover:text-fg focus-ring"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>

      {/* Type Selection */}
      <div role="radiogroup" aria-label="Claimer type" className="flex gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={type === 'wallet'}
          onClick={() => setType('wallet')}
          className={`flex-1 py-2 text-meta font-bold uppercase border transition-colors active:scale-95 focus-ring ${
            type === 'wallet'
              ? 'border-acid-green text-acid-green bg-acid-green/10'
              : 'border-line text-fg-soft hover:border-muted-high hover:text-fg'
          }`}
        >
          Wallet
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={type === 'social'}
          onClick={() => setType('social')}
          className={`flex-1 py-2 text-meta font-bold uppercase border transition-colors active:scale-95 focus-ring ${
            type === 'social'
              ? 'border-acid-green text-acid-green bg-acid-green/10'
              : 'border-line text-fg-soft hover:border-muted-high hover:text-fg'
          }`}
        >
          Social
        </button>
      </div>

      {/* Wallet Input */}
      {type === 'wallet' && (
        <Field label="Wallet Address" error={walletError ?? undefined}>
          <AddressInput
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana address..."
          />
        </Field>
      )}

      {/* Social Input */}
      {type === 'social' && (
        <div className="flex flex-col gap-1">
          <SocialHandleInput
            provider={socialProvider}
            username={socialUsername}
            onProviderChange={setSocialProvider}
            onUsernameChange={setSocialUsername}
          />
          {socialError && (
            <p role="alert" className="text-meta text-error font-mono">{socialError}</p>
          )}
        </div>
      )}

      {/* Percentage */}
      <Field label="Fee Percentage" error={percentageError ?? undefined}>
        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={percentage}
          onChange={(e) => setPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          min="1"
          max="100"
          suffix="%"
          aria-label="Fee percentage"
        />
      </Field>

      {/* Submit */}
      <Button variant="primary" size="sm" fullWidth onClick={handleSubmit}>
        Add Claimer
      </Button>
    </div>
  );
}
