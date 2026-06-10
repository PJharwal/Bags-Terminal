"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { config } from "@/config/env";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";

interface PrepareRequest {
  token: string;
  phantom_address: string;
  wallet_address?: string;
  mint: string;
  sol_amount: number;
  slippage_bps?: number;
  pool_address?: string;
  pool_type?: string;
  quote_address?: string;
  creator_address?: string;
  coin_creator?: string;
  priority_fee?: number;
  jito_tip?: number;
  base_vault_address?: string;
  quote_vault_address?: string;
  token_standard?: string;
}

interface PrepareSellRequest {
  token: string;
  phantom_address: string;
  wallet_address?: string;
  mint: string;
  token_amount: number;
  slippage_bps?: number;
  pool_address?: string;
  pool_type?: string;
  quote_address?: string;
  creator_address?: string;
  coin_creator?: string;
  priority_fee?: number;
  jito_tip?: number;
  base_vault_address?: string;
  quote_vault_address?: string;
  token_standard?: string;
}

interface ExecuteRequest {
  token: string;
  phantom_address: string;
}

interface JitoTipData {
  landed_tips_25th_percentile: number;
  landed_tips_50th_percentile: number;
  landed_tips_75th_percentile: number;
  landed_tips_95th_percentile: number;
  landed_tips_99th_percentile: number;
  ema_landed_tips_50th_percentile: number;
  time: string;
}

interface TradeSocketState {
  isConnected: boolean;
  isPreparing: boolean;
  isReady: boolean;
  isExecuting: boolean;
  estimatedTokens: number | null;
  estimatedDisplay: number | null;
  pricePerToken: number | null;
  estimatedSol: number | null;
  estimatedSolDisplay: number | null;
  sellPricePerToken: number | null;
  lastSignature: string | null;
  tokensReceived: number | null;
  tokensDisplay: number | null;
  lastError: string | null;
  jitoTips: JitoTipData | null;
  preparedFor: { mint: string; amount: number } | null;
}

