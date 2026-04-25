'use client';

import { useState, useEffect } from 'react';
import { bagsService } from '@/services/bags.service';
import type { BagsTokenCreator } from '@/lib/bags-types';

export interface ExtendedFeeData {
  lifetimeFees: number;
  creatorsCount: number;
  creators: BagsTokenCreator[];
  topEarnerShare: number;
}

export function useFeeData(
  tokenId: string | undefined,
  onFeeDataLoaded?: (tokenId: string, hasFees: boolean) => void
) {
  const [feeData, setFeeData] = useState<ExtendedFeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!tokenId) return;
    let mounted = true;

    /* eslint-disable react-hooks/set-state-in-effect -- effect synchronizes loading state to an async fetch lifecycle (external system). */
    setIsLoading(true);
    setError(false);
    /* eslint-enable react-hooks/set-state-in-effect */

    bagsService.getTokenFeeInfo(tokenId)
      .then((info) => {
        if (mounted && info) {
          const topEarner = info.creators.length > 0
            ? Math.max(...info.creators.map(c => c.royaltyBps)) / 100
            : 0;
          setFeeData({
            lifetimeFees: info.lifetimeFees,
            creatorsCount: info.creators.length,
            creators: info.creators,
            topEarnerShare: topEarner,
          });
          onFeeDataLoaded?.(tokenId, info.lifetimeFees > 0 || info.creators.length > 0);
        } else {
          onFeeDataLoaded?.(tokenId, false);
        }
      })
      .catch(() => {
        if (mounted) setError(true);
        onFeeDataLoaded?.(tokenId, false);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [tokenId]);

  return { feeData, isLoading, error };
}
