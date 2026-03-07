import { useState, useEffect, useCallback, useRef } from 'react';

const COINGECKO_URL =
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
const DEFAULT_REFRESH_MS = 60_000; // 60 seconds
const FALLBACK_PRICE = 140;

interface UseSolPriceReturn {
    price: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

/**
 * Hook to get the current SOL price from CoinGecko.
 * Auto-refreshes every {@link autoRefreshMs} (default 60 s).
 * Falls back to a constant if the fetch fails.
 */
export function useSolPrice(
    autoRefreshMs: number = DEFAULT_REFRESH_MS,
): UseSolPriceReturn {
    const [price, setPrice] = useState(FALLBACK_PRICE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const fetchPrice = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(COINGECKO_URL);
            if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
            const data = await res.json();
            const usd = data?.solana?.usd;
            if (typeof usd !== 'number') throw new Error('Invalid price data');
            if (mountedRef.current) {
                setPrice(usd);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to fetch SOL price');
                // keep last known price (or fallback)
            }
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchPrice();

        const id =
            autoRefreshMs > 0
                ? setInterval(fetchPrice, autoRefreshMs)
                : undefined;

        return () => {
            mountedRef.current = false;
            if (id) clearInterval(id);
        };
    }, [fetchPrice, autoRefreshMs]);

    return { price, isLoading, error, refresh: fetchPrice };
}

/**
 * Convert SOL amount to USD using current SOL price
 */
export function solToUsd(solAmount: number, solPrice: number = FALLBACK_PRICE): number {
    return solAmount * solPrice;
}

/**
 * Convert USD amount to SOL using current SOL price
 */
export function usdToSol(usdAmount: number, solPrice: number = FALLBACK_PRICE): number {
    return usdAmount / solPrice;
}

export default useSolPrice;