export function useTradeSocket() {
  const { phantomAddress, user } = useTurnkey();
  const socketRef = useRef<Socket | null>(null);
  const lastPrepareRef = useRef<{ mint: string; amount: number } | null>(null);

  const [state, setState] = useState<TradeSocketState>({
    isConnected: false,
    isPreparing: false,
    isReady: false,
    isExecuting: false,
    estimatedTokens: null,
    estimatedDisplay: null,
    pricePerToken: null,
    estimatedSol: null,
    estimatedSolDisplay: null,
    sellPricePerToken: null,
    lastSignature: null,
    tokensReceived: null,
    tokensDisplay: null,
    lastError: null,
    jitoTips: null,
    preparedFor: null,
  });

  const getToken = useCallback(() => {
    if (!phantomAddress) return null;
    return localStorage.getItem(`tk_token_${phantomAddress}`);
  }, [phantomAddress]);

  const connect = useCallback(() => {
    if (socketRef.current) return;
    if (!config.buysellServerUrl) return;

    const socket = io(config.buysellServerUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      setState((s) => ({ ...s, isConnected: true }));
    });

    socket.on("disconnect", () => {
      setState((s) => ({ ...s, isConnected: false, isReady: false, preparedFor: null }));
    });

    socket.on("prepare_result", (result: {
      success: boolean; estimated_tokens?: number; estimated_display?: number;
      price_per_token?: number; ready: boolean; error?: string;
    }) => {
      if (result.success) {
        setState((s) => ({
          ...s, isPreparing: false, isReady: result.ready,
          estimatedTokens: result.estimated_tokens ?? null,
          estimatedDisplay: result.estimated_display ?? null,
          pricePerToken: result.price_per_token ?? null,
          lastError: null,
          preparedFor: lastPrepareRef.current,
        }));
      } else {
        setState((s) => ({ ...s, isPreparing: false, isReady: false, lastError: result.error || "Prepare failed", preparedFor: null }));
      }
    });

    socket.on("prepare_sell_result", (result: {
      success: boolean; estimated_sol?: number; estimated_sol_display?: number;
      price_per_token?: number; ready: boolean; error?: string;
    }) => {
      if (result.success) {
        setState((s) => ({
          ...s, isPreparing: false, isReady: result.ready,
          estimatedSol: result.estimated_sol ?? null,
          estimatedSolDisplay: result.estimated_sol_display ?? null,
          sellPricePerToken: result.price_per_token ?? null,
          lastError: null,
          preparedFor: lastPrepareRef.current,
        }));
      } else {
        setState((s) => ({ ...s, isPreparing: false, isReady: false, lastError: result.error || "Prepare sell failed", preparedFor: null }));
      }
    });

    socket.on("execute_result", (result: {
      success: boolean; signature?: string; tokens_received?: number;
      tokens_display?: number; error?: string;
    }) => {
      if (result.success) {
        setState((s) => ({
          ...s, isExecuting: false, isReady: false,
          lastSignature: result.signature ?? null,
          tokensReceived: result.tokens_received ?? null,
          tokensDisplay: result.tokens_display ?? null,
          lastError: null,
          preparedFor: null,
        }));
      } else {
        setState((s) => ({ ...s, isExecuting: false, lastError: result.error || "Execute failed" }));
      }
    });

    socket.on("jito_tips", (data: JitoTipData) => setState((s) => ({ ...s, jitoTips: data })));

    socket.on("connect_error", (error) => {
      console.error("[TradeSocket] Connection error:", error.message);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const prepareBuy = useCallback((params: {
    mint: string; solAmount: number; slippageBps?: number;
    poolAddress?: string; poolType?: string; quoteAddress?: string;
    creatorAddress?: string; coinCreator?: string; priorityFee?: number; jitoTip?: number;
    baseVaultAddress?: string; quoteVaultAddress?: string; tokenStandard?: string;
  }): boolean => {
    const token = getToken();
    if (!token || !phantomAddress || !socketRef.current?.connected) return false;

    const solLamports = Math.floor(params.solAmount * 1_000_000_000);

    lastPrepareRef.current = { mint: params.mint, amount: params.solAmount };
    setState((s) => ({
      ...s, isPreparing: true, isReady: false, lastError: null,
      estimatedTokens: null, estimatedDisplay: null, preparedFor: null,
    }));

    const request: PrepareRequest = {
      token, phantom_address: phantomAddress,
      wallet_address: user?.activeWallet?.solanaAddress,
      mint: params.mint, sol_amount: solLamports,
      slippage_bps: params.slippageBps, pool_address: params.poolAddress,
      pool_type: params.poolType, quote_address: params.quoteAddress,
      creator_address: params.creatorAddress, coin_creator: params.coinCreator,
      priority_fee: params.priorityFee,
      jito_tip: params.jitoTip, base_vault_address: params.baseVaultAddress,
      quote_vault_address: params.quoteVaultAddress, token_standard: params.tokenStandard,
    };

    socketRef.current.emit("prepare_buy", request);
    return true;
  }, [getToken, phantomAddress, user]);

  const executeBuy = useCallback((): boolean => {
    const token = getToken();
    if (!token || !phantomAddress || !socketRef.current?.connected) return false;

    setState((s) => ({ ...s, isExecuting: true, lastError: null, lastSignature: null, tokensReceived: null }));
    socketRef.current.emit("execute_buy", { token, phantom_address: phantomAddress } as ExecuteRequest);
    return true;
  }, [getToken, phantomAddress]);

  const prepareSell = useCallback((params: {
    mint: string; tokenAmount: number; tokenDecimals?: number;
    slippageBps?: number; poolAddress?: string; poolType?: string;
    quoteAddress?: string; creatorAddress?: string; coinCreator?: string; priorityFee?: number;
    jitoTip?: number; baseVaultAddress?: string; quoteVaultAddress?: string;
    tokenStandard?: string;
  }): boolean => {
    const token = getToken();
    if (!token || !phantomAddress || !socketRef.current?.connected) return false;

    const decimals = params.tokenDecimals ?? 6;
    const tokenBaseUnits = Math.floor(params.tokenAmount * Math.pow(10, decimals));

    lastPrepareRef.current = { mint: params.mint, amount: params.tokenAmount };
    setState((s) => ({
      ...s, isPreparing: true, isReady: false, lastError: null,
      estimatedSol: null, estimatedSolDisplay: null, preparedFor: null,
    }));

    const request: PrepareSellRequest = {
      token, phantom_address: phantomAddress,
      wallet_address: user?.activeWallet?.solanaAddress,
      mint: params.mint, token_amount: tokenBaseUnits,
      slippage_bps: params.slippageBps, pool_address: params.poolAddress,
      pool_type: params.poolType, quote_address: params.quoteAddress,
      creator_address: params.creatorAddress, coin_creator: params.coinCreator,
      priority_fee: params.priorityFee,
      jito_tip: params.jitoTip, base_vault_address: params.baseVaultAddress,
      quote_vault_address: params.quoteVaultAddress, token_standard: params.tokenStandard,
    };

    socketRef.current.emit("prepare_sell", request);
    return true;
  }, [getToken, phantomAddress, user]);

  const executeSell = useCallback((): boolean => {
    const token = getToken();
    if (!token || !phantomAddress || !socketRef.current?.connected) return false;

    setState((s) => ({ ...s, isExecuting: true, lastError: null, lastSignature: null }));
    socketRef.current.emit("execute_sell", { token, phantom_address: phantomAddress } as ExecuteRequest);
    return true;
  }, [getToken, phantomAddress]);

  const instantBuy = useCallback((params: {
    mint: string; solAmount: number; slippageBps?: number;
    poolAddress?: string; poolType?: string; quoteAddress?: string;
    creatorAddress?: string; coinCreator?: string; priorityFee?: number; jitoTip?: number;
    baseVaultAddress?: string; quoteVaultAddress?: string; tokenStandard?: string;
  }): boolean => {
    const token = getToken();
    if (!token || !phantomAddress || !socketRef.current?.connected) return false;

    const solLamports = Math.floor(params.solAmount * 1_000_000_000);

    setState((s) => ({
      ...s, isExecuting: true, isPreparing: false, isReady: false,
      lastError: null, lastSignature: null, tokensReceived: null, preparedFor: null,
    }));

    socketRef.current.emit("instant_buy", {
      token, phantom_address: phantomAddress,
      wallet_address: user?.activeWallet?.solanaAddress,
      mint: params.mint, sol_amount: solLamports,
      slippage_bps: params.slippageBps, pool_address: params.poolAddress,
      pool_type: params.poolType, quote_address: params.quoteAddress,
      creator_address: params.creatorAddress, coin_creator: params.coinCreator,
      priority_fee: params.priorityFee,
      jito_tip: params.jitoTip, base_vault_address: params.baseVaultAddress,
      quote_vault_address: params.quoteVaultAddress, token_standard: params.tokenStandard,
    } as PrepareRequest);
    return true;
  }, [getToken, phantomAddress, user]);

  const instantSell = useCallback((params: {
    mint: string; tokenAmount: number; tokenDecimals?: number;
    slippageBps?: number; poolAddress?: string; poolType?: string;
    quoteAddress?: string; creatorAddress?: string; coinCreator?: string; priorityFee?: number;
    jitoTip?: number; baseVaultAddress?: string; quoteVaultAddress?: string;
    tokenStandard?: string;
  }): boolean => {
    const token = getToken();
    if (!token || !phantomAddress || !socketRef.current?.connected) return false;

    const decimals = params.tokenDecimals ?? 6;
    const tokenBaseUnits = Math.floor(params.tokenAmount * Math.pow(10, decimals));

    setState((s) => ({
      ...s, isExecuting: true, isPreparing: false, isReady: false,
      lastError: null, lastSignature: null, tokensReceived: null, preparedFor: null,
    }));

    socketRef.current.emit("instant_sell", {
      token, phantom_address: phantomAddress,
      wallet_address: user?.activeWallet?.solanaAddress,
      mint: params.mint, token_amount: tokenBaseUnits,
      slippage_bps: params.slippageBps, pool_address: params.poolAddress,
      pool_type: params.poolType, quote_address: params.quoteAddress,
      creator_address: params.creatorAddress, coin_creator: params.coinCreator,
      priority_fee: params.priorityFee,
      jito_tip: params.jitoTip, base_vault_address: params.baseVaultAddress,
      quote_vault_address: params.quoteVaultAddress, token_standard: params.tokenStandard,
    } as PrepareSellRequest);
    return true;
  }, [getToken, phantomAddress, user]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, lastError: null }));
  }, []);

  const resetPrepare = useCallback(() => {
    lastPrepareRef.current = null;
    setState((s) => ({
      ...s, isPreparing: false, isReady: false,
      estimatedTokens: null, estimatedDisplay: null, pricePerToken: null,
      estimatedSol: null, estimatedSolDisplay: null, sellPricePerToken: null,
      preparedFor: null,
    }));
  }, []);

  // Ping keep-alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) socketRef.current.emit("ping");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return {
    ...state,
    connect, disconnect,
    prepareBuy, executeBuy,
    prepareSell, executeSell,
    instantBuy, instantSell,
    clearError, resetPrepare,
  };
}
