'use client';

import { Loader2, CheckCircle2, XCircle, ExternalLink, RotateCcw } from 'lucide-react';
import type { SwapStatus } from '@/lib/bags-types';

interface TransactionStatusProps {
  status: SwapStatus;
  signature?: string | null;
  error?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function TransactionStatus({ status, signature, error, onRetry, onDismiss }: TransactionStatusProps) {
  if (status === 'idle') return null;

  return (
    <div className="p-3 border border-white/10 bg-[#0A0A0A]">
      {/* Pending / Confirming */}
      {(status === 'pending' || status === 'confirming' || status === 'quoting') && (
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="text-[#39FF14] animate-spin" />
          <span className="text-[10px] font-mono text-[#EDEDED]">
            {status === 'quoting' && 'Fetching quote...'}
            {status === 'pending' && 'Awaiting signature...'}
            {status === 'confirming' && 'Confirming transaction...'}
          </span>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#39FF14]" />
            <span className="text-[10px] font-mono text-[#39FF14]">Transaction confirmed</span>
          </div>
          {signature && (
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono text-[#888] hover:text-[#39FF14] transition-colors"
            >
              <ExternalLink size={10} />
              {signature.slice(0, 8)}...{signature.slice(-8)}
            </a>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[9px] text-[#666] hover:text-[#EDEDED] transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-[#FF003C]" />
            <span className="text-[10px] font-mono text-[#FF003C]">
              {error || 'Transaction failed'}
            </span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[9px] font-mono text-[#888] hover:text-[#EDEDED] transition-colors"
            >
              <RotateCcw size={10} />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
