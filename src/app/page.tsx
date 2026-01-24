"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ShieldAlert, Zap, Globe, Lock, Activity, Terminal } from "lucide-react";
import { formatCurrency, getScoreColor, getSeverityColor } from "@/lib/format";
import { useEffect, useState } from "react";
import { usePulseStore } from "@/store/pulse.store";
import { useSocketStore } from "@/store/socket.store";
import type { PulseItem } from "@/lib/types";

// --- Components ---

const GlitchText = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block group">
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-[#39FF14] opacity-0 group-hover:opacity-100 group-hover:translate-x-[2px] transition-all duration-75">
        {text}
      </span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-[#FF003C] opacity-0 group-hover:opacity-100 group-hover:-translate-x-[2px] transition-all duration-75 delay-75">
        {text}
      </span>
    </div>
  );
};

// Derive events from pulse items
interface DerivedEvent {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'success' | 'critical';
  timestamp: number;
  description: string;
}

const deriveEventsFromTokens = (items: PulseItem[]): DerivedEvent[] => {
  return items.slice(0, 6).map((item, idx) => {
    let severity: 'info' | 'warning' | 'success' | 'critical' = 'info';
    let type = 'launch';
    let description = `${item.symbol} launched by ${item.deployer}`;

    if (item.state === 'MIGRATED') {
      type = 'distribution';
      severity = 'success';
      description = `${item.symbol} migrated - MC: ${formatCurrency(item.marketCap)}`;
    } else if (item.state === 'FINAL_STRETCH') {
      type = 'whale_entry';
      severity = 'success';
      description = `${item.symbol} at ${item.bondingProgress}% bonding progress`;
    } else if (item.riskFlags.some(f => f.severity === 'critical')) {
      type = 'alert';
      severity = 'critical';
      description = `${item.symbol} - High risk detected`;
    } else if (item.riskFlags.some(f => f.severity === 'warn')) {
      type = 'alert';
      severity = 'warning';
      description = `${item.symbol} - Elevated risk concentration`;
    }

    return {
      id: `event-${item.tokenId}-${idx}`,
      type,
      severity,
      timestamp: item.updatedAt,
      description,
    };
  });
};

