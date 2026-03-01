"use client";

import { useEffect, useCallback } from "react";
import { useTerminalStore } from "@/store/terminal.store";
import { useBagsWallet } from "@/hooks/useWallet";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { bagsService } from "@/services/bags.service";
import { SlippageSettings } from "@/components/terminal/SlippageSettings";
import { TransactionStatus } from "@/components/terminal/TransactionStatus";
import { SOL_MINT } from "@/lib/bags-types";
import { Wallet } from "lucide-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

const AMOUNT_PRESETS = [0.1, 0.5, 1, 5];

export function TerminalTradePanel() {
    const {
        tradePanel,
        activeToken,
        slippageBps,
        priorityFee,
        swapStatus,
        lastSignature,
        swapError,
        setTradePanelMode,
        setTradePanelOrderType,
        setTradePanelAmount,
        setSwapStatus,
        setLastSignature,
        setSwapError,
    } = useTerminalStore();

    const {
        connected,
        publicKey,
        balance,
        sendTransaction,
        connection,
        addTransaction,
        updateTransaction,
        refreshBalance,
    } = useBagsWallet();

    const { quote, isLoading: quoteLoading, error: quoteError, fetchQuote, clearQuote } = useSwapQuote();

    const isBuy = tradePanel.mode === 'buy';
    const accentColor = isBuy ? "#39FF14" : "#FF003C";
    const accentBg = isBuy ? "bg-[#39FF14]" : "bg-[#FF003C]";

    // Fetch quote when amount or mode changes
    useEffect(() => {
        if (!activeToken || tradePanel.amount <= 0) {
            clearQuote();
            return;
        }

        const inputToken = isBuy ? SOL_MINT : activeToken.tokenId;
        const outputToken = isBuy ? activeToken.tokenId : SOL_MINT;

        fetchQuote({
            inputToken,
            outputToken,
            amount: tradePanel.amount,
            slippageBps,
            priorityFee: priorityFee || undefined,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tradePanel.amount, tradePanel.mode, activeToken?.tokenId, slippageBps]);

    const handleSwap = useCallback(async () => {
        if (!connected || !publicKey || !activeToken || !sendTransaction) return;

        const inputToken = isBuy ? SOL_MINT : activeToken.tokenId;
        const outputToken = isBuy ? activeToken.tokenId : SOL_MINT;

        const txId = `swap_${Date.now()}`;

        try {
            setSwapStatus('pending');
            setSwapError(null);

            // Get serialized transaction from API
            const serializedTx = await bagsService.createSwapTransaction({
                inputToken,
                outputToken,
                amount: tradePanel.amount,
                slippageBps,
                priorityFee: priorityFee || undefined,
                walletAddress: publicKey,
            });

            // Deserialize and send
            const txBuffer = Buffer.from(serializedTx, 'base64');
            let tx: Transaction | VersionedTransaction;
            try {
                tx = VersionedTransaction.deserialize(txBuffer);
            } catch {
                tx = Transaction.from(txBuffer);
            }

            setSwapStatus('confirming');

            const signature = await sendTransaction(tx, connection);

            // Track transaction
            addTransaction({
                id: txId,
                type: 'swap',
                signature,
                status: 'pending',
                timestamp: Date.now(),
                details: {
                    tokenSymbol: activeToken.symbol,
                    tokenMint: activeToken.tokenId,
                    amountIn: tradePanel.amount,
                    amountOut: quote?.outputAmount,
                    side: isBuy ? 'buy' : 'sell',
                },
            });

            // Confirm transaction
            await connection.confirmTransaction(signature, 'confirmed');

            setSwapStatus('success');
            setLastSignature(signature);
            updateTransaction(txId, { status: 'confirmed' });

            // Refresh balance
            setTimeout(() => refreshBalance(), 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
            setSwapStatus('error');
            setSwapError(errorMessage);
            updateTransaction(txId, { status: 'failed' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, publicKey, activeToken, isBuy, tradePanel.amount, slippageBps, priorityFee, quote, sendTransaction, connection]);

    const handleRetry = () => {
        setSwapStatus('idle');
        setSwapError(null);
        setLastSignature(null);
    };

    const handleDismiss = () => {
        setSwapStatus('idle');
        setLastSignature(null);
    };

    const isSwapDisabled = !connected || !activeToken || tradePanel.amount <= 0 || quoteLoading || swapStatus === 'pending' || swapStatus === 'confirming';

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-white/10">
            {/* Mode Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setTradePanelMode('buy')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${isBuy
                            ? 'bg-[#39FF14]/20 text-[#39FF14] border-b-2 border-[#39FF14]'
                            : 'text-[#666] hover:text-[#EDEDED]'
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setTradePanelMode('sell')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${!isBuy
                            ? 'bg-[#FF003C]/20 text-[#FF003C] border-b-2 border-[#FF003C]'
                            : 'text-[#666] hover:text-[#EDEDED]'
                        }`}
                >
                    Sell
                </button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
                {/* Order Type */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Order Type</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTradePanelOrderType('market')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${tradePanel.orderType === 'market'
                                    ? 'border-[#EDEDED] text-[#EDEDED] bg-[#1A1A1A]'
                                    : 'border-[#333] text-[#666] hover:border-[#666]'
                                }`}
                        >
                            Market
                        </button>
                        <button
                            onClick={() => setTradePanelOrderType('limit')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${tradePanel.orderType === 'limit'
                                    ? 'border-[#EDEDED] text-[#EDEDED] bg-[#1A1A1A]'
                                    : 'border-[#333] text-[#666] hover:border-[#666]'
                                }`}
                        >
                            Limit
                        </button>
                    </div>
                </div>

                {/* Amount Presets */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Amount (SOL)</span>
                    <div className="grid grid-cols-4 gap-2">
                        {AMOUNT_PRESETS.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setTradePanelAmount(amount)}
                                className="py-2 text-[10px] font-mono font-bold border transition-colors border-[#333] text-[#888] hover:border-[#666]"
                                style={{
                                    borderColor: tradePanel.amount === amount ? accentColor : undefined,
                                    color: tradePanel.amount === amount ? accentColor : undefined,
                                }}
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Amount Input */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-[#666] uppercase tracking-widest">Custom Amount</span>
                    <div className="relative">
                        <input
                            type="number"
                            value={tradePanel.amount}
                            onChange={(e) => setTradePanelAmount(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                            placeholder="0.00"
                            step="0.1"
                            min="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">
                            SOL
                        </span>
                    </div>
                </div>

                {/* Limit Price (if limit order) */}
                {tradePanel.orderType === 'limit' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] text-[#666] uppercase tracking-widest">Limit Price</span>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
                                placeholder="0.00000"
                                step="0.00001"
                                min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">
                                USD
                            </span>
                        </div>
                    </div>
                )}

                {/* Swap Quote */}
                {activeToken && (
                    <div className="flex flex-col gap-2 p-3 bg-[#1A1A1A] border border-white/10">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">You {isBuy ? 'pay' : 'sell'}</span>
                            <span className="text-[#EDEDED] font-mono">{tradePanel.amount} {isBuy ? 'SOL' : activeToken.symbol}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">You receive</span>
                            <span className="text-[#EDEDED] font-mono">
                                {quoteLoading ? (
                                    <span className="text-[#666] animate-pulse">Loading...</span>
                                ) : quote ? (
                                    `~${quote.outputAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${isBuy ? activeToken.symbol : 'SOL'}`
                                ) : (
                                    `~${((tradePanel.amount * 150) / (activeToken.priceUsd * 1000 || 1)).toFixed(0)} ${activeToken.symbol}`
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">Price impact</span>
                            <span className={`font-mono ${(quote?.priceImpact || 0) > 5 ? 'text-[#FF003C]' : 'text-[#39FF14]'}`}>
                                {quote ? `${quote.priceImpact.toFixed(2)}%` : '<0.1%'}
                            </span>
                        </div>
                        {quote && (
                            <>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-[#666]">Min received</span>
                                    <span className="text-[#888] font-mono">
                                        {quote.minimumReceived.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-[#666]">Network fee</span>
                                    <span className="text-[#888] font-mono">
                                        ~{quote.networkFee.toFixed(5)} SOL
                                    </span>
                                </div>
                            </>
                        )}
                        {quoteError && (
                            <span className="text-[9px] text-[#FF003C] font-mono">{quoteError}</span>
                        )}
                    </div>
                )}

                {/* Wallet Balance */}
                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/10">
                    <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-[#666]" />
                        <span className="text-[10px] text-[#666] uppercase">Balance</span>
                    </div>
                    <span className="text-xs font-mono text-[#EDEDED]">
                        {connected && balance !== null ? `${balance.toFixed(4)} SOL` : '-- SOL'}
                    </span>
                </div>

                {/* Slippage Settings */}
                <SlippageSettings />

                {/* Transaction Status */}
                <TransactionStatus
                    status={swapStatus}
                    signature={lastSignature}
                    error={swapError}
                    onRetry={handleRetry}
                    onDismiss={handleDismiss}
                />
            </div>

            {/* Action Button */}
            <div className="p-4 border-t border-white/10">
                {!connected ? (
                    <button
                        className="w-full py-3 text-sm font-bold uppercase tracking-wider text-[#888] bg-[#1A1A1A] border border-white/10 hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
                        onClick={() => {
                            // Trigger wallet modal via WalletButton
                            document.querySelector<HTMLButtonElement>('[data-wallet-connect]')?.click();
                        }}
                    >
                        Connect Wallet
                    </button>
                ) : (
                    <button
                        onClick={handleSwap}
                        disabled={isSwapDisabled}
                        className={`w-full py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${accentBg}`}
                    >
                        {swapStatus === 'pending' || swapStatus === 'confirming'
                            ? 'Processing...'
                            : `${isBuy ? 'Buy' : 'Sell'} ${activeToken?.symbol || 'Token'}`
                        }
                    </button>
                )}
            </div>
        </div>
    );
}
