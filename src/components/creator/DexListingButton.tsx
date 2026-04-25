'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { bagsService } from '@/services/bags.service';
import { useBagsWallet } from '@/hooks/useWallet';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

type DexListingState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'confirming'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error';

interface DexListingButtonProps {
  tokenMint: string;
}

export function DexListingButton({ tokenMint }: DexListingButtonProps) {
  const { publicKey, signTransaction, connection } = useBagsWallet();
  const [state, setState] = useState<DexListingState>('idle');
  const [expanded, setExpanded] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleCheck = async () => {
    if (!publicKey) return;
    setState('checking');
    setError('');
    setExpanded(true);

    try {
      const result = await bagsService.checkDexscreenerAvailability(tokenMint);
      if (result.available) {
        setState('available');
      } else {
        setState('unavailable');
        setUnavailableReason(result.reason || 'Already listed on Dexscreener');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    }
  };

  const handleConfirm = async () => {
    if (!publicKey || !signTransaction) return;
    setState('confirming');
    setError('');

    try {
      const order = await bagsService.createDexscreenerOrder(tokenMint, publicKey);

      setState('signing');
      const txBuffer = Buffer.from(order.paymentTransaction, 'base64');

      let signedTx: string;
      try {
        const tx = VersionedTransaction.deserialize(txBuffer);
        const signed = await signTransaction(tx);
        signedTx = Buffer.from(signed.serialize()).toString('base64');
      } catch {
        const tx = Transaction.from(txBuffer);
        const signed = await signTransaction(tx);
        signedTx = Buffer.from(signed.serialize()).toString('base64');
      }

      setState('submitting');
      await bagsService.submitDexscreenerPayment(order.orderId, signedTx);
      setState('success');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Listing failed');
    }
  };

  const reset = () => {
    setState('idle');
    setExpanded(false);
    setError('');
    setUnavailableReason('');
  };

  const isProcessing = ['checking', 'confirming', 'signing', 'submitting'].includes(state);

  return (
    <div className="w-full">
      <button
        onClick={state === 'idle' ? handleCheck : () => setExpanded(!expanded)}
        disabled={isProcessing || !publicKey}
        className="btn-ghost flex items-center justify-center gap-1 w-full py-2 text-meta font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <Loader2 size={10} className="animate-spin" />
        ) : state === 'success' ? (
          <CheckCircle size={10} className="text-acid-green" />
        ) : state === 'unavailable' ? (
          <XCircle size={10} className="text-muted-high" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        )}
        DEX
        {expanded && !isProcessing ? (
          <ChevronUp size={8} />
        ) : !isProcessing && state !== 'idle' ? (
          <ChevronDown size={8} />
        ) : null}
      </button>

      {expanded && state !== 'idle' && (
        <div className="mt-2 p-3 border border-white/10 bg-[#0A0A0A] text-meta font-mono space-y-2">
          {state === 'checking' && (
            <div className="flex items-center gap-2 text-muted-high">
              <Loader2 size={10} className="animate-spin" />
              Checking availability...
            </div>
          )}

          {state === 'available' && (
            <>
              <p className="text-fg">
                Pay for Dexscreener Enhanced Token Info listing.
              </p>
              <p className="text-muted-high">
                Your token will appear with full details on Dexscreener.
              </p>
              <button
                onClick={handleConfirm}
                className="btn-primary w-full py-1.5 text-meta font-bold uppercase"
              >
                Confirm & Pay
              </button>
            </>
          )}

          {state === 'unavailable' && (
            <p className="text-muted-high">{unavailableReason}</p>
          )}

          {state === 'confirming' && (
            <div className="flex items-center gap-2 text-muted-high">
              <Loader2 size={10} className="animate-spin" />
              Creating order...
            </div>
          )}

          {state === 'signing' && (
            <div className="flex items-center gap-2 text-fg">
              <Loader2 size={10} className="animate-spin text-acid-green" />
              Sign transaction in wallet...
            </div>
          )}

          {state === 'submitting' && (
            <div className="flex items-center gap-2 text-muted-high">
              <Loader2 size={10} className="animate-spin" />
              Submitting payment...
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-2">
              <p className="text-acid-green">Listing submitted successfully.</p>
              <p className="text-muted-high">Your token info will appear on Dexscreener shortly.</p>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-2">
              <p className="text-red-400">{error}</p>
              <button
                onClick={reset}
                className="btn-ghost w-full py-1.5 text-meta font-bold uppercase"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
