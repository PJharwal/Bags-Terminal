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
  Target,
  Gauge,
  Layers,
  ImageIcon,
  Settings,
  Share2,
  CheckCircle,
  Clock,
  Flame,
  Sparkles,
  CircleDollarSign,
  LineChart,
  Milestone,
  Crosshair,
  Zap,
  Link2,
  ArrowLeftRight,
  Network,
  Repeat,
  ShieldAlert,
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
/* SLIDE REGISTRY — 32 SLIDES                                         */
/* ------------------------------------------------------------------ */
const SLIDES: Slide[] = [
  { id: 'cover', label: 'Cover', section: 'intro' },
  { id: 'what-is-bags', label: 'What Is BAGS', section: 'intro' },
  { id: 'problem-landscape', label: 'The Problem', section: 'problem' },
  { id: 'problem-stats', label: 'By The Numbers', section: 'problem' },
  { id: 'what-we-solve', label: 'What We Solve', section: 'problem' },
  { id: 'problem-creators', label: 'Creator Crisis', section: 'problem' },
  { id: 'solution', label: 'Our Solution', section: 'solution' },
  { id: 'how-it-works', label: 'How It Works', section: 'solution' },
  { id: 'platform-overview', label: 'Platform', section: 'product' },
  { id: 'feature-pulse', label: 'Pulse Monitor', section: 'product' },
  { id: 'feature-terminal', label: 'Terminal', section: 'product' },
  { id: 'launchpad-overview', label: 'Launchpad', section: 'launchpad' },
  { id: 'launchpad-features', label: 'Launch Features', section: 'launchpad' },
  { id: 'launchpad-flow', label: 'Launch Flow', section: 'launchpad' },
  { id: 'feature-creator', label: 'Creator Dashboard', section: 'product' },
  { id: 'feature-analyze', label: 'Risk Engine', section: 'product' },
  { id: 'vision-thesis', label: 'Chain Abstraction', section: 'vision' },
  { id: 'vision-problem', label: 'Fragmentation Tax', section: 'vision' },
  { id: 'vision-architecture', label: 'One Terminal', section: 'vision' },
  { id: 'vision-polymarket', label: 'Cross-Chain Polymarket', section: 'vision' },
  { id: 'vision-perps', label: 'Cross-Chain Perps', section: 'vision' },
  { id: 'vision-meme', label: 'Cross-Chain Memes', section: 'vision' },
  { id: 'vision-moat', label: 'Why We Win', section: 'vision' },
  { id: 'kpis', label: 'KPIs', section: 'metrics' },
  { id: 'milestones', label: 'Milestones', section: 'metrics' },
  { id: 'differentiators', label: 'Why Us', section: 'advantage' },
  { id: 'competitive', label: 'Competitive Edge', section: 'advantage' },
  { id: 'market', label: 'Market Size', section: 'market' },
  { id: 'traction', label: 'Traction', section: 'traction' },
  { id: 'business-model', label: 'Business Model', section: 'business' },
  { id: 'roadmap', label: 'Roadmap', section: 'business' },
  { id: 'closing', label: 'The Ask', section: 'closing' },
];

