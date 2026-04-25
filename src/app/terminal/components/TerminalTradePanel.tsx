"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTerminalStore } from "@/store/terminal.store";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";
import { useTradeSocket } from "@/hooks/useTradeSocket";
import { SlippageSettings } from "@/components/terminal/SlippageSettings";
import { Wallet, Zap, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { config } from "@/config/env";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LiveDot } from "@/components/ui/LiveDot";
import { NumberInput } from "@/components/ui/NumberInput";

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
        estimatedSol, estimatedSolDisplay, sellPricePerToken,
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
        if (!activeToken?.tokenId) return;
        /* eslint-disable react-hooks/set-state-in-effect -- intentional: reset all per-token state when the active token changes (sync to external selection). */
        setExchange(null); setPoolAddress(null); setQuoteAddress(null);
        setCreatorAddress(null); setBaseVaultAddress(null); setQuoteVaultAddress(null);
        setTokenStandard("spl"); setTxStatus("idle"); setTxResult(null); resetPrepare();
        /* eslint-enable react-hooks/set-state-in-effect */

        const fetchGMGNInfo = async () => {
            try {
                const res = await fetch(`${config.baseGmgnUrl}/token/${activeToken.tokenId}/info`);
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
    }, [activeToken?.tokenId, resetPrepare]);

    // Fetch token balance
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset balance to 0 when prerequisites missing.
        if (!activeToken?.tokenId || !turnkeyAddress || !isAuthenticated) { setTokenBalance(0); return; }
        const fetchBalance = async () => {
            const mintPubkey = new PublicKey(activeToken.tokenId);
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
    }, [activeToken?.tokenId, turnkeyAddress, isAuthenticated, tokenDecimals, balanceRefreshTrigger, connection]);

    // Auto-prepare BUY when amount changes (debounced)
    useEffect(() => {
        if (!isAuthenticated || !socketConnected || action !== "buy") return;
        const val = parseFloat(solAmount);
        if (!val || val <= 0) { resetPrepare(); return; }
        const timer = setTimeout(() => {
            const slippageBpsVal = slippageBps > 0 ? slippageBps : undefined;
            const poolHint = getPoolHint();
            prepareBuy({ mint: activeToken!.tokenId, solAmount: val, slippageBps: slippageBpsVal, ...poolHint });
        }, 300);
        return () => clearTimeout(timer);
    }, [solAmount, isAuthenticated, socketConnected, action, activeToken?.tokenId, slippageBps, exchange, prepareBuy, resetPrepare, getPoolHint]);

    // Auto-prepare SELL when amount changes (debounced)
    useEffect(() => {
        if (!isAuthenticated || !socketConnected || action !== "sell") return;
        const val = parseFloat(sellAmount);
        if (!val || val <= 0) { resetPrepare(); return; }
        const timer = setTimeout(() => {
            const slippageBpsVal = slippageBps > 0 ? slippageBps : undefined;
            const poolHint = getPoolHint();
            prepareSell({ mint: activeToken!.tokenId, tokenAmount: val, tokenDecimals, slippageBps: slippageBpsVal, ...poolHint });
        }, 300);
        return () => clearTimeout(timer);
    }, [sellAmount, isAuthenticated, socketConnected, action, activeToken?.tokenId, tokenDecimals, slippageBps, exchange, prepareSell, resetPrepare, getPoolHint]);

    // Handle execute results — verify on-chain before showing success
    useEffect(() => {
        if (!lastSignature) return;

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
                            if (action === "buy" && estimatedTokens) {
                                setTokenBalance((prev) => prev + estimatedTokens / Math.pow(10, tokenDecimals));
                            } else if (action === "sell" && sellAmount) {
                                setTokenBalance((prev) => Math.max(0, prev - parseFloat(sellAmount)));
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
    }, [lastSignature]);

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

        const poolHint = getPoolHint();
        const slippageBpsVal = slippageBps > 0 ? slippageBps : undefined;

        if (socketReady) {
            // TX is pre-signed, just broadcast
            if (action === "buy") executeBuy();
            else executeSell();
        } else {
            // Instant flow (prepare + execute in one step)
            if (action === "buy") {
                instantBuy({ mint: activeToken!.tokenId, solAmount: parseFloat(solAmount), slippageBps: slippageBpsVal, ...poolHint });
            } else {
                instantSell({ mint: activeToken!.tokenId, tokenAmount: parseFloat(sellAmount), tokenDecimals, slippageBps: slippageBpsVal, ...poolHint });
            }
        }
    };

    const handleDismiss = () => { setTxStatus("idle"); setTxResult(null); resetPrepare(); };

    const isProcessing = isPreparing || socketExecuting || txStatus === "sending";

    const getButtonText = () => {
        if (socketExecuting || txStatus === "sending") return "Executing...";
        if (isPreparing) return "Preparing...";
        if (socketReady && action === "buy" && estimatedDisplay) return `Buy ~${estimatedDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${activeToken?.symbol || ""}`;
        if (socketReady && action === "sell" && estimatedSolDisplay) return `Sell for ~${estimatedSolDisplay.toFixed(4)} SOL`;
        return `${isBuy ? "Buy" : "Sell"} ${activeToken?.symbol || "Token"}`;
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-white/10">
            {/* Mode Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => { setAction("buy"); setSolAmount(""); setSellAmount(""); resetPrepare(); setTxStatus("idle"); setTxResult(null); }}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${isBuy ? "bg-acid-green/20 text-acid-green border-b-2 border-[#39FF14]" : "text-muted-high hover:text-fg"}`}
                >Buy</button>
                <button
                    onClick={() => { setAction("sell"); setSolAmount(""); setSellAmount(""); resetPrepare(); setTxStatus("idle"); setTxResult(null); }}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${!isBuy ? "bg-[#FF003C]/20 text-error border-b-2 border-[#FF003C]" : "text-muted-high hover:text-fg"}`}
                >Sell</button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {/* Connection Status */}
                {!socketConnected && isAuthenticated && (
                    <div className="p-2 bg-error/10 border border-error/30 flex items-center justify-center">
                        <LiveDot status="down" size="xs" label="Trade server disconnected" />
                    </div>
                )}

                {/* Amount Input */}
                {isBuy ? (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="trade-buy-amount" className="text-meta text-muted-high uppercase tracking-widest">Amount (SOL)</label>
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
                    <div className="flex flex-col gap-2">
                        <label htmlFor="trade-sell-amount" className="text-meta text-muted-high uppercase tracking-widest">Amount ({activeToken?.symbol || "Tokens"})</label>
                        <div role="group" aria-label="Sell percentage" className="grid grid-cols-4 gap-2">
                            {SELL_PRESETS.map((pct) => (
                                <button key={pct} type="button" onClick={() => handleSellPreset(pct)}
                                    aria-pressed={sellPreset === pct}
                                    className="min-h-6 px-2 py-1 text-meta font-mono font-bold border transition-colors border-line text-fg-soft hover:border-muted-high hover:text-fg active:scale-[0.97] focus-ring"
                                    style={{ borderColor: sellPreset === pct ? accentColor : undefined, color: sellPreset === pct ? accentColor : undefined }}
                                >{pct}%</button>
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
                        <span className="text-meta text-muted-high font-mono num">Holdings: {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {activeToken?.symbol || ""}</span>
                    </div>
                )}

                {/* Quote Display */}
                {activeToken && (isBuy ? solAmount : sellAmount) && (
                    <div className="flex flex-col gap-1.5 p-3 bg-elevated border border-white/10">
                        <div className="flex justify-between text-meta">
                            <span className="text-muted-high">You {isBuy ? "pay" : "sell"}</span>
                            <span className="text-fg font-mono num">{isBuy ? `${solAmount} SOL` : `${sellAmount} ${activeToken.symbol}`}</span>
                        </div>
                        <div className="flex justify-between text-meta">
                            <span className="text-muted-high">You receive</span>
                            <span className="text-fg font-mono num">
                                {isPreparing ? (
                                    <span className="text-muted-high animate-pulse">Calculating...</span>
                                ) : socketReady && isBuy && estimatedDisplay ? (
                                    `~${estimatedDisplay.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${activeToken.symbol}`
                                ) : socketReady && !isBuy && estimatedSolDisplay ? (
                                    `~${estimatedSolDisplay.toFixed(4)} SOL`
                                ) : "--"}
                            </span>
                        </div>
                        {(pricePerToken || sellPricePerToken) && (
                            <div className="flex justify-between text-meta">
                                <span className="text-muted-high">Price per token</span>
                                <span className="text-fg-soft font-mono num">{((pricePerToken || sellPricePerToken)!).toFixed(9)} SOL</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Wallet Balance */}
                <div className="flex flex-col gap-1 p-3 bg-elevated border border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={14} aria-hidden="true" className="text-acid-green" />
                            <span className="text-meta text-muted-high uppercase">Trading Wallet</span>
                        </div>
                        <span className="text-xs font-mono text-fg num">
                            {turnkeyBalance !== null ? `${turnkeyBalance.toFixed(4)} SOL` : "-- SOL"}
                        </span>
                    </div>
                    {turnkeyAddress && (
                        <span className="text-meta text-muted font-mono num pl-6">{turnkeyAddress.slice(0, 4)}...{turnkeyAddress.slice(-4)}</span>
                    )}
                </div>

                {/* Slippage */}
                <SlippageSettings />

                {/* TX Result */}
                {txResult && (
                    <div className={`p-3 border text-meta font-mono ${txResult.error ? "bg-[#FF003C]/10 border-[#FF003C]/30 text-error" : "bg-acid-green/10 border-[#39FF14]/30 text-acid-green"}`}>
                        {txResult.error ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={12} /> {txResult.error}
                                </div>
                                {txResult.signature && (
                                    <a href={`https://solscan.io/tx/${txResult.signature}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 underline opacity-70">
                                        View failed TX <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                        ) : txResult.signature ? (
                            <div className="flex flex-col gap-1">
                                <span>Transaction confirmed!</span>
                                <a href={`https://solscan.io/tx/${txResult.signature}`} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 underline">
                                    View on Solscan <ExternalLink size={10} />
                                </a>
                            </div>
                        ) : null}
                        <button onClick={handleDismiss} className="mt-2 text-meta opacity-60 hover:opacity-100">Dismiss</button>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-4 border-t border-white/10">
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
