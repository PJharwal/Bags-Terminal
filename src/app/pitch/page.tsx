'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  AlertTriangle,
  Globe,
  ArrowRight,
  BarChart3,
  Wallet,
  Radio,
  Search,
  Award,
  Rocket,
  Lock,
  Activity,
  GitBranch,
  Code,
  ExternalLink,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
interface Slide {
  id: string;
  label: string;
  section: string;
}

/* ------------------------------------------------------------------ */
/* SLIDE REGISTRY                                                      */
/* ------------------------------------------------------------------ */
const SLIDES: Slide[] = [
  { id: 'cover', label: 'Cover', section: 'intro' },
  { id: 'problem-landscape', label: 'The Problem', section: 'problem' },
  { id: 'problem-stats', label: 'By The Numbers', section: 'problem' },
  { id: 'problem-creators', label: 'Creator Crisis', section: 'problem' },
  { id: 'solution', label: 'Our Solution', section: 'solution' },
  { id: 'how-it-works', label: 'How It Works', section: 'solution' },
  { id: 'platform-overview', label: 'Platform', section: 'product' },
  { id: 'feature-pulse', label: 'Pulse Monitor', section: 'product' },
  { id: 'feature-terminal', label: 'Terminal', section: 'product' },
  { id: 'feature-launch', label: 'Token Launch', section: 'product' },
  { id: 'feature-creator', label: 'Creator Dashboard', section: 'product' },
  { id: 'feature-analyze', label: 'Risk Engine', section: 'product' },
  { id: 'differentiators', label: 'Why Us', section: 'advantage' },
  { id: 'competitive', label: 'Competitive Edge', section: 'advantage' },
  { id: 'market', label: 'Market Size', section: 'market' },
  { id: 'traction', label: 'Traction', section: 'traction' },
  { id: 'business-model', label: 'Business Model', section: 'business' },
  { id: 'roadmap', label: 'Roadmap', section: 'business' },
  { id: 'team', label: 'Team & Backing', section: 'team' },
  { id: 'closing', label: 'The Ask', section: 'closing' },
];

const SECTIONS: Record<string, string> = {
  intro: 'INTRO',
  problem: 'PROBLEM',
  solution: 'SOLUTION',
  product: 'PRODUCT',
  advantage: 'ADVANTAGE',
  market: 'MARKET',
  traction: 'TRACTION',
  business: 'BUSINESS',
  team: 'TEAM',
  closing: 'CLOSING',
};

/* ------------------------------------------------------------------ */
/* ANIMATION VARIANTS                                                  */
/* ------------------------------------------------------------------ */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ------------------------------------------------------------------ */
/* REUSABLE COMPONENTS                                                 */
/* ------------------------------------------------------------------ */

function StatBox({ value, label, accent = 'green' }: { value: string; label: string; accent?: 'green' | 'red' | 'gold' | 'blue' }) {
  const colors = {
    green: 'text-[#39FF14] border-[#39FF14]/20 number-glow-green',
    red: 'text-[#FF003C] border-[#FF003C]/20 number-glow-red',
    gold: 'text-[#FFD700] border-[#FFD700]/20 number-glow-gold',
    blue: 'text-[#00F0FF] border-[#00F0FF]/20',
  };
  return (
    <motion.div variants={fadeUp} className={`border ${colors[accent].split(' ').slice(1).join(' ')} bg-[#0A0A0A] p-5 sm:p-6 flex flex-col items-center justify-center gap-2`}>
      <span className={`text-2xl sm:text-3xl lg:text-4xl font-bold font-mono ${colors[accent].split(' ')[0]}`}>{value}</span>
      <span className="text-[10px] sm:text-xs text-[#666] uppercase tracking-widest text-center font-mono">{label}</span>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <motion.div variants={fadeUp} className="card p-5 sm:p-6 flex flex-col gap-3">
      <div className="w-10 h-10 flex items-center justify-center border border-[#39FF14]/20 bg-[#39FF14]/5">
        <Icon size={18} className="text-[#39FF14]" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#EDEDED] font-mono">{title}</h3>
      <p className="text-xs text-[#888] leading-relaxed font-mono">{desc}</p>
    </motion.div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-6">
      <div className="w-2 h-2 bg-[#39FF14]" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#39FF14] font-bold font-mono">{children}</span>
    </div>
  );
}

function SlideTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold uppercase tracking-tight text-[#EDEDED] font-[family-name:var(--font-display)] leading-[1.1] mb-6">{children}</h2>;
}

function SlideSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm sm:text-base text-[#888] leading-relaxed max-w-2xl font-mono">{children}</p>;
}

