'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, TrendingUp, Rocket, BarChart3, Wallet, Coins, Users } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { usePulseStore } from '@/store/pulse.store';
import { useSocketStore } from '@/store/socket.store';
import { bagsService } from '@/services/bags.service';
import { formatCurrency } from '@/lib/format';
import type { PulseItem } from '@/lib/types';

// Ticker Token Display
const TickerToken = ({ token }: { token: PulseItem }) => (
  <span className="inline-flex items-center mx-8 font-mono text-sm">
    <span className="text-[#39FF14] font-bold">{token.symbol}</span>
    <span className="text-[#888] mx-2">MC {formatCurrency(token.marketCap)}</span>
    <span className={token.bondingProgress >= 85 ? 'text-white' : 'text-[#444]'}>
      {token.bondingProgress}%
    </span>
  </span>
);

// Enhanced BAGS Token Card with fee data
const BagsTokenCard = ({ token }: { token: PulseItem }) => {
  const [feeData, setFeeData] = useState<{ lifetimeFees: number; creatorsCount: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    bagsService.getTokenFeeInfo(token.tokenId)
      .then((info) => {
        if (mounted && info) {
          setFeeData({
            lifetimeFees: info.lifetimeFees,
            creatorsCount: info.creators.length,
          });
        }
      })
      .catch(() => {
        // Token might not have fee data yet
      });
    return () => { mounted = false; };
  }, [token.tokenId]);

  const initial = (token.symbol || '?').replace('$', '').charAt(0).toUpperCase();
  const colors = ['bg-[#FF003C]', 'bg-[#39FF14]', 'bg-[#00F0FF]', 'bg-[#FAFF00]', 'bg-[#FF00FF]', 'bg-[#FF6B35]'];
  const fallbackColor = colors[initial.charCodeAt(0) % colors.length];

  return (
    <Link href={`/terminal/${token.tokenId}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-[#0A0A0A] border border-white/10 hover:border-[#39FF14] p-4 transition-all cursor-pointer h-full"
      >
        <div className="flex items-start gap-3 mb-3">
          {token.logoUrl ? (
            <img src={token.logoUrl} alt={token.symbol} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className={`w-12 h-12 ${fallbackColor} flex items-center justify-center font-display font-bold text-black text-xl`}>
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
                {token.symbol}
              </span>
              {feeData && feeData.lifetimeFees > 0 && (
                <div className="inline-flex items-center gap-0.5 text-[#FFD700]" title="Fee earner">
                  <Coins size={10} />
                </div>
              )}
            </div>
            <div className="text-xs text-[#666] truncate">{token.name}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#888] font-mono">Market Cap</span>
            <span className="text-sm font-mono text-white">{formatCurrency(token.marketCap)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[#888] font-mono">Bonding</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${token.bondingProgress >= 85 ? 'bg-[#39FF14]' : 'bg-[#444]'}`}
                  style={{ width: `${Math.min(token.bondingProgress, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono ${token.bondingProgress >= 85 ? 'text-[#39FF14]' : 'text-[#666]'}`}>
                {token.bondingProgress}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[#888] font-mono">Holders</span>
            <span className="text-sm font-mono text-white">{token.holders || '—'}</span>
          </div>

          {/* Fee Earnings Row */}
          {feeData && feeData.lifetimeFees > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-xs text-[#FFD700] font-mono flex items-center gap-1">
                <Coins size={10} /> Earnings
              </span>
              <span className="text-sm font-mono text-[#FFD700] font-bold">
                {feeData.lifetimeFees < 1 ? feeData.lifetimeFees.toFixed(3) : feeData.lifetimeFees.toFixed(2)} SOL
              </span>
            </div>
          )}

          {/* Fee Earners Count */}
          {feeData && feeData.creatorsCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                <Users size={10} /> Fee Earners
              </span>
              <span className="text-sm font-mono text-white">{feeData.creatorsCount}</span>
            </div>
          )}
        </div>

        {/* State badge */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
            token.state === 'MIGRATED' ? 'bg-[#39FF14]/20 text-[#39FF14]' :
            token.state === 'FINAL_STRETCH' ? 'bg-[#FAFF00]/20 text-[#FAFF00]' :
            'bg-white/10 text-[#888]'
          }`}>
            {token.state === 'MIGRATED' ? 'LP Live' :
             token.state === 'FINAL_STRETCH' ? 'Near Migration' :
             'Bonding'}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { connected, shortenedAddress } = useBagsWallet();
  const { items, loadInitialData } = usePulseStore();
  const { connect, isConnected } = useSocketStore();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    connect();
    // Load initial data from GMGN/DexScreener while socket connects
    loadInitialData();
  }, [connect, loadInitialData]);

  if (!mounted) return null;

  // BAGS tokens from pulse (sorted by market cap)
  const allBagsTokens = [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED]
    .sort((a, b) => b.marketCap - a.marketCap);

  const tickerTokens = allBagsTokens.length > 0
    ? [...allBagsTokens, ...allBagsTokens].slice(0, 20)
    : [];

  // Separate by state for display
  const migratedTokens = items.MIGRATED.slice(0, 4);
  const trendingTokens = [...items.FINAL_STRETCH, ...items.NEW]
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] font-mono selection:bg-[#39FF14] selection:text-black">
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Scrolling Ticker */}
      <div className="border-b border-white/10 bg-[#0A0A0A] overflow-hidden whitespace-nowrap py-3">
        <div className="animate-marquee inline-block">
          {tickerTokens.length > 0 ? (
            tickerTokens.map((token, i) => <TickerToken key={`${token.tokenId}-${i}`} token={token} />)
          ) : (
            <span className="mx-8 font-mono text-sm text-[#666]">
              {isConnected ? 'Waiting for tokens...' : 'Connecting to live feed...'}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        {!connected ? (
          <>
            {/* Hero — Not Connected */}
            <section className="pt-24 pb-16 px-6">
              <div className="max-w-6xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 border border-[#39FF14] px-3 py-1 text-[10px] text-[#39FF14] uppercase tracking-widest mb-8">
                  <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-[#39FF14]' : 'bg-[#FF003C]'} animate-pulse`} />
                  {isConnected ? 'System Online' : 'Connecting...'}
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-7xl md:text-9xl font-display font-bold leading-[0.85] tracking-tighter mb-6 text-white"
                >
                  BAGS<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-transparent">
                    TERMINAL
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl md:text-2xl text-[#888] mb-12 max-w-2xl mx-auto"
                >
                  Launch tokens with built-in fee sharing on Solana
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setVisible(true)}
                  className="group relative px-12 py-5 bg-[#EDEDED] text-black font-bold uppercase tracking-wider overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#39FF14] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 group-hover:text-black flex items-center gap-3">
                    <Wallet size={20} />
                    Connect Wallet
                  </span>
                </motion.button>
              </div>
            </section>

            {/* Live BAGS Tokens — Not Connected */}
            <section className="py-16 px-6 border-t border-white/10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-display font-bold">Live BAGS Tokens</h2>
                  <div className="flex items-center gap-2 text-xs text-[#39FF14] font-mono uppercase tracking-widest">
                    <TrendingUp size={16} />
                    {isConnected ? 'Live' : 'Connecting...'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allBagsTokens.length > 0 ? (
                    allBagsTokens.slice(0, 12).map((token) => (
                      <BagsTokenCard key={token.tokenId} token={token} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-[#666]">
                      {isConnected ? 'Waiting for tokens...' : 'Connect to discover tokens'}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Welcome — Connected */}
            <section className="pt-16 pb-8 px-6">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <h1 className="text-4xl md:text-6xl font-display font-bold mb-2">
                    Welcome back
                  </h1>
                  <p className="text-xl text-[#888] font-mono">{shortenedAddress}</p>
                </motion.div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                  <Link href="/launch">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group bg-[#0A0A0A] border border-white/10 hover:border-[#39FF14] p-6 transition-all cursor-pointer"
                    >
                      <Rocket className="text-[#39FF14] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Launch Token
                      </div>
                      <div className="text-xs text-[#666] mt-1">Deploy with fee sharing</div>
                    </motion.div>
                  </Link>

                  <Link href="/creator">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group bg-[#0A0A0A] border border-white/10 hover:border-[#39FF14] p-6 transition-all cursor-pointer"
                    >
                      <BarChart3 className="text-[#00F0FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Creator Dashboard
                      </div>
                      <div className="text-xs text-[#666] mt-1">Track earnings & claims</div>
                    </motion.div>
                  </Link>

                  <Link href="/pulse">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group bg-[#0A0A0A] border border-white/10 hover:border-[#39FF14] p-6 transition-all cursor-pointer"
                    >
                      <Terminal className="text-[#FAFF00] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Live Pulse
                      </div>
                      <div className="text-xs text-[#666] mt-1">Real-time BAGS activity</div>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Migrated Tokens (LP Live) */}
            {migratedTokens.length > 0 && (
              <section className="py-8 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                      <span className="text-[#39FF14]">LP Live</span>
                      <span className="text-[10px] font-mono text-[#888] uppercase">Migrated</span>
                    </h2>
                    <Link
                      href="/pulse"
                      className="text-xs font-mono text-[#888] hover:text-[#39FF14] uppercase tracking-widest transition-colors"
                    >
                      View All →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {migratedTokens.map((token) => (
                      <BagsTokenCard key={token.tokenId} token={token} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Trending BAGS Tokens */}
            <section className="py-8 px-6 border-t border-white/10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold">Trending BAGS</h2>
                  <Link
                    href="/pulse"
                    className="text-xs font-mono text-[#888] hover:text-[#39FF14] uppercase tracking-widest transition-colors"
                  >
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trendingTokens.length > 0 ? (
                    trendingTokens.map((token) => (
                      <BagsTokenCard key={token.tokenId} token={token} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-[#666]">
                      {isConnected ? 'Waiting for tokens...' : 'Connecting to live feed...'}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 mt-24 border-t border-white/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs font-mono text-[#444]">
            BAGS TERMINAL // SYSTEM V3.0.0
          </div>
          <div className="flex gap-6 text-xs font-mono text-[#888]">
            <a href="#" className="hover:text-[#39FF14] transition-colors">DOCS</a>
            <a href="#" className="hover:text-[#39FF14] transition-colors">API</a>
            <a href="#" className="hover:text-[#39FF14] transition-colors">STATUS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
