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
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const TurnkeyContext = createContext<TurnkeyContextType | null>(null);

export function TurnkeyProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState<TurnkeyUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const phantomAddress = publicKey?.toBase58() || null;

  const fetchWallet = useCallback(async () => {
    if (!phantomAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.buysellServerUrl}/api/turnkey/user/${phantomAddress}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.found === false) {
          console.log("User not found, auto-creating wallet...");
          const loginResponse = await fetch(
            `${config.buysellServerUrl}/api/turnkey/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phantomAddress }),
            }
          );

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.token) {
              localStorage.setItem(
                `tk_token_${phantomAddress}`,
                loginData.token
              );
            }
            const wallet: TurnkeyWallet = {
              id: loginData.wallet_id,
              solanaAddress: loginData.solana_address,
              walletId: loginData.wallet_id,
              orgId: loginData.org_id,
              walletName: "omnera",
              isActive: true,
            };
            setUser({
              id: loginData.user_id,
              phantomAddress,
              wallets: [wallet],
              activeWallet: wallet,
            });
          } else {
            setUser(null);
          }
          return;
        }

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
            })
          );

          setUser({
            id: `phantom_${phantomAddress.slice(0, 8)}`,
            phantomAddress,
            wallets,
            activeWallet: wallets[0],
          });
        } else {
          setUser(null);
        }
      } else if (response.status === 404) {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    } finally {
      setIsLoading(false);
    }
  }, [phantomAddress]);

  const createWallet = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!phantomAddress) {
      return { success: false, error: "Phantom wallet not connected" };
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.buysellServerUrl}/api/turnkey/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phantomAddress }),
        }
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

      await fetchWallet();
      return { success: true };
    } catch (error) {
      console.error("Create wallet error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create wallet",
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
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import(
        "@solana/web3.js"
      );
      const connection = new Connection(
        config.solanaRpcUrl || "https://api.mainnet-beta.solana.com"
      );
      const pubkey = new PublicKey(user.activeWallet.solanaAddress);
      const lamports = await connection.getBalance(pubkey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (connected && phantomAddress) {
      fetchWallet();
    } else {
      setUser(null);
      setBalance(null);
    }
  }, [connected, phantomAddress, fetchWallet]);

  useEffect(() => {
    if (user?.activeWallet) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  const logout = () => {
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
        logout,
        refreshBalance,
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
    isBuy: boolean;
    slippageBps: number;
    expectedOutput: number;
    quoteMint?: string;
  }) => {
    if (!user || !isAuthenticated || !phantomAddress) {
      return { success: false, error: "Not authenticated" };
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
            mint: params.tokenMint,
            action: params.isBuy ? "buy" : "sell",
            amount: params.amount,
            expected_output: params.expectedOutput,
            slippage_bps: params.slippageBps,
            quote_mint: params.quoteMint,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Trade failed" };
      }

      return {
        success: true,
        signature: data.signature,
        status: "confirmed", // Backend sends to Solana, we assume confirmation flow or basic success
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Trade failed",
      };
    }
  };

  return {
    executeTrade,
    isReady: isAuthenticated && !!turnkeyAddress,
    turnkeyAddress,
  };
}