const LivePulseItem = ({ event, index }: { event: DerivedEvent; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
    className="relative border-l-2 border-[#39FF14] bg-[#0A0A0A]/80 backdrop-blur-sm p-4 mb-3 max-w-md ml-auto"
  >
    <div className="absolute top-0 right-0 p-1">
      <div className={`w-2 h-2 rounded-none ${event.severity === 'critical' ? 'bg-[#FF003C]' : 'bg-[#39FF14]'} animate-pulse`} />
    </div>
    <div className="flex items-center gap-3 mb-1">
      <span className="text-xs font-mono text-[#888]">{new Date(event.timestamp).toLocaleTimeString()}</span>
      <span className={`text-xs font-bold uppercase tracking-wider ${getSeverityColor(event.severity)}`}>
        {event.type.replace('_', ' ')}
      </span>
    </div>
    <p className="text-sm font-mono text-[#EDEDED] leading-tight">{event.description}</p>
  </motion.div>
);

const StatCard = ({ label, value, trend }: { label: string; value: string; trend: string }) => (
  <div className="border border-white/10 p-4 bg-[#0A0A0A] hover:border-[#39FF14] transition-colors group">
    <div className="text-[10px] font-mono text-[#888] uppercase tracking-widest mb-2">{label}</div>
    <div className="text-3xl font-display font-bold text-white mb-2 group-hover:text-[#39FF14] transition-colors">
      {value}
    </div>
    <div className="flex items-center gap-1 text-xs font-mono text-[#39FF14]">
      <ArrowUpRight size={12} />
      {trend}
    </div>
  </div>
);

// --- Main Page ---

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { items } = usePulseStore();
  const { connect, isConnected } = useSocketStore();

  useEffect(() => {
    setMounted(true);
    connect();
  }, [connect]);

  if (!mounted) return null;

  // Get all tokens from pulse store
  const allTokens = [...items.NEW, ...items.FINAL_STRETCH, ...items.MIGRATED];
  const events = deriveEventsFromTokens(allTokens);

  // Calculate stats
  const tokenCount = allTokens.length;
  const deployerSet = new Set(allTokens.map(t => t.deployer));

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] font-mono selection:bg-[#39FF14] selection:text-black overflow-x-hidden">

      {/* Background Grid & Grain */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-grain opacity-30 pointer-events-none" />

      {/* Hero Section (90/10 Asymmetry) */}
      <section className="relative pt-32 pb-20 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Manifesto (Cols 1-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full z-10">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#39FF14] px-3 py-1 text-[10px] text-[#39FF14] uppercase tracking-widest mb-6">
                <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-[#39FF14]' : 'bg-[#FF003C]'} animate-pulse`} />
                {isConnected ? 'System Online v2.4' : 'Connecting...'}
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-display font-bold leading-[0.85] tracking-tighter mb-8 text-white mix-blend-difference"
              >
                BAGS<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-transparent">
                  TERM
                </span>
                INAL
              </motion.h1>

              <p className="text-lg text-[#888] mb-12 max-w-md leading-relaxed">
                Deployer intelligence. Insider tracking. <br/>
                <span className="text-white">Zero noise. Pure signal.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/terminal"
                  className="group relative px-8 py-4 bg-[#EDEDED] text-black font-bold uppercase tracking-wider overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#39FF14] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 group-hover:text-black flex items-center gap-2">
                    Enter Terminal <Terminal size={16} />
                  </span>
                </Link>
                <Link
                  href="/pulse"
                  className="px-8 py-4 border border-white/20 text-[#888] hover:text-white hover:border-white font-bold uppercase tracking-wider transition-all"
                >
                  Live Feed
                </Link>
              </div>
            </div>

            {/* Stats Row (Mobile only, hidden on LG) */}
            <div className="lg:hidden mt-12 grid grid-cols-2 gap-4">
               <StatCard label="Tokens Tracked" value={tokenCount > 0 ? String(tokenCount) : '--'} trend={isConnected ? 'LIVE' : '...'} />
               <StatCard label="Deployers" value={deployerSet.size > 0 ? String(deployerSet.size) : '--'} trend={isConnected ? 'LIVE' : '...'} />
            </div>
          </div>

          {/* Right: Live Pulse Visualization (Cols 6-12) */}
          <div className="lg:col-span-7 relative hidden lg:block h-[600px]">
            {/* Decorative 'Radar' Lines */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/5 rounded-full" />

            {/* Live Feed Stream */}
            <div className="absolute right-0 top-0 w-full h-full flex flex-col justify-center items-end pointer-events-none">
              <div className="w-full max-w-md space-y-4 pr-12 relative z-10">
                <div className="absolute -right-1 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-[#39FF14] to-transparent opacity-50" />
                {events.length > 0 ? (
                  events.slice(0, 4).map((event, i) => (
                    <LivePulseItem key={event.id} event={event} index={i} />
                  ))
                ) : (
                  <div className="text-center text-[#666] text-xs py-8">
                    {isConnected ? 'Waiting for tokens...' : 'Connecting to live feed...'}
                  </div>
                )}
              </div>
            </div>

            {/* Big Data Text Overlay */}
            <div className="absolute bottom-0 left-0 text-[10rem] font-display font-bold text-white/5 leading-none select-none pointer-events-none">
              PULSE
            </div>
          </div>

        </div>
      </section>

      {/* Ticker Tape */}
      <div className="border-b border-white/10 bg-[#0A0A0A] overflow-hidden whitespace-nowrap py-3">
        <div className="animate-marquee inline-block">
           {allTokens.length > 0 ? (
             [...allTokens, ...allTokens].slice(0, 20).map((token, i) => (
               <span key={`${token.tokenId}-${i}`} className="mx-8 font-mono text-sm">
                 <span className="text-[#39FF14] font-bold">{token.symbol}</span>
                 <span className="text-[#888] mx-2">MC {formatCurrency(token.marketCap)}</span>
                 <span className={token.bondingProgress >= 85 ? "text-white" : "text-[#444]"}>
                   {token.bondingProgress}% BONDED
                 </span>
               </span>
             ))
           ) : (
             <span className="mx-8 font-mono text-sm text-[#666]">
               {isConnected ? 'Waiting for BAGS tokens...' : 'Connecting to live feed...'}
             </span>
           )}
        </div>
      </div>

      {/* Intelligence Modules (Staggered Layout) */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-4">
          <h2 className="text-4xl font-display font-bold">Core Modules</h2>
          <div className="text-[#39FF14] font-mono text-xs uppercase tracking-widest animate-pulse">
            // Access Restricted
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Deployer Vision",
              desc: "Deep historical analysis of deployer wallets.",
              icon: <Globe size={24} />,
              color: "text-[#00F0FF]"
            },
            {
              title: "Insider Scan",
              desc: "Real-time detection of bundled snipes.",
              icon: <Lock size={24} />,
              color: "text-[#FF003C]"
            },
            {
              title: "Funding Trace",
              desc: "Follow the money back to CEX withdrawals.",
              icon: <Zap size={24} />,
              color: "text-[#FAFF00]"
            },
            {
              title: "Risk Engine",
              desc: "Automated rug-pull probability scoring.",
              icon: <ShieldAlert size={24} />,
              color: "text-[#39FF14]"
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="group relative p-6 bg-[#0A0A0A] border border-white/10 hover:border-white/30 h-64 flex flex-col justify-between transition-all"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <div className={`${item.color} mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                {item.icon}
              </div>

              <div>
                <h3 className="text-xl font-display font-bold mb-2 group-hover:text-white transition-colors">
                  <GlitchText text={item.title} />
                </h3>
                <p className="text-sm text-[#888] font-mono leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="absolute bottom-4 right-4 text-[10px] text-[#444] font-mono">
                0{i+1} // SYS
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Terminal Preview */}
      <section className="py-24 bg-[#0A0A0A] border-y border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <Activity className={`${isConnected ? 'text-[#39FF14]' : 'text-[#FF003C]'} animate-pulse`} size={20} />
               <h2 className="text-2xl font-display font-bold">Live Feed</h2>
             </div>
             <Link href="/terminal" className="text-xs font-mono text-[#888] hover:text-[#39FF14] uppercase tracking-widest border-b border-transparent hover:border-[#39FF14] transition-colors">
               View Full Terminal &rarr;
             </Link>
          </div>

          <div className="border border-white/10 bg-[#050505] relative">
            <div className="scanline absolute inset-0 pointer-events-none opacity-10" />

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-mono text-[#888] uppercase tracking-wider">Asset</th>
                  <th className="p-4 text-xs font-mono text-[#888] uppercase tracking-wider hidden sm:table-cell">Deployer</th>
                  <th className="p-4 text-xs font-mono text-[#888] uppercase tracking-wider text-right">Progress</th>
                  <th className="p-4 text-xs font-mono text-[#888] uppercase tracking-wider text-right">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {allTokens.length > 0 ? (
                  allTokens.slice(0, 5).map((token) => (
                    <tr key={token.tokenId} className="border-b border-white/5 hover:bg-[#39FF14]/5 transition-colors group cursor-pointer">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 ${token.state === 'MIGRATED' ? 'bg-[#39FF14]' : 'bg-[#00F0FF]'} rounded-full group-hover:animate-ping`} />
                           <span className="font-bold font-mono group-hover:text-[#39FF14] transition-colors">{token.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-[#666] hidden sm:table-cell">
                        {token.deployer}
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${token.bondingProgress >= 100 ? 'text-[#39FF14]' : token.bondingProgress >= 85 ? 'text-[#00F0FF]' : 'text-[#888]'}`}>
                        {token.bondingProgress}%
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-[#888]">
                        {formatCurrency(token.marketCap)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#666] font-mono text-sm">
                      {isConnected ? 'Waiting for BAGS tokens...' : 'Connecting to live feed...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#050505]">
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
