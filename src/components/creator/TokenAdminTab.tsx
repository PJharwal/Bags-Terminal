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
        <Shield size={20} className="text-[#666]" />
        <span className="text-[10px] font-mono text-[#888]">Connect wallet to view admin tokens</span>
      </div>
    );
  }

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={16} className="text-[#39FF14] animate-spin" />
      </div>
    );
  }

  if (adminTokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Shield size={20} className="text-[#666]" />
        <span className="text-[10px] font-mono text-[#888]">
          No tokens where you are the fee share admin
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <Shield size={12} className="text-[#00F0FF]" />
        <span className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest">
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

  const isValidNewAdmin = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newAdmin.trim());

  const handleTransferAdmin = async () => {
    if (!newAdmin.trim() || !sendTransaction) return;
    if (!isValidNewAdmin) {
      setError('Invalid Solana address');
      return;
    }
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
    <div className="p-4 bg-[#0A0A0A] border border-white/10">
      <div className="flex items-center gap-3 mb-3">
        {token.tokenImage ? (
          <img src={token.tokenImage} alt={token.tokenSymbol} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-[10px] font-mono text-[#666]">{token.tokenSymbol?.slice(0, 2)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-[#EDEDED] block truncate">{token.tokenSymbol}</span>
          <span className="text-[9px] font-mono text-[#666] truncate block">{token.tokenMint}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-[#1A1A1A] border border-white/5">
          <span className="text-[8px] text-[#666] uppercase tracking-widest block">Claimers</span>
          <span className="text-sm font-mono text-[#EDEDED]">{token.claimerCount}</span>
        </div>
        <div className="p-2 bg-[#1A1A1A] border border-white/5">
          <span className="text-[8px] text-[#666] uppercase tracking-widest block">Config Key</span>
          <button onClick={copyConfigKey} className="flex items-center gap-1 group">
            <span className="text-[10px] font-mono text-[#888] truncate max-w-[100px]">
              {token.configKey.slice(0, 8)}...
            </span>
            {copiedKey ? (
              <CheckCircle2 size={10} className="text-[#39FF14] shrink-0" />
            ) : (
              <Copy size={10} className="text-[#666] group-hover:text-[#39FF14] shrink-0" />
            )}
          </button>
        </div>
      </div>

      {mode === 'idle' && (
        <div className="flex gap-2">
          <button
            onClick={() => { setMode('transfer'); setError(null); setSuccess(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider border border-white/10 text-[#888] hover:text-[#FF003C] hover:border-[#FF003C]/30 transition-colors"
          >
            <ArrowRightLeft size={10} />
            Transfer Admin
          </button>
          <a
            href={`/terminal/${token.tokenMint}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider border border-white/10 text-[#888] hover:text-[#39FF14] hover:border-[#39FF14]/30 transition-colors"
          >
            <Settings size={10} />
            View Token
          </a>
        </div>
      )}

      {mode === 'transfer' && (
        <div className="flex flex-col gap-2">
          <label className="text-[8px] text-[#666] uppercase tracking-widest">New Admin Wallet</label>
          <input
            type="text"
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            placeholder="Wallet address..."
            className="w-full px-3 py-2 text-[10px] font-mono bg-[#1A1A1A] border border-white/10 text-[#EDEDED] placeholder:text-[#444] focus:border-[#39FF14]/30 focus:outline-none"
          />
          {isValidNewAdmin && (
            <span className="text-[9px] font-mono text-[#888]">
              Transferring admin to {newAdmin.trim().slice(0, 4)}...{newAdmin.trim().slice(-4)} — this is irreversible
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleTransferAdmin}
              disabled={isSubmitting || !isValidNewAdmin}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider bg-[#FF003C] text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={10} className="animate-spin" /> : <ArrowRightLeft size={10} />}
              Confirm Transfer
            </button>
            <button
              onClick={() => { setMode('idle'); setNewAdmin(''); setError(null); }}
              className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider border border-white/10 text-[#666] hover:text-[#EDEDED] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-[#FF003C]/10 border border-[#FF003C]/30">
          <span className="text-[9px] text-[#FF003C] font-mono">{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-2 p-2 bg-[#39FF14]/10 border border-[#39FF14]/30">
          <span className="text-[9px] text-[#39FF14] font-mono">{success}</span>
        </div>
      )}
    </div>
  );
}
