import { useState, useCallback } from 'react';

// SOL price constant (per user spec: use 140)
// This can be updated to fetch from an API later if needed
const SOL_PRICE_CONSTANT = 140;

interface UseSolPriceReturn {
    price: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

/**
 * Hook to get the current SOL price
 * Currently returns a constant value (140) as per user specification
 * Can be extended to fetch live prices from CoinGecko or similar
 */
export function useSolPrice(): UseSolPriceReturn {
    const [price, setPrice] = useState(SOL_PRICE_CONSTANT);
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const refresh = useCallback(() => {
        // Currently just returns the constant
        // Could be extended to fetch from an API:
        // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        setPrice(SOL_PRICE_CONSTANT);
    }, []);

    return {
        price,
        isLoading,
        error,
        refresh,
    };
}

/**
 * Convert SOL amount to USD using current SOL price
 */
export function solToUsd(solAmount: number, solPrice: number = SOL_PRICE_CONSTANT): number {
    return solAmount * solPrice;
}

/**
 * Convert USD amount to SOL using current SOL price
 */
export function usdToSol(usdAmount: number, solPrice: number = SOL_PRICE_CONSTANT): number {
    return usdAmount / solPrice;
}

export default useSolPrice;
