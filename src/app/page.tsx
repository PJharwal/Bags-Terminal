'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Rocket, BarChart3, Wallet, Activity, Search } from 'lucide-react';
import { BagsLogo } from '@/components/ui/BagsLogo';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { usePulseStore } from '@/store/pulse.store';
import { ReferralBanner } from '@/components/referral/ReferralBanner';
import { useSocketStore } from '@/store/socket.store';
import { formatCurrency } from '@/lib/format';
import type { PulseItem } from '@/lib/types';
import { HotCard } from '@/components/ui/HotCard';
import { StatCell } from '@/components/ui/StatCell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LivePulseDot } from '@/components/ui/LivePulseDot';
import { Onboarding } from '@/components/home/Onboarding';

// Enhanced BAGS Token Card with fee data
const BagsTokenCard = ({ token }: { token: PulseItem }) => {

  const initial = (token.symbol || '?').replace('$', '').charAt(0).toUpperCase();
  const colors = ['bg-[#FF003C]', 'bg-[#39FF14]', 'bg-[#00F0FF]', 'bg-[#FAFF00]', 'bg-[#FF00FF]', 'bg-[#FF6B35]'];
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
              <span className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">
                {token.symbol}
              </span>
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
              <div className="progress-bar w-16">
                <div
                  className={`progress-bar-fill ${token.bondingProgress >= 85 ? 'glow' : ''}`}
                  style={{ width: `${Math.min(token.bondingProgress, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono ${token.bondingProgress >= 85 ? 'text-[#39FF14]' : 'text-[#666]'}`}>
                {(token.bondingProgress || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[#888] font-mono">Holders</span>
            <span className="text-sm font-mono text-white">{token.holders || '—'}</span>
          </div>

        </div>

        <div className="mt-3 pt-3 border-t border-white/5 flex items-center">
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
  const { connected, shortenedAddress } = useBagsWallet();
  const { items, loadInitialData } = usePulseStore();
  const { connect } = useSocketStore();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    connect();
    // Load initial data from GMGN/DexScreener while socket connects
    loadInitialData();
  }, [connect, loadInitialData]);

  // BAGS tokens from pulse (sorted by market cap)
  const allBagsTokens = [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED]
    .sort((a, b) => b.marketCap - a.marketCap);

  // Separate by state for display
  const migratedTokens = items.MIGRATED.slice(0, 4);
  const trendingTokens = [...items.FINAL_STRETCH, ...items.NEW]
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] font-mono selection:bg-[#39FF14] selection:text-black">
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* First-visit walkthrough — only shows for new, disconnected visitors */}
      <Onboarding />

      <div className="relative">
        {!connected ? (
          <>
            {/* Hero — Not Connected (Evolved Brutalist) */}
            <section className="px-4 sm:px-6 pt-8 pb-10">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="relative card card-hot p-6 sm:p-8 lg:p-10 overflow-hidden"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#39FF14] pointer-events-none" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#39FF14] pointer-events-none" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#39FF14] pointer-events-none" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#39FF14] pointer-events-none" />

                  {/* Grid background overlay */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

                  <div className="relative grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-10 items-center">
                    {/* Left column */}
                    <div>

                      <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-[family-name:var(--font-display)] font-bold tracking-tight text-[#EDEDED] leading-[1.02] mb-5"
                        style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
                      >
                        TRADE{' '}
                        <span className="text-[#39FF14]">SOLANA</span>
                        <br />
                        AT THE{' '}
                        <span
                          className="inline-block pb-1"
                          style={{
                            boxShadow: 'inset 0 -6px 0 #39FF14',
                          }}
                        >
                          SOURCE.
                        </span>
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm sm:text-base text-[#888] font-mono max-w-xl mb-6 leading-relaxed"
                      >
                        One Solana wallet, every market — spot memes, prediction
                        markets, and perps from a single interface. No manual
                        bridging. Built on bags.fm.
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-2"
                      >
                        <button
                          onClick={() => setVisible(true)}
                          className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2"
                        >
                          <Wallet size={14} />
                          CONNECT WALLET
                        </button>
                        <Link
                          href="/pulse"
                          className="btn-ghost px-5 py-2.5 text-xs flex items-center gap-2"
                        >
                          <Activity size={14} />
                          OPEN PULSE →
                        </Link>
                        <Link
                          href="/launch"
                          className="btn-ghost px-5 py-2.5 text-xs flex items-center gap-2"
                        >
                          <Rocket size={14} />
                          LAUNCH TOKEN
                        </Link>
                      </motion.div>
                    </div>

                    {/* Right column: Hot Right Now */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <LivePulseDot color="gold" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#FFD700]">
                          HOT RIGHT NOW
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {allBagsTokens.length > 0 ? (
                          allBagsTokens.slice(0, 3).map((token, i) => (
                            <HotCard
                              key={token.tokenId}
                              token={token}
                              index={i}
                            />
                          ))
                        ) : (
                          <div className="text-[10px] font-mono text-[#555] px-2 py-6 text-center border border-dashed border-white/5">
                            No live tokens yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Stats strip */}
            <section className="px-4 sm:px-6 pb-10">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 gap-3 sm:gap-5">
                  <StatCell
                    label="TRACKED VOLUME"
                    value={`$${(allBagsTokens.reduce((a, t) => a + (t.volume24h || 0), 0) / 1e6).toFixed(1)}M`}
                    accent="green"
                    size="lg"
                  />
                  <StatCell
                    label="TRACKED TOKENS"
                    value={allBagsTokens.length.toString()}
                    accent="default"
                    size="lg"
                  />
                  <StatCell
                    label="HOLDERS"
                    value={(() => {
                      const sum = allBagsTokens.reduce((a, t) => a + (t.holders || 0), 0);
                      return sum > 0 ? sum.toLocaleString() : '—';
                    })()}
                    accent="blue"
                    size="lg"
                  />
                </div>
              </div>
            </section>

            {/* Live BAGS Tokens — Not Connected */}
            <section className="py-10 px-4 sm:px-6 border-t border-white/5">
              <div className="max-w-7xl mx-auto">
                <SectionHeader
                  title="BAGS TOKENS"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allBagsTokens.length > 0 ? (
                    allBagsTokens.slice(0, 12).map((token) => (
                      <BagsTokenCard key={token.tokenId} token={token} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-[#666] font-mono text-xs">
                      No tokens to display
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Feature strip */}
            <section className="py-10 px-4 sm:px-6 border-t border-white/5">
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: '✦', title: 'CREATOR ECONOMY', desc: 'Fee-share with up to 100 wallets, with automatic claiming.', color: '#39FF14' },
                  { icon: '◎', title: 'PULSE MONITOR', desc: 'Every mint, trade, migration. Live WebSocket.', color: '#00F0FF' },
                  { icon: '◈', title: 'DEPLOYER INTEL', desc: 'Success rates, cluster detection, rug scoring.', color: '#FFD700' },
                ].map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="card p-5 relative group"
                  >
                    <div className="text-4xl font-[family-name:var(--font-display)] mb-3 opacity-80" style={{ color: f.color }}>
                      {f.icon}
                    </div>
                    <div className="text-sm font-mono font-bold text-[#EDEDED] mb-1 tracking-wide">
                      {f.title}
                    </div>
                    <div className="text-[11px] font-mono text-[#666] leading-relaxed">
                      {f.desc}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Welcome — Connected (Evolved) */}
            <section className="pt-8 pb-6 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-[family-name:var(--font-display)] font-bold tracking-tight mb-1">
                    WELCOME BACK
                  </h1>
                  <p className="text-xs font-mono text-[#666] tracking-wider">
                    <span className="text-[#39FF14]">{shortenedAddress}</span>
                    <span className="text-[#333] mx-2">//</span>
                    <span>SESSION ACTIVE</span>
                  </p>
                </motion.div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-6">
                  <StatCell
                    label="TRACKED VOLUME"
                    value={`$${(allBagsTokens.reduce((a, t) => a + (t.volume24h || 0), 0) / 1e6).toFixed(1)}M`}
                    accent="green"
                  />
                  <StatCell
                    label="TRACKED TOKENS"
                    value={allBagsTokens.length.toString()}
                    accent="default"
                  />
                  <StatCell
                    label="HOLDERS"
                    value={(() => {
                      const sum = allBagsTokens.reduce((a, t) => a + (t.holders || 0), 0);
                      return sum > 0 ? sum.toLocaleString() : '—';
                    })()}
                    accent="blue"
                  />
                </div>

                <div className="mb-8">
                  <ReferralBanner />
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
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Pulse Monitor
                      </div>
                      <div className="text-xs text-[#666] mt-1">Real-time BAGS activity</div>
                    </motion.div>
                  </Link>

                  <Link href="/perps">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <TrendingUp className="text-[#FFD700] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Perps
                      </div>
                      <div className="text-xs text-[#666] mt-1">Cross-chain perps · soon</div>
                    </motion.div>
                  </Link>

                  <Link href="/trending">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <TrendingUp className="text-[#FF003C] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Trending
                      </div>
                      <div className="text-xs text-[#666] mt-1">Top performing tokens</div>
                    </motion.div>
                  </Link>

                  <Link href="/prediction">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <BarChart3 className="text-[#00F0FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Prediction
                      </div>
                      <div className="text-xs text-[#666] mt-1">Polymarket · soon</div>
                    </motion.div>
                  </Link>

                  <Link href="/analyze">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Search className="text-[#00F0FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Analyze
                      </div>
                      <div className="text-xs text-[#666] mt-1">Deep token analysis</div>
                    </motion.div>
                  </Link>

                  <Link href="/launch">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <Rocket className="text-[#FF6B35] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Launch Token
                      </div>
                      <div className="text-xs text-[#666] mt-1">Deploy with fee sharing</div>
                    </motion.div>
                  </Link>

                  <Link href="/creator">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="card group p-6 cursor-pointer"
                    >
                      <BarChart3 className="text-[#00F0FF] mb-3" size={24} />
                      <div className="font-mono font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        Creator Dashboard
                      </div>
                      <div className="text-xs text-[#666] mt-1">Track earnings & claims</div>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Migrated Tokens (LP Live) */}
            {migratedTokens.length > 0 && (
              <section className="py-8 px-4 sm:px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                  <SectionHeader
                    kicker="◆ ON DEX"
                    title="MIGRATED TOKENS"
                    subtitle="Graduated from bonding curve — now trading on Raydium / PumpSwap"
                    right={
                      <Link
                        href="/pulse"
                        className="text-[10px] font-mono text-[#888] hover:text-[#39FF14] uppercase tracking-widest transition-all"
                      >
                        VIEW ALL →
                      </Link>
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {migratedTokens.map((token) => (
                      <BagsTokenCard key={token.tokenId} token={token} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Trending BAGS Tokens */}
            <section className="py-8 px-4 sm:px-6 border-t border-white/5">
              <div className="max-w-7xl mx-auto">
                <SectionHeader
                  kicker="↗ TRENDING"
                  title="BAGS LAUNCHES"
                  subtitle="Highest bonding curve progress — closest to DEX migration"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trendingTokens.length > 0 ? (
                    trendingTokens.map((token) => (
                      <BagsTokenCard key={token.tokenId} token={token} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-[#666] font-mono text-xs">
                      No launches to display
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
            BAGS TERMINAL
          </div>
          <div className="flex gap-6 text-xs font-mono text-[#888]">
            <a href="https://docs.bags.fm" target="_blank" rel="noopener noreferrer" className="hover:text-[#39FF14] transition-all duration-200 hover:underline underline-offset-4">DOCS</a>
            <a href="https://docs.bags.fm/api-reference" target="_blank" rel="noopener noreferrer" className="hover:text-[#39FF14] transition-all duration-200 hover:underline underline-offset-4">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