const SECTIONS: Record<string, string> = {
  intro: 'INTRO',
  problem: 'PROBLEM',
  solution: 'SOLUTION',
  product: 'PRODUCT',
  launchpad: 'LAUNCHPAD',
  vision: 'CROSS-CHAIN',
  metrics: 'METRICS',
  advantage: 'ADVANTAGE',
  market: 'MARKET',
  traction: 'TRACTION',
  business: 'BUSINESS',
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
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
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

function FeatureCard({ icon: Icon, title, desc, color }: { icon: React.ElementType; title: string; desc: string; color?: string }) {
  const c = color || '#39FF14';
  return (
    <motion.div variants={fadeUp} className="card p-5 sm:p-6 flex flex-col gap-3">
      <div className="w-10 h-10 flex items-center justify-center border bg-black/30" style={{ borderColor: `${c}33` }}>
        <Icon size={18} style={{ color: c }} />
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

function MockupFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <motion.div variants={fadeUp} className="card p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0D0D0D]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF003C]/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#39FF14]/40" />
        </div>
        <span className="text-[9px] uppercase tracking-widest text-[#555] font-mono font-bold ml-2">{title}</span>
      </div>
      <div className="p-4">{children}</div>
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

function WhatIsBagsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>WHAT IS BAGS TERMINAL</SectionTag>
      <SlideTitle>THE ALL-IN-ONE <span className="text-[#39FF14]">COMMAND CENTER</span> FOR SOLANA TOKENS</SlideTitle>
      <SlideSubtitle>
        BAGS Terminal is a real-time Solana token monitoring, trading intelligence, and creator monetization platform built on bags.fm. It gives traders, creators, and deployers everything they need in one interface.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
        <motion.div variants={fadeUp} className="card p-6 border-l-2 border-l-[#39FF14]">
          <div className="text-xs font-mono font-bold text-[#39FF14] uppercase tracking-widest mb-3">FOR TRADERS</div>
          <p className="text-xs text-[#888] font-mono leading-relaxed">Discover tokens in real-time, analyze risk before buying, execute swaps, and track deployer reputation -- all before the crowd.</p>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6 border-l-2 border-l-[#FFD700]">
          <div className="text-xs font-mono font-bold text-[#FFD700] uppercase tracking-widest mb-3">FOR CREATORS</div>
          <p className="text-xs text-[#888] font-mono leading-relaxed">Launch tokens with perpetual 1% royalties. Split fees with up to 100 people. Claim earnings. Build a monetized community.</p>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6 border-l-2 border-l-[#00F0FF]">
          <div className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-widest mb-3">FOR DEVELOPERS</div>
          <p className="text-xs text-[#888] font-mono leading-relaxed">REST API + TypeScript SDK. Build apps on BAGS infrastructure. Participate in the $4M hackathon fund.</p>
        </motion.div>
      </motion.div>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6 p-4 border border-white/5 bg-[#0A0A0A]">
        <div className="flex flex-wrap items-center justify-center gap-6 text-center">
          {[
            { val: '6', lbl: 'Core Modules' },
            { val: '9', lbl: 'State Stores' },
            { val: '3', lbl: 'Data Sources' },
            { val: 'LIVE', lbl: 'WebSocket Feed' },
            { val: '4', lbl: 'Wallet Adapters' },
          ].map((s) => (
            <div key={s.lbl}>
              <div className="text-lg font-bold font-mono text-[#39FF14]">{s.val}</div>
              <div className="text-[9px] text-[#666] font-mono uppercase tracking-widest">{s.lbl}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ProblemLandscapeSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE PROBLEM</SectionTag>
      <SlideTitle>SOLANA&apos;S TOKEN MARKET IS A <span className="text-[#FF003C]">MINEFIELD</span></SlideTitle>
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
      <SlideTitle>A $1B PLATFORM THAT PAYS CREATORS <span className="text-[#FF003C]">$0</span></SlideTitle>
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

function WhatWeSolveSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>WHAT WE&apos;RE SOLVING</SectionTag>
      <SlideTitle>5 CRITICAL PROBLEMS. <span className="text-[#39FF14]">ONE PLATFORM.</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[
          {
            num: '01',
            problem: 'CREATOR MONETIZATION',
            before: 'Creators drive volume but earn $0 from tokens they promote',
            after: '1% perpetual royalties on ALL trading volume, forever',
            icon: CircleDollarSign,
            color: '#FFD700',
          },
          {
            num: '02',
            problem: 'FRAUD & RUG PULLS',
            before: '98.6% of tokens are scams. No way to assess risk pre-trade',
            after: 'Real-time risk scoring, sniper detection, deployer reputation',
            icon: Shield,
            color: '#FF003C',
          },
          {
            num: '03',
            problem: 'NO TRANSPARENCY',
            before: 'Anonymous deployers, hidden insider wallets, no accountability',
            after: 'Deployer dossiers, credibility matrix, on-chain verification',
            icon: Eye,
            color: '#00F0FF',
          },
          {
            num: '04',
            problem: 'FRAGMENTED TOOLS',
            before: 'Traders use 5+ separate tools: scanner, chart, swap, analyzer',
            after: 'Pulse + Terminal + Analyze + Launch in one unified interface',
            icon: Layers,
            color: '#39FF14',
          },
          {
            num: '05',
            problem: 'TOKEN DISCOVERY',
            before: 'Missed launches, slow feeds, no lifecycle tracking',
            after: 'WebSocket real-time feed with bonding > migration > DEX phases',
            icon: Radio,
            color: '#FAFF00',
          },
        ].map((p) => (
          <motion.div key={p.num} variants={fadeUp} className="card p-5 relative overflow-hidden">
            <div className="absolute top-2 right-3 text-[32px] font-bold font-[family-name:var(--font-display)] opacity-[0.04] text-white">{p.num}</div>
            <p.icon size={18} style={{ color: p.color }} className="mb-3" />
            <h3 className="text-xs font-bold font-mono mb-3" style={{ color: p.color }}>{p.problem}</h3>
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <div className="w-1 h-1 mt-1.5 bg-[#FF003C] flex-shrink-0" />
                <p className="text-[10px] text-[#666] font-mono leading-relaxed">{p.before}</p>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-1 h-1 mt-1.5 bg-[#39FF14] flex-shrink-0" />
                <p className="text-[10px] text-[#EDEDED] font-mono leading-relaxed">{p.after}</p>
              </div>
            </div>
          </motion.div>
        ))}
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
          <h3 className="text-xs uppercase tracking-widest text-[#FF003C] font-mono font-bold mb-4">TRADITIONAL MODEL</h3>
          <div className="space-y-3">
            {[
              'Creator tweets about a token launch',
              'Volume spikes -- platform earns fees',
              'Creator gets a one-time sponsor payment',
              'No ongoing revenue. No alignment.',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-xs font-mono text-[#888]">
                <div className="w-1.5 h-1.5 bg-[#FF003C]" />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <span className="text-xl font-bold font-mono text-[#FF003C] number-glow-red">$0</span>
            <div className="text-[9px] text-[#666] font-mono uppercase tracking-widest mt-1">ONGOING CREATOR REVENUE</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card card-gold p-6">
          <h3 className="text-xs uppercase tracking-widest text-[#39FF14] font-mono font-bold mb-4">BAGS MODEL</h3>
          <div className="space-y-3">
            {[
              'Creator launches token with fee sharing',
              '1% of ALL volume flows to creators forever',
              'Up to 100 fee earners per token',
              'Perpetual, transparent, on-chain revenue',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-xs font-mono text-[#888]">
                <div className="w-1.5 h-1.5 bg-[#39FF14]" />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#39FF14]/10 text-center">
            <span className="text-xl font-bold font-mono text-[#39FF14] number-glow-green">$20M+</span>
            <div className="text-[9px] text-[#666] font-mono uppercase tracking-widest mt-1">PAID TO CREATORS SO FAR</div>
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
        <FeatureCard icon={Radio} title="Real-Time Intelligence" desc="Live token monitoring across bonding curve, migration, and DEX phases. WebSocket-powered pulse feed." color="#39FF14" />
        <FeatureCard icon={DollarSign} title="Creator Monetization" desc="1% perpetual royalties on all volume. Up to 100 fee earners. Social account integration." color="#FFD700" />
        <FeatureCard icon={Shield} title="Risk Detection" desc="Sniper detection, bundler analysis, insider clustering, deployer intelligence, credibility scoring." color="#FF003C" />
      </motion.div>
    </div>
  );
}

function HowItWorksSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>HOW IT WORKS</SectionTag>
      <SlideTitle>FROM LAUNCH TO REVENUE IN <span className="text-[#39FF14]">4 STEPS</span></SlideTitle>
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
      {/* Visual flow arrow */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="hidden lg:flex items-center justify-center gap-2 mt-6">
        {['BONDING CURVE', 'NEAR MIGRATION', 'DEX LIVE', 'FEES FLOWING'].map((phase, i) => (
          <React.Fragment key={phase}>
            <div className="text-[9px] font-mono text-[#666] uppercase tracking-widest bg-[#111] px-3 py-1.5 border border-white/5">{phase}</div>
            {i < 3 && <ArrowRight size={12} className="text-[#39FF14]/40" />}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

function PlatformOverviewSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE PLATFORM</SectionTag>
      <SlideTitle>6 MODULES. <span className="text-[#39FF14]">ONE TERMINAL.</span></SlideTitle>
      <SlideSubtitle>
        Every tool a Solana trader and creator needs -- from discovery to execution to earnings -- unified in a single interface.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-10">
        {[
          { icon: Radio, title: 'PULSE', desc: 'Real-time token feed with 3-column lifecycle view', color: '#39FF14', route: '/pulse' },
          { icon: Activity, title: 'TERMINAL', desc: 'Charts, swap execution, fee earner visibility', color: '#00F0FF', route: '/terminal' },
          { icon: Rocket, title: 'LAUNCH', desc: 'Token creation with multi-party fee config', color: '#FFD700', route: '/launch' },
          { icon: BarChart3, title: 'CREATOR', desc: 'Earnings dashboard, claims, partner keys', color: '#39FF14', route: '/creator' },
          { icon: Search, title: 'ANALYZE', desc: 'Risk scoring, threat detection, holder audit', color: '#FF003C', route: '/analyze' },
          { icon: Users, title: 'DEPLOYERS', desc: 'Deployer intel, reputation, launch history', color: '#00F0FF', route: '/deployers' },
        ].map((m) => (
          <motion.div key={m.title} variants={fadeUp} className="card p-5 flex flex-col gap-3 group cursor-pointer">
            <div className="flex items-center justify-between">
              <m.icon size={20} style={{ color: m.color }} />
              <span className="text-[9px] font-mono text-[#333]">{m.route}</span>
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono" style={{ color: m.color }}>{m.title}</h3>
              <p className="text-[10px] text-[#666] font-mono mt-1 leading-relaxed">{m.desc}</p>
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
      <SlideTitle>SEE EVERY TOKEN. <span className="text-[#39FF14]">THE MOMENT IT LAUNCHES.</span></SlideTitle>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 mt-8">
        <div>
          <SlideSubtitle>
            Real-time WebSocket feed showing tokens across their lifecycle. Filter for BAGS tokens, toggle live updates, multi-chain support.
          </SlideSubtitle>
          <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6 space-y-3">
            {[
              { label: 'Live WebSocket connection', detail: 'Auto-reconnect with 5 retry attempts' },
              { label: '3-column Kanban view', detail: 'NEW > FINAL STRETCH > MIGRATED' },
              { label: 'BAGS token filter', detail: 'Filter tokens ending in "bags"' },
              { label: 'Multi-chain support', detail: 'Solana, Base, Ethereum' },
              { label: 'Auto-refresh feed', detail: 'Every 30s from bags.fm API' },
            ].map((f) => (
              <motion.div key={f.label} variants={fadeUp} className="flex gap-3 items-start">
                <CheckCircle size={14} className="text-[#39FF14] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-mono text-[#EDEDED]">{f.label}</div>
                  <div className="text-[10px] font-mono text-[#555]">{f.detail}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        {/* Mockup */}
        <MockupFrame title="bagsterminal.com/pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] badge-live" />
              <span className="text-[9px] uppercase tracking-widest text-[#39FF14] font-mono font-bold">LIVE</span>
            </div>
            <div className="flex gap-1.5">
              <div className="badge badge-green px-2 py-0.5 text-[8px]">SOL</div>
              <div className="badge badge-muted px-2 py-0.5 text-[8px]">BASE</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { col: 'NEW', color: '#39FF14', pcts: [18, 32, 12] },
              { col: 'FINAL STRETCH', color: '#FFD700', pcts: [87, 92, 78] },
              { col: 'MIGRATED', color: '#00F0FF', pcts: [100, 100, 100] },
            ].map((c) => (
              <div key={c.col}>
                <div className="text-[8px] uppercase tracking-widest font-mono font-bold mb-2" style={{ color: c.color }}>{c.col}</div>
                {c.pcts.map((pct, j) => (
                  <div key={j} className="bg-[#111] p-2 mb-1.5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-12 h-2 skeleton-shimmer rounded" />
                      <span className="text-[8px] font-mono" style={{ color: c.color }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: `${c.color}66` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </MockupFrame>
      </div>
    </div>
  );
}

function FeatureTerminalSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>TERMINAL</SectionTag>
      <SlideTitle>RESEARCH. ANALYZE. <span className="text-[#00F0FF]">EXECUTE.</span></SlideTitle>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 mt-8">
        <div>
          <SlideSubtitle>
            Full trading terminal with GeckoTerminal charts, market swap execution, fee earner visibility, and credibility scoring.
          </SlideSubtitle>
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 mt-6">
            <StatBox value="CHARTS" label="GeckoTerminal" accent="green" />
            <StatBox value="SWAP" label="Market Execution" accent="blue" />
            <StatBox value="FEES" label="Earner Visibility" accent="gold" />
            <StatBox value="SCORE" label="Credibility Matrix" accent="green" />
          </motion.div>
        </div>
        {/* Mockup */}
        <MockupFrame title="bagsterminal.com/terminal/[token]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20" />
                <div>
                  <div className="text-xs font-mono font-bold text-[#EDEDED]">$TOKEN</div>
                  <div className="text-[9px] font-mono text-[#666]">7xKp...bags</div>
                </div>
              </div>
              <div className="badge badge-green text-[8px] px-2 py-0.5">MIGRATED</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: 'MCAP', v: '$1.2M', c: '#39FF14' },
                { l: 'VOL 24H', v: '$340K', c: '#00F0FF' },
                { l: 'HOLDERS', v: '2,847', c: '#FFD700' },
                { l: 'BONDING', v: '100%', c: '#39FF14' },
              ].map((m) => (
                <div key={m.l} className="bg-[#111] p-2 border border-white/5 text-center">
                  <div className="text-[8px] font-mono text-[#555] uppercase">{m.l}</div>
                  <div className="text-xs font-mono font-bold" style={{ color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
            {/* Chart placeholder */}
            <div className="h-20 bg-[#111] border border-white/5 relative overflow-hidden">
              <svg viewBox="0 0 200 60" className="w-full h-full">
                <polyline fill="none" stroke="#39FF14" strokeWidth="1.5" opacity="0.6" points="0,50 20,45 40,48 60,30 80,35 100,20 120,25 140,15 160,18 180,8 200,12" />
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39FF14" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
                </linearGradient>
                <polygon fill="url(#cg)" points="0,50 20,45 40,48 60,30 80,35 100,20 120,25 140,15 160,18 180,8 200,12 200,60 0,60" />
              </svg>
              <div className="absolute top-1 right-2 text-[8px] font-mono text-[#39FF14]">+247%</div>
            </div>
            {/* Fee earners */}
            <div className="bg-[#111] p-2 border border-[#FFD700]/10">
              <div className="text-[8px] font-mono text-[#FFD700] uppercase tracking-widest mb-1.5 font-bold">FEE EARNERS</div>
              {[
                { name: '@creator', pct: '40%', earned: '12.4 SOL' },
                { name: '@partner', pct: '35%', earned: '10.8 SOL' },
              ].map((f) => (
                <div key={f.name} className="flex items-center justify-between text-[9px] font-mono py-0.5">
                  <span className="text-[#888]">{f.name}</span>
                  <div className="flex gap-3">
                    <span className="text-[#FFD700]">{f.pct}</span>
                    <span className="text-[#39FF14]">{f.earned}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockupFrame>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LAUNCHPAD SLIDES (NEW)                                              */
/* ------------------------------------------------------------------ */

function LaunchpadOverviewSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE LAUNCHPAD</SectionTag>
      <SlideTitle>LAUNCH TOKENS WITH <span className="text-[#FFD700]">BUILT-IN REVENUE SHARING</span></SlideTitle>
      <SlideSubtitle>
        The BAGS Launchpad is not just another token creator. It&apos;s a revenue-sharing engine that turns every token into a monetization vehicle for creators, communities, and teams.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Visual mockup */}
        <MockupFrame title="bagsterminal.com/launch">
          <div className="space-y-3">
            {/* Token form */}
            <div className="space-y-2">
              <div className="text-[8px] font-mono text-[#FFD700] uppercase tracking-widest font-bold">TOKEN DETAILS</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111] px-3 py-2 border border-white/5">
                  <div className="text-[8px] text-[#555] font-mono">NAME</div>
                  <div className="text-xs text-[#EDEDED] font-mono">My Token</div>
                </div>
                <div className="bg-[#111] px-3 py-2 border border-white/5">
                  <div className="text-[8px] text-[#555] font-mono">SYMBOL</div>
                  <div className="text-xs text-[#EDEDED] font-mono">$MYTKN</div>
                </div>
              </div>
              <div className="bg-[#111] px-3 py-2 border border-white/5">
                <div className="text-[8px] text-[#555] font-mono">DESCRIPTION</div>
                <div className="text-[10px] text-[#888] font-mono">Community-driven token with fee sharing...</div>
              </div>
            </div>
            {/* Image upload */}
            <div className="flex gap-2 items-center">
              <div className="w-12 h-12 border border-dashed border-white/10 flex items-center justify-center bg-[#111]">
                <ImageIcon size={14} className="text-[#555]" />
              </div>
              <div className="text-[9px] font-mono text-[#666]">Upload token image<br /><span className="text-[#39FF14]">PNG, JPG up to 5MB</span></div>
            </div>
            {/* Fee earners */}
            <div>
              <div className="text-[8px] font-mono text-[#39FF14] uppercase tracking-widest font-bold mb-2">FEE EARNERS (4/100)</div>
              {[
                { handle: '@creator_x', pct: 40, color: '#39FF14' },
                { handle: '@partner_kick', pct: 25, color: '#00F0FF' },
                { handle: 'Gz7k...4xR9', pct: 20, color: '#FFD700' },
                { handle: '@dev_github', pct: 15, color: '#888' },
              ].map((e) => (
                <div key={e.handle} className="flex items-center justify-between py-1 border-b border-white/3">
                  <span className="text-[9px] font-mono text-[#888]">{e.handle}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#1A1A1A] overflow-hidden">
                      <div className="h-full" style={{ width: `${e.pct}%`, backgroundColor: e.color }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold" style={{ color: e.color }}>{e.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#39FF14] text-black text-[10px] font-mono font-bold uppercase tracking-widest text-center py-2">
              LAUNCH TOKEN
            </div>
          </div>
        </MockupFrame>
        {/* Key points */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {[
            { icon: Rocket, title: 'NO-CODE LAUNCH', desc: 'Set name, symbol, description, upload image. Live on-chain in under 60 seconds. No smart contract knowledge needed.', color: '#39FF14' },
            { icon: Users, title: '100-WAY FEE SPLIT', desc: 'Configure up to 100 fee earners per token. Each earner gets a custom percentage of the 1% creator royalty.', color: '#FFD700' },
            { icon: Share2, title: 'SOCIAL PROVIDERS', desc: 'Add fee earners by Twitter, Kick, GitHub, or TikTok handle. BAGS auto-resolves to wallet addresses.', color: '#00F0FF' },
            { icon: Settings, title: 'LOOKUP TABLE OPTIMIZATION', desc: 'For 15+ claimers, auto-creates Solana Address Lookup Tables for gas-efficient on-chain execution.', color: '#39FF14' },
          ].map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="card p-4 flex gap-4 items-start">
              <div className="w-9 h-9 flex items-center justify-center border bg-black/30 flex-shrink-0" style={{ borderColor: `${f.color}33` }}>
                <f.icon size={16} style={{ color: f.color }} />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono mb-1" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-[10px] text-[#888] font-mono leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function LaunchpadFeaturesSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>LAUNCHPAD FEATURES</SectionTag>
      <SlideTitle>EVERYTHING A TOKEN NEEDS TO <span className="text-[#39FF14]">SUCCEED</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        {[
          { icon: ImageIcon, title: 'TOKEN METADATA', desc: 'Name, symbol, description, image upload with preview', color: '#39FF14' },
          { icon: CircleDollarSign, title: 'FEE CONFIG', desc: 'Per-claimer basis points. Visual split bar. Real-time cost preview', color: '#FFD700' },
          { icon: Globe, title: 'SOCIAL LINKING', desc: 'Twitter, Kick, GitHub, TikTok handle resolution to wallets', color: '#00F0FF' },
          { icon: Settings, title: 'LOOKUP TABLES', desc: 'Auto-created for 15+ claimers. Gas optimization on Solana', color: '#39FF14' },
          { icon: Share2, title: 'REFERRAL TRACKING', desc: 'Partner keys with ?ref= URL params for attribution', color: '#FFD700' },
          { icon: DollarSign, title: 'TIP CONFIG', desc: 'Optional platform tips. Transaction cost estimation', color: '#00F0FF' },
          { icon: CheckCircle, title: 'SUCCESS MODAL', desc: 'Token snapshot card on launch. Shareable to social media', color: '#39FF14' },
          { icon: Sparkles, title: 'DIVIDENDS', desc: 'Auto-distribute to top 100 holders every 24h when 10+ SOL unclaimed', color: '#FFD700' },
        ].map((f) => (
          <motion.div key={f.title} variants={fadeUp} className="card p-4">
            <f.icon size={16} style={{ color: f.color }} className="mb-2" />
            <h3 className="text-[10px] font-bold font-mono mb-1" style={{ color: f.color }}>{f.title}</h3>
            <p className="text-[9px] text-[#666] font-mono leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
      {/* Bottom highlight */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6 p-4 border border-[#FFD700]/20 bg-[#FFD700]/5">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {[
            { val: '100', lbl: 'Max Fee Earners' },
            { val: '1%', lbl: 'Perpetual Royalty' },
            { val: '60s', lbl: 'Launch Time' },
            { val: '24h', lbl: 'Dividend Cycle' },
            { val: '4', lbl: 'Social Providers' },
          ].map((s) => (
            <div key={s.lbl} className="text-center">
              <div className="text-lg font-bold font-mono text-[#FFD700]">{s.val}</div>
              <div className="text-[8px] text-[#666] font-mono uppercase tracking-widest">{s.lbl}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function LaunchpadFlowSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>LAUNCH FLOW</SectionTag>
      <SlideTitle>FROM IDEA TO <span className="text-[#FFD700]">LIVE TOKEN</span> IN 60 SECONDS</SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-8 space-y-3">
        {[
          { step: 1, title: 'CONNECT WALLET', desc: 'Phantom, Solflare, Coinbase, Trust Wallet. One click to authenticate.', icon: Wallet, color: '#39FF14', time: '5s' },
          { step: 2, title: 'SET TOKEN DETAILS', desc: 'Enter name, symbol, description. Upload token image with live preview.', icon: ImageIcon, color: '#00F0FF', time: '15s' },
          { step: 3, title: 'CONFIGURE FEE EARNERS', desc: 'Add up to 100 wallets or social handles. Set percentage splits. Visual bar shows distribution.', icon: Users, color: '#FFD700', time: '20s' },
          { step: 4, title: 'REVIEW & LAUNCH', desc: 'Preview transaction cost. Confirm in wallet. Token goes live on bonding curve immediately.', icon: Rocket, color: '#39FF14', time: '10s' },
          { step: 5, title: 'SHARE & GROW', desc: 'Get shareable snapshot card. Share on Twitter/socials. Volume starts generating fees for all earners.', icon: Share2, color: '#00F0FF', time: '10s' },
        ].map((s) => (
          <motion.div key={s.step} variants={fadeUp} className="card p-4 flex items-center gap-5">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border" style={{ borderColor: `${s.color}33` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold" style={{ color: s.color }}>STEP {s.step}</span>
                <h3 className="text-xs font-bold font-mono text-[#EDEDED]">{s.title}</h3>
              </div>
              <p className="text-[10px] text-[#888] font-mono mt-0.5">{s.desc}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.time}</div>
              <div className="text-[8px] font-mono text-[#555]">avg</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function FeatureCreatorSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>CREATOR DASHBOARD</SectionTag>
      <SlideTitle>YOUR TOKENS. YOUR FEES. <span className="text-[#39FF14]">YOUR COMMAND CENTER.</span></SlideTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          <FeatureCard icon={Wallet} title="My Tokens" desc="All created tokens with market cap, fees earned, holders" color="#39FF14" />
          <FeatureCard icon={DollarSign} title="Fee Claims" desc="One-click claim via v3 auto-claim. History with timestamps." color="#FFD700" />
          <FeatureCard icon={Users} title="Partner Config" desc="Create partner keys. Generate referral links. Track earnings." color="#00F0FF" />
          <FeatureCard icon={Lock} title="Token Admin" desc="Transfer admin authority. View admin tokens." color="#39FF14" />
        </motion.div>
        {/* Mockup */}
        <MockupFrame title="bagsterminal.com/creator">
          <div className="space-y-3">
            <div className="flex gap-2">
              {['MY TOKENS', 'FEE CLAIMS', 'PARTNER', 'ADMIN'].map((t, i) => (
                <div key={t} className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 ${i === 1 ? 'text-[#39FF14] border-b border-[#39FF14]' : 'text-[#555]'}`}>{t}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'TOTAL EARNED', v: '47.2 SOL', c: '#39FF14' },
                { l: 'CLAIMABLE', v: '12.8 SOL', c: '#FFD700' },
                { l: 'TOKENS', v: '8', c: '#00F0FF' },
              ].map((s) => (
                <div key={s.l} className="bg-[#111] p-2 border border-white/5 text-center">
                  <div className="text-[8px] text-[#555] font-mono">{s.l}</div>
                  <div className="text-sm font-mono font-bold" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            {/* Claims list */}
            {[
              { token: '$ALPHA', earned: '18.4 SOL', claimable: '5.2 SOL', status: 'CLAIM' },
              { token: '$BETA', earned: '12.1 SOL', claimable: '3.8 SOL', status: 'CLAIM' },
              { token: '$GAMMA', earned: '8.7 SOL', claimable: '0 SOL', status: 'CLAIMED' },
            ].map((c) => (
              <div key={c.token} className="flex items-center justify-between bg-[#111] p-2 border border-white/5">
                <div>
                  <div className="text-[10px] font-mono font-bold text-[#EDEDED]">{c.token}</div>
                  <div className="text-[8px] font-mono text-[#666]">Earned: {c.earned}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-[#FFD700]">{c.claimable}</div>
                  <div className={`text-[8px] font-mono font-bold ${c.status === 'CLAIM' ? 'text-[#39FF14]' : 'text-[#555]'}`}>{c.status}</div>
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>
      </div>
    </div>
  );
}

function FeatureAnalyzeSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>RISK ENGINE</SectionTag>
      <SlideTitle>DETECT THREATS <span className="text-[#FF003C]">BEFORE THEY STRIKE</span></SlideTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <SlideSubtitle>
            Risk scoring from 0-100. Detects snipers, bundlers, insider clusters, and dev patterns in real-time.
          </SlideSubtitle>
          <div className="space-y-3 mt-6">
            {[
              { threat: 'SNIPER WALLETS', desc: 'Detects wallets that buy within first blocks', severity: 'HIGH', color: '#FFD700' },
              { threat: 'BUNDLER CLUSTERS', desc: 'Identifies coordinated buy groups', severity: 'CRITICAL', color: '#FF003C' },
              { threat: 'FRESH WALLETS', desc: 'Flags recently created wallets with large buys', severity: 'MEDIUM', color: '#888' },
              { threat: 'DEV CLUSTERS', desc: 'Tracks deployer-connected wallet activity', severity: 'HIGH', color: '#FFD700' },
            ].map((t) => (
              <motion.div key={t.threat} variants={fadeUp} className="flex items-center justify-between bg-[#0A0A0A] p-3 border border-white/5">
                <div>
                  <div className="text-xs font-mono font-bold text-[#EDEDED]">{t.threat}</div>
                  <div className="text-[10px] font-mono text-[#666] mt-0.5">{t.desc}</div>
                </div>
                <div className={`badge text-[9px] px-2 py-0.5 ${t.severity === 'CRITICAL' ? 'badge-red' : t.severity === 'HIGH' ? 'badge-yellow' : 'badge-muted'}`}>
                  {t.severity}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Deployer intelligence mockup */}
        <MockupFrame title="Deployer Intelligence">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center">
                <Crosshair size={14} className="text-[#39FF14]" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#EDEDED]">Deployer 7xKp...3nR2</div>
                <div className="text-[9px] font-mono text-[#39FF14]">LOW RISK</div>
              </div>
            </div>
            {[
              { label: 'Total Launches', value: '47', bar: 47 },
              { label: 'Success Rate', value: '72%', bar: 72 },
              { label: 'Avg Market Cap', value: '$340K', bar: 60 },
              { label: 'Insider Usage', value: '2.1%', bar: 2 },
              { label: 'Holder Retention', value: '68%', bar: 68 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-[#666]">{s.label}</span>
                  <span className="text-[#EDEDED] font-bold">{s.value}</span>
                </div>
                <div className="w-full h-1 bg-[#1A1A1A] overflow-hidden">
                  <div className="h-full bg-[#39FF14]/30" style={{ width: `${s.bar}%` }} />
                </div>
              </div>
            ))}
            <div className="bg-[#111] p-2 border border-[#39FF14]/10 mt-2">
              <div className="text-[8px] font-mono text-[#39FF14] uppercase tracking-widest font-bold">CREDIBILITY SCORE</div>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#39FF14] number-glow-green">82</span>
                <span className="text-[10px] font-mono text-[#666] mb-1">/100</span>
              </div>
            </div>
          </div>
        </MockupFrame>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI & MILESTONE SLIDES (NEW)                                        */
/* ------------------------------------------------------------------ */

function KPIsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>KEY PERFORMANCE INDICATORS</SectionTag>
      <SlideTitle>METRICS THAT <span className="text-[#39FF14]">MATTER</span></SlideTitle>
      <SlideSubtitle>
        The KPIs we track to measure platform health, creator success, and ecosystem growth.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[
          {
            category: 'GROWTH',
            color: '#39FF14',
            icon: TrendingUp,
            kpis: [
              { metric: 'Total Volume Facilitated', value: '$3B+', target: '$10B by Q4' },
              { metric: 'Monthly Active Creators', value: 'Growing', target: '10K MACs' },
              { metric: 'Tokens Launched via BAGS', value: 'Live', target: '50K total' },
            ],
          },
          {
            category: 'CREATOR SUCCESS',
            color: '#FFD700',
            icon: Award,
            kpis: [
              { metric: 'Total Paid to Creators', value: '$20M+', target: '$100M by 2027' },
              { metric: 'Avg Creator Earnings', value: 'Growing', target: '$500/month' },
              { metric: 'Fee Claim Completion', value: 'High', target: '>90%' },
            ],
          },
          {
            category: 'PLATFORM HEALTH',
            color: '#00F0FF',
            icon: Gauge,
            kpis: [
              { metric: 'Uptime / Reliability', value: '99.9%', target: '99.99%' },
              { metric: 'WebSocket Latency', value: '<100ms', target: '<50ms' },
              { metric: 'API Response Time', value: '<200ms', target: '<100ms' },
            ],
          },
          {
            category: 'RISK DETECTION',
            color: '#FF003C',
            icon: Shield,
            kpis: [
              { metric: 'Threats Flagged', value: 'Active', target: '>95% detection' },
              { metric: 'Deployers Scored', value: 'Growing', target: 'All deployers' },
              { metric: 'False Positive Rate', value: 'Low', target: '<5%' },
            ],
          },
          {
            category: 'ECOSYSTEM',
            color: '#39FF14',
            icon: Code,
            kpis: [
              { metric: 'Developer Fund', value: '$4M', target: 'Fully deployed' },
              { metric: 'API Integrations', value: 'Growing', target: '100+ apps' },
              { metric: 'Hackathon Submissions', value: 'Active', target: '500+ projects' },
            ],
          },
          {
            category: 'RETENTION',
            color: '#FFD700',
            icon: Users,
            kpis: [
              { metric: 'Creator Retention', value: 'High', target: '>70% M1' },
              { metric: 'Trading DAU/MAU', value: 'Growing', target: '>30%' },
              { metric: 'Repeat Launches', value: 'Growing', target: '>40% creators' },
            ],
          },
        ].map((cat) => (
          <motion.div key={cat.category} variants={fadeUp} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <cat.icon size={14} style={{ color: cat.color }} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: cat.color }}>{cat.category}</span>
            </div>
            <div className="space-y-2.5">
              {cat.kpis.map((k) => (
                <div key={k.metric}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#888]">{k.metric}</span>
                    <span className="text-[10px] font-mono font-bold text-[#EDEDED]">{k.value}</span>
                  </div>
                  <div className="text-[8px] font-mono text-[#555]">Target: {k.target}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function MilestonesSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>MILESTONES</SectionTag>
      <SlideTitle>WHAT WE&apos;VE <span className="text-[#39FF14]">ACHIEVED</span> & WHERE WE&apos;RE <span className="text-[#00F0FF]">GOING</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-8 relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#39FF14]/40 via-[#00F0FF]/30 to-[#FFD700]/20 hidden sm:block" />
        <div className="space-y-4">
          {[
            { date: '2025', title: 'PLATFORM LAUNCH', items: ['bags.fm goes live on Solana', 'Bonding curve + DEX migration engine', 'Creator royalty system (1% perpetual)', 'First $1B in on-chain volume'], color: '#39FF14', done: true },
            { date: 'Q1 2026', title: 'INTELLIGENCE LAYER', items: ['BAGS Terminal ships with Pulse Monitor', 'Real-time WebSocket token feed', 'Risk analysis engine + deployer scoring', 'Creator Dashboard with fee claims'], color: '#39FF14', done: true },
            { date: 'MAR 2026', title: 'RECOGNITION & GROWTH', items: ['FinTech Breakthrough Award winner', '$3B+ total on-chain volume', '$20M+ paid to creators', '$4M developer fund + hackathon launch'], color: '#FFD700', done: true },
            { date: 'Q2 2026', title: 'ECOSYSTEM EXPANSION', items: ['Bags App Store launch', 'Enhanced API tiers for developers', 'Multi-chain expansion (Base, Ethereum)', 'Advanced deployer scoring v2'], color: '#00F0FF', done: false },
            { date: 'Q3 2026', title: 'PLATFORM FLYWHEEL', items: ['AI-powered risk predictions', 'Social trading features', 'Institutional dashboard', 'Mobile terminal app'], color: '#00F0FF', done: false },
            { date: 'Q4 2026', title: 'SCALE', items: ['$10B+ cumulative volume target', '100+ App Store integrations', 'Cross-chain token launch support', 'DAO governance framework'], color: '#FFD700', done: false },
          ].map((m) => (
            <motion.div key={m.date} variants={fadeUp} className="flex gap-4 sm:gap-6 items-start">
              <div className="flex-shrink-0 relative z-10">
                <div className={`w-10 h-10 flex items-center justify-center border ${m.done ? 'bg-[#39FF14]/10 border-[#39FF14]/30' : 'bg-[#111] border-white/10'}`}>
                  {m.done ? <CheckCircle size={16} className="text-[#39FF14]" /> : <Clock size={16} className="text-[#666]" />}
                </div>
              </div>
              <div className="flex-1 card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono font-bold" style={{ color: m.color }}>{m.date}</span>
                  <h3 className="text-xs font-bold font-mono text-[#EDEDED]">{m.title}</h3>
                  {m.done && <div className="badge badge-green text-[8px] px-1.5 py-0.5">DONE</div>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {m.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[10px] font-mono text-[#888]">
                      <div className="w-1 h-1 flex-shrink-0" style={{ backgroundColor: m.color }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* REMAINING SLIDES                                                    */
/* ------------------------------------------------------------------ */

function DifferentiatorsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>WHY BAGS TERMINAL</SectionTag>
      <SlideTitle>WHAT MAKES US <span className="text-[#39FF14]">DIFFERENT</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        <FeatureCard icon={DollarSign} title="Perpetual Royalties" desc="1% of ALL volume flows to creators -- forever. Not just at launch. Not just at graduation. Every trade." color="#FFD700" />
        <FeatureCard icon={Users} title="100-Way Fee Split" desc="Configure up to 100 fee earners per token. Split revenue across teams, KOLs, communities, DAOs." color="#39FF14" />
        <FeatureCard icon={Globe} title="Social Resolution" desc="Add fee earners by Twitter, Kick, GitHub, TikTok handle. Wallets resolved automatically." color="#00F0FF" />
        <FeatureCard icon={Shield} title="Risk Intelligence" desc="Sniper detection, bundler analysis, deployer scoring. Know the risks before you trade." color="#FF003C" />
        <FeatureCard icon={Radio} title="Real-Time Pulse" desc="WebSocket-powered live feed. See every token the moment it launches, migrates, or spikes." color="#39FF14" />
        <FeatureCard icon={Code} title="Developer Platform" desc="REST API + TypeScript SDK. 1,000 req/hour. Build apps on top of the BAGS ecosystem." color="#00F0FF" />
      </motion.div>
    </div>
  );
}

function CompetitiveSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>COMPETITIVE LANDSCAPE</SectionTag>
      <SlideTitle>FEATURE <span className="text-[#39FF14]">COMPARISON</span></SlideTitle>
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
        <StatBox value="94.9%" label="Solana Memecoin Share (Peak)" accent="blue" />
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
          <h3 className="text-xs uppercase tracking-widest text-[#FFD700] font-mono font-bold mb-4">FLYWHEEL ECONOMICS</h3>
          <div className="space-y-4">
            <div className="bg-[#111] p-4 border border-white/5">
              <div className="text-xs font-mono text-[#39FF14] font-bold mb-1">Volume = Revenue</div>
              <div className="text-[10px] font-mono text-[#888]">Every $1B in volume = direct platform revenue from trading fees</div>
            </div>
            <div className="bg-[#111] p-4 border border-white/5">
              <div className="text-xs font-mono text-[#FFD700] font-bold mb-1">Creator Lock-in</div>
              <div className="text-[10px] font-mono text-[#888]">Perpetual royalties create lifetime creator retention</div>
            </div>
            <div className="bg-[#111] p-4 border border-white/5">
              <div className="text-xs font-mono text-[#00F0FF] font-bold mb-1">Network Effects</div>
              <div className="text-[10px] font-mono text-[#888]">More creators = more tokens = more volume = more fees</div>
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
            30,000 tokens launch daily. A $240B prediction market. $1.2T+ in monthly perp volume.
            All fragmented across chains &mdash; until one Solana-native, chain-abstracted terminal.
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
/* CROSS-CHAIN VISION SLIDES (NEW)                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 border"
      style={{ color, borderColor: `${color}44`, backgroundColor: `${color}11` }}
    >
      <span className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] text-[#444] font-mono mt-6 tracking-wide">SOURCE — {children}</p>;
}

function FlowNode({ icon: Icon, label, sub, color }: { icon: React.ElementType; label: string; sub: string; color: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 flex-1 min-w-0">
      <div className="w-12 h-12 flex items-center justify-center border bg-black/40" style={{ borderColor: `${color}44` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="text-[11px] font-mono font-bold text-[#EDEDED] uppercase tracking-wide">{label}</div>
      <div className="text-[9px] font-mono text-[#666] leading-tight">{sub}</div>
    </div>
  );
}

function VisionThesisSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>CROSS-CHAIN VISION</SectionTag>
      <SlideTitle>ONE TERMINAL. <span className="text-[#FFD700]">EVERY MARKET.</span></SlideTitle>
      <SlideSubtitle>
        We are building a chain-abstracted trading terminal. Users keep one Solana wallet and one
        interface, while solver infrastructure routes execution across ecosystems. They care about
        opportunities &mdash; not which blockchain they are on.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
        <motion.div variants={fadeUp} className="card p-6 border-[#FF003C]/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-[#FF003C]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF003C]">Today &mdash; Fragmented</span>
          </div>
          <div className="space-y-3">
            {['Switch wallets &amp; networks per chain', 'Bridge assets manually, wait, pray', 'Learn a different interface per protocol', '$2.8B+ drained from bridges since 2022'].map((t) => (
              <div key={t} className="flex items-start gap-2 text-xs font-mono text-[#888]">
                <span className="text-[#FF003C] mt-0.5">&#10007;</span>
                <span dangerouslySetInnerHTML={{ __html: t }} />
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6 border-[#39FF14]/20">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-[#39FF14]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#39FF14]">BAGS &mdash; Abstracted</span>
          </div>
          <div className="space-y-3">
            {['One Solana wallet, one interface', 'Zero manual bridging &mdash; solver-routed', 'Spot, prediction &amp; perps in one terminal', 'Friction removed for retail traders'].map((t) => (
              <div key={t} className="flex items-start gap-2 text-xs font-mono text-[#888]">
                <span className="text-[#39FF14] mt-0.5">&#10003;</span>
                <span dangerouslySetInnerHTML={{ __html: t }} />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-4 p-4 border border-[#FFD700]/20 bg-[#FFD700]/5">
        <p className="text-xs font-mono text-[#FFD700] text-center">
          Chain abstraction is the dominant UX paradigm of 2026 &mdash; standardised by ERC-7683 (Uniswap Labs &amp; Across). We are building the trading terminal on top of it.
        </p>
      </motion.div>
      <SourceNote>DEXTools, Four Pillars &amp; Chainalysis, 2025&ndash;2026</SourceNote>
    </div>
  );
}

function VisionProblemSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE FRICTION</SectionTag>
      <SlideTitle>USERS PAY A <span className="text-[#FF003C]">FRAGMENTATION TAX</span></SlideTitle>
      <SlideSubtitle>
        Every trading platform is ecosystem-specific. To chase an opportunity on another chain, a
        retail trader becomes their own bridge operator &mdash; and absorbs the risk.
      </SlideSubtitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
        <StatBox value="$2.8B+" label="Drained From Bridges (since 2022)" accent="red" />
        <StatBox value="$3.4B" label="Crypto Stolen In 2025" accent="red" />
        <StatBox value="6+" label="Steps Per Cross-Chain Trade" accent="gold" />
        <StatBox value="5&minus;15s" label="Solver Flow vs Minutes&ndash;Hours" accent="green" />
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="card p-5">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF003C] mb-4">The Manual Flow Today</div>
          <div className="space-y-2.5">
            {['Fund &amp; secure a new wallet', 'Acquire gas on the destination chain', 'Find a bridge, accept hack risk', 'Wait for confirmations', 'Swap into the right asset', 'Re-learn an unfamiliar UI'].map((t, i) => (
              <div key={t} className="flex items-center gap-3 text-xs font-mono text-[#888]">
                <span className="text-[#FF003C] font-bold w-4">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: t }} />
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-5 border-[#39FF14]/20">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#39FF14] mb-4">The BAGS Flow</div>
          <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] gap-4">
            <div className="flex items-center gap-3">
              <FlowNode icon={Wallet} label="Solana" sub="One wallet" color="#39FF14" />
              <ArrowRight size={16} className="text-[#666]" />
              <FlowNode icon={Network} label="Solver" sub="Auto-route" color="#00F0FF" />
              <ArrowRight size={16} className="text-[#666]" />
              <FlowNode icon={Target} label="Any Market" sub="Filled" color="#FFD700" />
            </div>
            <p className="text-[10px] font-mono text-[#666] text-center">One intent. One confirmation. The terminal abstracts the rest.</p>
          </div>
        </motion.div>
      </motion.div>
      <SourceNote>Chainalysis 2026 Crypto Crime Report; bridge-exploit tracking 2022&ndash;2025</SourceNote>
    </div>
  );
}

function VisionArchitectureSlide() {
  const pillars = [
    { icon: Flame, title: 'Meme Token Trading', desc: 'Fast discovery &amp; one-click execution on Solana launchpad tokens.', status: 'LIVE', color: '#39FF14', stat: '$2.4B 2025 Solana app revenue' },
    { icon: Target, title: 'Cross-Chain Polymarket', desc: 'Trade prediction markets with Solana funds &mdash; no manual bridge.', status: 'E2E TESTING', color: '#00F0FF', stat: '~$10B Polymarket vol / month' },
    { icon: TrendingUp, title: 'Cross-Chain Perps', desc: 'Perpetual futures via Hyperliquid, settled from Solana UX.', status: 'FINAL TESTING', color: '#FFD700', stat: '$1.2T+ perp DEX vol / month' },
    { icon: ArrowLeftRight, title: 'Cross-Chain Memes', desc: 'Solana users trade EVM memes &mdash; and vice versa.', status: 'BUILDING', color: '#FF003C', stat: 'Upcoming infrastructure' },
  ];
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>THE PRODUCT</SectionTag>
      <SlideTitle>ONE INTERFACE, <span className="text-[#39FF14]">FOUR MARKETS</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
        {pillars.map((p) => (
          <motion.div key={p.title} variants={fadeUp} className="card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 flex items-center justify-center border bg-black/30" style={{ borderColor: `${p.color}33` }}>
                <p.icon size={18} style={{ color: p.color }} />
              </div>
              <StatusBadge label={p.status} color={p.color} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#EDEDED] font-mono">{p.title}</h3>
            <p className="text-xs text-[#888] leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: p.desc }} />
            <div className="mt-auto pt-3 border-t border-white/5 text-[10px] font-mono uppercase tracking-widest" style={{ color: p.color }}>{p.stat}</div>
          </motion.div>
        ))}
      </motion.div>
      <SourceNote>CryptoPotato, CoinMarketCap &amp; Polymarket data, 2025&ndash;2026</SourceNote>
    </div>
  );
}

function VisionPolymarketSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>PREDICTION MARKETS</SectionTag>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold uppercase tracking-tight text-[#EDEDED] font-[family-name:var(--font-display)] leading-[1.1]">POLYMARKET, <span className="text-[#00F0FF]">ZERO BRIDGING</span></h2>
        <StatusBadge label="Built &middot; E2E Testing" color="#00F0FF" />
      </div>
      <SlideSubtitle>
        Infrastructure is built and in end-to-end testing: a Solana-native user trades the world&apos;s
        largest prediction venue without bridging assets or switching chains.
      </SlideSubtitle>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-6 mt-8">
        <div className="flex items-center justify-between gap-2">
          <FlowNode icon={Wallet} label="Solana Funds" sub="User stays put" color="#39FF14" />
          <ArrowRight size={18} className="text-[#666] flex-shrink-0" />
          <FlowNode icon={Network} label="Abstraction Layer" sub="Solver routes" color="#00F0FF" />
          <ArrowRight size={18} className="text-[#666] flex-shrink-0" />
          <FlowNode icon={Target} label="Polymarket" sub="Position live" color="#FFD700" />
        </div>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <StatBox value="~$10B" label="Polymarket Vol / Month (Mar 2026)" accent="blue" />
        <StatBox value="$240B" label="2026 Prediction Vol (Bernstein Est.)" accent="green" />
        <StatBox value="$2B" label="ICE Strategic Commitment" accent="gold" />
        <StatBox value="$15B+" label="Polymarket Valuation Target" accent="blue" />
      </motion.div>
      <SourceNote>CoinDesk, The Defiant, Wikipedia &amp; Bernstein, Mar 2026</SourceNote>
    </div>
  );
}

function VisionPerpsSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>DERIVATIVES</SectionTag>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold uppercase tracking-tight text-[#EDEDED] font-[family-name:var(--font-display)] leading-[1.1]">PERPS WITHOUT <span className="text-[#FFD700]">LEAVING SOLANA</span></h2>
        <StatusBadge label="Built &middot; Final Testing" color="#FFD700" />
      </div>
      <SlideSubtitle>
        Perpetual futures execution via Hyperliquid &mdash; the dominant on-chain venue &mdash; with a
        Solana-native onboarding and a unified spot-plus-derivatives experience.
      </SlideSubtitle>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-6 mt-8">
        <div className="flex items-center justify-between gap-2">
          <FlowNode icon={Wallet} label="Solana UX" sub="Native onboarding" color="#39FF14" />
          <ArrowRight size={18} className="text-[#666] flex-shrink-0" />
          <FlowNode icon={Repeat} label="Abstraction Layer" sub="Margin routed" color="#00F0FF" />
          <ArrowRight size={18} className="text-[#666] flex-shrink-0" />
          <FlowNode icon={TrendingUp} label="Hyperliquid" sub="Order filled" color="#FFD700" />
        </div>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <StatBox value="$180B+" label="Hyperliquid 30-Day Vol (Apr 2026)" accent="gold" />
        <StatBox value="$1.2T+" label="Perp DEX Vol / Month" accent="green" />
        <StatBox value="$6.7T" label="2025 Perp DEX Vol (+346% YoY)" accent="blue" />
        <StatBox value="#1" label="Hyperliquid OI vs All Rivals" accent="gold" />
      </motion.div>
      <SourceNote>Yellow.com, CoinMarketCap &amp; BlockEden perp-DEX data, 2025&ndash;2026</SourceNote>
    </div>
  );
}

function VisionMemeSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>MEME LIQUIDITY</SectionTag>
      <SlideTitle>MEME LIQUIDITY, <span className="text-[#39FF14]">ANY CHAIN</span></SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <motion.div variants={fadeUp} className="card p-6 flex flex-col gap-3 border-[#39FF14]/20">
          <div className="flex items-center justify-between">
            <Flame size={20} className="text-[#39FF14]" />
            <StatusBadge label="Live" color="#39FF14" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#EDEDED] font-mono">Solana Meme Trading</h3>
          <p className="text-xs text-[#888] leading-relaxed font-mono">
            Fast discovery, seamless execution and a simplified flow built for high-volume meme
            traders on Solana launchpads &mdash; already shipping in the terminal.
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="card p-6 flex flex-col gap-3 border-[#FF003C]/20">
          <div className="flex items-center justify-between">
            <ArrowLeftRight size={20} className="text-[#FF003C]" />
            <StatusBadge label="Building" color="#FF003C" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#EDEDED] font-mono">Cross-Chain Meme Trading</h3>
          <p className="text-xs text-[#888] leading-relaxed font-mono">
            A Solana user trades memes launched on EVM chains; an EVM user reaches Solana memes &mdash;
            no manual bridging or chain switching. Infrastructure in progress.
          </p>
        </motion.div>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <StatBox value="$1B+" label="Pump.fun Lifetime Revenue" accent="green" />
        <StatBox value="18,446" label="Tokens Launched In A Day (Peak)" accent="gold" />
        <StatBox value="$2.4B" label="Solana App Revenue 2025" accent="blue" />
        <StatBox value="27.1M" label="Solana Monthly Active Addresses" accent="green" />
      </motion.div>
      <SourceNote>SolanaFloor, CryptoPotato &amp; AInvest, 2025&ndash;Jan 2026</SourceNote>
    </div>
  );
}

function VisionMoatSlide() {
  return (
    <div className="flex flex-col justify-center h-full">
      <SectionTag>WHY WE WIN</SectionTag>
      <SlideTitle>WE SELL <span className="text-[#FFD700]">OPPORTUNITY</span>, NOT CHAINS</SlideTitle>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <FeatureCard icon={Link2} title="No Manual Bridging" desc="Solver-routed cross-chain execution. The bridge risk users fear is abstracted away." color="#39FF14" />
        <FeatureCard icon={Wallet} title="Solana-First Access" desc="One Solana wallet reaches external ecosystems. Native onboarding, zero relearning." color="#00F0FF" />
        <FeatureCard icon={Layers} title="Unified Interface" desc="Memes, prediction markets and perpetuals in a single terminal &mdash; spot to derivatives." color="#FFD700" />
        <FeatureCard icon={Zap} title="Retail Friction Removed" desc="One intent, one confirmation, 5&ndash;15s. Built for the high-volume retail trader." color="#39FF14" />
        <FeatureCard icon={Network} title="Multi-Chain Execution" desc="Infrastructure designed for seamless settlement across Solana, EVM and app-chains." color="#00F0FF" />
        <FeatureCard icon={ShieldAlert} title="Timing Is Now" desc="Chain abstraction matured in 2026; bridge losses made the demand undeniable." color="#FF003C" />
      </motion.div>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-5 p-4 border border-[#39FF14]/20 bg-[#39FF14]/5">
        <p className="text-xs font-mono text-[#39FF14] text-center">
          Combined reachable flow &mdash; $240B 2026 prediction-market volume &bull; $1.2T+ monthly perp-DEX volume &bull; $762M annual launchpad revenue &mdash; from one Solana-native terminal.
        </p>
      </motion.div>
      <SourceNote>Bernstein, CoinMarketCap &amp; CryptoSlate market estimates, 2026</SourceNote>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SLIDE RENDERER                                                      */
/* ------------------------------------------------------------------ */
function SlideContent({ id }: { id: string }) {
  switch (id) {
    case 'cover': return <CoverSlide />;
    case 'what-is-bags': return <WhatIsBagsSlide />;
    case 'problem-landscape': return <ProblemLandscapeSlide />;
    case 'problem-stats': return <ProblemStatsSlide />;
    case 'what-we-solve': return <WhatWeSolveSlide />;
    case 'problem-creators': return <ProblemCreatorsSlide />;
    case 'solution': return <SolutionSlide />;
    case 'how-it-works': return <HowItWorksSlide />;
    case 'platform-overview': return <PlatformOverviewSlide />;
    case 'feature-pulse': return <FeaturePulseSlide />;
    case 'feature-terminal': return <FeatureTerminalSlide />;
    case 'launchpad-overview': return <LaunchpadOverviewSlide />;
    case 'launchpad-features': return <LaunchpadFeaturesSlide />;
    case 'launchpad-flow': return <LaunchpadFlowSlide />;
    case 'feature-creator': return <FeatureCreatorSlide />;
    case 'feature-analyze': return <FeatureAnalyzeSlide />;
    case 'vision-thesis': return <VisionThesisSlide />;
    case 'vision-problem': return <VisionProblemSlide />;
    case 'vision-architecture': return <VisionArchitectureSlide />;
    case 'vision-polymarket': return <VisionPolymarketSlide />;
    case 'vision-perps': return <VisionPerpsSlide />;
    case 'vision-meme': return <VisionMemeSlide />;
    case 'vision-moat': return <VisionMoatSlide />;
    case 'kpis': return <KPIsSlide />;
    case 'milestones': return <MilestonesSlide />;
    case 'differentiators': return <DifferentiatorsSlide />;
    case 'competitive': return <CompetitiveSlide />;
    case 'market': return <MarketSlide />;
    case 'traction': return <TractionSlide />;
    case 'business-model': return <BusinessModelSlide />;
    case 'roadmap': return <RoadmapSlide />;
    case 'closing': return <ClosingSlide />;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/* MAIN PITCH DECK                                                     */
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
    if (current < SLIDES.length - 1) { setDirection(1); setCurrent((p) => p + 1); }
  }, [current]);

  const prev = useCallback(() => {
    if (current > 0) { setDirection(-1); setCurrent((p) => p - 1); }
  }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

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
              if (sectionSlides.length === 0) return null;
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
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
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
