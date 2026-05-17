"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTerminalStore } from "@/store/terminal.store";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";
import { useTradeSocket } from "@/hooks/useTradeSocket";
import { toast } from "@/components/ui/Toast";
import { Wallet, Zap, Loader2, ExternalLink, AlertCircle, Settings2, ChevronDown } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { config } from "@/config/env";

const BUY_PRESETS = [0.1, 0.5, 1, 5];
const SELL_PRESETS = [25, 50, 75, 100];
const SLIPPAGE_PRESETS = ["auto", "0.5", "1", "3", "5"];
const PRIORITY_PRESETS: { label: string; value: string }[] = [
    { label: "None", value: "0" },
    { label: "0.001", value: "0.001" },
    { label: "0.005", value: "0.005" },
    { label: "0.01", value: "0.01" },
];
const JITO_MODES: ("off" | "auto" | "manual")[] = ["off", "auto", "manual"];

type TradeAction = "buy" | "sell";
type JitoMode = "off" | "auto" | "manual";
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
    const { activeToken } = useTerminalStore();
    const {
        isAuthenticated, turnkeyAddress,
        balance: turnkeyBalance, refreshBalance: refreshTurnkeyBalance,
        user, switchActiveWallet,
    } = useTurnkey();
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    const {
        isConnected: socketConnected,
        isPreparing, isReady: socketReady, isExecuting: socketExecuting,
        estimatedTokens, estimatedDisplay, pricePerToken,
        estimatedSol, estimatedSolDisplay, sellPricePerToken,
        lastSignature, lastError, jitoTips,
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

    // Zero-Config / advanced trade settings (LOCAL state — omnera parity, not the terminal store)
    const [zeroConfig, setZeroConfig] = useState(true);
    const [jitoMode, setJitoMode] = useState<JitoMode>("auto");
    const [jitoManualTip, setJitoManualTip] = useState("0.001");
    const [priorityFee, setPriorityFee] = useState("0"); // SOL string; "0" = None
    const [slippage, setSlippage] = useState("auto"); // number string or "auto"
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [walletMenuOpen, setWalletMenuOpen] = useState(false);

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

    // Snapshot of the dispatched trade's context — read by the on-chain confirm
    // effect so a buy/sell tab switch or token change mid-poll cannot mis-attribute
    // the optimistic balance update or success/fail toast (CR-01).
    const tradeCtxRef = useRef<{
        action: TradeAction;
        isBuy: boolean;
        symbol: string;
        estimatedTokens: number | null;
        sellAmount: string;
        tokenDecimals: number;
        mint: string | undefined;
    } | null>(null);

    const isBuy = action === "buy";
    const accentColor = isBuy ? "#39FF14" : "#FF003C";

    const connection = useMemo(() => new Connection(config.solanaRpcUrl), []);

    // --- omnera EXACT transform formulas (RESEARCH §1, replicate verbatim) ---
    const effectiveSlippageBps = useMemo<number | undefined>(() => {
        return slippage === "auto" ? undefined : Math.round(parseFloat(slippage) * 100);
    }, [slippage]);

    const effectivePriorityFee = useMemo<number | undefined>(() => {
        return zeroConfig ? undefined : Math.floor(((parseFloat(priorityFee) || 0) * 1e15) / 1_000_000);
    }, [zeroConfig, priorityFee]);

    const effectiveJitoTip = useMemo<number | undefined>(() => {
        if (zeroConfig) return undefined;
        if (jitoMode === "off") return 0;
        if (jitoMode === "auto" && jitoTips)
            return Math.floor(jitoTips.landed_tips_50th_percentile * 1_000_000_000);
        if (jitoMode === "manual")
            return Math.floor(parseFloat(jitoManualTip) * 1_000_000_000) || 0;
        return 0;
    }, [zeroConfig, jitoMode, jitoTips, jitoManualTip]);

    // Enabling Zero-Config forces slippage back to "auto" (omnera TokenTrading.tsx:804)
    const toggleZeroConfig = useCallback(() => {
        setZeroConfig((prev) => {
            const next = !prev;
            if (next) setSlippage("auto");
            return next;
        });
    }, []);

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
        setExchange(null); setPoolAddress(null); setQuoteAddress(null);
        setCreatorAddress(null); setBaseVaultAddress(null); setQuoteVaultAddress(null);
        setTokenStandard("spl"); setTxStatus("idle"); setTxResult(null); resetPrepare();

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
            const poolHint = getPoolHint();
            prepareBuy({
                mint: activeToken!.tokenId, solAmount: val,
                slippageBps: effectiveSlippageBps, priorityFee: effectivePriorityFee, jitoTip: effectiveJitoTip,
                ...poolHint,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [solAmount, isAuthenticated, socketConnected, action, activeToken?.tokenId, effectiveSlippageBps, effectivePriorityFee, effectiveJitoTip, exchange, prepareBuy, resetPrepare, getPoolHint]);

    // Auto-prepare SELL when amount changes (debounced)
    useEffect(() => {
        if (!isAuthenticated || !socketConnected || action !== "sell") return;
        const val = parseFloat(sellAmount);
        if (!val || val <= 0) { resetPrepare(); return; }
        const timer = setTimeout(() => {
            const poolHint = getPoolHint();
            prepareSell({
                mint: activeToken!.tokenId, tokenAmount: val, tokenDecimals,
                slippageBps: effectiveSlippageBps, priorityFee: effectivePriorityFee, jitoTip: effectiveJitoTip,
                ...poolHint,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [sellAmount, isAuthenticated, socketConnected, action, activeToken?.tokenId, tokenDecimals, effectiveSlippageBps, effectivePriorityFee, effectiveJitoTip, exchange, prepareSell, resetPrepare, getPoolHint]);

    // Handle execute results — verify on-chain before showing success
    useEffect(() => {
        if (!lastSignature) return;

        // Read ALL trade-context values from the snapshot taken when this trade was
        // dispatched (not live component state) so a tab/token switch during the
        // 0.5–6s poll cannot mis-attribute the balance update or toast (CR-01).
        const ctx = tradeCtxRef.current;
        const ctxIsBuy = ctx ? ctx.isBuy : isBuy;
        const ctxAction = ctx ? ctx.action : action;
        const ctxSymbol = ctx ? ctx.symbol : (activeToken?.symbol ?? "");
        const ctxEstimatedTokens = ctx ? ctx.estimatedTokens : estimatedTokens;
        const ctxSellAmount = ctx ? ctx.sellAmount : sellAmount;
        const ctxTokenDecimals = ctx ? ctx.tokenDecimals : tokenDecimals;
        const ctxMint = ctx ? ctx.mint : activeToken?.tokenId;

        let cancelled = false;

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
                        // Cancellation guard: ignore a late poll result for a
                        // superseded trade (effect re-ran, or the snapshotted
                        // trade's mint no longer matches the dispatched one).
                        if (cancelled || (tradeCtxRef.current && tradeCtxRef.current.mint !== ctxMint)) return;
                        if (status.err) {
                            setTxResult({ signature: lastSignature, error: "Transaction failed on-chain. Check if your trading wallet has enough SOL." });
                            setTxStatus("error");
                            toast.error(`${ctxIsBuy ? "Buy" : "Sell"} failed on-chain`);
                            return;
                        }
                        if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
                            setTxStatus("success");
                            toast.success(`${ctxIsBuy ? "Bought" : "Sold"} ${ctxSymbol} — confirmed`);
                            if (ctxAction === "buy" && ctxEstimatedTokens) {
                                setTokenBalance((prev) => prev + ctxEstimatedTokens / Math.pow(10, ctxTokenDecimals));
                            } else if (ctxAction === "sell" && ctxSellAmount) {
                                setTokenBalance((prev) => Math.max(0, prev - parseFloat(ctxSellAmount)));
                            }
                            setSolAmount(""); setSellAmount(""); setSellPreset(null);
                            setTimeout(() => { setBalanceRefreshTrigger((p) => p + 1); refreshTurnkeyBalance(); }, 3000);
                            return;
                        }
                    }
                } catch { /* RPC error, retry */ }

                if (cancelled) return;
                await new Promise((r) => setTimeout(r, 500));
            }

            if (cancelled) return;
            // After 6s of polling with no result
            setTxResult({ signature: lastSignature, error: "Transaction not confirmed. It may have been dropped." });
            setTxStatus("error");
            toast.error("Transaction not confirmed — may have been dropped");
        };

        confirmTx();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastSignature]);

    // Handle errors
    useEffect(() => {
        if (lastError) {
            setTxResult({ error: lastError });
            setTxStatus("error");
            toast.error(lastError);
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
        toast.info(`${isBuy ? "Buying" : "Selling"} ${activeToken?.symbol ?? ""}...`);

        // Snapshot the dispatched trade context for the confirm effect (CR-01).
        tradeCtxRef.current = {
            action,
            isBuy,
            symbol: activeToken?.symbol ?? "",
            estimatedTokens,
            sellAmount,
            tokenDecimals,
            mint: activeToken?.tokenId,
        };

        const poolHint = getPoolHint();

        if (socketReady) {
            // TX is pre-signed, just broadcast
            if (action === "buy") executeBuy();
            else executeSell();
        } else {
            // Instant flow (prepare + execute in one step)
            if (action === "buy") {
                instantBuy({
                    mint: activeToken!.tokenId, solAmount: parseFloat(solAmount),
                    slippageBps: effectiveSlippageBps, priorityFee: effectivePriorityFee, jitoTip: effectiveJitoTip,
                    ...poolHint,
                });
            } else {
                instantSell({
                    mint: activeToken!.tokenId, tokenAmount: parseFloat(sellAmount), tokenDecimals,
                    slippageBps: effectiveSlippageBps, priorityFee: effectivePriorityFee, jitoTip: effectiveJitoTip,
                    ...poolHint,
                });
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

    const wallets = user?.wallets ?? [];
    const activeWalletId = user?.activeWallet?.id ?? null;
    const walletLabel = (name: string) => (name === "omnera" ? "Trading" : name);

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-white/10">
            {/* Mode Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => { setAction("buy"); setSolAmount(""); setSellAmount(""); resetPrepare(); setTxStatus("idle"); setTxResult(null); }}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${isBuy ? "bg-[#39FF14]/20 text-[#39FF14] border-b-2 border-[#39FF14]" : "text-[#666] hover:text-[#EDEDED]"}`}
                >Buy</button>
                <button
                    onClick={() => { setAction("sell"); setSolAmount(""); setSellAmount(""); resetPrepare(); setTxStatus("idle"); setTxResult(null); }}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${!isBuy ? "bg-[#FF003C]/20 text-[#FF003C] border-b-2 border-[#FF003C]" : "text-[#666] hover:text-[#EDEDED]"}`}
                >Sell</button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {/* Connection Status */}
                {!socketConnected && isAuthenticated && (
                    <div className="p-2 bg-[#FF003C]/10 border border-[#FF003C]/30 text-[10px] text-[#FF003C] font-mono text-center">
                        Trade server disconnected
                    </div>
                )}

                {/* Wallet Selector */}
                {isAuthenticated && wallets.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setWalletMenuOpen((o) => !o)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border border-[#333] text-[10px] font-mono text-[#EDEDED] hover:border-[#666] transition-colors"
                        >
                            <span className="flex items-center gap-2 uppercase tracking-wider">
                                <Wallet size={12} className="text-[#39FF14]" />
                                {user?.activeWallet ? walletLabel(user.activeWallet.walletName) : "Select Wallet"}
                                {user?.activeWallet && (
                                    <span className="text-[#666]">
                                        {user.activeWallet.solanaAddress.slice(0, 4)}...{user.activeWallet.solanaAddress.slice(-4)}
                                    </span>
                                )}
                            </span>
                            <ChevronDown size={12} className="text-[#666]" />
                        </button>
                        {walletMenuOpen && (
                            <div className="absolute z-20 mt-1 w-full bg-[#1A1A1A] border border-[#333] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                                {wallets.map((w) => (
                                    <button
                                        key={w.id}
                                        onClick={() => { switchActiveWallet(w.id); setWalletMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors hover:bg-[#0A0A0A] ${w.id === activeWalletId ? "text-[#39FF14]" : "text-[#888]"}`}
                                    >
                                        <span>{walletLabel(w.walletName)}</span>
                                        <span className="text-[#666] normal-case">{w.solanaAddress.slice(0, 4)}...{w.solanaAddress.slice(-4)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Amount Input */}
                {isBuy ? (
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] text-[#666] uppercase tracking-widest">Amount (SOL)</span>
                        <div className="grid grid-cols-4 gap-2">
                            {BUY_PRESETS.map((amt) => (
                                <button key={amt} onClick={() => setSolAmount(String(amt))}
                                    className="py-2 text-[10px] font-mono font-bold border transition-colors border-[#333] text-[#888] hover:border-[#666]"
                                    style={{ borderColor: solAmount === String(amt) ? accentColor : undefined, color: solAmount === String(amt) ? accentColor : undefined }}
                                >{amt}</button>
                            ))}
                        </div>
                        <div className="relative">
                            <input type="number" value={solAmount} onChange={(e) => setSolAmount(e.target.value)}
                                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                                placeholder="0.00" step="0.1" min="0" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">SOL</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] text-[#666] uppercase tracking-widest">Amount ({activeToken?.symbol || "Tokens"})</span>
                        <div className="grid grid-cols-4 gap-2">
                            {SELL_PRESETS.map((pct) => (
                                <button key={pct} onClick={() => handleSellPreset(pct)}
                                    className="py-2 text-[10px] font-mono font-bold border transition-colors border-[#333] text-[#888] hover:border-[#666]"
                                    style={{ borderColor: sellPreset === pct ? accentColor : undefined, color: sellPreset === pct ? accentColor : undefined }}
                                >{pct}%</button>
                            ))}
                        </div>
                        <div className="relative">
                            <input type="number" value={sellAmount} onChange={(e) => { setSellAmount(e.target.value); setSellPreset(null); }}
                                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#FF003C] focus:outline-none"
                                placeholder="0.00" step="0.1" min="0" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">{activeToken?.symbol || "Tokens"}</span>
                        </div>
                        <span className="text-[9px] text-[#666] font-mono">Holdings: {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {activeToken?.symbol || ""}</span>
                    </div>
                )}

                {/* Quote Display */}
                {activeToken && (isBuy ? solAmount : sellAmount) && (
                    <div className="flex flex-col gap-1.5 p-3 bg-[#1A1A1A] border border-white/10">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">You {isBuy ? "pay" : "sell"}</span>
                            <span className="text-[#EDEDED] font-mono">{isBuy ? `${solAmount} SOL` : `${sellAmount} ${activeToken.symbol}`}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">You receive</span>
                            <span className="text-[#EDEDED] font-mono">
                                {isPreparing ? (
                                    <span className="text-[#666] animate-pulse">Calculating...</span>
                                ) : socketReady && isBuy && estimatedDisplay ? (
                                    `~${estimatedDisplay.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${activeToken.symbol}`
                                ) : socketReady && !isBuy && estimatedSolDisplay ? (
                                    `~${estimatedSolDisplay.toFixed(4)} SOL`
                                ) : "--"}
                            </span>
                        </div>
                        {(pricePerToken || sellPricePerToken) && (
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[#666]">Price per token</span>
                                <span className="text-[#888] font-mono">{((pricePerToken || sellPricePerToken)!).toFixed(9)} SOL</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Wallet Balance */}
                <div className="flex flex-col gap-1 p-3 bg-[#1A1A1A] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-[#39FF14]" />
                            <span className="text-[10px] text-[#666] uppercase">Trading Wallet</span>
                        </div>
                        <span className="text-xs font-mono text-[#EDEDED]">
                            {turnkeyBalance !== null ? `${turnkeyBalance.toFixed(4)} SOL` : "-- SOL"}
                        </span>
                    </div>
                    {turnkeyAddress && (
                        <span className="text-[9px] text-[#444] font-mono pl-6">{turnkeyAddress.slice(0, 4)}...{turnkeyAddress.slice(-4)}</span>
                    )}
                </div>

                {/* Zero-Config / Advanced Settings */}
                <div className="flex flex-col gap-2 p-3 bg-[#1A1A1A] border border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[10px] text-[#666] uppercase tracking-widest">
                            <Settings2 size={12} className={zeroConfig ? "text-[#39FF14]" : "text-[#666]"} />
                            Zero-Config
                        </span>
                        <button
                            onClick={toggleZeroConfig}
                            role="switch"
                            aria-checked={zeroConfig}
                            className={`relative w-9 h-5 border transition-colors ${zeroConfig ? "bg-[#39FF14]/20 border-[#39FF14]" : "bg-[#0A0A0A] border-[#333]"}`}
                        >
                            <span
                                className={`absolute top-0.5 h-3.5 w-3.5 transition-all ${zeroConfig ? "left-[18px] bg-[#39FF14]" : "left-0.5 bg-[#666]"}`}
                            />
                        </button>
                    </div>
                    <p className="text-[9px] text-[#444] font-mono leading-relaxed">
                        {zeroConfig
                            ? "Backend auto-tunes slippage, priority fee & Jito tip."
                            : "Manual control of slippage, priority fee & Jito MEV."}
                    </p>

                    {!zeroConfig && (
                        <button
                            onClick={() => setSettingsOpen((o) => !o)}
                            className="flex items-center justify-between text-[9px] text-[#888] uppercase tracking-wider hover:text-[#EDEDED] transition-colors"
                        >
                            <span>Advanced Options</span>
                            <ChevronDown size={11} className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
                        </button>
                    )}

                    {!zeroConfig && settingsOpen && (
                        <div className="flex flex-col gap-3 pt-1">
                            {/* Slippage */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] text-[#666] uppercase tracking-widest">Slippage</span>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {SLIPPAGE_PRESETS.map((s) => (
                                        <button key={s} onClick={() => setSlippage(s)}
                                            className="py-1.5 text-[9px] font-mono font-bold border transition-colors border-[#333] text-[#888] hover:border-[#666]"
                                            style={{ borderColor: slippage === s ? "#39FF14" : undefined, color: slippage === s ? "#39FF14" : undefined }}
                                        >{s === "auto" ? "AUTO" : `${s}%`}</button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={slippage === "auto" ? "" : slippage}
                                        onChange={(e) => setSlippage(e.target.value === "" ? "auto" : e.target.value)}
                                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-1.5 text-[10px] font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                                        placeholder="Custom %" step="0.1" min="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#666] font-mono">%</span>
                                </div>
                            </div>

                            {/* Priority Fee */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] text-[#666] uppercase tracking-widest">Priority Fee (SOL)</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {PRIORITY_PRESETS.map((p) => (
                                        <button key={p.label} onClick={() => setPriorityFee(p.value)}
                                            className="py-1.5 text-[9px] font-mono font-bold border transition-colors border-[#333] text-[#888] hover:border-[#666]"
                                            style={{ borderColor: priorityFee === p.value ? "#39FF14" : undefined, color: priorityFee === p.value ? "#39FF14" : undefined }}
                                        >{p.label}</button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={priorityFee}
                                        onChange={(e) => setPriorityFee(e.target.value === "" ? "0" : e.target.value)}
                                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-1.5 text-[10px] font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                                        placeholder="0.00" step="0.001" min="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#666] font-mono">SOL</span>
                                </div>
                            </div>

                            {/* Jito MEV */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] text-[#666] uppercase tracking-widest">Jito MEV</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {JITO_MODES.map((m) => (
                                        <button key={m} onClick={() => setJitoMode(m)}
                                            className="py-1.5 text-[9px] font-mono font-bold uppercase border transition-colors border-[#333] text-[#888] hover:border-[#666]"
                                            style={{ borderColor: jitoMode === m ? "#FFD700" : undefined, color: jitoMode === m ? "#FFD700" : undefined }}
                                        >{m}</button>
                                    ))}
                                </div>
                                {jitoMode === "auto" && (
                                    <span className="text-[9px] text-[#888] font-mono">
                                        Live tip: ~{jitoTips?.landed_tips_50th_percentile?.toFixed(5) ?? "..."} SOL
                                    </span>
                                )}
                                {jitoMode === "manual" && (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={jitoManualTip}
                                            onChange={(e) => setJitoManualTip(e.target.value === "" ? "0" : e.target.value)}
                                            className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-1.5 text-[10px] font-mono text-[#EDEDED] focus:border-[#FFD700] focus:outline-none"
                                            placeholder="0.001" step="0.0001" min="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#666] font-mono">SOL</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* TX Result */}
                {txResult && (
                    <div className={`p-3 border text-[10px] font-mono ${txResult.error ? "bg-[#FF003C]/10 border-[#FF003C]/30 text-[#FF003C]" : "bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]"}`}>
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
                        <button onClick={handleDismiss} className="mt-2 text-[9px] opacity-60 hover:opacity-100">Dismiss</button>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-4 border-t border-white/10">
                {!connected ? (
                    <button onClick={() => setVisible(true)}
                        className="w-full py-3 text-sm font-bold uppercase tracking-wider text-[#888] bg-[#1A1A1A] border border-white/10 hover:border-[#39FF14] hover:text-[#39FF14] transition-all">
                        <span className="flex items-center justify-center gap-2"><Wallet size={14} /> Connect Wallet</span>
                    </button>
                ) : !isAuthenticated ? (
                    <button disabled className="w-full py-3 text-sm font-bold uppercase tracking-wider text-[#666] bg-[#1A1A1A] border border-white/10">
                        <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Creating Wallet...</span>
                    </button>
                ) : (
                    <button onClick={handleTrade} disabled={isProcessing || !activeToken || (isBuy ? !solAmount : !sellAmount)}
                        className={`w-full py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${socketReady ? "bg-[#FFD700]" : isBuy ? "bg-[#39FF14]" : "bg-[#FF003C]"}`}>
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> {getButtonText()}</span>
                        ) : (
                            getButtonText()
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
