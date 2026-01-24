'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, TrendingUp, Rocket, BarChart3, Wallet } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { usePulseStore } from '@/store/pulse.store';
import { useSocketStore } from '@/store/socket.store';
import { gmgnService, type GMGNTrendingToken } from '@/services/gmgn.service';
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

// Token Card (apps.fun inspired)
const TokenCard = ({ token }: { token: GMGNTrendingToken | PulseItem }) => {
  const isGMGN = 'price' in token;
  const address = isGMGN ? token.address : token.tokenId;
  const symbol = isGMGN ? `$${token.symbol}` : token.symbol;
  const name = token.name || symbol;
  const marketCap = isGMGN ? (token.market_cap || 0) : token.marketCap;
  const logo = isGMGN ? token.logo : ('logoUrl' in token ? token.logoUrl : undefined);
  const priceChange = isGMGN && token.price_change_percent !== undefined
    ? token.price_change_percent
    : null;

  const initial = (token.symbol || '?').charAt(0).toUpperCase();
  const colors = ['bg-[#FF003C]', 'bg-[#39FF14]', 'bg-[#00F0FF]', 'bg-[#FAFF00]', 'bg-[#FF00FF]', 'bg-[#FF6B35]'];
  const fallbackColor = colors[initial.charCodeAt(0) % colors.length];

  return (
    <Link href={`/terminal/${address}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-[#0A0A0A] border border-white/10 hover:border-[#39FF14] p-4 transition-all cursor-pointer h-full"
      >
        <div className="flex items-start gap-3 mb-3">
          {logo ? (
            <img src={logo} alt={symbol} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className={`w-12 h-12 ${fallbackColor} flex items-center justify-center font-display font-bold text-black text-xl`}>
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
              {symbol}
            </div>
            <div className="text-xs text-[#666] truncate">{name}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#888] font-mono">Market Cap</span>
            <span className="text-sm font-mono text-white">{formatCurrency(marketCap)}</span>
          </div>
          {priceChange !== null && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#888] font-mono">Change</span>
              <span className={`text-sm font-mono font-bold ${priceChange >= 0 ? 'text-[#39FF14]' : 'text-[#FF003C]'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [trendingTokens, setTrendingTokens] = useState<GMGNTrendingToken[]>([]);
  const [trendingError, setTrendingError] = useState(false);
  const { connected, shortenedAddress } = useBagsWallet();
  const { items } = usePulseStore();
  const { connect, isConnected } = useSocketStore();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    setMounted(true);
    connect();

    const fetchTrending = async () => {
      try {
        const result = await gmgnService.getTrending('1h');
        if (result?.rank) {
          setTrendingTokens(result.rank.slice(0, 12));
        } else {
          setTrendingError(true);
        }
      } catch {
        setTrendingError(true);
      }
    };
    fetchTrending();
  }, [connect]);

  if (!mounted) return null;

  const allPulseTokens = [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED];
  const tickerTokens = allPulseTokens.length > 0
    ? [...allPulseTokens, ...allPulseTokens].slice(0, 20)
    : [];
  const recentTokens = allPulseTokens.slice(0, 6);

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
              {isConnected ? 'Waiting for BAGS tokens...' : 'Connecting to live feed...'}
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
                  Deployer intelligence for Solana token launches
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

            {/* Trending Grid — Not Connected */}
            <section className="py-16 px-6 border-t border-white/10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-display font-bold">Trending Launches</h2>
                  <div className="flex items-center gap-2 text-xs text-[#39FF14] font-mono uppercase tracking-widest">
                    <TrendingUp size={16} />
                    Live
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trendingTokens.length > 0 ? (
                    trendingTokens.map((token) => (
                      <TokenCard key={token.address} token={token} />
                    ))
                  ) : allPulseTokens.length > 0 ? (
                    allPulseTokens.slice(0, 12).map((token) => (
                      <TokenCard key={token.tokenId} token={token} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-[#666]">
                      {trendingError ? 'Connect to discover tokens' : 'Loading trending tokens...'}
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
                      <div className="text-xs text-[#666] mt-1">Deploy on BAGS</div>
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
                      <div className="text-xs text-[#666] mt-1">Track your launches</div>
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
                      <div className="text-xs text-[#666] mt-1">Real-time activity</div>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Trending — Connected */}
            <section className="py-8 px-6 border-t border-white/10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold">Trending Now</h2>
                  <Link
                    href="/trending"
                    className="text-xs font-mono text-[#888] hover:text-[#39FF14] uppercase tracking-widest transition-colors"
                  >
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trendingTokens.length > 0 ? (
                    trendingTokens.slice(0, 8).map((token) => (
                      <TokenCard key={token.address} token={token} />
                    ))
                  ) : allPulseTokens.length > 0 ? (
                    allPulseTokens.slice(0, 8).map((token) => (
                      <TokenCard key={token.tokenId} token={token} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-[#666]">
                      {trendingError ? 'No trending data available' : 'Loading trending tokens...'}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recent BAGS Tokens — Connected */}
            {recentTokens.length > 0 && (
              <section className="py-8 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold">Recent BAGS Tokens</h2>
                    <Link
                      href="/pulse"
                      className="text-xs font-mono text-[#888] hover:text-[#39FF14] uppercase tracking-widest transition-colors"
                    >
                      View All →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentTokens.map((token) => (
                      <TokenCard key={token.tokenId} token={token} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 mt-24 border-t border-white/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs font-mono text-[#444]">
            BAGS TERMINAL // SYSTEM V2.4.1
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
