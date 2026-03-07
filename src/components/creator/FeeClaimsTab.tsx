'use client';

import { useCreatorStore } from '@/store/creator.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { Loader2 } from 'lucide-react';
import type { SendTransactionFn } from '@/lib/bags-types';
import { BagsLogo } from '@/components/ui/BagsLogo';

export function FeeClaimsTab() {
  const { claimableEarnings, claimingToken, claimFees } = useCreatorStore();
  const { publicKey, sendTransaction, connection } = useBagsWallet();

  const totalEarned = claimableEarnings.reduce((sum, e) => sum + e.totalEarned, 0);
  const totalClaimed = claimableEarnings.reduce((sum, e) => sum + e.totalClaimed, 0);
  const totalPending = claimableEarnings.reduce((sum, e) => sum + e.claimableAmount, 0);

  const handleClaim = async (tokenMint: string) => {
    if (!publicKey || !sendTransaction) return;
    try {
      await claimFees(tokenMint, publicKey, sendTransaction as SendTransactionFn, connection);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  const handleClaimAll = async () => {
    if (!publicKey || !sendTransaction) return;
    for (const earning of claimableEarnings.filter(e => e.claimableAmount > 0)) {
      try {
        await claimFees(earning.tokenMint, publicKey, sendTransaction as SendTransactionFn, connection);
      } catch (err) {
        console.error(`Claim failed for ${earning.tokenMint}:`, err);
        break;
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card flex flex-col gap-1 p-3">
          <span className="label flex items-center gap-1" style={{ fontSize: '8px' }}>
            <BagsLogo size={10} /> Total Earned
          </span>
          <span className="text-sm font-mono text-[#EDEDED] font-bold">{totalEarned.toFixed(4)} SOL</span>
        </div>
        <div className="stat-card flex flex-col gap-1 p-3">
          <span className="label" style={{ fontSize: '8px' }}>Total Claimed</span>
          <span className="text-sm font-mono text-[#EDEDED] font-bold">{totalClaimed.toFixed(4)} SOL</span>
        </div>
        <div className="stat-card flex flex-col gap-1 p-3">
          <span className="label" style={{ fontSize: '8px' }}>Pending</span>
          <span className="text-sm font-mono text-[#39FF14] font-bold">{totalPending.toFixed(4)} SOL</span>
        </div>
      </div>

      {/* Bulk Claim */}
      {totalPending > 0 && (
        <button
          onClick={handleClaimAll}
          disabled={!!claimingToken}
          className="btn-primary w-full py-3 text-[11px]"
        >
          {claimingToken ? 'Claiming...' : `Claim All (${totalPending.toFixed(4)} SOL)`}
        </button>
      )}

      {/* Claimable Positions */}
      <div className="flex flex-col gap-2">
        {claimableEarnings.map((earning) => (
          <div
            key={earning.tokenMint}
            className="card flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-3">
              {earning.tokenImage && (
                <img src={earning.tokenImage} alt={earning.tokenSymbol} className="w-8 h-8 border border-white/10" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-mono text-[#EDEDED] font-bold">{earning.tokenSymbol}</span>
                <span className="label" style={{ fontSize: '9px' }}>
                  Earned: {earning.totalEarned.toFixed(4)} SOL
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#39FF14] font-bold">
                {earning.claimableAmount.toFixed(4)} SOL
              </span>
              <button
                onClick={() => handleClaim(earning.tokenMint)}
                disabled={earning.claimableAmount <= 0 || claimingToken === earning.tokenMint}
                className="btn-primary px-3 py-1.5 text-[9px]"
              >
                {claimingToken === earning.tokenMint ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  'Claim'
                )}
              </button>
            </div>
          </div>
        ))}

        {claimableEarnings.length === 0 && (
          <p className="text-center text-[10px] text-[#666] font-mono py-8">
            No claimable fees yet.
          </p>
        )}
      </div>
    </div>
  );
}
