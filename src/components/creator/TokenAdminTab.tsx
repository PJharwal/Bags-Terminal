'use client';

import { useState } from 'react';
import { useCreatorStore } from '@/store/creator.store';
import { useBagsWallet } from '@/hooks/useWallet';
import { bagsService } from '@/services/bags.service';
import { Shield, ArrowRightLeft, Settings, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import type { FeeShareAdminToken, SendTransactionFn } from '@/lib/bags-types';

export function TokenAdminTab() {
  const { connected, publicKey } = useBagsWallet();
  const { adminTokens, isLoadingAdmin } = useCreatorStore();

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Shield size={20} className="text-muted-high" />
        <span className="text-meta font-mono text-fg-soft">Connect wallet to view admin tokens</span>
      </div>
    );
  }

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={16} className="text-acid-green animate-spin" />
      </div>
    );
  }

  if (adminTokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Shield size={20} className="text-muted-high" />
        <span className="text-meta font-mono text-fg-soft">
          No tokens where you are the fee share admin
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <Shield size={12} className="text-[#00F0FF]" />
        <span className="text-meta font-bold text-fg uppercase tracking-widest">
          Fee Share Admin ({adminTokens.length})
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminTokens.map((token) => (
          <AdminTokenCard key={token.tokenMint} token={token} wallet={publicKey!} />
        ))}
      </div>
    </div>
  );
}

function AdminTokenCard({ token, wallet }: { token: FeeShareAdminToken; wallet: string }) {
  const { sendTransaction, connection } = useBagsWallet();
  const { loadAdminTokens } = useCreatorStore();

  const [mode, setMode] = useState<'idle' | 'transfer' | 'config'>('idle');
  const [newAdmin, setNewAdmin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleTransferAdmin = async () => {
    if (!newAdmin.trim() || !sendTransaction) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const serializedTx = await bagsService.transferFeeShareAdmin(
        token.tokenMint,
        wallet,
        newAdmin.trim()
      );
      const { Transaction, VersionedTransaction } = await import('@solana/web3.js');
      const txBuffer = Buffer.from(serializedTx, 'base64');
      let tx;
      try {
        tx = VersionedTransaction.deserialize(txBuffer);
      } catch {
        tx = Transaction.from(txBuffer);
      }
      const sig = await (sendTransaction as SendTransactionFn)(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      setSuccess(`Admin transferred. Tx: ${sig.slice(0, 8)}...`);
      setMode('idle');
      setNewAdmin('');
      await loadAdminTokens(wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyConfigKey = async () => {
    await navigator.clipboard.writeText(token.configKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="p-4 card">
      <div className="flex items-center gap-3 mb-3">
        {token.tokenImage ? (
          <img src={token.tokenImage} alt={token.tokenSymbol} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center" aria-hidden="true">
            <span className="text-meta font-mono text-muted-high">{token.tokenSymbol?.slice(0, 2)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-fg block truncate" title={token.tokenSymbol}>{token.tokenSymbol}</span>
          <span className="text-meta font-mono text-muted-high truncate block num" title={token.tokenMint}>{token.tokenMint}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-elevated border border-white/5">
          <span className="text-meta text-muted-high uppercase tracking-widest block">Claimers</span>
          <span className="text-sm font-mono text-fg num">{token.claimerCount}</span>
        </div>
        <div className="p-2 bg-elevated border border-white/5">
          <span className="text-meta text-muted-high uppercase tracking-widest block">Config Key</span>
          <button
            type="button"
            onClick={copyConfigKey}
            aria-label="Copy config key"
            className="flex items-center gap-1 group focus-ring"
          >
            <span className="text-meta font-mono text-fg-soft truncate max-w-[100px] num">
              {token.configKey.slice(0, 8)}...
            </span>
            {copiedKey ? (
              <CheckCircle2 size={10} aria-hidden="true" className="text-acid-green shrink-0" />
            ) : (
              <Copy size={10} aria-hidden="true" className="text-muted-high group-hover:text-acid-green shrink-0" />
            )}
          </button>
        </div>
      </div>

      {mode === 'idle' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setMode('transfer'); setError(null); setSuccess(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-meta font-bold uppercase tracking-wider border border-default text-fg-soft hover:text-error hover:border-error/30 transition-colors focus-ring"
          >
            <ArrowRightLeft size={10} aria-hidden="true" />
            Transfer Admin
          </button>
          <a
            href={`/terminal/${token.tokenMint}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-meta font-bold uppercase tracking-wider border border-default text-fg-soft hover:text-acid-green hover:border-acid-green/30 transition-colors focus-ring"
          >
            <Settings size={10} aria-hidden="true" />
            View Token
          </a>
        </div>
      )}

      {mode === 'transfer' && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`admin-${token.tokenMint}`} className="text-meta text-muted-high uppercase tracking-widest">New Admin Wallet</label>
          <input
            id={`admin-${token.tokenMint}`}
            type="text"
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            placeholder="Wallet address..."
            className="input w-full px-3 py-2 text-meta font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTransferAdmin}
              disabled={isSubmitting || !newAdmin.trim()}
              aria-busy={isSubmitting || undefined}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-meta font-bold uppercase tracking-wider bg-error text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              {isSubmitting ? <Loader2 size={10} aria-hidden="true" className="animate-spin" /> : <ArrowRightLeft size={10} aria-hidden="true" />}
              Confirm Transfer
            </button>
            <button
              type="button"
              onClick={() => { setMode('idle'); setNewAdmin(''); setError(null); }}
              className="px-3 py-2 text-meta font-bold uppercase tracking-wider border border-default text-muted-high hover:text-fg transition-colors focus-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-2 p-2 bg-error/10 border border-error/30">
          <span className="text-meta text-error font-mono">{error}</span>
        </div>
      )}
      {success && (
        <div role="status" className="mt-2 p-2 bg-acid-green/10 border border-acid-green/30">
          <span className="text-meta text-acid-green font-mono">{success}</span>
        </div>
      )}
    </div>
  );
}
