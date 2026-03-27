'use client';

import { useRouter } from 'next/navigation';
import { useLaunchStore } from '@/store/launch.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { Loader2, CheckCircle2, XCircle, Rocket, Heart } from 'lucide-react';
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
  const {
    metadata, feeClaimers, initialBuyAmount, status, error, result,
    tipEnabled, tipAmountSol, imageSourceMode, imageUrl,
    executeLaunch,
  } = useLaunchStore();
  const { connected, publicKey, balance, sendTransaction, connection } = useBagsWallet();

  // No API fees — only Solana tx costs
  const txFeeEstimate = 0.005;
  const tipCost = tipEnabled ? tipAmountSol : 0;
  const totalCost = initialBuyAmount + txFeeEstimate + tipCost;
  const hasSufficientBalance = balance !== null && balance >= totalCost;

  const hasImage = imageSourceMode === 'url' ? imageUrl.length > 0 : true;

  const isFormValid =
    metadata.name.length > 0 &&
    metadata.symbol.length > 0 &&
    hasImage &&
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
    } catch (err) {
      console.error('Launch failed:', err);
    }
  };

  return (
    <div className="card flex flex-col gap-3 p-4">
      <h3 className="label">Transaction Summary</h3>

      {/* Cost Breakdown */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-[#888]">Initial buy</span>
          <span className="text-[#EDEDED] font-mono">{initialBuyAmount} SOL</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[#888]">Solana tx fees</span>
          <span className="text-[#EDEDED] font-mono">~{txFeeEstimate} SOL</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[#888]">API fees</span>
          <span className="text-[#39FF14] font-mono font-bold">FREE</span>
        </div>
        {tipEnabled && tipAmountSol > 0 && (
          <div className="flex justify-between text-[10px]">
            <span className="text-[#FFD700] flex items-center gap-1">
              <Heart size={8} /> Tip
            </span>
            <span className="text-[#FFD700] font-mono">{tipAmountSol} SOL</span>
          </div>
        )}
        <div className="border-t border-white/10 pt-2 flex justify-between text-[11px]">
          <span className="text-[#EDEDED] font-bold">Total</span>
          <span className="text-[#39FF14] font-mono font-bold">~{totalCost.toFixed(3)} SOL</span>
        </div>
      </div>

      {/* Large claimer set notice */}
      {feeClaimers.length > 15 && (
        <div className="badge-blue p-2.5">
          <span className="text-[9px] font-mono">
            {feeClaimers.length} fee claimers — additional lookup table TX will be created
          </span>
        </div>
      )}

      {/* Balance Warning */}
      {connected && !hasSufficientBalance && (
        <div className="badge-red p-2.5">
          <span className="text-[9px] font-mono">
            Insufficient balance. Need {totalCost.toFixed(3)} SOL, have {(balance || 0).toFixed(3)} SOL
          </span>
        </div>
      )}

      {/* Status */}
      {isProcessing && (
        <div className="badge-green flex items-center gap-2 p-2.5">
          <Loader2 size={12} className="animate-spin" />
          <span className="text-[9px] font-mono">{STATUS_LABELS[status]}</span>
        </div>
      )}

      {status === 'success' && result && (
        <div className="badge-green flex items-center gap-2 p-2.5">
          <CheckCircle2 size={12} />
          <span className="text-[9px] font-mono">
            Token launched! Redirecting to terminal...
          </span>
        </div>
      )}

      {status === 'error' && error && (
        <div className="badge-red flex items-center gap-2 p-2.5">
          <XCircle size={12} />
          <span className="text-[9px] font-mono">{error}</span>
        </div>
      )}

      {/* Launch Button */}
      <button
        onClick={handleLaunch}
        disabled={!canLaunch}
        className="btn-primary flex items-center justify-center gap-2 w-full py-3 text-sm"
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
