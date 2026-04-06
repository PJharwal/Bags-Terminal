"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { config } from "@/config/env";

export interface TurnkeyWallet {
  id: string;
  solanaAddress: string;
  walletId: string;
  orgId: string;
  walletName: string;
  isActive: boolean;
}

export interface TurnkeyUser {
  id: string;
  phantomAddress: string;
  wallets: TurnkeyWallet[];
  activeWallet: TurnkeyWallet | null;
}

interface TurnkeyContextType {
  user: TurnkeyUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  phantomAddress: string | null;
  turnkeyAddress: string | null;
  balance: number | null;
  balanceLoading: boolean;

  fetchWallet: () => Promise<void>;
  createWallet: () => Promise<{ success: boolean; error?: string }>;
  importWallet: (
    name: string,
    privateKey: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  switchActiveWallet: (walletId: string) => void;
}

const TurnkeyContext = createContext<TurnkeyContextType | null>(null);

export function TurnkeyProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState<TurnkeyUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const phantomAddress = publicKey?.toBase58() || null;

  const switchActiveWallet = useCallback(
    (walletId: string) => {
      setUser((prev) => {
        if (!prev) return null;
        const wallet = prev.wallets.find((w) => w.id === walletId);
        if (!wallet) return prev;

        if (phantomAddress) {
          localStorage.setItem(`tk_active_${phantomAddress}`, walletId);
        }

        return { ...prev, activeWallet: wallet };
      });
    },
    [phantomAddress],
  );

