'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, TrendingUp, Rocket, BarChart3, Wallet, Activity, Search, Users } from 'lucide-react';
import { BagsLogo } from '@/components/ui/BagsLogo';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { usePulseStore } from '@/store/pulse.store';
import { ReferralBanner } from '@/components/referral/ReferralBanner';
import { useSocketStore } from '@/store/socket.store';
import { formatCurrency } from '@/lib/format';
import type { PulseItem } from '@/lib/types';

// Ticker Token Display
const TickerToken = ({ token }: { token: PulseItem }) => (
  <span className="inline-flex items-center mx-8 font-mono text-sm">
    <span className="text-acid-green font-bold">{token.symbol}</span>
    <span className="text-fg-soft mx-2 num">MC {formatCurrency(token.marketCap)}</span>
    <span className={`num ${token.bondingProgress >= 85 ? 'text-white' : 'text-muted'}`}>
      {Math.round(token.bondingProgress)}%
    </span>
  </span>
);

// Enhanced BAGS Token Card with fee data
const BagsTokenCard = ({ token }: { token: PulseItem }) => {

  const initial = (token.symbol || '?').replace('$', '').charAt(0).toUpperCase();
  const colors = ['bg-[#FF003C]', 'bg-acid-green', 'bg-[#00F0FF]', 'bg-[#FAFF00]', 'bg-[#FF00FF]', 'bg-[#FF6B35]'];
  const fallbackColor = colors[initial.charCodeAt(0) % colors.length];

  return (
    <Link href={`/terminal/${token.tokenId}`}>
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="card group p-4 cursor-pointer h-full"
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
              <span className="font-mono font-bold text-white group-hover:text-acid-green transition-colors truncate">
                {token.symbol}
              </span>
            </div>
            <div className="text-xs text-muted-high truncate">{token.name}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-fg-soft font-mono">Market Cap</span>
            <span className="text-sm font-mono text-white">{formatCurrency(token.marketCap)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-fg-soft font-mono">Bonding</span>
            <div className="flex items-center gap-2">
              <div className="progress-bar w-16">
                <div
                  className={`progress-bar-fill ${token.bondingProgress >= 85 ? 'glow' : ''}`}
                  style={{ width: `${Math.min(token.bondingProgress, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono num ${token.bondingProgress >= 85 ? 'text-acid-green' : 'text-muted-high'}`}>
                {Math.round(token.bondingProgress)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-fg-soft font-mono">Holders</span>
            <span className="text-sm font-mono text-white">{token.holders || '—'}</span>
          </div>

        </div>

        {/* State badge */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <span className={`text-meta font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
            token.state === 'MIGRATED' ? 'bg-acid-green/20 text-acid-green' :
            token.state === 'FINAL_STRETCH' ? 'bg-[#FAFF00]/20 text-[#FAFF00]' :
            'bg-white/10 text-fg-soft'
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

const HomeStat = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="stat-card p-4">
    <div className="flex items-center justify-between gap-3">
      <span className="text-meta font-mono uppercase tracking-widest text-fg-soft">{label}</span>
      <span className="text-lg font-display font-bold text-white">{value}</span>
    </div>
    <div className="mt-2 text-xs text-muted-high">{hint}</div>
  </div>
);

const HeroPreview = ({
  isConnected,
  tokens,
}: {
  isConnected: boolean;
  tokens: PulseItem[];
}) => (
  <div className="card p-5 md:p-6">
    <div className="flex items-center justify-between gap-3 mb-4">
      <div>
        <div className="text-meta font-mono uppercase tracking-[0.18em] text-fg-soft">Live Snapshot</div>
        <div className="text-sm text-white mt-1">A cleaner view of what is moving right now</div>
      </div>
      <span className={`badge ${isConnected ? 'badge-green' : 'badge-muted'}`}>
        {isConnected ? 'Live' : 'Syncing'}
      </span>
    </div>

    <div className="space-y-3">
      {tokens.length > 0 ? (
        tokens.slice(0, 3).map((token) => (
          <div key={token.tokenId} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-white truncate">{token.symbol}</span>
                <span className="text-meta text-fg-soft">{Math.round(token.bondingProgress)}%</span>
              </div>
              <div className="text-meta text-muted-high truncate">{token.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-white">{formatCurrency(token.marketCap)}</div>
              <div className="text-meta text-muted-high">market cap</div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-sm text-muted-high">
          {isConnected ? 'Waiting for tokens to stream in.' : 'Connect to see the live feed and token snapshot.'}
        </div>
      )}
    </div>
  </div>
);

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

  // BAGS tokens from pulse (sorted by market cap)
  const allBagsTokens = useMemo(
    () => [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED].sort((a, b) => b.marketCap - a.marketCap),
    [items.NEW, items.FINAL_STRETCH, items.MIGRATED],
  );

  const tickerTokens = useMemo(
    () => (allBagsTokens.length > 0 ? [...allBagsTokens, ...allBagsTokens].slice(0, 20) : []),
    [allBagsTokens],
  );

  // Separate by state for display
  const migratedTokens = useMemo(() => items.MIGRATED.slice(0, 4), [items.MIGRATED]);
  const trendingTokens = useMemo(
    () => [...items.FINAL_STRETCH, ...items.NEW].sort((a, b) => b.marketCap - a.marketCap).slice(0, 8),
    [items.FINAL_STRETCH, items.NEW],
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-fg font-mono selection:bg-acid-green selection:text-black">
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Scrolling Ticker */}
      <div className="border-b border-white/10 bg-[#0A0A0A] overflow-hidden whitespace-nowrap py-3">
        <div className="animate-marquee inline-block">
          {tickerTokens.length > 0 ? (
            tickerTokens.map((token, i) => <TickerToken key={`${token.tokenId}-${i}`} token={token} />)
          ) : (
            <span className="mx-8 font-mono text-sm text-muted-high">
              {isConnected ? 'Waiting for tokens...' : 'Connecting to live feed...'}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        {!connected ? (
          <>
            {/* Hero — Not Connected */}
            <section className="px-6 pt-20 pb-16">
              <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center">
                <div className="text-center lg:text-left">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 text-meta uppercase tracking-widest mb-8 ${isConnected ? 'badge-green' : 'badge-muted'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-acid-green' : 'bg-[#FF003C]'} animate-pulse`} />
                    {isConnected ? 'Live Feed' : 'Syncing'}
                  </div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-display font-bold leading-[0.92] tracking-tight mb-5 text-white"
                  >
                    BAGS<br />
                    <span className="text-fg-soft">
                      Terminal
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-xl text-fg-soft max-w-2xl mx-auto lg:mx-0"
                  >
                    A clean workspace for live BAGS tokens, simple trading, and deployer signals on Solana.
                  </motion.p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: 0.2 }}
                      onClick={() => setVisible(true)}
                      className="btn-primary px-7 py-3.5"
                    >
                      <Wallet size={18} />
                      Connect Wallet
                    </motion.button>
                    <Link href="/terminal" className="btn-ghost px-6 py-3.5">
                      Open Terminal
                    </Link>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <HomeStat
                      label="Feed"
                      value={isConnected ? 'Live' : 'Syncing'}
                      hint={isConnected ? 'Socket connected to the live token stream' : 'Waiting for the terminal feed to come online'}
                    />
                    <HomeStat
                      label="BAGS Tokens"
                      value={String(allBagsTokens.length)}
                      hint="Tokens surfaced from the pulse index"
                    />
                    <HomeStat
                      label="Migrated"
                      value={String(migratedTokens.length)}
                      hint="LP live and ready to trade"
                    />
                  </div>
                </div>

                <HeroPreview isConnected={isConnected} tokens={allBagsTokens} />
              </div>
            </section>

            {/* Live BAGS Tokens — Not Connected */}
            <section className="py-16 px-6 border-t border-white/10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-display font-bold">Live BAGS Tokens</h2>
                  <div className="flex items-center gap-2 text-xs text-acid-green font-mono uppercase tracking-widest">
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
                    <div className="col-span-full text-center py-12 text-muted-high">
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
                  <p className="text-xl text-fg-soft font-mono">{shortenedAddress}</p>
                </motion.div>

                <div className="mb-8">
                  <ReferralBanner />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                  <HomeStat
                    label="Feed"
                    value={isConnected ? 'Live' : 'Syncing'}
                    hint={isConnected ? 'Socket connected to the live token stream' : 'Waiting for the terminal feed to come online'}
                  />
                  <HomeStat
                    label="BAGS Tokens"
                    value={String(allBagsTokens.length)}
                    hint="Tokens surfaced from the pulse index"
                  />
                  <HomeStat
                    label="Migrated"
                    value={String(migratedTokens.length)}
                    hint="LP live and ready to trade"
                  />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  <Link href="/pulse">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Activity className="text-[#FAFF00] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Pulse Monitor
                      </div>
                      <div className="text-xs text-muted-high mt-1">Real-time BAGS activity</div>
                    </motion.div>
                  </Link>

                  <Link href="/terminal">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Terminal className="text-acid-green mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Terminal
                      </div>
                      <div className="text-xs text-muted-high mt-1">Browse & trade tokens</div>
                    </motion.div>
                  </Link>

                  <Link href="/trending">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <TrendingUp className="text-error mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Trending
                      </div>
                      <div className="text-xs text-muted-high mt-1">Top performing tokens</div>
                    </motion.div>
                  </Link>

                  <Link href="/deployers">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Users className="text-[#FF00FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Deployers
                      </div>
                      <div className="text-xs text-muted-high mt-1">Track deployer wallets</div>
                    </motion.div>
                  </Link>

                  <Link href="/analyze">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Search className="text-[#00F0FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Analyze
                      </div>
                      <div className="text-xs text-muted-high mt-1">Deep token analysis</div>
                    </motion.div>
                  </Link>

                  <Link href="/launch">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Rocket className="text-[#FF6B35] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Launch Token
                      </div>
                      <div className="text-xs text-muted-high mt-1">Deploy with fee sharing</div>
                    </motion.div>
                  </Link>

                  <Link href="/creator">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <BarChart3 className="text-[#00F0FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-acid-green transition-colors">
                        Creator Dashboard
                      </div>
                      <div className="text-xs text-muted-high mt-1">Track earnings & claims</div>
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
                      <span className="text-acid-green">LP Live</span>
                      <span className="text-meta font-mono text-fg-soft uppercase">Migrated</span>
                    </h2>
                    <Link
                      href="/pulse"
                      className="text-xs font-mono text-fg-soft hover:text-acid-green uppercase tracking-widest transition-all duration-200 hover:tracking-[0.2em]"
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
                    className="text-xs font-mono text-fg-soft hover:text-acid-green uppercase tracking-widest transition-all duration-200 hover:tracking-[0.2em]"
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
                    <div className="col-span-full text-center py-8 text-muted-high">
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
      <footer className="gradient-border py-12 mt-24 border-t border-white/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-xs font-mono text-[#444]">
            <BagsLogo size={16} />
            BAGS TERMINAL // SYSTEM V3.0.0
          </div>
          <div className="flex gap-4 text-xs font-mono text-fg-soft">
            <a
              href="https://docs.bags.fm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-6 px-1 hover:text-acid-green transition-all duration-200 hover:underline underline-offset-4 focus-ring"
            >DOCS</a>
            <a
              href="https://docs.bags.fm/api-reference"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-6 px-1 hover:text-acid-green transition-all duration-200 hover:underline underline-offset-4 focus-ring"
            >API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
