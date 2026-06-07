"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Connection } from "@solana/web3.js";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTradeSocket } from "@/hooks/useTradeSocket";
import { fetchPoolHint } from "@/lib/poolHint";
import { confirmSignature } from "@/lib/confirmTx";
import { toast } from "@/components/ui/Toast";
import { useLoadoutStore } from "@/store/loadout.store";
import { config } from "@/config/env";

// Headroom over the buy amount to cover tx fee + ATA rent (~0.002) + priority
// fee + Jito tip, so the funding check won't approve a buy that can't pay fees.
const FEE_HEADROOM_SOL = 0.012;
const CONFIRM_TIMEOUT_MS = 30_000;

interface QuickBuyContextValue {
  quickBuy: (mint: string, solAmount: number, symbol?: string) => void;
  // Mint of the in-flight buy (submitting OR confirming) — for per-card spinners.
  pendingMint: string | null;
}

const QuickBuyContext = createContext<QuickBuyContextValue | null>(null);

export function useQuickBuy(): QuickBuyContextValue {
  const ctx = useContext(QuickBuyContext);
  if (!ctx) return { quickBuy: () => {}, pendingMint: null };
  return ctx;
}

const shorten = (a: string) => (a.length > 8 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);

export function QuickBuyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, phantomAddress, turnkeyAddress, balance } = useTurnkey();
  const { setVisible } = useWalletModal();
  const {
    isConnected,
    lastSignature,
    lastError,
    connect,
    disconnect,
    instantBuy,
  } = useTradeSocket();

  const connection = useMemo(
    () =>
      new Connection(
        config.solanaRpcUrl || "https://api.mainnet-beta.solana.com",
        "confirmed",
      ),
    [],
  );

  // The in-flight buy. State (safe to read in render) drives the card spinner
  // through BOTH the submit and the on-chain confirmation phases.
  const [inflight, setInflight] = useState<{ mint: string; symbol?: string } | null>(null);
  const pendingMint = inflight?.mint ?? null;

  // Ref mirror so the socket-result effects / async confirm can read the current
  // buy without re-subscribing. Kept in sync via setBuy.
  const inflightRef = useRef<{ mint: string; symbol?: string } | null>(null);
  const setBuy = useCallback((v: { mint: string; symbol?: string } | null) => {
    inflightRef.current = v;
    setInflight(v);
  }, []);

  const prevSig = useRef<string | null>(null);
  const prevErr = useRef<string | null>(null);

  // Hydrate persisted presets once on the client.
  useEffect(() => {
    useLoadoutStore.persist.rehydrate();
  }, []);

  // One shared trade socket while authenticated.
  useEffect(() => {
    if (isAuthenticated && phantomAddress) connect();
    return () => disconnect();
  }, [isAuthenticated, phantomAddress, connect, disconnect]);

  // Submission accepted by the backend (signature in hand) → now TRACK on-chain
  // landing. The signature alone is NOT a confirmation: it's computed from the
  // signed bytes before broadcast. Poll the chain (~1-3s) and only report
  // success once the tx actually lands.
  useEffect(() => {
    if (!lastSignature || lastSignature === prevSig.current) return;
    prevSig.current = lastSignature;
    const ctx = inflightRef.current;
    if (!ctx) return;
    const sig = lastSignature;
    confirmSignature(connection, sig, { timeoutMs: CONFIRM_TIMEOUT_MS }).then((res) => {
      // Ignore if a newer buy has since superseded this one.
      if (inflightRef.current?.mint !== ctx.mint) return;
      const label = ctx.symbol ?? "token";
      if (res === "confirmed") toast.success(`Bought ${label} ✓`);
      else if (res === "failed") toast.error(`Buy failed on-chain (${label})`);
      else toast.error(`Buy not confirmed in ${CONFIRM_TIMEOUT_MS / 1000}s — check Solscan`);
      setBuy(null);
    });
  }, [lastSignature, connection, setBuy]);

  // Backend-side failure (auth / build / sign / broadcast) before any signature.
  useEffect(() => {
    if (!lastError || lastError === prevErr.current) return;
    prevErr.current = lastError;
    toast.error(lastError);
    setBuy(null);
  }, [lastError, setBuy]);

  const quickBuy = useCallback(
    async (mint: string, solAmount: number, symbol?: string) => {
      if (!isAuthenticated || !phantomAddress) {
        toast.error("Connect your wallet to quick-buy");
        setVisible(true);
        return;
      }
      if (!solAmount || solAmount <= 0) {
        toast.error("Set a buy amount in the loadout");
        return;
      }
      if (!isConnected) {
        toast.error("Trade connection not ready — try again in a moment");
        return;
      }
      // Funding guard: the payer is your Omnera (Turnkey) wallet, NOT Phantom.
      // Surface the deposit address instead of silently failing on-chain.
      if (balance != null && balance < solAmount + FEE_HEADROOM_SOL) {
        const addr = turnkeyAddress ?? "";
        toast.error(
          `Not enough SOL in your Omnera wallet (${balance.toFixed(3)} SOL). Deposit to ${shorten(addr)} (copied) and retry.`,
        );
        if (addr) navigator.clipboard?.writeText(addr).catch(() => {});
        return;
      }
      if (inflightRef.current) return; // one quick-buy at a time

      setBuy({ mint, symbol });
      toast.success(`Buying ${solAmount} SOL of ${symbol ?? "token"}…`);
      try {
        const hint = await fetchPoolHint(mint);
        instantBuy({ mint, solAmount, ...hint });
      } catch {
        toast.error("Failed to submit buy");
        setBuy(null);
      }
    },
    [
      isAuthenticated,
      phantomAddress,
      isConnected,
      balance,
      turnkeyAddress,
      setVisible,
      instantBuy,
      setBuy,
    ],
  );

  return (
    <QuickBuyContext.Provider value={{ quickBuy, pendingMint }}>
      {children}
    </QuickBuyContext.Provider>
  );
}
