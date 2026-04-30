"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTerminalStore } from "@/store/terminal.store";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";
import { useTradeSocket } from "@/hooks/useTradeSocket";
import { SlippageSettings } from "@/components/terminal/SlippageSettings";
import { Wallet, Zap, ExternalLink, AlertCircle } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { config } from "@/config/env";
import { Button } from "@/components/ui/Button";
import { LiveDot } from "@/components/ui/LiveDot";
import { NumberInput } from "@/components/ui/NumberInput";
import { cn } from "@/lib/utils";

const BUY_PRESETS = [0.1, 0.5, 1, 5];
const SELL_PRESETS = [25, 50, 75, 100];

type TradeAction = "buy" | "sell";
type TxStatus = "idle" | "preparing" | "ready" | "sending" | "success" | "error";

interface GMGNTokenInfoResponse {
    code: number;
    message: string;
    data: {
        decimals: number;
        standard?: string;
        dev?: { creator_address?: string };
        tpool: { exchange: string; pool_address: string; quote_address: string };
        pool?: { base_vault_address?: string; quote_vault_address?: string; quote_symbol?: string };
    }[];
}

export function TerminalTradePanel() {
    const { activeToken, slippageBps } = useTerminalStore();
    const {
        isAuthenticated, turnkeyAddress,
        balance: turnkeyBalance, refreshBalance: refreshTurnkeyBalance,
    } = useTurnkey();
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    const {
        isConnected: socketConnected,
        isPreparing, isReady: socketReady, isExecuting: socketExecuting,
        estimatedTokens, estimatedDisplay, pricePerToken,
        estimatedSolDisplay, sellPricePerToken,
        lastSignature, lastError,
        connect: socketConnect, disconnect: socketDisconnect,
        prepareBuy, executeBuy, prepareSell, executeSell,
        instantBuy, instantSell, clearError, resetPrepare,
    } = useTradeSocket();

    // Trade state
    const [action, setAction] = useState<TradeAction>("buy");
    const [solAmount, setSolAmount] = useState("");
    const [sellAmount, setSellAmount] = useState("");
    const [sellPreset, setSellPreset] = useState<number | null>(null);
    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txResult, setTxResult] = useState<{ signature?: string; error?: string } | null>(null);

    // Token metadata (from GMGN)
    const [tokenDecimals, setTokenDecimals] = useState(6);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [exchange, setExchange] = useState<string | null>(null);
    const [poolAddress, setPoolAddress] = useState<string | null>(null);
    const [quoteAddress, setQuoteAddress] = useState<string | null>(null);
    const [creatorAddress, setCreatorAddress] = useState<string | null>(null);
    const [baseVaultAddress, setBaseVaultAddress] = useState<string | null>(null);
    const [quoteVaultAddress, setQuoteVaultAddress] = useState<string | null>(null);
    const [tokenStandard, setTokenStandard] = useState("spl");
    const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
    const pendingTradeRef = useRef<{
        action: TradeAction;
        estimatedTokens: number;
        sellAmount: string;
        tokenDecimals: number;
    } | null>(null);
    const activeTokenId = activeToken?.tokenId;

    const isBuy = action === "buy";
    const accentColor = isBuy ? "#39FF14" : "#FF003C";

    const connection = useMemo(() => new Connection(config.solanaRpcUrl), []);

    // Map GMGN exchange to pool_type hint
    const getPoolHint = useCallback(() => {
        if (!exchange) return {};
        switch (exchange) {
            case "pump_amm": return { poolAddress: poolAddress || undefined, poolType: "pumpswap", creatorAddress: creatorAddress || undefined, baseVaultAddress: baseVaultAddress || undefined, quoteVaultAddress: quoteVaultAddress || undefined, tokenStandard };
            case "meteora_dammv2": return { poolAddress: poolAddress || undefined, poolType: "meteora_damm" };
            case "ray_v4": return { poolAddress: poolAddress || undefined, poolType: "raydium_cpmm" };
            case "pumpfun": case "pump": return { poolAddress: poolAddress || undefined, poolType: "pumpfun", creatorAddress: creatorAddress || undefined };
            case "meteora_dbc": return { poolAddress: poolAddress || undefined, poolType: "meteora_dbc" };
            case "raydium_launchlab": return { poolAddress: poolAddress || undefined, poolType: "raydium_launchlab", quoteAddress: quoteAddress || undefined };
            default: return {};
        }
    }, [exchange, poolAddress, quoteAddress, creatorAddress, baseVaultAddress, quoteVaultAddress, tokenStandard]);

    // Connect socket when authenticated
    useEffect(() => {
        if (isAuthenticated && turnkeyAddress) {
            socketConnect();
        }
        return () => { socketDisconnect(); };
    }, [isAuthenticated, turnkeyAddress, socketConnect, socketDisconnect]);

    // Fetch GMGN token info for pool hints
    useEffect(() => {
        if (!activeTokenId) return;
        /* eslint-disable react-hooks/set-state-in-effect -- intentional: reset all per-token state when the active token changes (sync to external selection). */
        setTokenDecimals(6);
        setTokenBalance(0);
        setExchange(null); setPoolAddress(null); setQuoteAddress(null);
        setCreatorAddress(null); setBaseVaultAddress(null); setQuoteVaultAddress(null);
        setTokenStandard("spl"); setTxStatus("idle"); setTxResult(null); resetPrepare();
        pendingTradeRef.current = null;
        /* eslint-enable react-hooks/set-state-in-effect */

        const fetchGMGNInfo = async () => {
            try {
                const res = await fetch(`${config.baseGmgnUrl}/token/${activeTokenId}/info`);
                const data: GMGNTokenInfoResponse = await res.json();
                if (data.code === 0 && data.data?.length > 0) {
                    const d = data.data[0];
                    if (d.decimals) setTokenDecimals(d.decimals);
                    if (d.tpool) { setExchange(d.tpool.exchange); setPoolAddress(d.tpool.pool_address); setQuoteAddress(d.tpool.quote_address || null); }
                    if (d.pool) { setBaseVaultAddress(d.pool.base_vault_address || null); setQuoteVaultAddress(d.pool.quote_vault_address || null); }
                    if (d.dev?.creator_address) setCreatorAddress(d.dev.creator_address);
                    if (d.standard === "2022") setTokenStandard("2022");
                }
            } catch { /* GMGN unavailable, backend will auto-detect */ }
        };
        fetchGMGNInfo();
    }, [activeTokenId, resetPrepare]);

    // Fetch token balance
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset balance to 0 when prerequisites missing.
        if (!activeTokenId || !turnkeyAddress || !isAuthenticated) { setTokenBalance(0); return; }
        const fetchBalance = async () => {
            const mintPubkey = new PublicKey(activeTokenId);
            const userPubkey = new PublicKey(turnkeyAddress);
            const tryProgram = async (progId: typeof TOKEN_PROGRAM_ID) => {
                const ata = await getAssociatedTokenAddress(mintPubkey, userPubkey, false, progId);
                const account = await getAccount(connection, ata, "confirmed", progId);
                return Number(account.amount);
            };
            try {
                const raw = await tryProgram(TOKEN_PROGRAM_ID);
                setTokenBalance(raw / Math.pow(10, tokenDecimals));
            } catch {
                try {
                    const raw = await tryProgram(TOKEN_2022_PROGRAM_ID);
                    setTokenBalance(raw / Math.pow(10, tokenDecimals));
                } catch { setTokenBalance(0); }
            }
        };
        fetchBalance();
    }, [activeTokenId, turnkeyAddress, isAuthenticated, tokenDecimals, balanceRefreshTrigger, connection]);

    // Auto-prepare BUY when amount changes (debounced)
    useEffect(() => {
        if (!isAuthenticated || !socketConnected || action !== "buy") return;
        const val = parseFloat(solAmount);
        if (!val || val <= 0) { resetPrepare(); return; }
        const timer = setTimeout(() => {
            const slippageBpsVal = slippageBps > 0 ? slippageBps : undefined;
            const poolHint = getPoolHint();
            prepareBuy({ mint: activeTokenId!, solAmount: val, slippageBps: slippageBpsVal, ...poolHint });
        }, 300);
        return () => clearTimeout(timer);
    }, [solAmount, isAuthenticated, socketConnected, action, activeTokenId, slippageBps, exchange, prepareBuy, resetPrepare, getPoolHint]);

    // Auto-prepare SELL when amount changes (debounced)
    useEffect(() => {
        if (!isAuthenticated || !socketConnected || action !== "sell") return;
        const val = parseFloat(sellAmount);
        if (!val || val <= 0) { resetPrepare(); return; }
        const timer = setTimeout(() => {
            const slippageBpsVal = slippageBps > 0 ? slippageBps : undefined;
            const poolHint = getPoolHint();
            prepareSell({ mint: activeTokenId!, tokenAmount: val, tokenDecimals, slippageBps: slippageBpsVal, ...poolHint });
        }, 300);
        return () => clearTimeout(timer);
    }, [sellAmount, isAuthenticated, socketConnected, action, activeTokenId, tokenDecimals, slippageBps, exchange, prepareSell, resetPrepare, getPoolHint]);

    // Handle execute results — verify on-chain before showing success
    useEffect(() => {
        if (!lastSignature) return;
        const tradeSnapshot = pendingTradeRef.current;

        const confirmTx = async () => {
            setTxResult({ signature: lastSignature });
            setTxStatus("sending");

            // Poll getSignatureStatuses — returns instantly, no blocking wait
            const maxAttempts = 12;
            for (let i = 0; i < maxAttempts; i++) {
                try {
                    const { value } = await connection.getSignatureStatuses([lastSignature]);
                    const status = value?.[0];

                    if (status) {
                        if (status.err) {
                            setTxResult({ signature: lastSignature, error: "Transaction failed on-chain. Check if your trading wallet has enough SOL." });
                            setTxStatus("error");
                            return;
                        }
                        if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
                            setTxStatus("success");
                            if (tradeSnapshot?.action === "buy" && tradeSnapshot.estimatedTokens) {
                                setTokenBalance((prev) => prev + tradeSnapshot.estimatedTokens / Math.pow(10, tradeSnapshot.tokenDecimals));
                            } else if (tradeSnapshot?.action === "sell" && tradeSnapshot.sellAmount) {
                                setTokenBalance((prev) => Math.max(0, prev - parseFloat(tradeSnapshot.sellAmount)));
                            }
                            setSolAmount(""); setSellAmount(""); setSellPreset(null);
                            setTimeout(() => { setBalanceRefreshTrigger((p) => p + 1); refreshTurnkeyBalance(); }, 3000);
                            return;
                        }
                    }
                } catch { /* RPC error, retry */ }

                await new Promise((r) => setTimeout(r, 500));
            }

            // After 6s of polling with no result
            setTxResult({ signature: lastSignature, error: "Transaction not confirmed. It may have been dropped." });
            setTxStatus("error");
        };

        confirmTx();
    }, [lastSignature, refreshTurnkeyBalance, connection]);

    // Handle errors — sync local result state to socket-emitted error stream.
    useEffect(() => {
        if (lastError) {
            /* eslint-disable react-hooks/set-state-in-effect -- intentional: react to async error from socket, then clear it. */
            setTxResult({ error: lastError });
            setTxStatus("error");
            /* eslint-enable react-hooks/set-state-in-effect */
            clearError();
        }
    }, [lastError, clearError]);

    // Sell preset handler
    const handleSellPreset = (pct: number) => {
        const computed = parseFloat((tokenBalance * pct / 100).toFixed(10)).toString();
        setSellAmount(computed);
        setSellPreset(pct);
    };

    // Execute trade
    const handleTrade = () => {
        if (!isAuthenticated) { setVisible(true); return; }
        if (action === "buy" && (!solAmount || parseFloat(solAmount) <= 0)) return;
        if (action === "sell" && (!sellAmount || parseFloat(sellAmount) <= 0)) return;

        setTxStatus("sending");
        setTxResult(null);
        pendingTradeRef.current = {
            action,
            estimatedTokens: estimatedTokens || 0,
            sellAmount,
            tokenDecimals,
        };

        const poolHint = getPoolHint();
        const slippageBpsVal = slippageBps > 0 ? slippageBps : undefined;

        if (socketReady) {
            // TX is pre-signed, just broadcast
            if (action === "buy") executeBuy();
            else executeSell();
        } else {
            // Instant flow (prepare + execute in one step)
            if (action === "buy") {
                instantBuy({ mint: activeTokenId!, solAmount: parseFloat(solAmount), slippageBps: slippageBpsVal, ...poolHint });
            } else {
                instantSell({ mint: activeTokenId!, tokenAmount: parseFloat(sellAmount), tokenDecimals, slippageBps: slippageBpsVal, ...poolHint });
            }
        }
    };

    const handleDismiss = () => {
        pendingTradeRef.current = null;
        setTxStatus("idle");
        setTxResult(null);
        resetPrepare();
    };

    const isProcessing = isPreparing || socketExecuting || txStatus === "sending";

    const getButtonText = () => {
        if (socketExecuting || txStatus === "sending") return "Executing...";
        if (isPreparing) return "Preparing...";
        if (socketReady && action === "buy" && estimatedDisplay) return `Buy ~${estimatedDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${activeToken?.symbol || ""}`;
        if (socketReady && action === "sell" && estimatedSolDisplay) return `Sell for ~${estimatedSolDisplay.toFixed(4)} SOL`;
        return `${isBuy ? "Buy" : "Sell"} ${activeToken?.symbol || "Token"}`;
    };

    return (
        <div className="card flex h-full flex-col overflow-hidden">
            <div className="p-3">
                <div className="grid grid-cols-2 rounded-full border border-white/8 bg-black/20 p-1">
                    <button
                        onClick={() => { setAction("buy"); setSolAmount(""); setSellAmount(""); resetPrepare(); setTxStatus("idle"); setTxResult(null); }}
                        className={cn(
                            "rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors",
                            isBuy ? "border border-acid-green/20 bg-acid-green/10 text-acid-green" : "text-muted-high hover:text-fg"
                        )}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => { setAction("sell"); setSolAmount(""); setSellAmount(""); resetPrepare(); setTxStatus("idle"); setTxResult(null); }}
                        className={cn(
                            "rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors",
                            !isBuy ? "border border-white/10 bg-white/[0.04] text-fg" : "text-muted-high hover:text-fg"
                        )}
                    >
                        Sell
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {!socketConnected && isAuthenticated && (
                    <div className="rounded-2xl border border-error/20 bg-error/[0.08] px-3 py-2">
                        <LiveDot status="down" size="xs" label="Trade server disconnected" />
                    </div>
                )}

                {isBuy ? (
                    <div className="space-y-2">
                        <label htmlFor="trade-buy-amount" className="text-[11px] uppercase tracking-[0.2em] text-muted-high">Amount (SOL)</label>
                        <NumberInput
                            id="trade-buy-amount"
                            presets={BUY_PRESETS}
                            value={solAmount}
                            onChange={(e) => setSolAmount(e.target.value)}
                            placeholder="0.00"
                            min={0}
                            decimals={3}
                            suffix="SOL"
                            aria-label="SOL amount to buy"
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label htmlFor="trade-sell-amount" className="text-[11px] uppercase tracking-[0.2em] text-muted-high">Amount ({activeToken?.symbol || "Tokens"})</label>
                        <div role="group" aria-label="Sell percentage" className="grid grid-cols-4 gap-2">
                            {SELL_PRESETS.map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handleSellPreset(pct)}
                                    aria-pressed={sellPreset === pct}
                                    className="rounded-xl border border-white/10 px-2 py-2 text-xs font-medium text-fg-soft transition-colors hover:border-white/20 hover:text-fg active:scale-[0.98]"
                                    style={sellPreset === pct ? { borderColor: accentColor, color: accentColor, background: `${accentColor}14` } : undefined}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                        <NumberInput
                            id="trade-sell-amount"
                            value={sellAmount}
                            onChange={(e) => { setSellAmount(e.target.value); setSellPreset(null); }}
                            placeholder="0.00"
                            min={0}
                            decimals={6}
                            suffix={activeToken?.symbol || "Tokens"}
                            aria-label={`${activeToken?.symbol || "Token"} amount to sell`}
                        />
                        <span className="block text-xs text-muted-high font-mono num">
                            Holdings: {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {activeToken?.symbol || ""}
                        </span>
                    </div>
                )}

                {activeToken && (isBuy ? solAmount : sellAmount) && (
                    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-high">You {isBuy ? "pay" : "sell"}</span>
                            <span className="font-mono text-fg num">
                                {isBuy ? `${solAmount} SOL` : `${sellAmount} ${activeToken.symbol}`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-high">You receive</span>
                            <span className="font-mono text-fg num">
                                {isPreparing ? (
                                    <span className="animate-pulse text-muted-high">Calculating...</span>
                                ) : socketReady && isBuy && estimatedDisplay ? (
                                    `~${estimatedDisplay.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${activeToken.symbol}`
                                ) : socketReady && !isBuy && estimatedSolDisplay ? (
                                    `~${estimatedSolDisplay.toFixed(4)} SOL`
                                ) : "--"}
                            </span>
                        </div>
                        {(pricePerToken || sellPricePerToken) && (
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-muted-high">Price per token</span>
                                <span className="font-mono text-fg-soft num">{((pricePerToken || sellPricePerToken)!).toFixed(9)} SOL</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Zap size={14} aria-hidden="true" className="text-acid-green" />
                            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-high">Trading wallet</span>
                        </div>
                        <span className="font-mono text-xs text-fg num">
                            {turnkeyBalance !== null ? `${turnkeyBalance.toFixed(4)} SOL` : "-- SOL"}
                        </span>
                    </div>
                    {turnkeyAddress && (
                        <span className="block pl-6 text-xs font-mono text-muted-high num">
                            {turnkeyAddress.slice(0, 4)}...{turnkeyAddress.slice(-4)}
                        </span>
                    )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <SlippageSettings />
                </div>

                {txResult && (
                    <div className={cn(
                        "rounded-2xl border p-3 text-sm font-mono",
                        txResult.error ? "border-error/20 bg-error/[0.08] text-error" : "border-[#39FF14]/20 bg-acid-green/[0.08] text-acid-green"
                    )}>
                        {txResult.error ? (
                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={12} className="mt-0.5" />
                                    <span>{txResult.error}</span>
                                </div>
                                {txResult.signature && (
                                    <a href={`https://solscan.io/tx/${txResult.signature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline opacity-80">
                                        View failed TX <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                        ) : txResult.signature ? (
                            <div className="space-y-2">
                                <div>Transaction confirmed.</div>
                                <a href={`https://solscan.io/tx/${txResult.signature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline">
                                    View on Solscan <ExternalLink size={10} />
                                </a>
                            </div>
                        ) : null}
                        <button onClick={handleDismiss} className="mt-2 text-xs text-muted-high hover:text-fg">
                            Dismiss
                        </button>
                    </div>
                )}
            </div>

            <div className="border-t border-white/5 p-4">
                {!connected ? (
                    <Button
                        variant="ghost"
                        size="md"
                        fullWidth
                        iconLeft={<Wallet size={14} />}
                        onClick={() => setVisible(true)}
                    >
                        Connect Wallet
                    </Button>
                ) : !isAuthenticated ? (
                    <Button variant="ghost" size="md" fullWidth disabled loading>
                        Creating Wallet...
                    </Button>
                ) : (
                    <Button
                        variant={socketReady ? "gold" : isBuy ? "primary" : "destructive"}
                        size="md"
                        fullWidth
                        loading={isProcessing}
                        onClick={handleTrade}
                        disabled={isProcessing || !activeToken || (isBuy ? !solAmount : !sellAmount)}
                    >
                        {getButtonText()}
                    </Button>
                )}
            </div>
        </div>
    );
}
