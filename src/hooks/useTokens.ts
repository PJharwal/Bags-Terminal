'use client';

import { usePulseStore } from '@/store/pulse.store';
import { type Token, type TokenStatus } from '@/types';
import { useEffect, useTransition } from 'react';
import { SOL_PRICE_FALLBACK } from '@/lib/constants';

/**
 * Hook to access token data from the Zustand pulse store and map it
 * reactively to the Token interface expected by the Axiom Pulse UI.
 */
export const useTokens = (status: TokenStatus) => {
  const loadInitialData = usePulseStore((state) => state.loadInitialData);
  const items = usePulseStore((state) => state.items);
  const isInitialLoading = usePulseStore((state) => state.isInitialLoading);

  // Load initial trending data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Map TokenStatus ('new' | 'finalStretch' | 'migrated') to Zustand PulseState ('NEW' | 'FINAL_STRETCH' | 'MIGRATED')
  const statusMap: Record<TokenStatus, 'NEW' | 'FINAL_STRETCH' | 'MIGRATED'> = {
    new: 'NEW',
    finalStretch: 'FINAL_STRETCH',
    migrated: 'MIGRATED',
  };

  const pulseState = statusMap[status];
  const pulseItems = items[pulseState] || [];

  // Map PulseItem to Token
  const mappedTokens: Token[] = pulseItems.map((item) => {
    // Generate safety score and metrics based on risk flags
    const insiderFlag = item.riskFlags?.find((f) => f.type === 'INSIDER_CLUSTER');
    const smartTradersCount = insiderFlag ? (insiderFlag.severity === 'critical' ? 6 : 3) : 0;
    const snipersCount = item.riskFlags?.some((f) => f.type === 'DEV_SELL') ? 2 : 0;
    const insidersCount = insiderFlag ? 4 : 0;
    const freshTradersCount = item.holders > 10 ? Math.floor(item.holders * 0.15) : 0;

    const auditScore = Math.max(
      40,
      100 - (item.riskFlags?.length * 20 || 0)
    );

    return {
      id: item.tokenId,
      address: item.tokenId,
      name: item.name || 'Unknown',
      symbol: item.symbol.replace(/^\$/, ''), // Remove leading $
      imageUrl: item.logoUrl || '/solana.png',
      logoUrl: item.logoUrl,
      marketCap: item.marketCap,
      volume24h: item.volume24h || 0,
      txCount: item.txCount || 0,
      priceInSol: item.marketCap / SOL_PRICE_FALLBACK / 1_000_000_000,
      priceChange24h: 0,
      priceChange1h: 0,
      priceChange5m: 0,
      bondingCurveProgress: item.bondingProgress,
      createdAt: Date.now() - (item.ageSeconds * 1000),
      socials: {},
      safety: {
        isVerified: auditScore > 70,
        auditScore,
        liquidityLocked: item.state === 'MIGRATED',
        contractRenounced: true,
      },
      status,
      holdersCount: item.holders || 0,
      smartTradersCount,
      snipersCount,
      insidersCount,
      freshTradersCount,
      liquidity: item.liquidity || (item.marketCap * 0.3),
      deployer: item.deployer,
      source: item.protocolSource || 'pumpfun',
      exchangeName: item.protocolSource === 'pumpfun' ? 'PumpFun' : 'Raydium',
      exchangeLogo: item.protocolSource === 'pumpfun' ? '/icons/pump-small.svg' : '/icons/sol-fill.svg',
    };
  });

  return {
    data: mappedTokens,
    isLoading: isInitialLoading && mappedTokens.length === 0,
    error: null,
  };
};
