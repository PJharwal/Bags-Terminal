'use client';

import { useCallback } from 'react';
import { useOmneraStore } from '@/store/omnera.store';
import { useTerminalStore } from '@/store/terminal.store';
import { useTurnkey } from '@/components/turnkey/TurnkeyProvider';

interface PrepareBuyOptions {
  slippageBps?: number;
  poolAddress?: string;
  poolType?: string;
  creatorAddress?: string;
  priorityFee?: number;
  jitoTip?: number;
  baseVaultAddress?: string;
  quoteVaultAddress?: string;
  tokenStandard?: string;
}

interface PrepareSellOptions {
  slippageBps?: number;
  poolAddress?: string;
  poolType?: string;
  creatorAddress?: string;
  priorityFee?: number;
  jitoTip?: number;
  baseVaultAddress?: string;
  quoteVaultAddress?: string;
  tokenStandard?: string;
}

export function useOmneraTrade() {
  const socket = useOmneraStore((s) => s.socket);
  const isConnected = useOmneraStore((s) => s.isConnected);
  const tradeState = useOmneraStore((s) => s.tradeState);
  const estimate = useOmneraStore((s) => s.estimate);
  const estimateSell = useOmneraStore((s) => s.estimateSell);
  const executeResult = useOmneraStore((s) => s.executeResult);
  const tradeError = useOmneraStore((s) => s.tradeError);
  const jitoTipData = useOmneraStore((s) => s.jitoTipData);

  const setTradeState = useOmneraStore((s) => s.setTradeState);
  const setTradeError = useOmneraStore((s) => s.setTradeError);
  const resetTrade = useOmneraStore((s) => s.resetTrade);

  // Auth comes from TurnkeyProvider (single source of truth)
  const { phantomAddress, turnkeyAddress, isAuthenticated, createWallet } = useTurnkey();

  // Get JWT from TurnkeyProvider's localStorage
  const getToken = useCallback(() => {
    if (!phantomAddress) return null;
    try {
      return localStorage.getItem(`tk_token_${phantomAddress}`);
    } catch {
      return null;
    }
  }, [phantomAddress]);

  // Ensure auth is ready — TurnkeyProvider auto-creates, but we can force it
  const ensureAuth = useCallback(async () => {
    if (isAuthenticated && getToken()) return true;
    if (!phantomAddress) return false;
    const result = await createWallet();
    return result.success;
  }, [isAuthenticated, phantomAddress, getToken, createWallet]);

  // Prepare buy (step 1 of two-step flow)
  const prepareBuy = useCallback(
    (mint: string, solAmountLamports: number, opts: PrepareBuyOptions = {}) => {
      const token = getToken();
      if (!socket || !isConnected || !token || !phantomAddress) {
        setTradeError('Not connected or not authenticated');
        return;
      }

      setTradeState('preparing');
      setTradeError(null);

      const { slippageBps, priorityFee, jitoTip: terminalJitoTip } = useTerminalStore.getState();

      socket.emit('prepare_buy', {
        token,
        phantom_address: phantomAddress,
        wallet_address: turnkeyAddress || undefined,
        mint,
        sol_amount: solAmountLamports,
        slippage_bps: opts.slippageBps ?? slippageBps,
        pool_address: opts.poolAddress,
        pool_type: opts.poolType,
        creator_address: opts.creatorAddress,
        priority_fee: opts.priorityFee ?? (priorityFee > 0 ? priorityFee : undefined),
        jito_tip: opts.jitoTip ?? (terminalJitoTip > 0 ? terminalJitoTip : undefined),
        base_vault_address: opts.baseVaultAddress,
        quote_vault_address: opts.quoteVaultAddress,
        token_standard: opts.tokenStandard,
      });
    },
    [socket, isConnected, phantomAddress, turnkeyAddress, getToken, setTradeState, setTradeError]
  );

  // Prepare sell (step 1 of two-step flow)
  const prepareSell = useCallback(
    (mint: string, tokenAmount: number, opts: PrepareSellOptions = {}) => {
      const token = getToken();
      if (!socket || !isConnected || !token || !phantomAddress) {
        setTradeError('Not connected or not authenticated');
        return;
      }

      setTradeState('preparing');
      setTradeError(null);

      const { slippageBps, priorityFee, jitoTip: terminalJitoTip } = useTerminalStore.getState();

      socket.emit('prepare_sell', {
        token,
        phantom_address: phantomAddress,
        wallet_address: turnkeyAddress || undefined,
        mint,
        token_amount: tokenAmount,
        slippage_bps: opts.slippageBps ?? slippageBps,
        pool_address: opts.poolAddress,
        pool_type: opts.poolType,
        creator_address: opts.creatorAddress,
        priority_fee: opts.priorityFee ?? (priorityFee > 0 ? priorityFee : undefined),
        jito_tip: opts.jitoTip ?? (terminalJitoTip > 0 ? terminalJitoTip : undefined),
        base_vault_address: opts.baseVaultAddress,
        quote_vault_address: opts.quoteVaultAddress,
        token_standard: opts.tokenStandard,
      });
    },
    [socket, isConnected, phantomAddress, turnkeyAddress, getToken, setTradeState, setTradeError]
  );

  // Execute buy (step 2 — broadcasts pre-signed TX)
  const executeBuy = useCallback(() => {
    const token = getToken();
    if (!socket || !isConnected || !token || !phantomAddress) {
      setTradeError('Not connected or not authenticated');
      return;
    }

    setTradeState('executing');

    socket.emit('execute_buy', {
      token,
      phantom_address: phantomAddress,
    });
  }, [socket, isConnected, phantomAddress, getToken, setTradeState, setTradeError]);

  // Execute sell (step 2 — broadcasts pre-signed TX)
  const executeSell = useCallback(() => {
    const token = getToken();
    if (!socket || !isConnected || !token || !phantomAddress) {
      setTradeError('Not connected or not authenticated');
      return;
    }

    setTradeState('executing');

    socket.emit('execute_sell', {
      token,
      phantom_address: phantomAddress,
    });
  }, [socket, isConnected, phantomAddress, getToken, setTradeState, setTradeError]);

  // Reset trade state
  const reset = useCallback(() => {
    resetTrade();
  }, [resetTrade]);

  return {
    // State
    tradeState,
    estimate,
    estimateSell,
    executeResult,
    tradeError,
    jitoTipData,
    isConnected,
    isAuthenticated: isAuthenticated && !!getToken(),

    // Actions
    ensureAuth,
    prepareBuy,
    prepareSell,
    executeBuy,
    executeSell,
    reset,
  };
}