  const createWallet = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!phantomAddress) {
      return { success: false, error: "Phantom wallet not connected" };
    }

    if (!config.buysellServerUrl) {
      return { success: false, error: "Trading server not configured" };
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.buysellServerUrl}/api/turnkey/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phantomAddress }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to create wallet",
        };
      }

      if (data.token) {
        localStorage.setItem(`tk_token_${phantomAddress}`, data.token);
      }

      // Re-fetch wallet data after creation
      await fetchWallet();
      return { success: true };
    } catch (error) {
      console.error("[Turnkey] Create wallet error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create wallet",
      };
    } finally {
      setIsLoading(false);
    }
  }, [phantomAddress]);

  const fetchWallet = useCallback(async () => {
    if (!phantomAddress || !config.buysellServerUrl) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.buysellServerUrl}/api/turnkey/user/${phantomAddress}`,
      );

      if (response.ok) {
        const data = await response.json();

        // If user not found, auto-create
        if (data.found === false) {
          console.log("[Turnkey] User not found, auto-creating wallet...");
          await createWallet();
          return;
        }

        // If token missing or expired, re-authenticate
        const existingToken = localStorage.getItem(
          `tk_token_${phantomAddress}`,
        );
        if (!existingToken) {
          console.log("[Turnkey] Token missing, re-authenticating...");
          await createWallet();
          return;
        }

        // Check token expiration (1 hour buffer)
        try {
          const payload = JSON.parse(atob(existingToken.split(".")[1]));
          const expiresAt = payload.exp * 1000;
          const now = Date.now();
          const oneHourBuffer = 60 * 60 * 1000;

          if (now > expiresAt - oneHourBuffer) {
            console.log("[Turnkey] Token expired, refreshing...");
            localStorage.removeItem(`tk_token_${phantomAddress}`);
            await createWallet();
            return;
          }
        } catch {
          console.warn("[Turnkey] Failed to parse JWT, re-authenticating...");
          localStorage.removeItem(`tk_token_${phantomAddress}`);
          await createWallet();
          return;
        }

        // Populate user state
        if (data.wallets?.length > 0) {
          const wallets: TurnkeyWallet[] = data.wallets.map(
            (w: {
              turnkeyOrgId: string;
              turnkeyWalletId: string;
              solanaAddress: string;
            }) => ({
              id: w.turnkeyWalletId,
              solanaAddress: w.solanaAddress,
              walletId: w.turnkeyWalletId,
              orgId: w.turnkeyOrgId,
              walletName: "omnera",
              isActive: true,
            }),
          );

          const savedActiveId = localStorage.getItem(
            `tk_active_${phantomAddress}`,
          );
          const activeWallet = savedActiveId
            ? wallets.find((w) => w.id === savedActiveId) || wallets[0]
            : wallets[0];

          setUser({
            id: `phantom_${phantomAddress.slice(0, 8)}`,
            phantomAddress,
            wallets,
            activeWallet,
          });
        } else {
          setUser(null);
        }
      } else if (response.status === 404) {
        // User doesn't exist yet, auto-create
        await createWallet();
      }
    } catch (error) {
      console.error("[Turnkey] Failed to fetch wallet:", error);
    } finally {
      setIsLoading(false);
    }
  }, [phantomAddress, createWallet]);

  const importWallet = async (
    name: string,
    privateKey: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!phantomAddress || !config.buysellServerUrl) {
      return { success: false, error: "Phantom wallet not connected" };
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.buysellServerUrl}/api/turnkey/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phantomAddress,
            walletName: name,
            privateKey,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to import wallet",
        };
      }

      if (data.token) {
        localStorage.setItem(`tk_token_${phantomAddress}`, data.token);
      }

      await fetchWallet();
      return { success: true };
    } catch (error) {
      console.error("[Turnkey] Import wallet error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to import wallet",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = useCallback(async () => {
    if (!user?.activeWallet?.solanaAddress) {
      setBalance(null);
      return;
    }

    setBalanceLoading(true);
    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } =
        await import("@solana/web3.js");
      const connection = new Connection(
        config.solanaRpcUrl || "https://api.mainnet-beta.solana.com",
      );
      const pubkey = new PublicKey(user.activeWallet.solanaAddress);
      const lamports = await connection.getBalance(pubkey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("[Turnkey] Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  // Auto-fetch wallet when Phantom connects
  useEffect(() => {
    if (connected && phantomAddress) {
      fetchWallet();
    } else {
      setUser(null);
      setBalance(null);
    }
  }, [connected, phantomAddress, fetchWallet]);

  // Refresh balance when active wallet changes
  useEffect(() => {
    if (user?.activeWallet) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  const logout = () => {
    if (phantomAddress) {
      localStorage.removeItem(`tk_token_${phantomAddress}`);
      localStorage.removeItem(`tk_active_${phantomAddress}`);
    }
    setUser(null);
    setBalance(null);
  };

  return (
    <TurnkeyContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user?.activeWallet,
        phantomAddress,
        turnkeyAddress: user?.activeWallet?.solanaAddress || null,
        balance,
        balanceLoading,
        fetchWallet,
        createWallet,
        importWallet,
        logout,
        refreshBalance,
        switchActiveWallet,
      }}
    >
      {children}
    </TurnkeyContext.Provider>
  );
}

export function useTurnkey() {
  const context = useContext(TurnkeyContext);
  if (!context) {
    throw new Error("useTurnkey must be used within a TurnkeyProvider");
  }
  return context;
}

export function useTurnkeyTrade() {
  const { user, isAuthenticated, turnkeyAddress, phantomAddress } =
    useTurnkey();

  const executeTrade = async (params: {
    tokenMint: string;
    amount: number;
    decimals: number;
    isBuy: boolean;
    slippageBps: number;
    expectedOutput: number;
    quoteMint?: string;
    poolAddress?: string;
    poolType?: string;
    priorityFee?: number;
  }) => {
    if (!user || !isAuthenticated || !phantomAddress || !user.activeWallet) {
      return { success: false, error: "Not authenticated or no active wallet" };
    }

    try {
      const token = localStorage.getItem(`tk_token_${phantomAddress}`);
      const response = await fetch(
        `${config.buysellServerUrl}/api/execute-trade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            phantom_address: phantomAddress,
            wallet_address: user.activeWallet.solanaAddress,
            mint: params.tokenMint,
            action: params.isBuy ? "buy" : "sell",
            amount: params.amount,
            decimals: params.decimals,
            expected_output: params.expectedOutput,
            slippage_bps: params.slippageBps,
            quote_mint: params.quoteMint,
            pool_address: params.poolAddress,
            pool_type:
              params.poolType === "ray_v4" ? "raydium_cpmm" : params.poolType,
            priority_fee: params.priorityFee,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Trade failed" };
      }

      return {
        success: true,
        signature: data.signature,
        status: "confirmed",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Trade failed",
      };
    }
  };

  const preSign = async (params: {
    tokenMint: string;
    amount: number;
    decimals: number;
    isBuy: boolean;
    slippageBps: number;
    expectedOutput: number;
    quoteMint?: string;
    poolAddress?: string;
    poolType?: string;
    priorityFee?: number;
  }) => {
    if (!user || !isAuthenticated || !phantomAddress || !user.activeWallet)
      return;

    try {
      const token = localStorage.getItem(`tk_token_${phantomAddress}`);
      await fetch(`${config.buysellServerUrl}/api/pre-sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          phantom_address: phantomAddress,
          wallet_address: user.activeWallet.solanaAddress,
          mint: params.tokenMint,
          action: params.isBuy ? "buy" : "sell",
          amount: params.amount,
          decimals: params.decimals,
          expected_output: params.expectedOutput,
          slippage_bps: params.slippageBps,
          quote_mint: params.quoteMint,
          pool_address: params.poolAddress,
          pool_type:
            params.poolType === "ray_v4" ? "raydium_cpmm" : params.poolType,
          priority_fee: params.priorityFee,
        }),
      });
    } catch (error) {
      console.error("[Turnkey] Pre-sign error:", error);
    }
  };

  return {
    executeTrade,
    preSign,
    isReady: isAuthenticated && !!turnkeyAddress,
    turnkeyAddress,
  };
}