function CompetitorRow({ name, fee, social, api, risk, dividend }: { name: string; fee: string; social: string; api: string; risk: string; dividend: string }) {
  return (
    <motion.div variants={fadeUp} className="grid grid-cols-6 text-xs font-mono py-3 border-b border-white/5 items-center">
      <span className="text-[#EDEDED] font-bold">{name}</span>
      <span className={fee === 'YES' ? 'text-[#39FF14]' : 'text-[#FF003C]'}>{fee}</span>
      <span className={social === 'YES' ? 'text-[#39FF14]' : 'text-[#FF003C]'}>{social}</span>
      <span className={api === 'YES' ? 'text-[#39FF14]' : 'text-[#FF003C]'}>{api}</span>
      <span className={risk === 'YES' ? 'text-[#39FF14]' : 'text-[#FF003C]'}>{risk}</span>
      <span className={dividend === 'YES' ? 'text-[#39FF14]' : 'text-[#FF003C]'}>{dividend}</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* INDIVIDUAL SLIDES                                                   */
/* ------------------------------------------------------------------ */

function CoverSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#39FF14] font-bold font-mono mb-6">BAGS TERMINAL</div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-[#EDEDED] font-[family-name:var(--font-display)] leading-[1.05] mb-8">
            THE INTELLIGENCE<br />
            <span className="text-[#39FF14]">LAYER</span> FOR<br />
            SOLANA TOKENS
          </h1>
          <p className="text-sm sm:text-base text-[#888] font-mono max-w-xl mx-auto mb-12 leading-relaxed">
            Real-time monitoring. Creator monetization. Risk intelligence.<br />
            Built on bags.fm -- the platform that paid $20M+ to creators.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="badge badge-green px-3 py-1.5 text-[10px]">LIVE ON SOLANA</div>
            <div className="badge badge-gold px-3 py-1.5 text-[10px]">$3B+ VOLUME</div>
            <div className="badge badge-blue px-3 py-1.5 text-[10px]">AWARD WINNING</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute -bottom-8 flex items-center gap-2 text-[10px] text-[#444] font-mono uppercase tracking-widest">
          <span>PRESS ARROW KEYS OR SWIPE</span>
          <ArrowRight size={12} />
        </motion.div>
      </div>
    </div>
  );
}

function ProblemLandscapeSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE PROBLEM</SectionTag>
      <SlideTitle>SOLANA&apos;S TOKEN MARKET IS A MINEFIELD</SlideTitle>
      <SlideSubtitle>
        20,000-30,000 tokens launch daily on Solana. The vast majority are scams, pump-and-dumps, or abandoned projects. Traders lose money. Creators can&apos;t monetize. Nobody has transparency.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        <motion.div variants={fadeUp} className="border border-[#FF003C]/20 bg-[#FF003C]/5 p-6">
          <AlertTriangle size={24} className="text-[#FF003C] mb-3" />
          <h3 className="text-sm font-bold text-[#FF003C] font-mono mb-2">98.6% SCAM RATE</h3>
          <p className="text-xs text-[#888] font-mono leading-relaxed">Of all pump.fun tokens are rug pulls or pump-and-dump schemes (Solidus Labs)</p>
        </motion.div>
        <motion.div variants={fadeUp} className="border border-[#FF003C]/20 bg-[#FF003C]/5 p-6">
          <DollarSign size={24} className="text-[#FF003C] mb-3" />
          <h3 className="text-sm font-bold text-[#FF003C] font-mono mb-2">80% LOSE MONEY</h3>
          <p className="text-xs text-[#888] font-mono leading-relaxed">Only 20% of memecoin investors made any profit at all. 0.4% made over $10K.</p>
        </motion.div>
        <motion.div variants={fadeUp} className="border border-[#FF003C]/20 bg-[#FF003C]/5 p-6">
          <Eye size={24} className="text-[#FF003C] mb-3" />
          <h3 className="text-sm font-bold text-[#FF003C] font-mono mb-2">ZERO TRANSPARENCY</h3>
          <p className="text-xs text-[#888] font-mono leading-relaxed">Anonymous devs behind 92% of rug pulls. No deployer accountability anywhere.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProblemStatsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>BY THE NUMBERS</SectionTag>
      <SlideTitle>A $1B PLATFORM THAT PAYS CREATORS $0</SlideTitle>
      <SlideSubtitle>
        Pump.fun generated over $1 billion in revenue. Zero goes back to creators. Less than 1% of tokens survive. The house always wins.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
        <StatBox value="$1B+" label="Pump.fun Revenue" accent="red" />
        <StatBox value="$0" label="Paid to Creators" accent="red" />
        <StatBox value="<1%" label="Token Survival Rate" accent="red" />
        <StatBox value="294" label="Millionaires / 13.4M wallets" accent="red" />
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        <StatBox value="70%" label="Pump.fun Token Share" accent="gold" />
        <StatBox value="30K/day" label="Tokens Launched" accent="gold" />
        <StatBox value="$206B" label="Peak Monthly Volume" accent="gold" />
      </motion.div>
    </div>
  );
}

function ProblemCreatorsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE CREATOR CRISIS</SectionTag>
      <SlideTitle>CREATORS BUILD HYPE. PLATFORMS TAKE PROFIT.</SlideTitle>
      <SlideSubtitle>
        KOLs drive millions in volume with a single tweet. They charge $10K+ per post, but earn nothing from the tokens they help launch. The $250B creator economy has no on-chain monetization layer.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#FFD700] font-mono font-bold mb-4">TRADITIONAL MODEL</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FF003C]" />
              <span>Creator tweets about a token launch</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FF003C]" />
              <span>Volume spikes -- platform earns fees</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FF003C]" />
              <span>Creator gets a one-time sponsor payment</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FF003C]" />
              <span>No ongoing revenue. No alignment.</span>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card card-gold p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#39FF14] font-mono font-bold mb-4">BAGS MODEL</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#39FF14]" />
              <span>Creator launches token with fee sharing</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#39FF14]" />
              <span>1% of ALL volume flows to creators forever</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#39FF14]" />
              <span>Up to 100 fee earners per token</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#39FF14]" />
              <span>Perpetual, transparent, on-chain revenue</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SolutionSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE SOLUTION</SectionTag>
      <SlideTitle>
        BAGS TERMINAL<br />
        <span className="text-[#39FF14]">INTELLIGENCE + MONETIZATION</span>
      </SlideTitle>
      <SlideSubtitle>
        A unified platform where creators launch tokens with built-in revenue sharing, traders discover opportunities with real-time intelligence, and everyone operates with full transparency.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        <FeatureCard icon={Radio} title="Real-Time Intelligence" desc="Live token monitoring across bonding curve, migration, and DEX phases. WebSocket-powered pulse feed." />
        <FeatureCard icon={DollarSign} title="Creator Monetization" desc="1% perpetual royalties on all volume. Up to 100 fee earners. Social account integration." />
        <FeatureCard icon={Shield} title="Risk Detection" desc="Sniper detection, bundler analysis, insider clustering, deployer intelligence, credibility scoring." />
      </motion.div>
    </div>
  );
}

function HowItWorksSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>HOW IT WORKS</SectionTag>
      <SlideTitle>FROM LAUNCH TO REVENUE IN 4 STEPS</SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        {[
          { step: '01', title: 'LAUNCH', desc: 'Creator launches token with name, symbol, image. Configures up to 100 fee earners with custom split percentages.', icon: Rocket, color: '#39FF14' },
          { step: '02', title: 'TRADE', desc: 'Token enters bonding curve. Traders discover it via Pulse Monitor. Volume generates 1% creator royalties automatically.', icon: TrendingUp, color: '#00F0FF' },
          { step: '03', title: 'MIGRATE', desc: 'Token graduates to DEX. Creator fees continue flowing perpetually. Dividends auto-distribute to top 100 holders.', icon: GitBranch, color: '#FFD700' },
          { step: '04', title: 'EARN', desc: 'Creators claim accumulated fees anytime. Full dashboard with earnings history, analytics, and shareable stats.', icon: Wallet, color: '#39FF14' },
        ].map((s) => (
          <motion.div key={s.step} variants={fadeUp} className="card p-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[40px] font-bold font-[family-name:var(--font-display)] opacity-5 text-white">{s.step}</div>
            <s.icon size={20} style={{ color: s.color }} className="mb-4" />
            <h3 className="text-sm font-bold font-mono mb-2" style={{ color: s.color }}>{s.title}</h3>
            <p className="text-xs text-[#888] font-mono leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function PlatformOverviewSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE PLATFORM</SectionTag>
      <SlideTitle>6 MODULES. ONE TERMINAL.</SlideTitle>
      <SlideSubtitle>
        Every tool a Solana trader and creator needs -- from discovery to execution to earnings -- unified in a single interface.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-10">
        {[
          { icon: Radio, title: 'PULSE', desc: 'Real-time token feed', color: '#39FF14' },
          { icon: Activity, title: 'TERMINAL', desc: 'Trading + charts + analysis', color: '#00F0FF' },
          { icon: Rocket, title: 'LAUNCH', desc: 'Token creation + fee config', color: '#FFD700' },
          { icon: BarChart3, title: 'CREATOR', desc: 'Earnings + claims + admin', color: '#39FF14' },
          { icon: Search, title: 'ANALYZE', desc: 'Risk scoring + threat detection', color: '#FF003C' },
          { icon: Users, title: 'DEPLOYERS', desc: 'Deployer intel + reputation', color: '#00F0FF' },
        ].map((m) => (
          <motion.div key={m.title} variants={fadeUp} className="card p-5 flex flex-col gap-3 group cursor-pointer">
            <m.icon size={20} style={{ color: m.color }} />
            <div>
              <h3 className="text-xs font-bold font-mono group-hover:text-[#39FF14] transition-colors" style={{ color: m.color }}>{m.title}</h3>
              <p className="text-[10px] text-[#666] font-mono mt-1">{m.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function FeaturePulseSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>PULSE MONITOR</SectionTag>
      <SlideTitle>SEE EVERY TOKEN. THE MOMENT IT LAUNCHES.</SlideTitle>
      <SlideSubtitle>
        Real-time WebSocket feed showing tokens across their lifecycle: bonding curve, near-migration, and DEX-listed. Filter for BAGS tokens, toggle live updates, multi-chain support.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-10">
        {/* Simulated Pulse UI */}
        <motion.div variants={fadeUp} className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] badge-live" />
              <span className="text-[10px] uppercase tracking-widest text-[#39FF14] font-mono font-bold">LIVE FEED</span>
            </div>
            <div className="flex gap-2">
              <div className="badge badge-green px-2 py-1 text-[9px]">SOLANA</div>
              <div className="badge badge-muted px-2 py-1 text-[9px]">BASE</div>
              <div className="badge badge-muted px-2 py-1 text-[9px]">ETH</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0">
            {['NEW', 'FINAL STRETCH', 'MIGRATED'].map((col, i) => (
              <div key={col} className={`p-4 ${i < 2 ? 'border-r border-white/5' : ''}`}>
                <div className="text-[9px] uppercase tracking-widest text-[#666] font-mono font-bold mb-3">{col}</div>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-[#111] p-3 mb-2 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-16 h-2.5 skeleton-shimmer rounded" />
                      <div className={`w-8 h-2.5 rounded ${i === 0 ? 'bg-[#39FF14]/10' : i === 1 ? 'bg-[#FFD700]/10' : 'bg-[#00F0FF]/10'}`} />
                    </div>
                    <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-[#39FF14]/40 w-[25%]' : i === 1 ? 'bg-[#FFD700]/60 w-[85%]' : 'bg-[#00F0FF]/40 w-full'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureTerminalSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>TERMINAL</SectionTag>
      <SlideTitle>RESEARCH. ANALYZE. EXECUTE.</SlideTitle>
      <SlideSubtitle>
        Full trading terminal with GeckoTerminal charts, market swap execution via bags.fm, fee earner visibility, credibility scoring, and real-time trade streams.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
        <StatBox value="CHARTS" label="GeckoTerminal Integration" accent="green" />
        <StatBox value="SWAP" label="Direct Market Execution" accent="blue" />
        <StatBox value="FEES" label="Fee Earner Visibility" accent="gold" />
        <StatBox value="SCORE" label="Credibility Matrix" accent="green" />
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <FeatureCard icon={BarChart3} title="Price Analytics" desc="24h & 5m volume, market cap, holders, traders -- all real-time" />
        <FeatureCard icon={Users} title="Fee Earners Panel" desc="See who earns from every trade. Lifetime fees, royalty %, social profiles" />
        <FeatureCard icon={ExternalLink} title="Shareable Cards" desc="Export P&L and snapshot cards for social sharing" />
      </motion.div>
    </div>
  );
}

function FeatureLaunchSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>TOKEN LAUNCH</SectionTag>
      <SlideTitle>LAUNCH A TOKEN.<br /><span className="text-[#FFD700]">SPLIT FEES WITH 100 PEOPLE.</span></SlideTitle>
      <SlideSubtitle>
        No code required. Set token metadata, configure fee sharing across up to 100 wallets or social accounts, and launch on-chain in under 60 seconds.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#FFD700] font-mono font-bold mb-4">FEE CONFIGURATION</h3>
          <div className="space-y-3">
            {[
              { label: '@creator_twitter', pct: '40%', color: '#39FF14' },
              { label: '@kol_partner', pct: '25%', color: '#00F0FF' },
              { label: 'community_wallet.sol', pct: '20%', color: '#FFD700' },
              { label: '@dev_github', pct: '15%', color: '#888' },
            ].map((e) => (
              <div key={e.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: e.color }} />
                  <span className="text-xs font-mono text-[#888]">{e.label}</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: e.color }}>{e.pct}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="w-full h-2 bg-[#1A1A1A] flex overflow-hidden">
              <div className="h-full bg-[#39FF14]" style={{ width: '40%' }} />
              <div className="h-full bg-[#00F0FF]" style={{ width: '25%' }} />
              <div className="h-full bg-[#FFD700]" style={{ width: '20%' }} />
              <div className="h-full bg-[#888]" style={{ width: '15%' }} />
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#39FF14] font-mono font-bold mb-4">SOCIAL PROVIDERS</h3>
          <p className="text-xs text-[#888] font-mono mb-4 leading-relaxed">
            Add fee earners by their social handle. BAGS resolves wallets automatically.
          </p>
          <div className="space-y-2">
            {['Twitter / X', 'Kick', 'GitHub', 'TikTok'].map((p) => (
              <div key={p} className="flex items-center gap-3 text-xs font-mono text-[#888] bg-[#111] p-3 border border-white/5">
                <div className="w-1.5 h-1.5 bg-[#39FF14]" />
                {p}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureCreatorSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>CREATOR DASHBOARD</SectionTag>
      <SlideTitle>YOUR TOKENS. YOUR FEES.<br /><span className="text-[#39FF14]">YOUR COMMAND CENTER.</span></SlideTitle>
      <SlideSubtitle>
        Track all launched tokens, claim accumulated fees, manage partner configs, and share your stats with exportable cards.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
        <FeatureCard icon={Wallet} title="My Tokens" desc="All created tokens with market cap, fees earned, holders" />
        <FeatureCard icon={DollarSign} title="Fee Claims" desc="Claim fees with one click. View history with timestamps." />
        <FeatureCard icon={Users} title="Partner Config" desc="Create partner keys. Track referral earnings." />
        <FeatureCard icon={Lock} title="Token Admin" desc="Transfer admin authority. Manage token settings." />
      </motion.div>
    </div>
  );
}

function FeatureAnalyzeSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>RISK ENGINE</SectionTag>
      <SlideTitle>DETECT THREATS<br /><span className="text-[#FF003C]">BEFORE THEY STRIKE</span></SlideTitle>
      <SlideSubtitle>
        AI-powered risk scoring from 0-100. Detects snipers, bundlers, insider clusters, fresh wallet patterns, and dev clustering in real-time.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#FF003C] font-mono font-bold mb-4">THREAT DETECTION</h3>
          <div className="space-y-3">
            {[
              { threat: 'SNIPER WALLETS', desc: 'Detects wallets that buy within first blocks', severity: 'HIGH' },
              { threat: 'BUNDLER CLUSTERS', desc: 'Identifies coordinated buy groups', severity: 'CRITICAL' },
              { threat: 'FRESH WALLETS', desc: 'Flags recently created wallets with large buys', severity: 'MEDIUM' },
              { threat: 'DEV CLUSTERS', desc: 'Tracks deployer-connected wallet activity', severity: 'HIGH' },
            ].map((t) => (
              <div key={t.threat} className="flex items-center justify-between bg-[#111] p-3 border border-white/5">
                <div>
                  <div className="text-xs font-mono font-bold text-[#EDEDED]">{t.threat}</div>
                  <div className="text-[10px] font-mono text-[#666] mt-0.5">{t.desc}</div>
                </div>
                <div className={`badge text-[9px] px-2 py-0.5 ${t.severity === 'CRITICAL' ? 'badge-red' : t.severity === 'HIGH' ? 'badge-yellow' : 'badge-muted'}`}>
                  {t.severity}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#00F0FF] font-mono font-bold mb-4">DEPLOYER INTELLIGENCE</h3>
          <p className="text-xs text-[#888] font-mono mb-4 leading-relaxed">
            Aggregated performance profiles for every deployer on the network. Know who you&apos;re trusting before you trade.
          </p>
          <div className="space-y-3">
            {[
              { label: 'Total Launches', value: '47' },
              { label: 'Success Rate', value: '72%' },
              { label: 'Avg Market Cap', value: '$340K' },
              { label: 'Risk Score', value: 'LOW' },
              { label: 'Insider Usage', value: '2.1%' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#666]">{s.label}</span>
                <span className="text-[#EDEDED] font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function DifferentiatorsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>WHY BAGS TERMINAL</SectionTag>
      <SlideTitle>WHAT MAKES US <span className="text-[#39FF14]">DIFFERENT</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        <FeatureCard icon={DollarSign} title="Perpetual Royalties" desc="1% of ALL volume flows to creators -- forever. Not just at launch. Not just at graduation. Every trade." />
        <FeatureCard icon={Users} title="100-Way Fee Split" desc="Configure up to 100 fee earners per token. Split revenue across teams, KOLs, communities, DAOs." />
        <FeatureCard icon={Globe} title="Social Resolution" desc="Add fee earners by Twitter, Kick, GitHub, TikTok handle. Wallets resolved automatically." />
        <FeatureCard icon={Shield} title="Risk Intelligence" desc="Sniper detection, bundler analysis, deployer scoring. Know the risks before you trade." />
        <FeatureCard icon={Radio} title="Real-Time Pulse" desc="WebSocket-powered live feed. See every token the moment it launches, migrates, or spikes." />
        <FeatureCard icon={Code} title="Developer Platform" desc="REST API + TypeScript SDK. 1,000 req/hour. Build apps on top of the BAGS ecosystem." />
      </motion.div>
    </div>
  );
}

function CompetitiveSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>COMPETITIVE LANDSCAPE</SectionTag>
      <SlideTitle>FEATURE COMPARISON</SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-10 overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-6 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#666] pb-3 border-b border-white/10 font-bold">
            <span>PLATFORM</span>
            <span>FEE SHARING</span>
            <span>SOCIAL LINK</span>
            <span>DEV API</span>
            <span>RISK ENGINE</span>
            <span>DIVIDENDS</span>
          </div>
          <CompetitorRow name="BAGS" fee="YES" social="YES" api="YES" risk="YES" dividend="YES" />
          <CompetitorRow name="Pump.fun" fee="NO" social="NO" api="NO" risk="NO" dividend="NO" />
          <CompetitorRow name="Moonshot" fee="NO" social="NO" api="NO" risk="NO" dividend="NO" />
          <CompetitorRow name="LetsBonk" fee="NO" social="NO" api="NO" risk="NO" dividend="NO" />
          <CompetitorRow name="SunPump" fee="NO" social="NO" api="NO" risk="NO" dividend="NO" />
        </div>
      </motion.div>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-8 p-4 border border-[#39FF14]/20 bg-[#39FF14]/5">
        <p className="text-xs font-mono text-[#39FF14] text-center">
          BAGS Terminal is the ONLY platform combining creator monetization, risk intelligence, and real-time monitoring in one interface.
        </p>
      </motion.div>
    </div>
  );
}

function MarketSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>MARKET OPPORTUNITY</SectionTag>
      <SlideTitle>A MARKET THAT ONLY <span className="text-[#39FF14]">GROWS</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        <motion.div variants={fadeUp} className="card p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-[#39FF14] font-mono number-glow-green mb-2">$80B+</div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] font-mono font-bold mb-3">MEMECOIN MARKET CAP</div>
          <div className="text-xs text-[#888] font-mono">Growing at 26.7% CAGR through 2035</div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-[#FFD700] font-mono number-glow-gold mb-2">$250B</div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] font-mono font-bold mb-3">CREATOR ECONOMY</div>
          <div className="text-xs text-[#888] font-mono">Projected $480B by 2027. 22.5% YoY growth.</div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-[#00F0FF] font-mono mb-2">$2.4B</div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] font-mono font-bold mb-3">SOLANA APP REVENUE</div>
          <div className="text-xs text-[#888] font-mono">2025 total. Memecoins = 83.7% of DApp revenue.</div>
        </motion.div>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 mt-4">
        <StatBox value="$206B" label="Peak Monthly DEX Volume" accent="green" />
        <StatBox value="30K+" label="Tokens Launched Daily" accent="gold" />
        <StatBox value="94.9%" label="Solana Memecoin Market Share (Peak)" accent="blue" />
      </motion.div>
    </div>
  );
}

function TractionSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>TRACTION</SectionTag>
      <SlideTitle>ALREADY <span className="text-[#39FF14]">SHIPPING & SCALING</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
        <StatBox value="$3B+" label="Total On-chain Volume" accent="green" />
        <StatBox value="$20M+" label="Paid to Creators" accent="gold" />
        <StatBox value="$4M" label="Developer Fund" accent="blue" />
        <StatBox value="2026" label="FinTech Award Winner" accent="green" />
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="card p-5">
          <Award size={20} className="text-[#FFD700] mb-3" />
          <h3 className="text-sm font-bold font-mono text-[#FFD700] mb-2">AWARD RECOGNITION</h3>
          <p className="text-xs text-[#888] font-mono leading-relaxed">Winner of the &ldquo;Crowdfunding Innovation Award&rdquo; at the 2026 FinTech Breakthrough Awards (10th annual program).</p>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-5">
          <Code size={20} className="text-[#00F0FF] mb-3" />
          <h3 className="text-sm font-bold font-mono text-[#00F0FF] mb-2">DEVELOPER ECOSYSTEM</h3>
          <p className="text-xs text-[#888] font-mono leading-relaxed">$4M hackathon fund. REST API + TypeScript SDK. Bags App Store launching for third-party apps.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function BusinessModelSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>BUSINESS MODEL</SectionTag>
      <SlideTitle>REVENUE FROM <span className="text-[#FFD700]">EVERY TRANSACTION</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#39FF14] font-mono font-bold mb-4">REVENUE STREAMS</h3>
          <div className="space-y-4">
            {[
              { source: 'Trading Fees', desc: 'Platform fee on every swap executed', pct: 'PRIMARY' },
              { source: 'Launch Tips', desc: 'Optional creator tip on token launches', pct: 'RECURRING' },
              { source: 'Partner Keys', desc: 'Referral tracking with revenue share', pct: 'GROWTH' },
              { source: 'API Access', desc: 'Developer platform with rate-limited tiers', pct: 'EXPANSION' },
              { source: 'App Store', desc: 'Third-party app marketplace (upcoming)', pct: 'PLATFORM' },
            ].map((r) => (
              <div key={r.source} className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-[#EDEDED]">{r.source}</div>
                  <div className="text-[10px] font-mono text-[#666] mt-0.5">{r.desc}</div>
                </div>
                <div className="badge badge-green text-[9px] px-2 py-0.5">{r.pct}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#FFD700] font-mono font-bold mb-4">UNIT ECONOMICS</h3>
          <div className="space-y-4">
            <div className="bg-[#111] p-4 border border-white/5">
              <div className="text-xs font-mono text-[#666] mb-1">Volume = Revenue</div>
              <div className="text-sm font-mono text-[#EDEDED]">Every $1B in volume = direct platform revenue from trading fees</div>
            </div>
            <div className="bg-[#111] p-4 border border-white/5">
              <div className="text-xs font-mono text-[#666] mb-1">Creator Lock-in</div>
              <div className="text-sm font-mono text-[#EDEDED]">Perpetual royalties create lifetime creator retention</div>
            </div>
            <div className="bg-[#111] p-4 border border-white/5">
              <div className="text-xs font-mono text-[#666] mb-1">Network Effects</div>
              <div className="text-sm font-mono text-[#EDEDED]">More creators = more tokens = more volume = more fees</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function RoadmapSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>ROADMAP</SectionTag>
      <SlideTitle>WHERE WE&apos;RE <span className="text-[#00F0FF]">GOING</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-10 space-y-4">
        {[
          { phase: 'NOW', title: 'INTELLIGENCE LAYER', items: ['Pulse Monitor (LIVE)', 'Terminal + Trading (LIVE)', 'Risk Analysis Engine (LIVE)', 'Creator Dashboard (LIVE)'], color: '#39FF14', done: true },
          { phase: 'Q2 2026', title: 'ECOSYSTEM EXPANSION', items: ['Bags App Store Launch', 'Enhanced API Tiers', 'Multi-chain Expansion (Base, Ethereum)', 'Advanced Deployer Scoring'], color: '#00F0FF', done: false },
          { phase: 'Q3-Q4 2026', title: 'PLATFORM FLYWHEEL', items: ['AI-Powered Risk Predictions', 'Social Trading Features', 'Institutional Dashboard', 'Mobile Terminal App'], color: '#FFD700', done: false },
        ].map((p) => (
          <motion.div key={p.phase} variants={fadeUp} className="card p-5 flex gap-6 items-start">
            <div className="flex-shrink-0 w-20 text-center">
              <div className="text-xs font-mono font-bold mb-1" style={{ color: p.color }}>{p.phase}</div>
              {p.done && <div className="badge badge-green text-[8px] px-1.5 py-0.5">LIVE</div>}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold font-mono text-[#EDEDED] mb-2">{p.title}</h3>
              <div className="grid grid-cols-2 gap-1">
                {p.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-mono text-[#888]">
                    <div className="w-1 h-1" style={{ backgroundColor: p.color }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function TeamSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>TEAM & BACKING</SectionTag>
      <SlideTitle>BUILT BY <span className="text-[#39FF14]">BUILDERS</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#FFD700] font-mono font-bold mb-4">BAGS.FM</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FFD700]" />
              <span>Founded by Finn Bags (CEO)</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FFD700]" />
              <span>$3B+ on-chain volume facilitated</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FFD700]" />
              <span>2026 FinTech Breakthrough Award Winner</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888]">
              <div className="w-1.5 h-1.5 bg-[#FFD700]" />
              <span>$4M Developer Fund deployed</span>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#00F0FF] font-mono font-bold mb-4">TECH STACK</h3>
          <div className="space-y-3">
            {[
              'Next.js 16 + React 19 + TypeScript',
              'Solana Web3.js + Wallet Adapter',
              'Socket.IO Real-time Infrastructure',
              'Zustand State Management (9 stores)',
              'Bags SDK + GMGN + DexScreener APIs',
              'Framer Motion Animations',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-xs font-mono text-[#888]">
                <div className="w-1.5 h-1.5 bg-[#00F0FF]" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ClosingSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#39FF14] font-bold font-mono mb-6">THE OPPORTUNITY</div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-tight text-[#EDEDED] font-[family-name:var(--font-display)] leading-[1.1] mb-8">
            THE TOKEN ECONOMY<br />
            NEEDS AN <span className="text-[#39FF14]">INTELLIGENCE LAYER</span>
          </h1>
          <p className="text-sm sm:text-base text-[#888] font-mono max-w-2xl mx-auto mb-12 leading-relaxed">
            30,000 tokens launch daily. $80B+ market. $250B creator economy.
            Zero transparency. Zero creator monetization. Until now.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#39FF14] font-mono number-glow-green">$3B+</div>
              <div className="text-[9px] text-[#666] font-mono uppercase tracking-widest mt-1">VOLUME</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FFD700] font-mono number-glow-gold">$20M+</div>
              <div className="text-[9px] text-[#666] font-mono uppercase tracking-widest mt-1">TO CREATORS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00F0FF] font-mono">$4M</div>
              <div className="text-[9px] text-[#666] font-mono uppercase tracking-widest mt-1">DEV FUND</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="badge badge-green px-6 py-2.5 text-sm font-bold">
              BAGS TERMINAL
            </div>
            <span className="text-[10px] text-[#444] font-mono uppercase tracking-widest">
              bagsterminal.com
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SLIDE RENDERER                                                      */
/* ------------------------------------------------------------------ */
function SlideContent({ id }: { id: string }) {
  switch (id) {
    case 'cover': return <CoverSlide />;
    case 'problem-landscape': return <ProblemLandscapeSlide />;
    case 'problem-stats': return <ProblemStatsSlide />;
    case 'problem-creators': return <ProblemCreatorsSlide />;
    case 'solution': return <SolutionSlide />;
    case 'how-it-works': return <HowItWorksSlide />;
    case 'platform-overview': return <PlatformOverviewSlide />;
    case 'feature-pulse': return <FeaturePulseSlide />;
    case 'feature-terminal': return <FeatureTerminalSlide />;
    case 'feature-launch': return <FeatureLaunchSlide />;
    case 'feature-creator': return <FeatureCreatorSlide />;
    case 'feature-analyze': return <FeatureAnalyzeSlide />;
    case 'differentiators': return <DifferentiatorsSlide />;
    case 'competitive': return <CompetitiveSlide />;
    case 'market': return <MarketSlide />;
    case 'traction': return <TractionSlide />;
    case 'business-model': return <BusinessModelSlide />;
    case 'roadmap': return <RoadmapSlide />;
    case 'team': return <TeamSlide />;
    case 'closing': return <ClosingSlide />;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/* MAIN PITCH DECK COMPONENT                                           */
/* ------------------------------------------------------------------ */
export default function PitchDeckPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    setNavOpen(false);
  }, [current]);

  const next = useCallback(() => {
    if (current < SLIDES.length - 1) {
      setDirection(1);
      setCurrent((p) => p + 1);
    }
  }, [current]);

  const prev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((p) => p - 1);
    }
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Touch navigation
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [next, prev]);

  const slide = SLIDES[current];
  const progress = ((current + 1) / SLIDES.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-[#EDEDED] flex flex-col overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-12 border-b border-white/5 relative z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setNavOpen(!navOpen)} className="text-[10px] uppercase tracking-widest text-[#888] font-mono font-bold hover:text-[#39FF14] transition-colors">
            {SECTIONS[slide.section]}
          </button>
          <span className="text-[#333]">/</span>
          <span className="text-[10px] uppercase tracking-widest text-[#EDEDED] font-mono font-bold">{slide.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-[#666]">{current + 1} / {SLIDES.length}</span>
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={prev} disabled={current === 0} className="w-7 h-7 flex items-center justify-center border border-white/10 hover:border-[#39FF14]/30 disabled:opacity-20 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={next} disabled={current === SLIDES.length - 1} className="w-7 h-7 flex items-center justify-center border border-white/10 hover:border-[#39FF14]/30 disabled:opacity-20 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-[2px] bg-[#111] relative z-20">
        <motion.div className="h-full bg-[#39FF14]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
      </div>

      {/* Navigation drawer */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-white/5 z-30 p-4 overflow-y-auto custom-scrollbar"
          >
            {Object.entries(SECTIONS).map(([key, label]) => {
              const sectionSlides = SLIDES.filter((s) => s.section === key);
              return (
                <div key={key} className="mb-4">
                  <div className="text-[9px] uppercase tracking-widest text-[#39FF14] font-mono font-bold mb-2">{label}</div>
                  {sectionSlides.map((s) => {
                    const idx = SLIDES.indexOf(s);
                    return (
                      <button
                        key={s.id}
                        onClick={() => goTo(idx)}
                        className={`block w-full text-left text-xs font-mono py-1.5 px-3 mb-0.5 transition-colors ${
                          idx === current ? 'text-[#39FF14] bg-[#39FF14]/5' : 'text-[#888] hover:text-[#EDEDED]'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden" onClick={navOpen ? () => setNavOpen(false) : undefined}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 px-6 sm:px-12 lg:px-24 py-6 sm:py-10 overflow-y-auto custom-scrollbar"
          >
            <SlideContent id={slide.id} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom progress dots */}
      <div className="flex-shrink-0 flex items-center justify-center gap-1 py-3 border-t border-white/5">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`h-1 transition-all duration-300 ${
              i === current ? 'w-6 bg-[#39FF14]' : i < current ? 'w-1.5 bg-[#39FF14]/30' : 'w-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
