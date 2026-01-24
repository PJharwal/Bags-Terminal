'use client';

import { useState } from 'react';
import { useLaunchStore } from '@/store/launch.store';
import { SocialHandleInput } from './SocialHandleInput';
import type { FeeClaimerType, SocialProvider } from '@/lib/bags-types';
import { X } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const validateSolanaAddress = (addr: string) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  };

  const handleSubmit = () => {
    setError(null);

    if (type === 'wallet') {
      if (!validateSolanaAddress(walletAddress)) {
        setError('Invalid Solana address');
        return;
      }
    } else {
      if (!socialUsername.trim()) {
        setError('Username is required');
        return;
      }
    }

    if (percentage <= 0 || percentage > 100) {
      setError('Percentage must be between 1 and 100');
      return;
    }

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
    <div className="flex flex-col gap-3 p-3 bg-[#0A0A0A] border border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest">Add Claimer</span>
        <button onClick={onClose} className="text-[#666] hover:text-[#EDEDED]">
          <X size={12} />
        </button>
      </div>

      {/* Type Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setType('wallet')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${
            type === 'wallet'
              ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
              : 'border-[#333] text-[#888] hover:border-[#666]'
          }`}
        >
          Wallet
        </button>
        <button
          onClick={() => setType('social')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${
            type === 'social'
              ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
              : 'border-[#333] text-[#888] hover:border-[#666]'
          }`}
        >
          Social
        </button>
      </div>

      {/* Wallet Input */}
      {type === 'wallet' && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[#666] uppercase tracking-widest">Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[11px] font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
            placeholder="Enter Solana address..."
          />
        </div>
      )}

      {/* Social Input */}
      {type === 'social' && (
        <SocialHandleInput
          provider={socialProvider}
          username={socialUsername}
          onProviderChange={setSocialProvider}
          onUsernameChange={setSocialUsername}
        />
      )}

      {/* Percentage */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Fee Percentage</label>
        <div className="relative">
          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
            min="1"
            max="100"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">%</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <span className="text-[9px] text-[#FF003C] font-mono">{error}</span>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="py-2 text-[10px] font-bold uppercase tracking-wider bg-[#39FF14] text-black hover:brightness-110 transition-all"
      >
        Add Claimer
      </button>
    </div>
  );
}
