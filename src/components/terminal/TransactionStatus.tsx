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
          <Loader2 size={14} className="text-acid-green animate-spin" />
          <span className="text-meta font-mono text-fg">
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
            <CheckCircle2 size={14} className="text-acid-green" />
            <span className="text-meta font-mono text-acid-green">Transaction confirmed</span>
          </div>
          {signature && (
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-meta font-mono text-fg-soft hover:text-acid-green transition-colors"
            >
              <ExternalLink size={10} />
              {signature.slice(0, 8)}...{signature.slice(-8)}
            </a>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-meta text-muted-high hover:text-fg transition-colors"
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
            <XCircle size={14} className="text-error" />
            <span className="text-meta font-mono text-error">
              {error || 'Transaction failed'}
            </span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-meta font-mono text-fg-soft hover:text-fg transition-colors"
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
