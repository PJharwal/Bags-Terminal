"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { config } from "@/config/env";

// ── Types ────────────────────────────────────────────────────────

export interface TradeStep {
  step: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  detail?: string;
  tx_signature?: string;
}

export interface CrossChainStatus {
  intent_id: string;
  steps: TradeStep[];
  current_step: string;
  error?: string;
}

export interface CrossChainResult {
  success: boolean;
  intent_id: string;
  result?: unknown;
  error?: string;
}

export interface CrossChainQuote {
  sol_amount: number;
  usdc_estimate: number;
  usdc_after_bridge: number;
  usdc_display: number;
  corridor: string;
  estimated_time_secs: number;
  error?: string;
}

export interface BuyParams {
  phantomAddress: string;
  solAmount: number;
  tokenId: string;
  outcome: string;
  price: number;
}

export interface SellParams {
  phantomAddress: string;
  tokenId: string;
  outcome: string;
  price: number;
  shares: number;
  slippagePct?: number;
}

export type TradeState =
  | "idle"
  | "connecting"
  | "executing"
  | "success"
  | "error";

const QUOTE_TIMEOUT_MS = 5_000;

// ── Hook ─────────────────────────────────────────────────────────

/**
 * Socket.IO cross-chain trade engine against omnera-polymarket.
 *
 * buy:  SOL → USDC → bridge → Polymarket CLOB order   (corridor "polymarket")
 * sell: CLOB order → bridge back → SOL                (corridor "polymarket_sell")
 * getQuote: SOL amount → estimated USDC               (crosschain_quote)
 *
 * Step progress streams in via `crosschain_status`; the final outcome lands
 * on `crosschain_result`.
 */
export function usePolymarketTrade() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<TradeState>("idle");
  const [steps, setSteps] = useState<TradeStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrossChainResult | null>(null);
  const [quote, setQuote] = useState<CrossChainQuote | null>(null);

  // Connect to Rust backend Socket.IO
  const getSocket = useCallback((): Socket => {
    if (socketRef.current?.connected) return socketRef.current;

    const socket = io(config.polyBackendUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socket.on("crosschain_status", (data: CrossChainStatus) => {
      setSteps(data.steps);
      setCurrentStep(data.current_step);
      if (data.error) {
        setError(data.error);
      }
    });

    socket.on("crosschain_result", (data: CrossChainResult) => {
      setResult(data);
      if (data.success) {
        setState("success");
      } else {
        setState("error");
        setError(data.error ?? "Trade failed");
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[Polymarket] Socket connect error:", err.message);
      setState("error");
      setError(`Cannot connect to trading server: ${err.message}`);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Reset state for new trade
  const reset = useCallback(() => {
    setState("idle");
    setSteps([]);
    setCurrentStep("");
    setError(null);
    setResult(null);
    setQuote(null);
  }, []);

  // ── Buy: SOL → USDC → Bridge → Polymarket order ───────────────

  const buy = useCallback(
    (params: BuyParams) => {
      reset();
      setState("connecting");

      const socket = getSocket();

      const emit = () => {
        setState("executing");
        socket.emit("crosschain_intent", {
          phantom_address: params.phantomAddress,
          sol_amount: params.solAmount,
          corridor: "polymarket",
          token_id: params.tokenId,
          outcome: params.outcome,
          price: params.price,
        });
      };

      if (socket.connected) {
        emit();
      } else {
        socket.once("connect", emit);
      }
    },
    [getSocket, reset],
  );

  // ── Sell: CLOB order → Bridge back → SOL ───────────────────────

  const sell = useCallback(
    (params: SellParams) => {
      reset();
      setState("connecting");

      const socket = getSocket();

      const emit = () => {
        setState("executing");
        socket.emit("crosschain_intent", {
          phantom_address: params.phantomAddress,
          corridor: "polymarket_sell",
          token_id: params.tokenId,
          outcome: params.outcome,
          price: params.price,
          shares: params.shares,
          slippage_pct: params.slippagePct ?? 5,
        });
      };

      if (socket.connected) {
        emit();
      } else {
        socket.once("connect", emit);
      }
    },
    [getSocket, reset],
  );

  // ── Quote: SOL amount → estimated USDC ─────────────────────────

  const getQuote = useCallback(
    (solAmount: number): Promise<CrossChainQuote | null> => {
      return new Promise((resolve) => {
        const socket = getSocket();

        const request = () => {
          const onResult = (data: CrossChainQuote) => {
            clearTimeout(timer);
            if (data?.error) {
              setQuote(null);
              resolve(null);
            } else {
              setQuote(data);
              resolve(data);
            }
          };
          // One-shot listener with a timeout so a silent backend can't leave
          // the UI waiting forever — resolves null on timeout.
          const timer = setTimeout(() => {
            socket.off("crosschain_quote_result", onResult);
            setQuote(null);
            resolve(null);
          }, QUOTE_TIMEOUT_MS);

          socket.once("crosschain_quote_result", onResult);
          socket.emit("crosschain_quote", {
            sol_amount: solAmount,
            corridor: "polymarket",
          });
        };

        if (socket.connected) {
          request();
        } else {
          socket.once("connect", request);
        }
      });
    },
    [getSocket],
  );

  return {
    state,
    steps,
    currentStep,
    error,
    result,
    quote,
    buy,
    sell,
    getQuote,
    reset,
  };
}
