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
        <Loader2 size={16} className="text-acid-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Partner Key Section */}
      <div className="p-4 card">
        <div className="flex items-center gap-2 mb-3">
          <Key size={14} className="text-[#00F0FF]" />
          <h3 className="text-meta font-bold text-fg uppercase tracking-widest">Partner Key</h3>
        </div>

        {partnerConfig ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-meta font-mono text-fg-soft bg-elevated px-3 py-2 border border-white/5 truncate">
                {partnerConfig.partnerKey}
              </code>
              <button
                onClick={copyPartnerKey}
                className="p-2 border border-white/10 hover:border-[#39FF14] transition-colors"
              >
                {copied ? (
                  <CheckCircle2 size={12} className="text-acid-green" />
                ) : (
                  <Copy size={12} className="text-fg-soft" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-elevated border border-white/5">
                <span className="text-meta text-muted-high uppercase tracking-widest block">Total Earned</span>
                <span className="text-sm font-mono text-acid-green">
                  {partnerConfig.totalFeesEarned.toFixed(4)} SOL
                </span>
              </div>
              <div className="p-2 bg-elevated border border-white/5">
                <span className="text-meta text-muted-high uppercase tracking-widest block">Tokens</span>
                <span className="text-sm font-mono text-fg">{partnerConfig.tokenCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-meta text-fg-soft font-mono text-center">
              Create a partner key to receive fees from multiple token launches.
              Share your key with creators to earn from their launches.
            </p>
            <button
              onClick={handleCreatePartner}
              disabled={isCreating || !connected}
              className="flex items-center gap-2 px-4 py-2 text-meta font-bold uppercase tracking-wider bg-[#00F0FF] text-black hover:brightness-110 transition-all disabled:opacity-50"
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
        <div className="p-4 card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-gold" />
              <h3 className="text-meta font-bold text-fg uppercase tracking-widest">Partner Earnings</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 bg-elevated border border-white/5">
              <span className="text-meta text-muted-high uppercase tracking-widest block">Claimable</span>
              <span className="text-sm font-mono text-gold font-bold">
                {partnerClaimable.claimableAmount.toFixed(4)} SOL
              </span>
            </div>
            <div className="p-2 bg-elevated border border-white/5">
              <span className="text-meta text-muted-high uppercase tracking-widest block">Total Earned</span>
              <span className="text-sm font-mono text-acid-green">
                {partnerClaimable.totalEarned.toFixed(4)} SOL
              </span>
            </div>
            <div className="p-2 bg-elevated border border-white/5">
              <span className="text-meta text-muted-high uppercase tracking-widest block">Claimed</span>
              <span className="text-sm font-mono text-fg">
                {partnerClaimable.totalClaimed.toFixed(4)} SOL
              </span>
            </div>
          </div>

          {partnerClaimable.claimableAmount > 0 && (
            <button
              onClick={handleClaimPartner}
              disabled={isClaiming}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-meta font-bold uppercase tracking-wider bg-[#FFD700] text-black hover:brightness-110 transition-all disabled:opacity-50"
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
        <div className="p-4 card">
          <h3 className="text-meta font-bold text-fg uppercase tracking-widest mb-3">
            Fee Share Overview
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-elevated border border-white/5">
              <span className="text-meta text-muted-high uppercase tracking-widest block">Total Earned</span>
              <span className="text-sm font-mono text-acid-green">
                {feeShareWalletInfo.totalEarned.toFixed(4)} SOL
              </span>
            </div>
            <div className="p-2 bg-elevated border border-white/5">
              <span className="text-meta text-muted-high uppercase tracking-widest block">Total Claimed</span>
              <span className="text-sm font-mono text-fg">
                {feeShareWalletInfo.totalClaimed.toFixed(4)} SOL
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {feeShareWalletInfo.tokens.map((token) => (
              <div key={token.tokenMint} className="flex items-center justify-between p-2 bg-elevated border border-white/5">
                <div className="flex items-center gap-2">
                  {token.tokenImage && (
                    <img src={token.tokenImage} alt={token.tokenSymbol} className="w-5 h-5 rounded-full" />
                  )}
                  <span className="text-meta font-mono text-fg">{token.tokenSymbol}</span>
                  <span className="text-meta font-mono text-muted-high">
                    {(token.royaltyBps / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-meta font-mono text-gold">
                    {token.claimableAmount.toFixed(4)} SOL
                  </span>
                  <a
                    href={`/terminal/${token.tokenMint}`}
                    className="text-muted-high hover:text-acid-green transition-colors"
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
          <span className="text-meta text-error font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}
