'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useOmneraStore, type OmneraQuoteResult } from '@/store/omnera.store';

interface UseOmneraQuoteOptions {
  debounceMs?: number;
  autoRefreshMs?: number;
}

interface UseOmneraQuoteReturn {
  quote: OmneraQuoteResult | null;
  isLoading: boolean;
  error: string | null;
  fetchQuote: (mint: string, amount: number, action: 'buy' | 'sell') => void;
  clearQuote: () => void;
}

export function useOmneraQuote(options: UseOmneraQuoteOptions = {}): UseOmneraQuoteReturn {
  const { debounceMs = 500, autoRefreshMs = 15000 } = options;

  const [quote, setQuote] = useState<OmneraQuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const lastParams = useRef<{ mint: string; amount: number; action: string } | null>(null);
  const listenerAttached = useRef(false);

  const socket = useOmneraStore((s) => s.socket);
  const isConnected = useOmneraStore((s) => s.isConnected);

  // Attach quote_result listener
  useEffect(() => {
    if (!socket || listenerAttached.current) return;

    const handleQuoteResult = (data: {
      success: boolean;
      output_amount: number;
      output_display: number;
      price_per_token: number;
      error?: string;
    }) => {
      setIsLoading(false);
      if (data.success) {
        setQuote({
          success: true,
          outputAmount: data.output_amount,
          outputDisplay: data.output_display,
          pricePerToken: data.price_per_token,
          error: null,
        });
        setError(null);
      } else {
        setError(data.error || 'Quote failed');
        setQuote(null);
      }
    };

    socket.on('quote_result', handleQuoteResult);
    listenerAttached.current = true;

    return () => {
      socket.off('quote_result', handleQuoteResult);
      listenerAttached.current = false;
    };
  }, [socket]);

  const fetchQuoteImmediate = useCallback(
    (mint: string, amount: number, action: 'buy' | 'sell') => {
      if (!socket || !isConnected || amount <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      lastParams.current = { mint, amount, action };

      socket.emit('quote_request', {
        mint,
        amount,
        action,
      });
    },
    [socket, isConnected]
  );

  const fetchQuote = useCallback(
    (mint: string, amount: number, action: 'buy' | 'sell') => {
      if (amount <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchQuoteImmediate(mint, amount, action);
      }, debounceMs);
    },
    [fetchQuoteImmediate, debounceMs]
  );

  // Auto-refresh
  useEffect(() => {
    if (!quote || !lastParams.current || !autoRefreshMs) return;

    refreshTimer.current = setInterval(() => {
      if (lastParams.current) {
        const { mint, amount, action } = lastParams.current;
        fetchQuoteImmediate(mint, amount, action as 'buy' | 'sell');
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
