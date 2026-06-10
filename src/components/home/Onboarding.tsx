'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { BagsLogo } from '@/components/ui/BagsLogo';
import {
  Layers, Activity, Rocket, Coins, Wallet, TrendingUp, Target, ShieldCheck,
  ArrowLeft, ArrowRight, X, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Layers, Activity, Rocket, Coins, Wallet, TrendingUp, Target, ShieldCheck,
};

type Card = { title: string; desc: string; accent: string; icon: keyof typeof ICONS; badge: '' | 'LIVE' | 'SOON' };

const CARDS: Card[] = [
  { title: 'ONE TERMINAL, EVERY MARKET', desc: 'Discover it. Launch it. Get paid on it. The whole token lifecycle on Solana, in one place.', accent: '#00F0FF', icon: 'Layers', badge: '' },
  { title: 'DISCOVER', desc: 'Watch fresh tokens hit the live Pulse feed the moment they go live. Spot it before the crowd.', accent: '#39FF14', icon: 'Activity', badge: 'LIVE' },
  { title: 'LAUNCH IN SECONDS', desc: 'No-code token launch with built-in fee sharing — split fees across up to 100 claimers.', accent: '#FF6B35', icon: 'Rocket', badge: 'LIVE' },
  { title: 'GET PAID', desc: 'Claim your creator fees straight from the terminal. Build it, ship it, earn on it.', accent: '#FFD700', icon: 'Coins', badge: 'LIVE' },
  { title: 'ONE WALLET', desc: 'A single Solana wallet powers every surface — discover, launch and claim without switching.', accent: '#FAFF00', icon: 'Wallet', badge: 'LIVE' },
  { title: 'PERPS', desc: 'Perps without leaving Solana — no bridging, no detours, no second app.', accent: '#FF00FF', icon: 'TrendingUp', badge: 'SOON' },
  { title: 'PREDICTION MARKETS', desc: 'Polymarket-style markets with zero bridging, settled natively on Solana.', accent: '#00F0FF', icon: 'Target', badge: 'SOON' },
  { title: 'HONEST BY DESIGN', desc: "Trending and token analytics you can read, with a clear line between what's live and coming.", accent: '#39FF14', icon: 'ShieldCheck', badge: '' },
];

const STORAGE_KEY = 'bags_onboarded_v1';
const SYS_GREEN = '#39FF14';
const AMBER = '#FFB020';

function Badge({ kind }: { kind: 'LIVE' | 'SOON' }) {
  const live = kind === 'LIVE';
  const color = live ? SYS_GREEN : AMBER;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-[0.12em]"
      style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color, boxShadow: live ? `0 0 5px ${color}` : 'none' }} />
      {kind}
    </span>
  );
}

