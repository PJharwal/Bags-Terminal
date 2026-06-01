'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { dexScreenerService, type DexScreenerToken } from '@/services/dexscreener.service';
import { formatCurrency } from '@/lib/format';

// Base58, 32–44 chars — a Solana mint/contract address.
const CA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function TokenSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DexScreenerToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = query.trim();
  const isCA = CA_RE.test(trimmed);

  const go = useCallback((mint: string) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/terminal/${mint}`);
  }, [router]);

  // Debounced name/symbol search (skipped when the input is a contract address).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isCA || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const raw = await dexScreenerService.searchTokens(trimmed).catch(() => []);
      // Dedupe by mint, keep the highest-liquidity pair, sort by market cap.
      const byAddr = new Map<string, DexScreenerToken>();
      for (const t of raw) {
        const prev = byAddr.get(t.address);
        if (!prev || t.liquidity > prev.liquidity) byAddr.set(t.address, t);
      }
      const list = Array.from(byAddr.values())
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 8);
      setResults(list);
      setActive(0);
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [trimmed, isCA]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCA) { go(trimmed); return; }
      if (results[active]) go(results[active].address);
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
  };

  const showDropdown = open && trimmed.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-2.5 h-8 bg-[#0A0A0A] border border-white/10 focus-within:border-[#39FF14]/40 transition-colors">
        <Search size={13} className="text-[#666] shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search token or paste CA…"
          spellCheck={false}
          className="bg-transparent outline-none text-[11px] font-mono text-[#EDEDED] placeholder:text-[#555] w-full min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="text-[#666] hover:text-[#EDEDED] shrink-0">
            <X size={12} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 w-[320px] max-w-[90vw] bg-[#0A0A0A] border border-white/10 shadow-2xl z-[60] max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isCA ? (
            <button
              onClick={() => go(trimmed)}
              className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left hover:bg-white/5 transition-colors group"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-[#39FF14] uppercase tracking-widest">Open terminal</div>
                <div className="text-[10px] font-mono text-[#888] truncate">{trimmed}</div>
              </div>
              <ArrowRight size={14} className="text-[#666] group-hover:text-[#39FF14] shrink-0" />
            </button>
          ) : loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-[10px] font-mono text-[#666]">
              <Loader2 size={12} className="animate-spin" /> Searching…
            </div>
          ) : results.length > 0 ? (
            results.map((t, i) => (
              <button
                key={t.address}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(t.address)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${i === active ? 'bg-white/5' : 'hover:bg-white/5'}`}
              >
                {t.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt="" className="w-6 h-6 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[9px] font-mono text-[#888]">
                    {t.symbol.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-mono font-bold text-[#EDEDED] truncate">
                    ${t.symbol} <span className="text-[#666] font-normal">{t.name}</span>
                  </div>
                  <div className="text-[9px] font-mono text-[#555] truncate">{t.address}</div>
                </div>
                <div className="text-[10px] font-mono text-[#888] shrink-0">{t.marketCap > 0 ? formatCurrency(t.marketCap) : '—'}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-[10px] font-mono text-[#666]">No tokens found for “{trimmed}”.</div>
          )}
        </div>
      )}
    </div>
  );
}
