'use client';

import { useCreatorStore } from '@/store/creator.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { TokenStatsCard } from './TokenStatsCard';
import { EmptyState } from './EmptyState';
import { Loader2 } from 'lucide-react';
import type { SendTransactionFn } from '@/lib/bags-types';

export function MyTokensTab() {
  const { createdTokens, claimableEarnings, claimingToken, isLoading, claimFees } = useCreatorStore();
  const { publicKey, sendTransaction, connection } = useBagsWallet();

  const handleClaim = async (tokenMint: string) => {
    if (!publicKey || !sendTransaction) return;
    try {
      await claimFees(tokenMint, publicKey, sendTransaction as SendTransactionFn, connection);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="text-acid-green animate-spin" />
      </div>
    );
  }

  if (createdTokens.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {createdTokens.map((token) => {
        const claimInfo = claimableEarnings.find((e) => e.tokenMint === token.mint);
        return (
          <TokenStatsCard
            key={token.mint}
            token={token}
            claimable={claimInfo?.claimableAmount || 0}
            isClaiming={claimingToken === token.mint}
            onClaim={() => handleClaim(token.mint)}
          />
        );
      })}
    </div>
  );
}