export function Onboarding() {
  const { connected } = useBagsWallet();
  const { setVisible } = useWalletModal();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const decided = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (decided.current || !mounted) return;
    decided.current = true;
    setOpen(!connected && localStorage.getItem(STORAGE_KEY) !== '1');
  }, [mounted, connected]);
  useEffect(() => {
    if (connected) {
      localStorage.setItem(STORAGE_KEY, '1');
      setOpen(false);
    }
  }, [connected]);

  if (!mounted || !open) return null;

  const total = CARDS.length;
  const isLast = step === total - 1;
  const isHero = step === 0;
  const isFinish = isLast;
  const c = CARDS[step];
  const Icon = ICONS[c.icon];
  const accent = c.accent;
  const live = c.badge === 'LIVE';
  const soon = c.badge === 'SOON';

  const dismiss = () => { localStorage.setItem(STORAGE_KEY, '1'); setOpen(false); };
  const goto = (i: number) => { setDir(i > step ? 1 : -1); setStep(Math.max(0, Math.min(i, total - 1))); };
  const next = () => { if (isLast) { dismiss(); setVisible(true); return; } goto(step + 1); };
  const back = () => goto(step - 1);

  const nn = String(step + 1).padStart(2, '0');
  const statusLine = isHero ? '> booting bags terminal…'
    : isFinish ? '> SYSTEM READY'
    : live ? '> status: ONLINE'
    : '> status: STANDBY · COMING SOON';
  const statusColor = soon ? AMBER : SYS_GREEN;

  // step-body stagger variants (reduced-motion = opacity only)
  const container = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: (d: number) => ({ opacity: 0, x: d * 28 }),
        show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30, staggerChildren: 0.05, delayChildren: 0.04 } },
        exit: (d: number) => ({ opacity: 0, x: d * -28, transition: { duration: 0.15 } }),
      };
  const item = reduce ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-mono">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={dismiss} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="scanline relative w-full max-w-lg card card-hot p-0 overflow-hidden"
        style={{ ['--accent' as string]: accent } as React.CSSProperties}
      >
        {/* corner brackets */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#39FF14] pointer-events-none z-20" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#39FF14] pointer-events-none z-20" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#39FF14] pointer-events-none z-20" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#39FF14] pointer-events-none z-20" />

        {/* ambient accent glow (re-tints per step) */}
        <motion.div
          key={`glow-${step}`}
          aria-hidden
          className="absolute inset-0 pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ background: `radial-gradient(120% 80% at 50% 0%, ${accent}${soon ? '0c' : '1f'}, transparent 65%)` }}
        />
        {/* static dotted grid texture */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />

        <div className="relative z-10">
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2 min-w-0">
              <BagsLogo size={16} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shrink-0" style={{ boxShadow: '0 0 6px #39FF14' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666] truncate">SYS://BAGS_TERMINAL</span>
              {!isHero && !isFinish && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] ml-1" style={{ color: accent }}>
                  · MOD {nn}
                </span>
              )}
            </div>
            <button onClick={dismiss} className="text-[#666] hover:text-white transition-colors p-1 -mr-1" aria-label="Skip">
              <X size={14} />
            </button>
          </div>

          {/* progress rail */}
          <div className="px-5 mt-3">
            <div className="flex items-center justify-end mb-1.5">
              <span className="text-[9px] font-mono text-[#555] tracking-[0.15em]">{nn} / 08</span>
            </div>
            <div className="flex gap-1">
              {CARDS.map((seg, i) => {
                const done = i < step;
                const current = i === step;
                const segSoon = seg.badge === 'SOON';
                return (
                  <button
                    key={i}
                    onClick={() => goto(i)}
                    className="relative h-[3px] flex-1 rounded-full overflow-hidden transition-transform hover:scale-y-[2]"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    aria-label={`Go to step ${i + 1}`}
                  >
                    {done && (
                      <span
                        className="absolute inset-0"
                        style={{
                          background: segSoon
                            ? `repeating-linear-gradient(90deg, ${seg.accent}8c 0 4px, transparent 4px 7px)`
                            : seg.accent,
                          opacity: segSoon ? 0.6 : 1,
                        }}
                      />
                    )}
                    {current && (
                      <motion.span
                        key={`fill-${step}`}
                        className="absolute inset-0 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: reduce ? 0 : 0.45, ease: 'easeOut' }}
                        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* stage */}
          <div className="relative px-6 pt-6 pb-2 min-h-[244px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir} variants={container} initial="hidden" animate="show" exit="exit"
                className={isHero || isFinish ? 'flex flex-col items-center text-center' : ''}>

                {/* HERO / FINISH logo power-on */}
                {(isHero || isFinish) && (
                  <motion.div variants={item} className="relative mb-4">
                    <span className="absolute inset-0 -m-6 rounded-full pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${isHero ? '#00F0FF' : '#39FF14'}26, transparent 70%)`, filter: 'blur(8px)' }} />
                    <motion.span
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="relative inline-block"
                      style={!reduce ? { animation: 'glitch 90ms steps(2,end) 1' } : undefined}
                    >
                      <BagsLogo size={isHero ? 40 : 34} withText />
                    </motion.span>
                  </motion.div>
                )}

                {/* interior medallion */}
                {!isHero && !isFinish && (
                  <motion.div variants={item} className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      {live && !reduce && (
                        <motion.span
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          style={{ border: `1px solid ${accent}` }}
                          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                        />
                      )}
                      <motion.div
                        key={`med-${step}`}
                        initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                        whileHover={{ scale: 1.06 }}
                        className="w-14 h-14 flex items-center justify-center rounded-lg"
                        style={{
                          color: accent,
                          border: `1px ${soon ? 'dashed' : 'solid'} ${accent}${soon ? '55' : '40'}`,
                          background: `${accent}0d`,
                          opacity: soon ? 0.75 : 1,
                        }}
                      >
                        <Icon size={24} />
                      </motion.div>
                    </div>
                    {c.badge && <Badge kind={c.badge} />}
                  </motion.div>
                )}

                {/* kicker */}
                {!isHero && !isFinish && (
                  <motion.div variants={item} className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5" style={{ color: accent }}>
                    MODULE {nn} / {c.title.split(/[ ,]/)[0]}
                  </motion.div>
                )}

                {/* title (one-shot glitch on step change) */}
                <motion.h2
                  variants={item}
                  key={`title-${step}`}
                  className={`text-display font-bold text-[#EDEDED] tracking-tight leading-snug mb-2 ${isHero ? 'text-2xl' : 'text-lg'}`}
                  style={!reduce ? { animation: 'glitch 90ms steps(2,end) 1' } : undefined}
                >
                  {c.title}
                </motion.h2>

                {/* desc */}
                <motion.p variants={item} className="text-[13px] text-[#999] leading-relaxed max-w-[46ch]">
                  {c.desc}
                </motion.p>

                {/* status line */}
                <motion.div variants={item} className="mt-3 text-[11px] font-mono tracking-wide" style={{ color: statusColor }}>
                  {statusLine}
                  {(isHero || isFinish) && <span className="inline-block ml-0.5 animate-pulse">▌</span>}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 mt-2">
            <div className="flex items-center gap-3">
              <button onClick={back} disabled={step === 0}
                className="btn-ghost px-3 py-2 text-[11px] flex items-center gap-1.5 disabled:opacity-25 disabled:cursor-not-allowed">
                <ArrowLeft size={12} /> Back
              </button>
              <span className="text-[10px] text-[#555]">{step + 1} / {total}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isLast && (
                <button onClick={dismiss} className="text-[10px] font-mono text-[#666] hover:text-[#888] uppercase tracking-wider">
                  Skip
                </button>
              )}
              <button
                onClick={next}
                className="btn-primary px-5 py-2 text-[11px] flex items-center gap-1.5"
                style={{ borderColor: `${accent}66`, boxShadow: `0 0 16px ${accent}33` }}
              >
                {isLast ? (<><Wallet size={13} /> Connect Wallet</>) : isHero ? (<>Begin <ArrowRight size={12} /></>) : (<>Next <ArrowRight size={12} /></>)}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
