'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { bagsService } from '@/services/bags.service';
import type { SwapQuote, SwapParams } from '@/lib/bags-types';

interface UseSwapQuoteOptions {
  debounceMs?: number;
  autoRefreshMs?: number;
}

interface UseSwapQuoteReturn {
  quote: SwapQuote | null;
  isLoading: boolean;
  error: string | null;
  fetchQuote: (params: SwapParams) => Promise<void>;
  clearQuote: () => void;
}

export function useSwapQuote(options: UseSwapQuoteOptions = {}): UseSwapQuoteReturn {
  const { debounceMs = 500, autoRefreshMs = 15000 } = options;

  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const lastParams = useRef<SwapParams | null>(null);

  const fetchQuoteImmediate = useCallback(async (params: SwapParams) => {
    if (params.amount <= 0) {
      setQuote(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await bagsService.getSwapQuote(params);
      setQuote(result);
      lastParams.current = params;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchQuote = useCallback(
    async (params: SwapParams) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchQuoteImmediate(params);
      }, debounceMs);
    },
    [fetchQuoteImmediate, debounceMs]
  );

  // Auto-refresh quote
  useEffect(() => {
    if (!quote || !lastParams.current || !autoRefreshMs) return;

    refreshTimer.current = setInterval(() => {
      if (lastParams.current) {
        fetchQuoteImmediate(lastParams.current);
      }
    }, autoRefreshMs);

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [quote, autoRefreshMs, fetchQuoteImmediate]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
    lastParams.current = null;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  return { quote, isLoading, error, fetchQuote, clearQuote };
}
