'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { bagsService } from '@/services/bags.service';
import type {
  BagsTokenCreator,
  BagsTokenCreatorWithStats,
  BagsTokenClaimEvent,
} from '@/lib/bags-types';

interface UseBagsFeesOptions {
  autoRefreshMs?: number;
  fetchClaimStats?: boolean;
  fetchClaimEvents?: boolean;
  claimEventsLimit?: number;
}

interface UseBagsFeesReturn {
  lifetimeFees: number;
  creators: BagsTokenCreator[];
  claimStats: BagsTokenCreatorWithStats[];
  claimEvents: BagsTokenClaimEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  hasFeeData: boolean;
}

export function useBagsFees(
  tokenMint: string | null,
  options: UseBagsFeesOptions = {}
): UseBagsFeesReturn {
  const {
    autoRefreshMs = 0,
    fetchClaimStats = false,
    fetchClaimEvents = false,
    claimEventsLimit = 50,
  } = options;

  const [lifetimeFees, setLifetimeFees] = useState<number>(0);
  const [creators, setCreators] = useState<BagsTokenCreator[]>([]);
  const [claimStats, setClaimStats] = useState<BagsTokenCreatorWithStats[]>([]);
  const [claimEvents, setClaimEvents] = useState<BagsTokenClaimEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!tokenMint) {
      setLifetimeFees(0);
      setCreators([]);
      setClaimStats([]);
      setClaimEvents([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Always fetch basic fee info
      const [fees, creatorsData] = await Promise.all([
        bagsService.getTokenLifetimeFees(tokenMint).catch(() => 0),
        bagsService.getTokenCreators(tokenMint).catch(() => []),
      ]);

      if (!mountedRef.current) return;

      setLifetimeFees(fees);
      setCreators(creatorsData);

      // Optionally fetch claim stats
      if (fetchClaimStats) {
        const stats = await bagsService.getTokenClaimStats(tokenMint).catch(() => []);
        if (mountedRef.current) setClaimStats(stats);
      }

      // Optionally fetch claim events
      if (fetchClaimEvents) {
        const events = await bagsService
          .getTokenClaimEvents(tokenMint, claimEventsLimit)
          .catch(() => []);
        if (mountedRef.current) setClaimEvents(events);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fee data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [tokenMint, fetchClaimStats, fetchClaimEvents, claimEventsLimit]);

  // Initial fetch and when tokenMint changes
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!tokenMint || !autoRefreshMs) return;

    refreshTimer.current = setInterval(() => {
      fetchData();
    }, autoRefreshMs);

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [tokenMint, autoRefreshMs, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    lifetimeFees,
    creators,
    claimStats,
    claimEvents,
    isLoading,
    error,
    refetch,
    hasFeeData: creators.length > 0 || lifetimeFees > 0,
  };
}

/**
 * Simplified hook for just checking if a token has Bags fee earners
 */
export function useHasBagsFees(tokenMint: string | null): {
  hasFees: boolean;
  isLoading: boolean;
} {
  const { hasFeeData, isLoading } = useBagsFees(tokenMint);
  return { hasFees: hasFeeData, isLoading };
}
