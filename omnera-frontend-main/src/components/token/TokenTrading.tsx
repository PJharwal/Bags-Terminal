"use client";

import { FC, useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "@/config/env";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { cn } from "@/lib/utils";
import { Loader2, Settings, AlertCircle, CheckCircle, Zap } from "lucide-react";
import { useTurnkey, useTurnkeyTrade } from "@/components/turnkey";
import { TurnkeyLogin } from "@/components/turnkey";

interface TokenTradingProps {
  tokenMint: string;
  tokenSymbol: string;
}

interface QuoteResponse {
  input_amount: number;
  output_amount: number;
  output_display: number;
  price_per_token: number;
  price_impact_bps: number;
  platform:
    | string
    | {
        type: string;
        bonding_curve?: string;
        pool_state?: string;
        quote_mint?: string;
        quote_symbol?: string;
        platform_name?: string;
      };
  error: string | null;
}

type TradeAction = "buy" | "sell";
type TxStatus =
  | "idle"
  | "building"
  | "signing"
  | "sending"
  | "confirming"
  | "success"
  | "error";

export const TokenTrading: FC<TokenTradingProps> = ({
  tokenMint,
  tokenSymbol,
}) => {
  const {
    isAuthenticated,
    turnkeyAddress,
    isLoading: authLoading,
  } = useTurnkey();
  const { executeTrade } = useTurnkeyTrade();

  const [action, setAction] = useState<TradeAction>("buy");
  const [amount, setAmount] = useState<string>("");
  const [solAmount, setSolAmount] = useState<string>("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteTimer, setQuoteTimer] = useState<NodeJS.Timeout | null>(null);
  const [slippage, setSlippage] = useState<string>("5");
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txResult, setTxResult] = useState<{
    signature?: string;
    error?: string;
  } | null>(null);
  const [platformInfo, setPlatformInfo] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(6);
  const [quoteDecimals, setQuoteDecimals] = useState<number>(9);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const slippagePresets = ["0.5", "1", "2", "5"];
  const connection = new Connection(config.solanaRpcUrl);

  // New combined effect for metadata and balance
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenMint) return;

      setIsLoadingMetadata(true);
      const mintPubkey = new PublicKey(tokenMint);

      try {
        // 1. Fetch Mint Decimals (Parallelizable)
        const fetchDecimals = async () => {
          try {
            const mintInfo = await getMint(
              connection,
              mintPubkey,
              "confirmed",
              TOKEN_PROGRAM_ID
            );
            return mintInfo.decimals;
          } catch {
            const mintInfo = await getMint(
              connection,
              mintPubkey,
              "confirmed",
              TOKEN_2022_PROGRAM_ID
            );
            return mintInfo.decimals;
          }
        };

        // 2. Fetch User Balance (Parallelizable)
        const fetchBalance = async () => {
          if (!turnkeyAddress || !isAuthenticated) return 0;
          const userPubkey = new PublicKey(turnkeyAddress);

          const getBal = async (progId: PublicKey) => {
            const ata = await getAssociatedTokenAddress(
              mintPubkey,
              userPubkey,
              false,
              progId
            );
            const account = await getAccount(
              connection,
              ata,
              "confirmed",
              progId
            );
            return Number(account.amount);
          };

          try {
            return await getBal(TOKEN_PROGRAM_ID);
          } catch {
            try {
              return await getBal(TOKEN_2022_PROGRAM_ID);
            } catch {
              return 0;
            }
          }
        };

        // Execute in parallel
        const [decimals, rawBalance] = await Promise.all([
          fetchDecimals(),
          fetchBalance(),
        ]);

        setTokenDecimals(decimals);
        setTokenBalance(rawBalance / Math.pow(10, decimals));
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchTokenData();
    // Refresh interval for balance? Could be added here.
  }, [tokenMint, turnkeyAddress, isAuthenticated]);

  const fetchQuote = async (inputAmount: number, tradeAction: TradeAction) => {
    if (!inputAmount || inputAmount <= 0) {
      setQuote(null);
      return;
    }

    try {
      const response = await fetch(`${config.buysellServerUrl}/api/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mint: tokenMint,
          action: tradeAction,
          amount: inputAmount,
          chain: "sol",
          user_pubkey: turnkeyAddress || undefined,
        }),
      });

      if (response.ok) {
        const quoteData: QuoteResponse = await response.json();
        if (quoteData.error) {
          setQuote(null);
        } else {
          setQuote(quoteData);

          if (
            quoteData.platform &&
            typeof quoteData.platform === "object" &&
            "quote_symbol" in quoteData.platform
          ) {
            const sym = quoteData.platform.quote_symbol;
            if (sym === "USD1" || sym === "USDC") {
              setQuoteDecimals(6);
            } else {
              setQuoteDecimals(9);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setQuote(null);
    }
  };

  const handleSolAmountChange = (val: string) => {
    setSolAmount(val);
    if (quoteTimer) clearTimeout(quoteTimer);

    const solVal = parseFloat(val);
    if (solVal > 0) {
      const timer = setTimeout(() => fetchQuote(solVal, "buy"), 500); // 500ms debounce
      setQuoteTimer(timer);
    } else {
      setQuote(null);
    }
  };

  const handleTokenAmountChange = (val: string) => {
    setAmount(val);
    if (quoteTimer) clearTimeout(quoteTimer);

    const tokenVal = parseFloat(val);
    if (tokenVal > 0 && action === "sell") {
      const timer = setTimeout(() => fetchQuote(tokenVal, "sell"), 500); // 500ms debounce
      setQuoteTimer(timer);
    } else {
      setQuote(null);
    }
  };

  const handleTrade = async () => {
    // Show login modal if not authenticated
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Validate input
    if (action === "buy" && (!solAmount || parseFloat(solAmount) <= 0)) {
      setTxResult({ error: "Please enter a valid SOL amount" });
      setTxStatus("error");
      return;
    }

    if (action === "sell" && (!amount || parseFloat(amount) <= 0)) {
      setTxResult({ error: "Please enter a valid token amount" });
      setTxStatus("error");
      return;
    }

    if (!quote || !quote.output_amount) {
      setTxResult({ error: "Please wait for quote to load" });
      setTxStatus("error");
      return;
    }

    setTxStatus("building");
    setTxResult(null);
    setPlatformInfo(null);

    try {
      const LAMPORTS_PER_SOL = 1_000_000_000;
      const TOKEN_DECIMALS = Math.pow(10, tokenDecimals);
      const slippageBps = Math.round(parseFloat(slippage) * 100);

      let amountInBaseUnits: number;

      if (action === "buy") {
        amountInBaseUnits = Math.floor(
          parseFloat(solAmount) * Math.pow(10, quoteDecimals)
        );
      } else {
        amountInBaseUnits = Math.floor(parseFloat(amount) * TOKEN_DECIMALS);
      }

      setTxStatus("sending");

      const quoteMint =
        quote?.platform &&
        typeof quote.platform === "object" &&
        "quote_mint" in quote.platform
          ? quote.platform.quote_mint
          : undefined;

      // Use Turnkey one-click trade!
      const result = await executeTrade({
        tokenMint: tokenMint,
        amount: amountInBaseUnits,
        isBuy: action === "buy",
        slippageBps: slippageBps,
        expectedOutput: quote?.output_amount || 0,
        quoteMint: quoteMint,
      });

      if (result.success && result.signature) {
        const signature = result.signature;
        setTxResult({ signature });
        setTxStatus("success");
        setAmount("");
        setSolAmount("");

        // Optional: background monitoring
        connection.onSignature(
          signature,
          (signatureResult) => {
            if (signatureResult.err) {
              console.error("Tx failed after broadcast:", signatureResult.err);
            }
          },
          "processed"
        );
      } else {
        throw new Error(result.error || "Trade failed");
      }
    } catch (error) {
      console.error("Trade error:", error);
      setTxStatus("error");
      setTxResult({
        error: error instanceof Error ? error.message : "Transaction failed",
      });
    }
  };

  const getStatusMessage = () => {
    switch (txStatus) {
      case "building":
        return "Preparing trade...";
      case "signing":
        return "Authorizing with Turnkey...";
      case "sending":
        return "Broadcasting to Solana...";
      case "confirming":
        return "Landing transaction...";
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">
          Trade {tokenSymbol}
        </h3>
        <button
          onClick={() => setShowSlippageSettings(!showSlippageSettings)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showSlippageSettings
              ? "bg-primary/20 text-primary"
              : "hover:bg-white/5 text-muted-foreground"
          )}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Slippage Settings */}
      {showSlippageSettings && (
        <div className="p-3 rounded-lg bg-background/50 border border-border space-y-2">
          <div className="text-xs text-muted-foreground">
            Slippage Tolerance
          </div>
          <div className="flex items-center gap-2">
            {slippagePresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setSlippage(preset)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  slippage === preset
                    ? "bg-primary text-white"
                    : "bg-surface border border-border hover:bg-white/5 text-muted-foreground"
                )}
              >
                {preset}%
              </button>
            ))}
            <div className="relative flex items-center">
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-20 h-9 px-3 pr-8 rounded-md border border-border bg-surface text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                min="0.1"
                max="50"
                step="0.1"
              />
              <span className="absolute right-3 text-muted-foreground text-sm pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Buy/Sell Toggle */}
      <div className="flex rounded-lg bg-background/50 p-1 border border-border">
        <button
          onClick={() => setAction("buy")}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
            action === "buy"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "text-muted-foreground hover:text-white"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setAction("sell")}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
            action === "sell"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "text-muted-foreground hover:text-white"
          )}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        {action === "buy" ? (
          <>
            <label className="text-sm text-muted-foreground">
              SOL Amount to Spend
            </label>
            <div className="relative">
              <input
                type="number"
                value={solAmount}
                onChange={(e) => handleSolAmountChange(e.target.value)}
                placeholder="e.g., 0.01"
                className="w-full h-12 px-4 rounded-lg border border-border bg-surface text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                min="0"
                step="any"
                disabled={txStatus === "signing" || txStatus === "sending"}
              />
            </div>
            {quote && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    You will receive
                  </span>
                  <span className="text-sm font-medium text-blue-400">
                    {quote.output_display.toLocaleString()} {tokenSymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Price per token</span>
                  <span className="text-white">
                    {quote.price_per_token.toFixed(8)} SOL
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">
                {tokenSymbol} to Sell
              </label>
              <div className="text-sm">
                {isLoadingMetadata ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  <span className="text-muted-foreground">
                    Balance:{" "}
                    <span className="text-white font-medium">
                      {tokenBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}{" "}
                      {tokenSymbol}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleTokenAmountChange(e.target.value)}
                placeholder="e.g., 1000"
                className="w-full h-12 px-4 rounded-lg border border-border bg-surface text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                min="0"
                step="any"
                disabled={txStatus === "signing" || txStatus === "sending"}
              />
            </div>
            {quote && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    You will receive
                  </span>
                  <span className="text-sm font-medium text-blue-400">
                    {quote.output_display.toFixed(6)} SOL
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex gap-2">
        {action === "buy" ? (
          <>
            {["0.001", "0.01", "0.1", "0.5"].map((val) => (
              <button
                key={val}
                onClick={() => handleSolAmountChange(val)}
                className="flex-1 py-1.5 text-xs rounded-md bg-surface border border-border hover:bg-white/5 text-muted-foreground transition-colors"
              >
                {val} SOL
              </button>
            ))}
          </>
        ) : (
          <>
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => {
                  if (tokenBalance > 0) {
                    const sellAmount = (tokenBalance * percent) / 100;
                    handleTokenAmountChange(sellAmount.toString());
                  }
                }}
                disabled={tokenBalance <= 0 || isLoadingMetadata}
                className={cn(
                  "flex-1 py-1.5 text-xs rounded-md bg-surface border border-border transition-colors",
                  tokenBalance > 0 && !isLoadingMetadata
                    ? "hover:bg-white/5 text-muted-foreground"
                    : "opacity-50 cursor-not-allowed text-muted-foreground/50"
                )}
              >
                {percent}%
              </button>
            ))}
          </>
        )}
      </div>

      {/* Trade Info */}
      <div className="p-3 rounded-lg bg-background/50 border border-border space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Slippage</span>
          <span className="text-white">{slippage}%</span>
        </div>
        {quote && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price Impact</span>
            <span
              className={cn(
                "text-white",
                quote.price_impact_bps > 500
                  ? "text-red-400"
                  : quote.price_impact_bps > 100
                  ? "text-yellow-400"
                  : ""
              )}
            >
              {(quote.price_impact_bps / 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Status Message */}
      {getStatusMessage() && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          {getStatusMessage()}
        </div>
      )}

      {/* Success Message */}
      {txStatus === "success" && txResult?.signature && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={16} />
            Transaction successful!
          </div>
          <a
            href={`https://solscan.io/tx/${txResult.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline break-all"
          >
            View on Solscan: {txResult.signature.slice(0, 20)}...
          </a>
        </div>
      )}

      {/* Error Message */}
      {txStatus === "error" && txResult?.error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} />
          {txResult.error}
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={handleTrade}
        disabled={
          (action === "buy" ? !solAmount : !amount) ||
          txStatus === "building" ||
          txStatus === "signing" ||
          txStatus === "sending"
        }
        className={cn(
          "w-full py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2",
          action === "buy"
            ? "bg-green-500 hover:bg-green-600 disabled:bg-green-500/50"
            : "bg-red-500 hover:bg-red-600 disabled:bg-red-500/50",
          "disabled:cursor-not-allowed"
        )}
      >
        {!isAuthenticated ? (
          <>
            <Zap size={18} />
            Login to Trade
          </>
        ) : txStatus === "building" ||
          txStatus === "signing" ||
          txStatus === "sending" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {action === "buy" ? "Buy" : "Sell"} {tokenSymbol}
          </>
        )}
      </button>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-xl bg-surface border border-border">
            <h2 className="text-xl font-semibold text-white mb-4">
              Login to Trade
            </h2>
            <TurnkeyLogin onSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
