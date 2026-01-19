import { useState, useCallback } from 'react';
import { gmgnService, fetchTerminalTokenData } from '@/services/gmgn.service';
import type { GMGNTokenInfo, GMGNHolder, GMGNTrader, GMGNSecurityData, GMGNTokenStats } from '@/services/gmgn.service';

interface TokenData {
    info: GMGNTokenInfo | null;
    stats: GMGNTokenStats | null;
    security: { security: GMGNSecurityData } | null;
    holders: GMGNHolder[];
    traders: GMGNTrader[];
}

interface UseTokenDataReturn {
    data: TokenData | null;
    isLoading: boolean;
    error: string | null;
    fetchToken: (address: string) => Promise<void>;
    clear: () => void;
}

/**
 * Hook for fetching comprehensive token data from GMGN
 * Provides loading states and error handling
 */
export function useTokenData(): UseTokenDataReturn {
    const [data, setData] = useState<TokenData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async (address: string) => {
        if (!address.trim()) {
            setError('Token address is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await fetchTerminalTokenData(address);

            if (!result.tokenInfo) {
                throw new Error('Failed to fetch token info');
            }

            setData({
                info: result.tokenInfo.info || null,
                stats: result.tokenInfo.stats || null,
                security: result.security,
                holders: result.holders,
                traders: result.traders,
            });
        } catch (err) {
            console.error('Failed to fetch token data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch token data');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clear = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return {
        data,
        isLoading,
        error,
        fetchToken,
        clear,
    };
}

/**
 * Hook for fetching just token info (lighter weight)
 */
export function useTokenInfo(address: string | null) {
    const [info, setInfo] = useState<GMGNTokenInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await gmgnService.getTokenInfo(address);
            setInfo(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    return {
        info,
        isLoading,
        error,
        fetch,
    };
}

/**
 * Hook for fetching token holders
 */
export function useTokenHolders(address: string | null, limit = 50) {
    const [holders, setHolders] = useState<GMGNHolder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await gmgnService.getTokenHolders(address, limit);
            setHolders(data?.list || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setIsLoading(false);
        }
    }, [address, limit]);

    return {
        holders,
        isLoading,
        error,
        fetch,
    };
}

/**
 * Hook for fetching token traders
 */
export function useTokenTraders(address: string | null, limit = 50) {
    const [traders, setTraders] = useState<GMGNTrader[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await gmgnService.getTokenTraders(address, limit);
            setTraders(data?.list || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setIsLoading(false);
        }
    }, [address, limit]);

    return {
        traders,
        isLoading,
        error,
        fetch,
    };
}

export default useTokenData;
