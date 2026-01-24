'use client';

import { useRouter } from 'next/navigation';
import { useLaunchStore } from '@/store/launch.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { Loader2, CheckCircle2, XCircle, Rocket } from 'lucide-react';
import type { SendTransactionFn } from '@/lib/bags-types';

const STATUS_LABELS: Record<string, string> = {
  idle: '',
  uploading_image: 'Uploading image to IPFS...',
  creating_config: 'Creating fee share config...',
  generating_tx: 'Generating transaction...',
  awaiting_signature: 'Awaiting wallet signature...',
  confirming: 'Confirming on-chain...',
  success: 'Token launched successfully!',
  error: 'Launch failed',
};

export function TransactionSummary() {
  const router = useRouter();
  const { metadata, feeClaimers, initialBuyAmount, status, error, result, executeLaunch } = useLaunchStore();
  const { connected, publicKey, balance, sendTransaction, connection } = useBagsWallet();

  const txFeeEstimate = 0.01;
  const totalCost = initialBuyAmount + txFeeEstimate;
  const hasSufficientBalance = balance !== null && balance >= totalCost;

  const isFormValid =
    metadata.name.length > 0 &&
    metadata.symbol.length > 0 &&
    feeClaimers.length > 0 &&
    feeClaimers.reduce((sum, c) => sum + c.percentage, 0) === 100;

  const canLaunch = connected && isFormValid && hasSufficientBalance && status === 'idle';
  const isProcessing = ['uploading_image', 'creating_config', 'generating_tx', 'awaiting_signature', 'confirming'].includes(status);

  const handleLaunch = async () => {
    if (!publicKey || !sendTransaction) return;
    try {
      const launchResult = await executeLaunch(publicKey, sendTransaction as SendTransactionFn, connection);
      // Redirect to terminal after success
      setTimeout(() => {
        router.push(`/terminal/${launchResult.tokenMint}`);
      }, 2000);
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#0A0A0A] border border-white/10">
      <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Transaction Summary</h3>

      {/* Cost Breakdown */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-[#888]">Initial buy</span>
          <span className="text-[#EDEDED] font-mono">{initialBuyAmount} SOL</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[#888]">Transaction fees</span>
          <span className="text-[#EDEDED] font-mono">~{txFeeEstimate} SOL</span>
        </div>
        <div className="border-t border-white/10 pt-2 flex justify-between text-[11px]">
          <span className="text-[#EDEDED] font-bold">Total</span>
          <span className="text-[#39FF14] font-mono font-bold">~{totalCost.toFixed(3)} SOL</span>
        </div>
      </div>

      {/* Balance Warning */}
      {connected && !hasSufficientBalance && (
        <div className="p-2 bg-[#FF003C]/10 border border-[#FF003C]/30">
          <span className="text-[9px] text-[#FF003C] font-mono">
            Insufficient balance. Need {totalCost.toFixed(3)} SOL, have {(balance || 0).toFixed(3)} SOL
          </span>
        </div>
      )}

      {/* Status */}
      {isProcessing && (
        <div className="flex items-center gap-2 p-2 bg-[#39FF14]/10 border border-[#39FF14]/30">
          <Loader2 size={12} className="text-[#39FF14] animate-spin" />
          <span className="text-[9px] text-[#39FF14] font-mono">{STATUS_LABELS[status]}</span>
        </div>
      )}

      {status === 'success' && result && (
        <div className="flex items-center gap-2 p-2 bg-[#39FF14]/10 border border-[#39FF14]/30">
          <CheckCircle2 size={12} className="text-[#39FF14]" />
          <span className="text-[9px] text-[#39FF14] font-mono">
            Token launched! Redirecting to terminal...
          </span>
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-center gap-2 p-2 bg-[#FF003C]/10 border border-[#FF003C]/30">
          <XCircle size={12} className="text-[#FF003C]" />
          <span className="text-[9px] text-[#FF003C] font-mono">{error}</span>
        </div>
      )}

      {/* Launch Button */}
      <button
        onClick={handleLaunch}
        disabled={!canLaunch}
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold uppercase tracking-wider bg-[#39FF14] text-black hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Rocket size={14} />
        {!connected
          ? 'Connect Wallet'
          : isProcessing
            ? 'Launching...'
            : 'Launch Token'
        }
      </button>

      {!isFormValid && connected && (
        <p className="text-[8px] text-[#666] font-mono text-center">
          Fill all fields and configure fee claimers (total must equal 100%)
        </p>
      )}
    </div>
  );
}
