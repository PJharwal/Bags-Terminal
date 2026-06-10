'use client';

import { useState, useEffect, useCallback } from 'react';
import { SOL_PRICE_FALLBACK, SOL_MINT_ADDRESS } from '@/lib/constants';

let cachedPrice = SOL_PRICE_FALLBACK;
let lastFetchTime = 0;
const CACHE_DURATION = 60_000;

async function fetchSolPrice(): Promise<number> {
    try {
        const now = Date.now();
        if (now - lastFetchTime < CACHE_DURATION && cachedPrice !== SOL_PRICE_FALLBACK) {
            return cachedPrice;
        }
        const res = await fetch(
            `https://api.jup.ag/price/v2?ids=${SOL_MINT_ADDRESS}`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return cachedPrice;
        const data = await res.json();
        const price = parseFloat(data?.data?.[SOL_MINT_ADDRESS]?.price);
        if (price && isFinite(price) && price > 0) {
            cachedPrice = price;
            lastFetchTime = now;
            return price;
        }
        return cachedPrice;
    } catch {
        return cachedPrice;
    }
}

export function useSolPrice() {
    const [price, setPrice] = useState(cachedPrice);
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        const p = await fetchSolPrice();
        setPrice(p);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, CACHE_DURATION);
        return () => clearInterval(interval);
    }, [refresh]);

    return { price, isLoading, isLive: cachedPrice !== SOL_PRICE_FALLBACK };
}

export const getSolPrice = () => cachedPrice;

export function solToUsd(solAmount: number, solPrice: number = cachedPrice): number {
    return solAmount * solPrice;
}

export function usdToSol(usdAmount: number, solPrice: number = cachedPrice): number {
    return usdAmount / solPrice;
}

export { fetchSolPrice };
export default useSolPrice;
