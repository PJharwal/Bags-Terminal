'use client';

import { useState } from 'react';
import { useCreatorStore } from '@/store/creator.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { Key, Copy, CheckCircle2, Loader2, Coins, ExternalLink } from 'lucide-react';
import type { SendTransactionFn } from '@/lib/bags-types';

export function PartnerConfigTab() {
  const { connected, publicKey, sendTransaction, connection } = useBagsWallet();
  const {
    partnerConfig,
    partnerClaimable,
    isLoadingPartner,
    createPartnerConfig,
    claimPartnerFees,
    feeShareWalletInfo,
  } = useCreatorStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePartner = async () => {
    if (!publicKey) return;
    setIsCreating(true);
    setError(null);
    try {
      await createPartnerConfig(publicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create partner config');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClaimPartner = async () => {
    if (!publicKey || !partnerConfig?.partnerKey || !sendTransaction) return;
    setIsClaiming(true);
    setError(null);
    try {
      await claimPartnerFees(
        partnerConfig.partnerKey,
        publicKey,
        sendTransaction as SendTransactionFn,
        connection
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim partner fees');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyPartnerKey = async () => {
    if (partnerConfig?.partnerKey) {
      await navigator.clipboard.writeText(partnerConfig.partnerKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoadingPartner) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={16} className="text-[#39FF14] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Partner Key Section */}
      <div className="p-4 bg-[#0A0A0A] border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Key size={14} className="text-[#00F0FF]" />
          <h3 className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest">Partner Key</h3>
        </div>

        {partnerConfig ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] font-mono text-[#888] bg-[#1A1A1A] px-3 py-2 border border-white/5 truncate">
                {partnerConfig.partnerKey}
              </code>
              <button
                onClick={copyPartnerKey}
                className="p-2 border border-white/10 hover:border-[#39FF14] transition-colors"
              >
                {copied ? (
                  <CheckCircle2 size={12} className="text-[#39FF14]" />
                ) : (
                  <Copy size={12} className="text-[#888]" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#1A1A1A] border border-white/5">
                <span className="text-[8px] text-[#666] uppercase tracking-widest block">Total Earned</span>
                <span className="text-sm font-mono text-[#39FF14]">
                  {partnerConfig.totalFeesEarned.toFixed(4)} SOL
                </span>
              </div>
              <div className="p-2 bg-[#1A1A1A] border border-white/5">
                <span className="text-[8px] text-[#666] uppercase tracking-widest block">Tokens</span>
                <span className="text-sm font-mono text-[#EDEDED]">{partnerConfig.tokenCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-[10px] text-[#888] font-mono text-center">
              Create a partner key to receive fees from multiple token launches.
              Share your key with creators to earn from their launches.
            </p>
            <button
              onClick={handleCreatePartner}
              disabled={isCreating || !connected}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#00F0FF] text-black hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Key size={12} />
              )}
              Create Partner Key
            </button>
          </div>
        )}
      </div>

      {/* Partner Claimable Fees */}
      {partnerConfig && partnerClaimable && (
        <div className="p-4 bg-[#0A0A0A] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-[#FFD700]" />
              <h3 className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest">Partner Earnings</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 bg-[#1A1A1A] border border-white/5">
              <span className="text-[8px] text-[#666] uppercase tracking-widest block">Claimable</span>
              <span className="text-sm font-mono text-[#FFD700] font-bold">
                {partnerClaimable.claimableAmount.toFixed(4)} SOL
              </span>
            </div>
            <div className="p-2 bg-[#1A1A1A] border border-white/5">
              <span className="text-[8px] text-[#666] uppercase tracking-widest block">Total Earned</span>
              <span className="text-sm font-mono text-[#39FF14]">
                {partnerClaimable.totalEarned.toFixed(4)} SOL
              </span>
            </div>
            <div className="p-2 bg-[#1A1A1A] border border-white/5">
              <span className="text-[8px] text-[#666] uppercase tracking-widest block">Claimed</span>
              <span className="text-sm font-mono text-[#EDEDED]">
                {partnerClaimable.totalClaimed.toFixed(4)} SOL
              </span>
            </div>
          </div>

          {partnerClaimable.claimableAmount > 0 && (
            <button
              onClick={handleClaimPartner}
              disabled={isClaiming}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider bg-[#FFD700] text-black hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isClaiming ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Coins size={12} />
              )}
              Claim Partner Fees
            </button>
          )}
        </div>
      )}

      {/* Fee Share Wallet v2 Info */}
      {feeShareWalletInfo && feeShareWalletInfo.tokens.length > 0 && (
        <div className="p-4 bg-[#0A0A0A] border border-white/10">
          <h3 className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest mb-3">
            Fee Share Overview
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-[#1A1A1A] border border-white/5">
              <span className="text-[8px] text-[#666] uppercase tracking-widest block">Total Earned</span>
              <span className="text-sm font-mono text-[#39FF14]">
                {feeShareWalletInfo.totalEarned.toFixed(4)} SOL
              </span>
            </div>
            <div className="p-2 bg-[#1A1A1A] border border-white/5">
              <span className="text-[8px] text-[#666] uppercase tracking-widest block">Total Claimed</span>
              <span className="text-sm font-mono text-[#EDEDED]">
                {feeShareWalletInfo.totalClaimed.toFixed(4)} SOL
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {feeShareWalletInfo.tokens.map((token) => (
              <div key={token.tokenMint} className="flex items-center justify-between p-2 bg-[#1A1A1A] border border-white/5">
                <div className="flex items-center gap-2">
                  {token.tokenImage && (
                    <img src={token.tokenImage} alt={token.tokenSymbol} className="w-5 h-5 rounded-full" />
                  )}
                  <span className="text-[10px] font-mono text-[#EDEDED]">{token.tokenSymbol}</span>
                  <span className="text-[8px] font-mono text-[#666]">
                    {(token.royaltyBps / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#FFD700]">
                    {token.claimableAmount.toFixed(4)} SOL
                  </span>
                  <a
                    href={`/terminal/${token.tokenMint}`}
                    className="text-[#666] hover:text-[#39FF14] transition-colors"
                  >
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-[#FF003C]/10 border border-[#FF003C]/30">
          <span className="text-[9px] text-[#FF003C] font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}
