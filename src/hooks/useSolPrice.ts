import { SOL_PRICE } from '@/lib/constants';

interface UseSolPriceReturn {
    price: number;
    isLoading: boolean;
    error: string | null;
}

export function useSolPrice(): UseSolPriceReturn {
    return { price: SOL_PRICE, isLoading: false, error: null };
}

export function solToUsd(solAmount: number, solPrice: number = SOL_PRICE): number {
    return solAmount * solPrice;
}

export function usdToSol(usdAmount: number, solPrice: number = SOL_PRICE): number {
    return usdAmount / solPrice;
}

export default useSolPrice;
